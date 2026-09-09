"""
Infrastructure Gap Analysis Engine — Python port of frontend infrastructure/engine.ts
Identifies critical logistics infrastructure deficits and recommends targeted interventions.
"""

from typing import List, Dict, Any
import math
from sqlalchemy.orm import Session
from app.models.geo import District, State
from app.schemas.schemas import InfrastructureGap, StateGapSummary


def analyze_infrastructure_gaps(db: Session) -> List[InfrastructureGap]:
    districts = db.query(District).all()
    states = db.query(State).all()
    state_map = {s.id: s.name for s in states}

    if not districts:
        return []

    max_pop = max(d.population for d in districts) if districts else 1

    gaps: List[InfrastructureGap] = []
    for d in districts:
        demand_pressure = d.demand_level / 100.0
        pop_importance = math.log10(d.population + 1) / math.log10(max_pop + 1)
        accessibility_deficit = (100.0 - d.accessibility_score) / 100.0
        risk_factor = d.risk_score / 100.0

        gap_score = round(
            (
                demand_pressure * 30.0
                + pop_importance * 25.0
                + accessibility_deficit * 30.0
                + risk_factor * 15.0
            )
        )

        if gap_score >= 65:
            priority = "critical"
        elif gap_score >= 50:
            priority = "high"
        elif gap_score >= 35:
            priority = "medium"
        else:
            priority = "low"

        interventions: List[str] = []
        if d.nearest_hub_distance > 200:
            interventions.append("Establish a new regional logistics hub")
        if d.road_connectivity < 40:
            interventions.append("Major road infrastructure upgrade required")
        if d.rail_connectivity < 15 and d.population > 100000:
            interventions.append("Extend rail connectivity for freight logistics")
        if d.infrastructure_quality < 35:
            interventions.append("Road surface and bridge capacity improvements")
        if d.risk_score > 70:
            interventions.append("Disaster-resilient infrastructure development")
        if d.airport_access < 15 and d.terrain == "mountainous":
            interventions.append("Develop regional airstrip for emergency logistics")
        if d.last_mile_difficulty == "very-high":
            interventions.append("Last-mile delivery infrastructure (feeder roads, warehousing)")

        if not interventions:
            interventions.append("Capacity enhancement and maintenance of existing infrastructure")

        recommended_intervention = "; ".join(interventions)

        estimated_cost = 0
        if d.nearest_hub_distance > 200:
            estimated_cost += 120
        if d.road_connectivity < 40:
            estimated_cost += 250
        if d.rail_connectivity < 15:
            estimated_cost += 800
        if d.infrastructure_quality < 35:
            estimated_cost += 150
        if len(interventions) == 1 and estimated_cost == 0:
            estimated_cost = 50

        gaps.append(
            InfrastructureGap(
                id=f"gap-{d.id}",
                districtId=d.id,
                districtName=d.name,
                stateId=d.state_id,
                stateName=state_map.get(d.state_id, ""),
                demandPressure=round(demand_pressure * 100),
                populationImportance=round(pop_importance * 100),
                accessibilityDeficit=round(accessibility_deficit * 100),
                riskFactor=round(risk_factor * 100),
                gapScore=gap_score,
                nearestHubDistance=d.nearest_hub_distance,
                recommendedIntervention=recommended_intervention,
                estimatedCost=estimated_cost,
                priority=priority,
            )
        )

    gaps.sort(key=lambda g: g.gapScore, reverse=True)
    return gaps


def get_top_gaps(db: Session, limit: int = 15) -> List[InfrastructureGap]:
    return analyze_infrastructure_gaps(db)[:limit]


def get_gaps_by_state(db: Session) -> List[StateGapSummary]:
    gaps = analyze_infrastructure_gaps(db)
    state_map: Dict[str, List[InfrastructureGap]] = {}
    for g in gaps:
        state_map.setdefault(g.stateId, []).append(g)

    summaries: List[StateGapSummary] = []
    for state_id, s_gaps in state_map.items():
        avg_gap = round(sum(g.gapScore for g in s_gaps) / len(s_gaps))
        crit_count = len([g for g in s_gaps if g.priority in ("critical", "high")])
        tot_cost = sum(g.estimatedCost for g in s_gaps)
        summaries.append(
            StateGapSummary(
                stateId=state_id,
                stateName=s_gaps[0].stateName,
                avgGap=avg_gap,
                criticalCount=crit_count,
                totalCost=tot_cost,
            )
        )

    summaries.sort(key=lambda s: s.avgGap, reverse=True)
    return summaries
