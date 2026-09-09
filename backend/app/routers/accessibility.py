"""
Accessibility Intelligence API router: Multi-factor accessibility scoring and ranking.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.geo import District
from app.schemas.schemas import DistrictAccessibilityScore
from app.services.accessibility import (
    compute_all_accessibility,
    compute_accessibility_by_id,
    get_accessibility_summary,
)

router = APIRouter(prefix="/api/accessibility", tags=["Accessibility Intelligence"])


@router.get("/districts", response_model=List[DistrictAccessibilityScore])
def get_all_accessibility_scores(db: Session = Depends(get_db)):
    """Returns accessibility scores and multi-factor breakdowns for all districts in the NER."""
    return compute_all_accessibility(db)


@router.get("/districts/{district_id}", response_model=DistrictAccessibilityScore)
def get_district_accessibility(district_id: str, db: Session = Depends(get_db)):
    """Returns detailed accessibility evaluation for a specific district."""
    result = compute_accessibility_by_id(db, district_id)
    if not result:
        raise HTTPException(status_code=404, detail="District not found")
    return result


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns regional accessibility summary statistics and tier distributions."""
    return get_accessibility_summary(db)
