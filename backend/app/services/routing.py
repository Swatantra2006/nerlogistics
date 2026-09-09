"""
Route Optimization Engine — Python port of frontend routing/engine.ts
Computes optimal multi-criteria routes with Dijkstra graph search.
"""

from typing import List, Dict, Any, Optional, Tuple
import math
from sqlalchemy.orm import Session
from app.models.logistics import GraphNode, GraphEdge
from app.schemas.schemas import OptimizedRoute, RouteSegment, RouteExplanation, FactorImpact


PRIORITY_WEIGHTS = {
    "fastest": {"distance": 0.1, "time": 0.45, "cost": 0.1, "risk": 0.15, "accessibility": 0.2},
    "cheapest": {"distance": 0.15, "time": 0.1, "cost": 0.45, "risk": 0.1, "accessibility": 0.2},
    "safest": {"distance": 0.1, "time": 0.1, "cost": 0.1, "risk": 0.5, "accessibility": 0.2},
    "balanced": {"distance": 0.2, "time": 0.2, "cost": 0.2, "risk": 0.2, "accessibility": 0.2},
}


def normalize_value(value: float, min_val: float, max_val: float) -> float:
    if max_val == min_val:
        return 0.5
    return (value - min_val) / (max_val - min_val)


def compute_edge_weight(
    edge: GraphEdge, weights: Dict[str, float], cargo_weight: float
) -> float:
    dist_norm = normalize_value(edge.distance, 50, 600)
    time_norm = normalize_value(edge.time, 1, 15)
    cost_norm = normalize_value(edge.cost * edge.distance * cargo_weight / 1000.0, 100, 5000)
    risk_norm = normalize_value(edge.risk, 0, 100)
    acc_norm = 1.0 - normalize_value(edge.accessibility, 0, 100)

    return (
        weights["distance"] * dist_norm
        + weights["time"] * time_norm
        + weights["cost"] * cost_norm
        + weights["risk"] * risk_norm
        + weights["accessibility"] * acc_norm
    )


