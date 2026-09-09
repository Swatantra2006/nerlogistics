"""
Geospatial API router: Spatial queries, radius search, nearest hubs, and bounding box filtering.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.services.spatial import (
    find_nearest_hubs,
    find_infrastructure_within_radius,
    find_in_bounding_box,
    compute_distance_matrix,
)

router = APIRouter(prefix="/api/spatial", tags=["Spatial Queries"])


class CoordinatePoint(BaseModel):
    lat: float
    lng: float


class DistanceMatrixRequest(BaseModel):
    origins: List[CoordinatePoint]
    destinations: List[CoordinatePoint]


@router.get("/nearest-hubs")
def get_nearest_hubs(
    lat: float = Query(..., description="Latitude of target position"),
    lng: float = Query(..., description="Longitude of target position"),
    limit: int = Query(5, ge=1, le=20, description="Max number of hubs to return"),
    max_distance_km: Optional[float] = Query(None, description="Optional maximum search radius in km"),
    db: Session = Depends(get_db),
):
    """Finds the nearest logistics hubs to any coordinate using great-circle Haversine distance."""
    return find_nearest_hubs(db, lat, lng, limit=limit, max_distance_km=max_distance_km)


@router.get("/radius-search")
def search_within_radius(
    lat: float = Query(..., description="Center latitude"),
    lng: float = Query(..., description="Center longitude"),
    radius_km: float = Query(100.0, ge=1.0, le=1000.0, description="Radius in kilometers"),
    db: Session = Depends(get_db),
):
    """Searches for all multimodal logistics assets (hubs, airports, rail, districts) within a radius."""
    return find_infrastructure_within_radius(db, lat, lng, radius_km=radius_km)


@router.get("/bbox")
def search_bounding_box(
    min_lat: float = Query(..., description="South boundary latitude"),
    min_lng: float = Query(..., description="West boundary longitude"),
    max_lat: float = Query(..., description="North boundary latitude"),
    max_lng: float = Query(..., description="East boundary longitude"),
    db: Session = Depends(get_db),
):
    """Filters districts, hubs, and infrastructure within a geographic bounding box."""
    return find_in_bounding_box(db, min_lat, min_lng, max_lat, max_lng)


@router.post("/distance-matrix")
def get_distance_matrix(request: DistanceMatrixRequest):
    """Computes an NxM pairwise distance matrix (in km) between origin and destination coordinates."""
    origins = [{"lat": p.lat, "lng": p.lng} for p in request.origins]
    destinations = [{"lat": p.lat, "lng": p.lng} for p in request.destinations]
    matrix = compute_distance_matrix(origins, destinations)
    return {
        "originsCount": len(origins),
        "destinationsCount": len(destinations),
        "distancesKm": matrix,
    }
