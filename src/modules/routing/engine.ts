// ============================================================
// Route Optimization Engine — Dijkstra-based weighted routing
// Computes optimal routes with priority-based weight adjustment
// ============================================================

import { graphNodes, graphEdges, GraphEdge } from '@/data/ner-data';
import { OptimizedRoute, RouteOptimizationRequest, RouteSegment, RouteExplanation } from '@/types';

interface PriorityWeights {
  distance: number;
  time: number;
  cost: number;
  risk: number;
  accessibility: number;
}

const PRIORITY_WEIGHTS: Record<string, PriorityWeights> = {
  fastest: { distance: 0.1, time: 0.45, cost: 0.1, risk: 0.15, accessibility: 0.2 },
  cheapest: { distance: 0.15, time: 0.1, cost: 0.45, risk: 0.1, accessibility: 0.2 },
  safest: { distance: 0.1, time: 0.1, cost: 0.1, risk: 0.5, accessibility: 0.2 },
  balanced: { distance: 0.2, time: 0.2, cost: 0.2, risk: 0.2, accessibility: 0.2 },
};

function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function computeEdgeWeight(edge: GraphEdge, weights: PriorityWeights, cargoWeight: number): number {
  const distNorm = normalizeValue(edge.distance, 50, 600);
  const timeNorm = normalizeValue(edge.time, 1, 15);
  const costNorm = normalizeValue(edge.cost * edge.distance * cargoWeight / 1000, 100, 5000);
  const riskNorm = normalizeValue(edge.risk, 0, 100);
  const accNorm = 1 - normalizeValue(edge.accessibility, 0, 100); // lower accessibility = higher weight

  return (
    weights.distance * distNorm +
    weights.time * timeNorm +
    weights.cost * costNorm +
    weights.risk * riskNorm +
    weights.accessibility * accNorm
  );
}

function dijkstra(
  start: string,
  end: string,
  weights: PriorityWeights,
  cargoWeight: number,
  excludedRoads: string[] = []
): { path: string[]; edges: GraphEdge[]; totalWeight: number } | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: GraphEdge } | null>();
  const visited = new Set<string>();

  graphNodes.forEach(n => {
    dist.set(n.id, Infinity);
    prev.set(n.id, null);
  });
  dist.set(start, 0);

  while (true) {
    let current: string | null = null;
    let currentDist = Infinity;
    dist.forEach((d, id) => {
      if (!visited.has(id) && d < currentDist) {
        current = id;
        currentDist = d;
      }
    });

    if (current === null || current === end) break;
    visited.add(current);

    const neighbors = graphEdges.filter(e =>
      (e.from === current || e.to === current) &&
      !excludedRoads.includes(e.roadId)
    );

    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (visited.has(neighbor)) continue;

      const weight = computeEdgeWeight(edge, weights, cargoWeight);
      const newDist = currentDist + weight;

      if (newDist < (dist.get(neighbor) || Infinity)) {
        dist.set(neighbor, newDist);
        prev.set(neighbor, { node: current, edge });
      }
    }
  }

  if (dist.get(end) === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  const edges: GraphEdge[] = [];
  let current: string | undefined = end;
  while (current) {
    path.unshift(current);
    const prevEntry = prev.get(current);
    if (prevEntry) {
      edges.unshift(prevEntry.edge);
      current = prevEntry.node;
    } else {
      break;
    }
  }

  return { path, edges, totalWeight: dist.get(end) || 0 };
}

