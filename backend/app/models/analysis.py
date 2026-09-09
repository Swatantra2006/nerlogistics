"""
Analysis models: AccessibilityScore, InfrastructureGap, AIRecommendation.
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON
from app.database import Base


class AccessibilityScore(Base):
    __tablename__ = "accessibility_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, unique=True)
    district_name = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    overall_score = Column(Integer, default=0)
    road_connectivity_score = Column(Integer, default=0)
    road_connectivity_weight = Column(Float, default=0.22)
    road_connectivity_contribution = Column(Float, default=0)
    rail_connectivity_score = Column(Integer, default=0)
    rail_connectivity_weight = Column(Float, default=0.15)
    rail_connectivity_contribution = Column(Float, default=0)
    airport_access_score = Column(Integer, default=0)
    airport_access_weight = Column(Float, default=0.13)
    airport_access_contribution = Column(Float, default=0)
    travel_time_score = Column(Integer, default=0)
    travel_time_weight = Column(Float, default=0.15)
    travel_time_contribution = Column(Float, default=0)
    hub_proximity_score = Column(Integer, default=0)
    hub_proximity_weight = Column(Float, default=0.15)
    hub_proximity_contribution = Column(Float, default=0)
    infrastructure_quality_score = Column(Integer, default=0)
    infrastructure_quality_weight = Column(Float, default=0.10)
    infrastructure_quality_contribution = Column(Float, default=0)
    risk_penalty_score = Column(Integer, default=0)
    risk_penalty_weight = Column(Float, default=0.10)
    risk_penalty_contribution = Column(Float, default=0)
    level = Column(String(30), default="Moderate")
    recommendations = Column(JSON, default=list)


class InfrastructureGap(Base):
    __tablename__ = "infrastructure_gaps"

    id = Column(String(50), primary_key=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, unique=True)
    district_name = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    state_name = Column(String(100), nullable=False)
    demand_pressure = Column(Integer, default=0)
    population_importance = Column(Integer, default=0)
    accessibility_deficit = Column(Integer, default=0)
    risk_factor = Column(Integer, default=0)
    gap_score = Column(Integer, default=0)
    nearest_hub_distance = Column(Float, default=0)
    recommended_intervention = Column(String(1000), default="")
    estimated_cost = Column(Float, default=0)  # crores
    priority = Column(String(20), default="medium")  # critical | high | medium | low


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    context_type = Column(String(50), nullable=False)  # accessibility | risk | route | demand
    context_id = Column(String(50), nullable=False)  # district_id, route_id, etc.
    recommendation = Column(String(2000), nullable=False)
    confidence = Column(Float, default=0.8)
    created_at = Column(String(30), nullable=False)
