"""
Scenario Simulation API router: What-if disruption and intervention impact analysis.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import ScenarioInput, ScenarioResult, ScenarioPreset
from app.services.scenario import simulate_scenario, get_scenario_presets

router = APIRouter(prefix="/api/scenario", tags=["Scenario Simulator"])


@router.post("/simulate", response_model=ScenarioResult)
def run_simulation(input_data: ScenarioInput, db: Session = Depends(get_db)):
    """Simulates the cascade impact of a road closure, flood, landslide, demand surge, or new hub."""
    return simulate_scenario(db, input_data)


@router.get("/presets", response_model=List[ScenarioPreset])
def get_presets():
    """Returns curated historical and realistic disruption scenarios across the NER."""
    return get_scenario_presets()
