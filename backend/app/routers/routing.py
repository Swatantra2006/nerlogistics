"""
Routing API router: Multi-criteria Route Optimization & Graph Network.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.logistics import GraphNode, GraphEdge
from app.schemas.schemas import RouteOptimizationRequest, OptimizedRoute
from app.services.routing import optimize_routes

router = APIRouter(prefix="/api/routing", tags=["Route Optimization"])


@router.post("/optimize", response_model=List[OptimizedRoute])
def optimize_route_plan(request: RouteOptimizationRequest, db: Session = Depends(get_db)):
    """Computes optimal logistics routes based on distance, time, cost, risk, and accessibility."""
    routes = optimize_routes(
        db=db,
        origin=request.origin,
        destination=request.destination,
        priority=request.priority,
        cargo_weight=request.cargoWeight,
        vehicle_type=request.vehicleType,
        avoid_risks=request.avoidRisks,
    )
    if not routes:
        raise HTTPException(
            status_code=404,
            detail=f"No viable route found between '{request.origin}' and '{request.destination}'",
        )
    return routes


@router.get("/graph")
def get_graph(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns the complete multimodal routing graph (nodes and edges)."""
    nodes = db.query(GraphNode).all()
    edges = db.query(GraphEdge).all()
    return {
        "nodes": [n.to_dict() for n in nodes],
        "edges": [e.to_dict() for e in edges],
    }