function buildRoute(
  result: { path: string[]; edges: GraphEdge[]; totalWeight: number },
  priority: string,
  cargoWeight: number,
  routeIndex: number
): OptimizedRoute {
  const totalDistance = result.edges.reduce((sum, e) => sum + e.distance, 0);
  const totalTime = result.edges.reduce((sum, e) => sum + e.time, 0);
  const avgRisk = result.edges.reduce((sum, e) => sum + e.risk, 0) / result.edges.length;
  const avgAccessibility = result.edges.reduce((sum, e) => sum + e.accessibility, 0) / result.edges.length;
  const costPerTonKm = result.edges.reduce((sum, e) => sum + e.cost * e.distance, 0) / totalDistance;
  const totalCost = Math.round(costPerTonKm * totalDistance * cargoWeight / 1000);

  // Collect all waypoints
  const waypoints: [number, number][] = [];
  result.edges.forEach(edge => {
    const from = result.path[result.edges.indexOf(edge)];
    const isForward = edge.from === from;
    const pts = isForward ? edge.waypoints : [...edge.waypoints].reverse();
    if (waypoints.length === 0) {
      waypoints.push(...pts);
    } else {
      waypoints.push(...pts.slice(1));
    }
  });

  const segments: RouteSegment[] = result.edges.map((edge, i) => ({
    from: result.path[i],
    to: result.path[i + 1],
    road: edge.roadName,
    distance: edge.distance,
    time: edge.time,
    risk: edge.risk,
  }));

  const routeNames = ['A', 'B', 'C', 'D'];
  const recommendations: Record<string, string> = {
    fastest: 'Fastest',
    cheapest: 'Most Economical',
    safest: 'Safest',
    balanced: 'Balanced',
  };

  // Build explanation
  const factors: RouteExplanation['factors'] = [];
  if (avgRisk < 40) factors.push({ label: 'Low disruption risk', value: `${Math.round(avgRisk)}/100`, impact: 'positive' });
  else if (avgRisk > 60) factors.push({ label: 'High disruption risk', value: `${Math.round(avgRisk)}/100`, impact: 'negative' });
  else factors.push({ label: 'Moderate risk level', value: `${Math.round(avgRisk)}/100`, impact: 'neutral' });

  if (avgAccessibility > 60) factors.push({ label: 'Good road accessibility', value: `${Math.round(avgAccessibility)}/100`, impact: 'positive' });
  else if (avgAccessibility < 40) factors.push({ label: 'Poor accessibility', value: `${Math.round(avgAccessibility)}/100`, impact: 'negative' });

  if (totalTime < 6) factors.push({ label: 'Short travel time', value: `${totalTime.toFixed(1)} hrs`, impact: 'positive' });
  else if (totalTime > 12) factors.push({ label: 'Long travel time', value: `${totalTime.toFixed(1)} hrs`, impact: 'negative' });

  factors.push({ label: 'Estimated cost', value: `₹${totalCost.toLocaleString()}`, impact: totalCost < 15000 ? 'positive' : totalCost > 25000 ? 'negative' : 'neutral' });

  const routeScore = Math.round(
    (100 - normalizeValue(totalDistance, 100, 800) * 25) +
    (100 - normalizeValue(totalTime, 2, 20) * 25) -
    normalizeValue(avgRisk, 0, 100) * 25 +
    normalizeValue(avgAccessibility, 0, 100) * 25
  ) / 4;

  return {
    id: `route-${routeIndex}`,
    name: `Route ${routeNames[routeIndex] || routeIndex}`,
    distance: Math.round(totalDistance),
    estimatedTime: Math.round(totalTime * 10) / 10,
    estimatedCost: totalCost,
    riskScore: Math.round(avgRisk),
    accessibilityScore: Math.round(avgAccessibility),
    routeScore: Math.round(routeScore),
    recommendation: recommendations[priority] || 'Alternative',
    waypoints,
    segments,
    explanation: {
      summary: `Route ${routeNames[routeIndex]} via ${result.path.slice(1, -1).map(id => graphNodes.find(n => n.id === id)?.name || id).join(' → ')}`,
      factors,
      recommendation: `This route is optimized for ${priority} priority with a route score of ${Math.round(routeScore)}/100.`,
    },
  };
}

export function optimizeRoutes(request: RouteOptimizationRequest): OptimizedRoute[] {
  const routes: OptimizedRoute[] = [];
  const priorities: string[] = ['balanced', 'fastest', 'cheapest', 'safest'];

  // Move selected priority to front
  const orderedPriorities = [request.priority, ...priorities.filter(p => p !== request.priority)];

  const usedEdgeSets = new Set<string>();

  for (let i = 0; i < orderedPriorities.length && routes.length < 3; i++) {
    const priority = orderedPriorities[i];
    const weights = PRIORITY_WEIGHTS[priority];
    const result = dijkstra(request.origin, request.destination, weights, request.cargoWeight);

    if (result) {
      const edgeKey = result.edges.map(e => e.roadId).sort().join('-');
      if (!usedEdgeSets.has(edgeKey) || routes.length === 0) {
        usedEdgeSets.add(edgeKey);
        routes.push(buildRoute(result, priority, request.cargoWeight, routes.length));
      }
    }
  }

  // Try with excluded roads for diversity
  if (routes.length < 3 && routes.length > 0) {
    const mainRoads = routes[0].segments.map(s => {
      const edge = graphEdges.find(e => e.roadName === s.road);
      return edge?.roadId || '';
    }).filter(Boolean);

    for (const roadToExclude of mainRoads) {
      if (routes.length >= 3) break;
      const result = dijkstra(request.origin, request.destination, PRIORITY_WEIGHTS.balanced, request.cargoWeight, [roadToExclude]);
      if (result) {
        routes.push(buildRoute(result, 'alternate', request.cargoWeight, routes.length));
      }
    }
  }

  return routes;
}

export function getRouteGraph() {
  return { nodes: graphNodes, edges: graphEdges };
}
