"""
Geographic API router: States and Districts in the NER region.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.geo import State, District
from app.schemas.schemas import StateSchema, DistrictSchema

router = APIRouter(prefix="/api/geo", tags=["Geography"])


@router.get("/states", response_model=List[StateSchema])
def get_all_states(db: Session = Depends(get_db)):
    states = db.query(State).all()
    return [s.to_dict() for s in states]


@router.get("/states/{state_id}", response_model=StateSchema)
def get_state(state_id: str, db: Session = Depends(get_db)):
    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state.to_dict()


@router.get("/districts", response_model=List[DistrictSchema])
def get_all_districts(state_id: str = None, db: Session = Depends(get_db)):
    query = db.query(District)
    if state_id:
        query = query.filter(District.state_id == state_id)
    districts = query.all()
    return [d.to_dict() for d in districts]


@router.get("/districts/{district_id}", response_model=DistrictSchema)
def get_district(district_id: str, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district.to_dict()
