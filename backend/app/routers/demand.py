"""
Demand Forecasting API router: Time-series predictive analytics and seasonal trends.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import DemandForecast
from app.services.demand import (
    forecast_demand,
    forecast_all_districts,
    get_top_demand_districts,
)

router = APIRouter(prefix="/api/demand", tags=["Demand Forecasting"])


@router.get("/forecasts", response_model=List[DemandForecast])
def get_all_forecasts(db: Session = Depends(get_db)):
    """Computes time-series demand predictions for all districts."""
    return forecast_all_districts(db)


@router.get("/forecasts/{district_id}", response_model=DemandForecast)
def get_single_forecast(district_id: str, db: Session = Depends(get_db)):
    """Returns 7-day and 30-day forecast, seasonality, and confidence intervals for a district."""
    try:
        return forecast_demand(db, district_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/top", response_model=List[DemandForecast])
def get_top_demand(limit: int = 10, db: Session = Depends(get_db)):
    """Retrieves top demand districts ranked by daily logistics freight volume."""
    return get_top_demand_districts(db, limit)