def dijkstra_search(
    nodes: List[GraphNode],
    edges: List[GraphEdge],
    start: str,
    end: str,
    weights: Dict[str, float],
    cargo_weight: float,
    excluded_roads: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    if excluded_roads is None:
        excluded_roads = []

    dist: Dict[str, float] = {n.id: float("inf") for n in nodes}
    prev: Dict[str, Optional[Tuple[str, GraphEdge]]] = {n.id: None for n in nodes}
    visited = set()

    dist[start] = 0.0

    while True:
        current = None
        current_dist = float("inf")
        for node_id, d in dist.items():
            if node_id not in visited and d < current_dist:
                current = node_id
                current_dist = d

        if current is None or current == end:
            break
        visited.add(current)

        # Find adjacent edges (bidirectional)
        neighbors = [
            e for e in edges
            if (e.from_node == current or e.to_node == current)
            and (e.road_id not in excluded_roads)
        ]

        for edge in neighbors:
            neighbor = edge.to_node if edge.from_node == current else edge.from_node
            if neighbor in visited:
                continue

            weight = compute_edge_weight(edge, weights, cargo_weight)
            new_dist = current_dist + weight

            if new_dist < dist.get(neighbor, float("inf")):
                dist[neighbor] = new_dist
                prev[neighbor] = (current, edge)

    if dist.get(end, float("inf")) == float("inf"):
        return None

    path: List[str] = []
    path_edges: List[GraphEdge] = []
    curr: Optional[str] = end

    while curr:
        path.insert(0, curr)
        prev_entry = prev.get(curr)
        if prev_entry:
            path_edges.insert(0, prev_entry[1])
            curr = prev_entry[0]
        else:
            break

    return {"path": path, "edges": path_edges, "total_weight": dist[end]}


def build_route(
    result: Dict[str, Any],
    nodes: List[GraphNode],
    priority: str,
    cargo_weight: float,
    route_index: int,
) -> OptimizedRoute:
    edges: List[GraphEdge] = result["edges"]
    path: List[str] = result["path"]

    node_map = {n.id: n for n in nodes}

    total_distance = sum(e.distance for e in edges)
    total_time = sum(e.time for e in edges)
    avg_risk = sum(e.risk for e in edges) / max(1, len(edges))
    avg_acc = sum(e.accessibility for e in edges) / max(1, len(edges))

    cost_per_ton_km = sum(e.cost * e.distance for e in edges) / max(1.0, total_distance)
    total_cost = round(cost_per_ton_km * total_distance * cargo_weight / 1000.0)

    # Collect waypoints in direction of travel
    waypoints: List[List[float]] = []
    for i, edge in enumerate(edges):
        from_id = path[i]
        is_forward = (edge.from_node == from_id)
        pts = edge.waypoints if is_forward else list(reversed(edge.waypoints or []))
        if not waypoints:
            waypoints.extend(pts)
        else:
            waypoints.extend(pts[1:])

    segments: List[RouteSegment] = []
    for i, edge in enumerate(edges):
        segments.append(
            RouteSegment(
                from_=path[i],
                to=path[i + 1],
                road=edge.road_name or edge.road_id or "Road",
                distance=edge.distance,
                time=edge.time,
                risk=edge.risk,
            )
        )

    route_names = ["A", "B", "C", "D"]
    recommendations_map = {
        "fastest": "Fastest",
        "cheapest": "Most Economical",
        "safest": "Safest",
        "balanced": "Balanced",
    }

    factors: List[FactorImpact] = []
    if avg_risk < 40:
        factors.append(FactorImpact(label="Low disruption risk", value=f"{round(avg_risk)}/100", impact="positive"))
    elif avg_risk > 60:
        factors.append(FactorImpact(label="High disruption risk", value=f"{round(avg_risk)}/100", impact="negative"))
    else:
        factors.append(FactorImpact(label="Moderate risk level", value=f"{round(avg_risk)}/100", impact="neutral"))

    if avg_acc > 60:
        factors.append(FactorImpact(label="Good road accessibility", value=f"{round(avg_acc)}/100", impact="positive"))
    elif avg_acc < 40:
        factors.append(FactorImpact(label="Poor accessibility", value=f"{round(avg_acc)}/100", impact="negative"))

    if total_time < 6:
        factors.append(FactorImpact(label="Short travel time", value=f"{total_time:.1f} hrs", impact="positive"))
    elif total_time > 12:
        factors.append(FactorImpact(label="Long travel time", value=f"{total_time:.1f} hrs", impact="negative"))

    cost_impact = "positive" if total_cost < 15000 else ("negative" if total_cost > 25000 else "neutral")
    factors.append(FactorImpact(label="Estimated cost", value=f"₹{total_cost:,}", impact=cost_impact))

    route_score = round(
        (100.0 - normalize_value(total_distance, 100, 800) * 25.0)
        + (100.0 - normalize_value(total_time, 2, 20) * 25.0)
        - normalize_value(avg_risk, 0, 100) * 25.0
        + normalize_value(avg_acc, 0, 100) * 25.0
    ) / 4.0

    via_names = [node_map.get(nid, nid).name if hasattr(node_map.get(nid, None), "name") else nid for nid in path[1:-1]]
    summary_str = f"Route {route_names[route_index] if route_index < len(route_names) else route_index} via {' → '.join(via_names)}" if via_names else f"Direct route {route_names[route_index]}"

    return OptimizedRoute(
        id=f"route-{route_index}",
        name=f"Route {route_names[route_index] if route_index < len(route_names) else route_index}",
        distance=round(total_distance),
        estimatedTime=round(total_time * 10) / 10,
        estimatedCost=total_cost,
        riskScore=round(avg_risk),
        accessibilityScore=round(avg_acc),
        routeScore=round(route_score),
        recommendation=recommendations_map.get(priority, "Alternative"),
        waypoints=waypoints,
        segments=segments,
        explanation=RouteExplanation(
            summary=summary_str,
            factors=factors,
            recommendation=f"This route is optimized for {priority} priority with a route score of {round(route_score)}/100.",
        ),
    )


def optimize_routes(
    db: Session,
    origin: str,
    destination: str,
    priority: str = "balanced",
    cargo_weight: float = 1000.0,
    vehicle_type: str = "truck",
    avoid_risks: bool = False,
) -> List[OptimizedRoute]:
    nodes = db.query(GraphNode).all()
    edges = db.query(GraphEdge).all()

    if not nodes or not edges:
        return []

    routes: List[OptimizedRoute] = []
    priorities = ["balanced", "fastest", "cheapest", "safest"]
    ordered_priorities = [priority] + [p for p in priorities if p != priority]

    used_edge_sets = set()

    for p in ordered_priorities:
        if len(routes) >= 3:
            break
        w = dict(PRIORITY_WEIGHTS.get(p, PRIORITY_WEIGHTS["balanced"]))
        if avoid_risks:
            w["risk"] += 0.2
            w["distance"] = max(0.05, w["distance"] - 0.1)

        result = dijkstra_search(nodes, edges, origin, destination, w, cargo_weight)
        if result:
            edge_key = "-".join(sorted(e.road_id or str(e.id) for e in result["edges"]))
            if edge_key not in used_edge_sets or not routes:
                used_edge_sets.add(edge_key)
                routes.append(build_route(result, nodes, p, cargo_weight, len(routes)))

    # Try route diversity by excluding primary segments if fewer than 3 routes
    if len(routes) < 3 and routes:
        main_roads = [s.road for s in routes[0].segments if s.road]
        for road_to_exclude in main_roads:
            if len(routes) >= 3:
                break
            # Find road_id
            matching_edges = [e for e in edges if e.road_name == road_to_exclude]
            if not matching_edges:
                continue
            road_id = matching_edges[0].road_id
            result = dijkstra_search(nodes, edges, origin, destination, PRIORITY_WEIGHTS["balanced"], cargo_weight, excluded_roads=[road_id])
            if result:
                edge_key = "-".join(sorted(e.road_id or str(e.id) for e in result["edges"]))
                if edge_key not in used_edge_sets:
                    used_edge_sets.add(edge_key)
                    routes.append(build_route(result, nodes, "alternate", cargo_weight, len(routes)))

    return routes
