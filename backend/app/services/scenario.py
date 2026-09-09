"""
Scenario Simulation Engine — Python port of frontend scenario/engine.ts
Provides what-if impact analysis for logistical disruptions, natural hazards, and infrastructure interventions.
"""

from typing import List, Dict, Any, Optional
import random
from sqlalchemy.orm import Session
from app.models.geo import District, State
from app.models.logistics import Road, LogisticsHub, GraphEdge
from app.schemas.schemas import ScenarioInput, ScenarioResult, DistrictAccessibilityImpact, ScenarioPreset
from app.services.accessibility import compute_accessibility


def get_scenario_presets() -> List[ScenarioPreset]:
    return [
        ScenarioPreset(
            id="sc-1",
            name="NH-13 Closure (Tawang Road)",
            description="Major corridor to Tawang closed due to landslide",
            input=ScenarioInput(type="road_closure", target="nh-13", details="Complete road closure due to massive landslide near Sela Pass"),
        ),
        ScenarioPreset(
            id="sc-2",
            name="NH-10 Closure (Sikkim Highway)",
            description="Gangtok-Siliguri corridor disrupted",
            input=ScenarioInput(type="road_closure", target="nh-10", details="Landslide blocks both lanes near Rangpo"),
        ),
        ScenarioPreset(
            id="sc-3",
            name="Brahmaputra Flood (Barpeta)",
            description="Severe flooding in Brahmaputra basin",
            input=ScenarioInput(type="flood", target="barpeta", severity=80, details="River water above danger mark, low-lying areas inundated"),
        ),
        ScenarioPreset(
            id="sc-4",
            name="Landslide on NH-2 (Manipur)",
            description="Dimapur-Imphal corridor blocked",
            input=ScenarioInput(type="landslide", target="nh-2", details="Multiple debris flows blocking road near Mao Gate"),
        ),
        ScenarioPreset(
            id="sc-5",
            name="Demand Surge (Guwahati)",
            description="Festival season demand increase",
            input=ScenarioInput(type="demand_surge", target="kamrup-metro", severity=60, details="Bihu festival driving 60% demand surge"),
        ),
        ScenarioPreset(
            id="sc-6",
            name="New Hub: Tawang",
            description="Establish logistics hub in Tawang",
            input=ScenarioInput(type="new_hub", target="tawang", details="Proposed new logistics staging point"),
        ),
        ScenarioPreset(
            id="sc-7",
            name="NH-44 Disruption (Silchar)",
            description="Major link to Barak Valley disrupted",
            input=ScenarioInput(type="road_closure", target="nh-44", details="Bridge load restriction + heavy rainfall combination"),
        ),
        ScenarioPreset(
            id="sc-8",
            name="Flood (Silchar Basin)",
            description="Barak river flooding",
            input=ScenarioInput(type="flood", target="silchar", severity=75, details="Barak river flooding, affecting logistics to Mizoram and Tripura"),
        ),
    ]


