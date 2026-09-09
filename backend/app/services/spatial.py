"""
Spatial Queries & GIS Service — Geospatial search and distance computations.
Supports Haversine distance, radius searches, nearest hub lookups, bounding boxes, and corridor buffers.
"""

from typing import List, Dict, Any, Optional, Tuple
import math
from sqlalchemy.orm import Session
from app.models.geo import District, State
from app.models.logistics import LogisticsHub, Road, GraphNode
from app.models.infrastructure import Airport, RailwayStation


EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def find_nearest_hubs(
    db: Session,
    lat: float,
    lng: float,
    limit: int = 5,
    max_distance_km: Optional[float] = None,
) -> List[Dict[str, Any]]:
    hubs = db.query(LogisticsHub).all()
    results = []
    for h in hubs:
        dist = haversine_distance(lat, lng, h.lat, h.lng)
        if max_distance_km is None or dist <= max_distance_km:
            results.append({
                "id": h.id,
                "name": h.name,
                "type": h.type,
                "city": h.city,
                "lat": h.lat,
                "lng": h.lng,
                "capacity": h.capacity,
                "currentUtilization": h.current_utilization,
                "storageAvailable": h.storage_available,
                "distanceKm": round(dist, 2),
            })
    results.sort(key=lambda x: x["distanceKm"])
    return results[:limit]


def find_infrastructure_within_radius(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 100.0,
) -> Dict[str, Any]:
    """Finds all hubs, airports, railway stations, and districts within a radius."""
    hubs = db.query(LogisticsHub).all()
    airports = db.query(Airport).all()
    railways = db.query(RailwayStation).all()
    districts = db.query(District).all()

    matched_hubs = []
    for h in hubs:
        d = haversine_distance(lat, lng, h.lat, h.lng)
        if d <= radius_km:
            matched_hubs.append({"id": h.id, "name": h.name, "city": h.city, "distanceKm": round(d, 2)})

    matched_airports = []
    for a in airports:
        d = haversine_distance(lat, lng, a.lat, a.lng)
        if d <= radius_km:
            matched_airports.append({"id": a.id, "name": a.name, "city": a.city, "code": a.code, "distanceKm": round(d, 2)})

    matched_railways = []
    for r in railways:
        d = haversine_distance(lat, lng, r.lat, r.lng)
        if d <= radius_km:
            matched_railways.append({"id": r.id, "name": r.name, "division": r.division, "distanceKm": round(d, 2)})

    matched_districts = []
    for dist in districts:
        d = haversine_distance(lat, lng, dist.lat, dist.lng)
        if d <= radius_km:
            matched_districts.append({"id": dist.id, "name": dist.name, "stateId": dist.state_id, "distanceKm": round(d, 2)})

    return {
        "center": {"lat": lat, "lng": lng},
        "radiusKm": radius_km,
        "counts": {
            "hubs": len(matched_hubs),
            "airports": len(matched_airports),
            "railways": len(matched_railways),
            "districts": len(matched_districts),
        },
        "hubs": sorted(matched_hubs, key=lambda x: x["distanceKm"]),
        "airports": sorted(matched_airports, key=lambda x: x["distanceKm"]),
        "railways": sorted(matched_railways, key=lambda x: x["distanceKm"]),
        "districts": sorted(matched_districts, key=lambda x: x["distanceKm"]),
    }


def find_in_bounding_box(
    db: Session,
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> Dict[str, Any]:
    """Retrieves all entities within a geographical bounding box."""
    districts = (
        db.query(District)
        .filter(District.lat >= min_lat, District.lat <= max_lat)
        .filter(District.lng >= min_lng, District.lng <= max_lng)
        .all()
    )

    hubs = (
        db.query(LogisticsHub)
        .filter(LogisticsHub.lat >= min_lat, LogisticsHub.lat <= max_lat)
        .filter(LogisticsHub.lng >= min_lng, LogisticsHub.lng <= max_lng)
        .all()
    )

    airports = (
        db.query(Airport)
        .filter(Airport.lat >= min_lat, Airport.lat <= max_lat)
        .filter(Airport.lng >= min_lng, Airport.lng <= max_lng)
        .all()
    )

    return {
        "bbox": {"minLat": min_lat, "minLng": min_lng, "maxLat": max_lat, "maxLng": max_lng},
        "districts": [{"id": d.id, "name": d.name, "lat": d.lat, "lng": d.lng, "accessibilityScore": d.accessibility_score} for d in districts],
        "hubs": [{"id": h.id, "name": h.name, "lat": h.lat, "lng": h.lng, "type": h.type} for h in hubs],
        "airports": [{"id": a.id, "name": a.name, "lat": a.lat, "lng": a.lng, "code": a.code} for a in airports],
    }


def compute_distance_matrix(
    origins: List[Dict[str, float]],
    destinations: List[Dict[str, float]],
) -> List[List[float]]:
    """Generates an NxM distance matrix between sets of coordinates."""
    matrix: List[List[float]] = []
    for orig in origins:
        row = []
        for dest in destinations:
            d = haversine_distance(orig["lat"], orig["lng"], dest["lat"], dest["lng"])
            row.append(round(d, 2))
        matrix.append(row)
    return matrix
