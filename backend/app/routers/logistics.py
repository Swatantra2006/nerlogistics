"""
Logistics API router: Hubs, Roads, Multi-modal Infrastructure, and Regional KPIs.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.geo import District, State
from app.models.logistics import LogisticsHub, Road, GraphNode, GraphEdge
from app.models.infrastructure import Airport, RailwayStation
from app.schemas.schemas import (
    LogisticsHubSchema,
    RoadSchema,
    AirportSchema,
    RailwayStationSchema,
)

router = APIRouter(prefix="/api/logistics", tags=["Logistics"])


@router.get("/hubs", response_model=List[LogisticsHubSchema])
def get_all_hubs(db: Session = Depends(get_db)):
    hubs = db.query(LogisticsHub).all()
    return [h.to_dict() for h in hubs]


@router.get("/hubs/{hub_id}", response_model=LogisticsHubSchema)
def get_hub(hub_id: str, db: Session = Depends(get_db)):
    hub = db.query(LogisticsHub).filter(LogisticsHub.id == hub_id).first()
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub.to_dict()


@router.get("/roads", response_model=List[RoadSchema])
def get_all_roads(operational_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Road)
    if operational_only:
        query = query.filter(Road.is_operational == True)
    roads = query.all()
    return [r.to_dict() for r in roads]


@router.get("/airports", response_model=List[AirportSchema])
def get_all_airports(db: Session = Depends(get_db)):
    airports = db.query(Airport).all()
    return [a.to_dict() for a in airports]


@router.get("/railway-stations", response_model=List[RailwayStationSchema])
def get_all_railway_stations(db: Session = Depends(get_db)):
    stations = db.query(RailwayStation).all()
    return [s.to_dict() for s in stations]


@router.get("/kpis")
def get_logistics_kpis(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns regional executive KPIs for the NER Logistics Intelligence Platform."""
    districts = db.query(District).all()
    hubs = db.query(LogisticsHub).all()
    roads = db.query(Road).all()

    total_population = sum(d.population for d in districts)
    avg_accessibility = (
        round(sum(d.accessibility_score for d in districts) / len(districts)) if districts else 0
    )
    avg_risk = round(sum(d.risk_score for d in districts) / len(districts)) if districts else 0
    total_hub_capacity = sum(h.capacity for h in hubs)
    avg_utilization = (
        round(sum(h.current_utilization for h in hubs) / len(hubs)) if hubs else 0
    )
    total_road_km = round(sum(r.distance for r in roads))
    operational_roads = len([r for r in roads if r.is_operational])

    return {
        "totalDistricts": len(districts),
        "totalPopulation": total_population,
        "avgAccessibilityScore": avg_accessibility,
        "avgRiskScore": avg_risk,
        "activeHubs": len(hubs),
        "totalHubCapacityTons": total_hub_capacity,
        "avgHubUtilizationPercent": avg_utilization,
        "totalRoadNetworkKm": total_road_km,
        "operationalRoadsCount": operational_roads,
        "totalRoadsCount": len(roads),
    }