def simulate_scenario(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    if input_data.type == "road_closure":
        return simulate_road_closure(db, input_data)
    elif input_data.type == "flood":
        return simulate_flood(db, input_data)
    elif input_data.type == "landslide":
        return simulate_landslide(db, input_data)
    elif input_data.type == "demand_surge":
        return simulate_demand_surge(db, input_data)
    elif input_data.type == "new_hub":
        return simulate_new_hub(db, input_data)
    else:
        return simulate_road_closure(db, input_data)


def simulate_road_closure(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    road = db.query(Road).filter(Road.id == input_data.target).first()
    if not road:
        return create_default_result(input_data, f"Road '{input_data.target}' not found")

    districts = db.query(District).all()
    affected_edges = db.query(GraphEdge).filter(GraphEdge.road_id == input_data.target).all()

    route_importance = 0.8 if road.type == "NH" else 0.5
    num_affected = max(3, round(len(districts) * route_importance * 0.3))

    # Relevant districts
    relevant_districts = [
        d for d in districts
        if (road.from_city.lower() in d.name.lower() or road.to_city.lower() in d.name.lower() or d.nearest_hub_distance > 200)
    ][:num_affected]

    if not relevant_districts:
        relevant_districts = districts[:num_affected]

    actual_affected = max(len(relevant_districts), round(num_affected * 0.6))
    avg_delay = (road.distance / max(10.0, road.avg_speed)) * 1.8
    additional_cost = round(road.distance * 85 * actual_affected * 0.3)

    accessibility_impact = []
    for d in relevant_districts:
        before = compute_accessibility(d)["overallScore"]
        after = max(5, before - round(15 + (d.risk_score * 0.2)))
        accessibility_impact.append(
            DistrictAccessibilityImpact(districtId=d.id, before=before, after=after)
        )

    pop_impacted = sum(d.population for d in relevant_districts)
    all_roads = db.query(Road).filter(Road.id != input_data.target, Road.is_operational == True).all()
    alternate_routes = [f"{r.name} ({r.from_city} → {r.to_city})" for r in all_roads if r.type == "NH"][:3]

    nearest_hub = (
        db.query(LogisticsHub).order_by(LogisticsHub.current_utilization.asc()).first()
    )

    hub_name = nearest_hub.name if nearest_hub else "nearest available hub"
    rec = (
        f"Activate alternate routes: {alternate_routes[0] if alternate_routes else 'available corridors'}. "
        f"Redistribute cargo through {hub_name}. Pre-position 72-hour buffer stock in affected districts. "
        f"Deploy emergency road repair teams to {road.name}."
    )

    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=actual_affected,
        routesDisrupted=len(affected_edges) + 2,
        estimatedDelay=round(avg_delay * 10) / 10,
        additionalCost=additional_cost,
        populationImpacted=pop_impacted,
        accessibilityImpact=accessibility_impact,
        recommendation=rec,
        alternateRoutes=alternate_routes,
    )


def simulate_flood(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    severity = input_data.severity or 70
    district = db.query(District).filter(District.id == input_data.target).first()
    if not district:
        # Check by name
        district = db.query(District).filter(District.name.ilike(f"%{input_data.target}%")).first()

    if not district:
        return create_default_result(input_data, f"District '{input_data.target}' not found")

    state = db.query(State).filter(State.id == district.state_id).first()
    affected_districts = (
        db.query(District)
        .filter(District.state_id == district.state_id)
        .filter(District.terrain.in_(["riverine", "plain"]) | (District.elevation < 200))
        .all()
    )

    num_affected = min(len(affected_districts), max(1, round(severity / 10)))
    selected = affected_districts[:num_affected] or [district]

    pop_impacted = sum(d.population for d in selected)

    accessibility_impact = []
    for d in selected:
        before = compute_accessibility(d)["overallScore"]
        after = max(5, before - round(severity * 0.35))
        accessibility_impact.append(
            DistrictAccessibilityImpact(districtId=d.id, before=before, after=after)
        )

    rec = (
        f"Activate flood emergency logistics protocol for {state.name if state else 'affected state'}. "
        f"Deploy watercraft for last-mile delivery. Airlift critical supplies to cut-off areas. "
        f"Establish relief distribution points at elevated locations. Pre-position rescue and medical supplies."
    )

    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=num_affected,
        routesDisrupted=round(severity / 12),
        estimatedDelay=round(severity * 0.15 * 10) / 10,
        additionalCost=round(severity * 4200 * num_affected / 10),
        populationImpacted=pop_impacted,
        accessibilityImpact=accessibility_impact,
        recommendation=rec,
        alternateRoutes=[
            "Elevated highway corridors",
            "Rail freight (where tracks are above flood level)",
            "Air cargo via nearest operational airport",
        ],
    )


def simulate_landslide(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    road = db.query(Road).filter(Road.id == input_data.target).first()
    if not road:
        return create_default_result(input_data, f"Road '{input_data.target}' not found")

    hilly_districts = (
        db.query(District)
        .filter(District.terrain.in_(["mountainous", "hilly"]))
        .limit(8)
        .all()
    )

    pop_impacted = sum(d.population for d in hilly_districts)
    avg_delay = (road.distance / max(10.0, road.avg_speed)) * 2.5
    cost = round(road.distance * 120 * len(hilly_districts) * 0.2)

    accessibility_impact = []
    for d in hilly_districts:
        before = compute_accessibility(d)["overallScore"]
        after = max(5, before - round(20 + (d.risk_score * 0.15)))
        accessibility_impact.append(
            DistrictAccessibilityImpact(districtId=d.id, before=before, after=after)
        )

    nh_roads = (
        db.query(Road)
        .filter(Road.id != input_data.target, Road.type == "NH")
        .limit(3)
        .all()
    )
    alt_routes = [f"{r.name} ({r.from_city} → {r.to_city})" for r in nh_roads]

    rec = (
        f"Deploy road clearing teams to {road.name}. Activate alternate mountain corridors. "
        f"Airlift essential supplies for isolated communities. Deploy helicopter logistics for critical medical supplies. "
        f"Estimated road clearance: 72-120 hours."
    )

    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=len(hilly_districts),
        routesDisrupted=4,
        estimatedDelay=round(avg_delay * 10) / 10,
        additionalCost=cost,
        populationImpacted=pop_impacted,
        accessibilityImpact=accessibility_impact,
        recommendation=rec,
        alternateRoutes=alt_routes,
    )


def simulate_demand_surge(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    district = db.query(District).filter(District.id == input_data.target).first()
    if not district:
        district = db.query(District).filter(District.name.ilike(f"%{input_data.target}%")).first()

    if not district:
        return create_default_result(input_data, f"District '{input_data.target}' not found")

    severity = input_data.severity or 50
    surge_multiplier = (severity / 100.0) + 1.0

    nearby = (
        db.query(District)
        .filter(District.state_id == district.state_id, District.id != district.id)
        .all()
    )

    pop_impacted = district.population + sum(d.population for d in nearby)
    cur_score = compute_accessibility(district)["overallScore"]

    rec = (
        f"Increase shipment frequency by {round((surge_multiplier - 1) * 100)}%. "
        f"Activate overflow capacity at nearby logistics hubs. Coordinate with regional warehouses for stock redistribution. "
        f"Deploy additional vehicles on primary supply corridors."
    )

    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=len(nearby) + 1,
        routesDisrupted=0,
        estimatedDelay=round(surge_multiplier * 2 * 10) / 10,
        additionalCost=round(district.demand_level * surge_multiplier * 1800),
        populationImpacted=pop_impacted,
        accessibilityImpact=[
            DistrictAccessibilityImpact(districtId=district.id, before=cur_score, after=cur_score)
        ],
        recommendation=rec,
        alternateRoutes=[],
    )


def simulate_new_hub(db: Session, input_data: ScenarioInput) -> ScenarioResult:
    district = db.query(District).filter(District.id == input_data.target).first()
    if not district:
        district = db.query(District).filter(District.name.ilike(f"%{input_data.target}%")).first()

    if not district:
        return create_default_result(input_data, f"District '{input_data.target}' not found")

    all_districts = db.query(District).all()
    beneficiary_districts = [
        d for d in all_districts
        if abs(d.lat - district.lat) < 1.5 and abs(d.lng - district.lng) < 1.5
    ]

    pop_impacted = sum(d.population for d in beneficiary_districts)
    time_savings = -round(district.avg_delivery_time * 0.35 * 10) / 10
    cost_savings = -round(len(beneficiary_districts) * 12000)

    accessibility_impact = []
    for d in beneficiary_districts:
        before = compute_accessibility(d)["overallScore"]
        after = min(95, before + round(15))
        accessibility_impact.append(
            DistrictAccessibilityImpact(districtId=d.id, before=before, after=after)
        )

    rec = (
        f"New logistics hub in {district.name} would improve accessibility for {len(beneficiary_districts)} districts. "
        f"Estimated reduction in average delivery time: {round(district.avg_delivery_time * 0.35)} hours. "
        f"Annual logistics cost savings: ₹{round(len(beneficiary_districts) * 12000 * 365 / 100000)} lakhs. "
        f"Recommended hub capacity: {round(district.population / 100)} tons."
    )

    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=len(beneficiary_districts),
        routesDisrupted=0,
        estimatedDelay=time_savings,
        additionalCost=cost_savings,
        populationImpacted=pop_impacted,
        accessibilityImpact=accessibility_impact,
        recommendation=rec,
        alternateRoutes=[],
    )


def create_default_result(input_data: ScenarioInput, error: str) -> ScenarioResult:
    return ScenarioResult(
        scenario=input_data,
        affectedDistricts=0,
        routesDisrupted=0,
        estimatedDelay=0.0,
        additionalCost=0,
        populationImpacted=0,
        accessibilityImpact=[],
        recommendation=f"Unable to simulate: {error}. Please check the target identifier.",
        alternateRoutes=[],
    )
