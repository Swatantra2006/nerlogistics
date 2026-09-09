"""
Risk Intelligence API router: Hazard assessments, Active Alerts, Weather Data, and Corridor Vulnerability.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.geo import District
from app.models.risk import RiskEvent
from app.schemas.schemas import RiskAssessmentSchema, RiskEventSchema
from app.services.risk import (
    assess_all_risks,
    assess_district_risk,
    get_active_alerts,
    get_high_risk_districts,
    generate_weather_data,
)

router = APIRouter(prefix="/api/risk", tags=["Risk Intelligence"])


@router.get("/districts", response_model=List[RiskAssessmentSchema])
def get_all_district_risks(db: Session = Depends(get_db)):
    """Returns multi-hazard risk assessments for all districts in the NER."""
    return assess_all_risks(db)


@router.get("/districts/{district_id}", response_model=RiskAssessmentSchema)
def get_district_risk(district_id: str, db: Session = Depends(get_db)):
    """Returns comprehensive hazard and vulnerability assessment for a single district."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    risk_events = db.query(RiskEvent).all()
    return assess_district_risk(district, risk_events)


@router.get("/events", response_model=List[RiskEventSchema])
def get_risk_events(active_only: bool = False, db: Session = Depends(get_db)):
    """Returns real-time and historical risk events (floods, landslides, road closures)."""
    if active_only:
        return get_active_alerts(db)
    events = db.query(RiskEvent).all()
    return [e.to_dict() for e in events]


@router.get("/weather/{district_id}")
def get_district_weather(district_id: str, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns synthetic weather simulation data (rainfall, humidity, temp, flood/landslide risk)."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return generate_weather_data(district.id, district.terrain)


@router.get("/high-risk", response_model=List[RiskAssessmentSchema])
def get_critical_risk_areas(threshold: int = 55, db: Session = Depends(get_db)):
    """Filters districts with risk scores exceeding the specified threshold."""
    return get_high_risk_districts(db, threshold)
