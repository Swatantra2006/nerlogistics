"""
AI Copilot API router: Natural Language Decision Assistant.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import CopilotMessage
from app.services.copilot import process_copilot_query

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])


class CopilotQueryRequest(BaseModel):
    query: str
    api_key: Optional[str] = None


@router.post("/query", response_model=CopilotMessage)
def ask_copilot(request: CopilotQueryRequest, db: Session = Depends(get_db)):
    """Processes natural language questions about NER logistics, hazards, accessibility, and routing."""
    return process_copilot_query(db, request.query, request.api_key)


@router.get("/suggestions")
def get_prompt_suggestions() -> List[str]:
    """Returns recommended prompt templates for interactive decision making."""
    return [
        "Which districts have the worst logistics accessibility?",
        "What is the safest route from Guwahati to Tawang?",
        "Which supply corridors are currently at high risk of disruption?",
        "Where should we establish new regional logistics hubs?",
        "What are the top infrastructure gap priorities in Arunachal Pradesh?",
        "What happens if NH-10 becomes unavailable?",
    ]
