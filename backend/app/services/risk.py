"""
Risk Scoring Engine — Python port of frontend risk/engine.ts
Multi-hazard assessment for districts.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.geo import District
from app.models.risk import RiskEvent

# Seismic zone mapping for NER (actual zones)
SEISMIC_ZONES = {
    "assam": 72, "arunachal": 80, "manipur": 75, "meghalaya": 68,
    "mizoram": 72, "nagaland": 78, "sikkim": 82, "tripura": 65,
}


def _seeded_random(seed: int):
    """Deterministic PRNG matching the frontend seededRandom."""
    s = seed
    def next_val():
        nonlocal s
        s = (s * 1103515245 + 12345) & 0x7FFFFFFF
        return s / 0x7FFFFFFF
    return next_val


def generate_weather_data(district_id: str, terrain: str) -> List[Dict]:
    """Generate synthetic weather data matching frontend generateWeatherData."""
    seed = sum(ord(c) * 2 for c in district_id)
    rng = _seeded_random(seed)
    events = []
    for d in range(30):
        base_rainfall = 15 + rng() * 40
        terrain_mult = 1.3 if terrain == "mountainous" else (1.15 if terrain == "hilly" else 1.0)
        rainfall = round(base_rainfall * terrain_mult)
        temperature = (12 + rng() * 8) if terrain == "mountainous" else ((18 + rng() * 8) if terrain == "hilly" else (24 + rng() * 8))
        humidity = 70 + rng() * 25

        if rainfall > 40:
            condition = "heavy_rain"
        elif rainfall > 25:
            condition = "rain"
        elif rainfall > 10:
            condition = "cloudy"
        else:
            condition = "clear"

        flood_risk = min(100, round(rainfall * 1.8 * (1.5 if terrain == "riverine" else 1.0)))
        landslide_risk = min(100, round(rainfall * 1.5 * (2.0 if terrain == "mountainous" else (1.4 if terrain == "hilly" else 0.3))))

        events.append({
            "rainfall": rainfall,
            "temperature": round(temperature * 10) / 10,
            "humidity": round(humidity),
            "condition": condition,
            "floodRisk": flood_risk,
            "landslideRisk": landslide_risk,
        })
    return events


def assess_district_risk(district: District, risk_events: List[RiskEvent]) -> Dict[str, Any]:
    """Assess risk for a single district."""
    weather = generate_weather_data(district.id, district.terrain)
    recent_weather = weather[-7:]
    avg_rainfall = sum(w["rainfall"] for w in recent_weather) / len(recent_weather)
    max_flood_risk = max(w["floodRisk"] for w in recent_weather)
    max_landslide_risk = max(w["landslideRisk"] for w in recent_weather)

    # Flood risk
    terrain_flood = 40 if district.terrain == "riverine" else (20 if district.terrain == "plain" else 10)
    flood_risk = min(100, round(terrain_flood + min(40, avg_rainfall * 0.8) + max_flood_risk * 0.3))

    # Landslide risk
    terrain_ls = 45 if district.terrain == "mountainous" else (30 if district.terrain == "hilly" else 5)
    elev_ls = 20 if district.elevation > 2000 else (12 if district.elevation > 1000 else 5)
    landslide_risk = min(100, round(terrain_ls + min(30, avg_rainfall * 0.5) + elev_ls))

    # Earthquake risk
    earthquake_risk = round(
        (SEISMIC_ZONES.get(district.state_id, 60)) * 0.8 +
        (15 if district.terrain == "mountainous" else 5)
    )

    # Infrastructure risk
    infrastructure_risk = round(100 - district.infrastructure_quality)

    # Weather risk
    weather_risk = min(100, round(avg_rainfall * 1.5 + (max_flood_risk + max_landslide_risk) / 4))

    # Connectivity risk
    connectivity_risk = round(
        (100 - district.road_connectivity) * 0.4 +
        (100 - district.rail_connectivity) * 0.3 +
        min(100, district.nearest_hub_distance / 4) * 0.3
    )

    # Overall risk
    overall_risk = round(
        flood_risk * 0.22 +
        landslide_risk * 0.22 +
        earthquake_risk * 0.15 +
        infrastructure_risk * 0.15 +
        weather_risk * 0.14 +
        connectivity_risk * 0.12
    )

    if overall_risk >= 75:
        level = "CRITICAL"
    elif overall_risk >= 55:
        level = "HIGH"
    elif overall_risk >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    active_alerts = [
        _risk_event_to_dict(e) for e in risk_events
        if e.district_id == district.id or e.state_id == district.state_id
    ]

    if level == "CRITICAL":
        recommendation = f"Critical risk level in {district.name}. Activate emergency logistics protocols. Maintain buffer stock for 72 hours."
    elif level == "HIGH":
        recommendation = f"High risk in {district.name}. Pre-position emergency supplies. Monitor weather forecasts closely."
    elif level == "MEDIUM":
        recommendation = f"Moderate risk in {district.name}. Maintain standard monitoring. Ensure contingency plans are updated."
    else:
        recommendation = f"Low risk in {district.name}. Normal operations. Continue routine monitoring."

    return {
        "districtId": district.id,
        "districtName": district.name,
        "stateId": district.state_id,
        "overallRisk": overall_risk,
        "level": level,
        "factors": {
            "floodRisk": flood_risk,
            "landslideRisk": landslide_risk,
            "earthquakeRisk": earthquake_risk,
            "infrastructureRisk": infrastructure_risk,
            "weatherRisk": weather_risk,
            "connectivityRisk": connectivity_risk,
        },
        "activeAlerts": active_alerts,
        "recommendation": recommendation,
    }


def _risk_event_to_dict(e: RiskEvent) -> Dict[str, Any]:
    return {
        "id": e.id,
        "type": e.type,
        "severity": e.severity,
        "location": e.location,
        "districtId": e.district_id,
        "stateId": e.state_id,
        "lat": e.lat,
        "lng": e.lng,
        "description": e.description,
        "startDate": e.start_date,
        "endDate": e.end_date,
        "affectedRoutes": e.affected_routes or [],
        "riskScore": e.risk_score,
        "recommendation": e.recommendation,
    }


def assess_all_risks(db: Session) -> List[Dict[str, Any]]:
    """Assess risk for all districts."""
    districts = db.query(District).all()
    risk_events = db.query(RiskEvent).all()
    results = [assess_district_risk(d, risk_events) for d in districts]
    results.sort(key=lambda x: x["overallRisk"], reverse=True)
    return results


def get_active_alerts(db: Session) -> List[Dict[str, Any]]:
    """Get currently active risk events."""
    events = db.query(RiskEvent).all()
    return [_risk_event_to_dict(e) for e in events if not e.end_date or e.end_date >= "2026-08-28"]


def get_high_risk_districts(db: Session, threshold: int = 55) -> List[Dict[str, Any]]:
    """Get districts above risk threshold."""
    all_risks = assess_all_risks(db)
    return [r for r in all_risks if r["overallRisk"] >= threshold]
