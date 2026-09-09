"""
Accessibility Intelligence Engine — Python port of frontend accessibility/engine.ts
Computes multi-factor accessibility scores for districts.
"""

import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.geo import District, State


WEIGHTS = {
    "roadConnectivity": 0.22,
    "railConnectivity": 0.15,
    "airportAccess": 0.13,
    "travelTime": 0.15,
    "hubProximity": 0.15,
    "infrastructureQuality": 0.10,
    "riskPenalty": 0.10,
}


def travel_time_score(avg_hours: float) -> int:
    if avg_hours <= 2:
        return 95
    if avg_hours <= 5:
        return 80
    if avg_hours <= 8:
        return 65
    if avg_hours <= 12:
        return 45
    if avg_hours <= 18:
        return 25
    return 10


def hub_proximity_score(distance_km: float) -> int:
    if distance_km <= 10:
        return 95
    if distance_km <= 50:
        return 80
    if distance_km <= 100:
        return 65
    if distance_km <= 200:
        return 45
    if distance_km <= 350:
        return 25
    return 10


def compute_accessibility(district: District) -> Dict[str, Any]:
    """Compute multi-factor accessibility breakdown for a single district."""
    travel_score = travel_time_score(district.avg_travel_time)
    hub_score = hub_proximity_score(district.nearest_hub_distance)
    risk_penalty = max(0, 100 - district.risk_score)

    factors = {
        "roadConnectivity": {
            "score": district.road_connectivity,
            "weight": WEIGHTS["roadConnectivity"],
            "contribution": district.road_connectivity * WEIGHTS["roadConnectivity"],
        },
        "railConnectivity": {
            "score": district.rail_connectivity,
            "weight": WEIGHTS["railConnectivity"],
            "contribution": district.rail_connectivity * WEIGHTS["railConnectivity"],
        },
        "airportAccess": {
            "score": district.airport_access,
            "weight": WEIGHTS["airportAccess"],
            "contribution": district.airport_access * WEIGHTS["airportAccess"],
        },
        "travelTime": {
            "score": travel_score,
            "weight": WEIGHTS["travelTime"],
            "contribution": travel_score * WEIGHTS["travelTime"],
        },
        "hubProximity": {
            "score": hub_score,
            "weight": WEIGHTS["hubProximity"],
            "contribution": hub_score * WEIGHTS["hubProximity"],
        },
        "infrastructureQuality": {
            "score": district.infrastructure_quality,
            "weight": WEIGHTS["infrastructureQuality"],
            "contribution": district.infrastructure_quality * WEIGHTS["infrastructureQuality"],
        },
        "riskPenalty": {
            "score": risk_penalty,
            "weight": WEIGHTS["riskPenalty"],
            "contribution": risk_penalty * WEIGHTS["riskPenalty"],
        },
    }

    overall_score = round(sum(f["contribution"] for f in factors.values()))

    if overall_score >= 80:
        level = "Highly Accessible"
    elif overall_score >= 60:
        level = "Accessible"
    elif overall_score >= 40:
        level = "Moderate"
    elif overall_score >= 20:
        level = "Poor"
    else:
        level = "Critical"

    recommendations = []
    if district.road_connectivity < 40:
        recommendations.append("Priority: Road connectivity improvement required. Current road network is inadequate for logistics operations.")
    if district.rail_connectivity < 20:
        recommendations.append("Extend rail connectivity. Rail freight would significantly reduce logistics costs and improve reliability.")
    if district.airport_access < 20:
        recommendations.append("Consider regional airstrip development for emergency logistics and high-value cargo.")
    if district.nearest_hub_distance > 200:
        recommendations.append(f"Establish a regional logistics hub. Nearest hub is {district.nearest_hub_distance}km away, causing excessive delivery times.")
    if district.infrastructure_quality < 30:
        recommendations.append("Urgent infrastructure investment needed. Road surface quality and bridge capacity are limiting factors.")
    if district.risk_score > 70:
        recommendations.append("High natural hazard risk. Implement disaster-resilient logistics infrastructure and maintain emergency supply corridors.")
    if district.avg_travel_time > 12:
        recommendations.append(f"Average travel time of {district.avg_travel_time}h is excessive. Road upgrades and alternate route development needed.")
    if not recommendations:
        recommendations.append("Maintain current infrastructure standards. Consider capacity expansion for growing demand.")

    return {
        "districtId": district.id,
        "districtName": district.name,
        "stateId": district.state_id,
        "overallScore": overall_score,
        "factors": factors,
        "level": level,
        "recommendations": recommendations,
    }


def compute_all_accessibility(db: Session) -> List[Dict[str, Any]]:
    """Compute accessibility for all districts, sorted by score descending."""
    districts = db.query(District).all()
    results = [compute_accessibility(d) for d in districts]
    results.sort(key=lambda x: x["overallScore"], reverse=True)
    return results


def compute_accessibility_by_id(db: Session, district_id: str) -> Optional[Dict[str, Any]]:
    """Compute accessibility for a single district by ID."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        return None
    return compute_accessibility(district)


def get_accessibility_summary(db: Session) -> Dict[str, Any]:
    """Get regional accessibility summary statistics and tier distributions."""
    all_acc = compute_all_accessibility(db)
    if not all_acc:
        return {
            "avgAccessibility": 0,
            "totalDistricts": 0,
            "tierDistribution": {"EXCELLENT": 0, "GOOD": 0, "MODERATE": 0, "POOR": 0, "CRITICAL": 0},
            "topAccessible": [],
            "leastAccessible": [],
        }

    scores = [a["overallScore"] for a in all_acc]
    avg_score = round(sum(scores) / len(scores))
    tiers = {"EXCELLENT": 0, "GOOD": 0, "MODERATE": 0, "POOR": 0, "CRITICAL": 0}
    for a in all_acc:
        lvl = a.get("level", "MODERATE")
        tiers[lvl] = tiers.get(lvl, 0) + 1

    return {
        "avgAccessibility": avg_score,
        "totalDistricts": len(all_acc),
        "tierDistribution": tiers,
        "topAccessible": all_acc[:5],
        "leastAccessible": list(reversed(all_acc[-5:])),
    }


def get_state_accessibility(db: Session) -> List[Dict[str, Any]]:
    """Get average accessibility per state."""
    districts = db.query(District).all()
    state_map: Dict[str, Dict] = {}
    for d in districts:
        breakdown = compute_accessibility(d)
        if d.state_id not in state_map:
            state_map[d.state_id] = {"total": 0, "count": 0}
        state_map[d.state_id]["total"] += breakdown["overallScore"]
        state_map[d.state_id]["count"] += 1

    return [
        {
            "stateId": state_id,
            "avgScore": round(data["total"] / data["count"]),
            "districtCount": data["count"],
        }
        for state_id, data in state_map.items()
    ]
