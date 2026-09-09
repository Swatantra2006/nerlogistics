"""
Infrastructure Gap Analysis API router: Critical deficit identification and targeted interventions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import InfrastructureGap, StateGapSummary
from app.services.infrastructure import (
    analyze_infrastructure_gaps,
    get_top_gaps,
    get_gaps_by_state,
)

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure Gap Analysis"])


@router.get("/gaps", response_model=List[InfrastructureGap])
def get_all_gaps(db: Session = Depends(get_db)):
    """Computes infrastructure gap scores, recommended interventions, and investment estimates."""
    return analyze_infrastructure_gaps(db)


@router.get("/top", response_model=List[InfrastructureGap])
def get_top_priority_gaps(limit: int = 15, db: Session = Depends(get_db)):
    """Returns the highest-priority infrastructure bottlenecks across the North Eastern Region."""
    return get_top_gaps(db, limit)


@router.get("/by-state", response_model=List[StateGapSummary])
def get_state_summaries(db: Session = Depends(get_db)):
    """Aggregates infrastructure deficits and estimated budget requirements per state."""
    return get_gaps_by_state(db)
