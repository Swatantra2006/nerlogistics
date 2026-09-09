"""
AI Copilot Engine — Real-time decision assistant for NER Logistics.
Provides dynamic natural language answers, real-time GPS telemetry inspection,
live disruption alerts, multi-criteria route calculations, and LLM augmentation.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import math
import re
import urllib.request
import urllib.error
from sqlalchemy.orm import Session

from app.models.geo import District, State
from app.models.logistics import LogisticsHub, Road
from app.models.risk import RiskEvent
from app.schemas.schemas import CopilotMessage, MetricItem, RouteOptimizationRequest
from app.services.accessibility import compute_all_accessibility
from app.services.risk import assess_all_risks
from app.services.infrastructure import get_top_gaps
from app.services.demand import forecast_demand
from app.services.routing import optimize_routes
from app.routers.realtime import ACTIVE_CONVOYS
from app.config import settings


def parse_query_intent(query: str, districts: List[District], states: List[State]) -> Dict[str, Any]:
    lower = query.lower()
    entities: List[str] = []
    matched_district = None
    matched_state = None

    for d in districts:
        if d.name.lower() in lower or d.id.lower() in lower:
            entities.append(d.name)
            if not matched_district:
                matched_district = d
    for s in states:
        if s.name.lower() in lower or s.id.lower() in lower:
            entities.append(s.name)
            if not matched_state:
                matched_state = s

    # 1. Real-time truck / GPS / convoy queries
    convoy_patterns = [
        "truck", "convoy", "moving", "telemetry", "gps", "speed", "where is",
        "ner-cv", "convoy-ner", "in transit", "active truck", "live freight",
        "live status", "driver", "vehicle", "live fleet", "as-", "sk-", "nl-"
    ]
    if any(w in lower for w in convoy_patterns):
        return {"type": "realtime_convoys", "entities": entities, "parameters": {}}

    # 2. Live hazard / disruption / weather / road block alerts
    alert_patterns = [
        "live alert", "landslide", "flood", "fog", "road block", "weather alert",
        "closure", "sela pass", "disruption right now", "hazard today", "blocked road",
        "is open", "is closed", "closed route", "mudslide", "snow"
    ]
    if any(w in lower for w in alert_patterns):
        return {"type": "live_alerts", "entities": entities, "parameters": {}}

    # 3. Route inquiries
    route_patterns = [
        "route", "path", "way", "travel", "directions", "how to go", "how to reach",
        "from ", "to ", "shortest", "fastest", "safest way", "distance between"
    ]
    if any(w in lower for w in route_patterns) and len(entities) >= 1:
        return {"type": "route", "entities": entities, "parameters": {}}

    # 4. What-if scenarios
    if any(w in lower for w in ["what if", "happen", "unavailable", "closed", "blocked", "disrupted"]):
        return {"type": "scenario", "entities": entities, "parameters": {}}

    # 5. Accessibility comparisons
    if "worst" in lower and ("access" in lower or "logistics" in lower or "connectivity" in lower):
        return {"type": "accessibility", "entities": entities, "parameters": {"sort": "worst"}}
    if "best" in lower and ("access" in lower or "logistics" in lower or "connectivity" in lower):
        return {"type": "accessibility", "entities": entities, "parameters": {"sort": "best"}}

    # 6. Specific District deep-dive
    if matched_district and any(w in lower for w in ["score", "about", "connectivity", "terrain", "details", "how is", "population"]):
        return {"type": "district", "entities": entities, "parameters": {"district_id": matched_district.id, "district_name": matched_district.name}}

    # 7. Specific State logistics profile
    if matched_state and any(w in lower for w in ["state", "about", "logistics", "network", "overview", "how is"]):
        return {"type": "state", "entities": entities, "parameters": {"state_id": matched_state.id, "state_name": matched_state.name}}

    # 8. Commodity specific
    commodity_patterns = ["tea", "medicine", "medical", "pharma", "grain", "pds", "fuel", "petroleum", "cement", "steel", "perishable", "spices"]
    if any(w in lower for w in commodity_patterns):
        return {"type": "commodity", "entities": entities, "parameters": {}}

    # 9. Demand forecast
    if any(w in lower for w in ["demand", "forecast", "predict", "increase", "next month", "surge", "volume"]):
        return {"type": "demand", "entities": entities, "parameters": {}}

    # 10. Hubs & storage
    if any(w in lower for w in ["hub", "warehouse", "depot", "new hub", "storage", "capacity"]):
        return {"type": "hub", "entities": entities, "parameters": {}}

    # 11. Infrastructure gaps & investment
    if any(w in lower for w in ["infrastructure", "gap", "improve", "intervention", "invest", "deficit"]):
        return {"type": "infrastructure", "entities": entities, "parameters": {}}

    # 12. Risk general
    if any(w in lower for w in ["risk", "danger", "vulnerable", "hazard"]):
        return {"type": "risk", "entities": entities, "parameters": {}}

    return {"type": "general", "entities": entities, "parameters": {}}


# --------------------------------------------------------------------------
# HANDLERS
# --------------------------------------------------------------------------

def handle_realtime_convoys_query(query: str) -> CopilotMessage:
    lower = query.lower()
    now = datetime.now()
    now_str = now.strftime("%H:%M:%S")

    # Check if a specific convoy or truck is requested
    target_convoy = None
    for c in ACTIVE_CONVOYS:
        if c["id"].lower() in lower or c["driver"].lower() in lower or c["origin"].lower() in lower or c["destination"].lower() in lower:
            target_convoy = c
            break

    if target_convoy:
        c = target_convoy
        content = (
            f"**Real-Time Telemetry for {c['id']}** (Pinged at {now_str}):\n\n"
            f"• **Corridor:** {c['corridor']}\n"
            f"• **Driver:** {c['driver']}\n"
            f"• **Cargo:** {c['cargo']} ({c['weightTons']} tons)\n"
            f"• **Live GPS Coordinates:** `{c['currentLat']:.4f}°N, {c['currentLng']:.4f}°E`\n"
            f"• **Current Speed:** **{c['speedKmh']} km/h**\n"
            f"• **Status:** {c['status'].upper()} (ETA: ~{c['etaHours']} hrs)\n"
            f"• **Delay Risk Assessment:** {c['delayRisk']}\n\n"
            f"**Live Copilot Advisory:** Vehicle telemetry is active. Maintain recommended mountain speeds around hairpin bends."
        )
        metrics = [
            MetricItem(label="Speed", value=f"{c['speedKmh']} km/h"),
            MetricItem(label="ETA", value=f"{c['etaHours']} hrs"),
            MetricItem(label="Cargo Weight", value=f"{c['weightTons']} t"),
            MetricItem(label="Risk", value=c['delayRisk'].split()[0]),
        ]
        return CopilotMessage(
            role="assistant",
            content=content,
            timestamp=now.isoformat(),
            metrics=metrics,
            recommendations=[
                f"Continuous tracking active on corridor {c['corridor']}",
                "Alert driver if heavy fog or rainfall exceeds 15mm/hr",
                "Ensure emergency staging contact is notified",
            ],
        )

    # General live convoys overview
    convoy_list = "\n".join(
        f"• **{c['id']}** ({c['corridor']}): {c['cargo']} — **{c['speedKmh']} km/h** | ETA: {c['etaHours']}h | Risk: {c['delayRisk']}"
        for c in ACTIVE_CONVOYS
    )
    total_tons = sum(c["weightTons"] for c in ACTIVE_CONVOYS)
    avg_speed = round(sum(c["speedKmh"] for c in ACTIVE_CONVOYS) / len(ACTIVE_CONVOYS), 1)

    content = (
        f"**Live NER Freight Operations Stream** (Real-Time GPS Ping: {now_str}):\n\n"
        f"There are currently **{len(ACTIVE_CONVOYS)} commercial freight convoys** actively tracked across North Eastern corridors carrying **{total_tons:.1f} tons** of supplies:\n\n"
        f"{convoy_list}\n\n"
        f"**Fleet Real-time Overview:**\n"
        f"• Average Velocity across hill corridors: **{avg_speed} km/h**\n"
        f"• High-Risk Zone: Sela Pass (NH-13 Tawang Access) — fog and single-lane bottlenecks\n"
        f"• Green Corridors: NH-10 (Siliguri-Gangtok) and NH-44 (Guwahati-Silchar) moving smoothly."
    )

    metrics = [
        MetricItem(label="Active Convoys", value=str(len(ACTIVE_CONVOYS))),
        MetricItem(label="Total Freight", value=f"{total_tons:.1f} t"),
        MetricItem(label="Avg Velocity", value=f"{avg_speed} km/h"),
        MetricItem(label="Monitored Corridors", value=f"{len(ACTIVE_CONVOYS)}"),
    ]
    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            "Monitor CONVOY-NER-101 approaching Sela Pass for inclement weather",
            "Pre-clear transshipment bay at Silchar Rail Depot for arriving rebar freight",
            "Coordinate with BRO (Border Roads Organisation) on NH-13 maintenance clearances",
        ],
    )


def handle_live_alerts_query(db: Session) -> CopilotMessage:
    now = datetime.now()
    active_events = db.query(RiskEvent).filter(RiskEvent.severity.in_(["critical", "high"])).all()
    
    events_text = "\n\n".join(
        f"• ⚠️ **{e.location}** [{e.severity.upper()}]\n"
        f"  Type: {e.type.replace('_', ' ').title()} | Status: Active\n"
        f"  Description: {e.description}\n"
        f"  Recommendation: {e.recommendation}"
        for e in active_events[:4]
    )

    content = (
        f"**Live Disruption & Hazard Alert Center:**\n\n"
        f"Here are the active high-priority weather and geological disruptions recorded in the NER database:\n\n"
        f"{events_text}\n\n"
        f"**Dynamic Rerouting Advisory:**\n"
        f"• NH-10 (Sevoke-Teesta section): Maintain caution for localized rockfalls during heavy showers.\n"
        f"• NH-13 (Bhalukpong-Tawang): Fog and single-lane crawl near Sela Tunnel portal.\n"
        f"• GS Road (Guwahati-Shillong): All four lanes operational with nominal transit times."
    )

    metrics = [
        MetricItem(label="Critical Alerts", value=str(len([e for e in active_events if e.severity == 'critical']))),
        MetricItem(label="High Alerts", value=str(len([e for e in active_events if e.severity == 'high']))),
        MetricItem(label="Road Network Status", value="94.2% Operational"),
    ]
    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            "Enforce mandatory convoy departure spacing during night operations",
            "Inspect culvert drainage along NH-29 Dimapur-Kohima corridor",
            "Broadcast automated SMS alerts to freight drivers entering high landslide sectors",
        ],
    )


def handle_route_query(db: Session, query: str, entities: List[str]) -> CopilotMessage:
    now = datetime.now()
    nodes = {d.name.lower(): d.name for d in db.query(District).all()}
    
    origin = None
    dest = None
    lower = query.lower()

    # Match origin and destination
    for e in entities:
        if not origin:
            origin = e
        elif not dest and e != origin:
            dest = e

    if not origin:
        origin = "Guwahati"
    if not dest:
        dest = "Tawang" if origin.lower() != "tawang" else "Silchar"

    # Compute Dijkstra weighted route
    routes = optimize_routes(
        db=db,
        origin=origin.lower().replace(" ", "-"),
        destination=dest.lower().replace(" ", "-"),
        priority="safest",
        cargo_weight=500.0,
        vehicle_type="Medium Truck (3.5-12t)",
    )
    best_route = routes[0] if routes else None

    if best_route:
        waypoints_str = " → ".join(best_route.waypoints)
        content = (
            f"**AI Multi-Criteria Route Optimization: {origin} to {dest}**\n\n"
            f"**Recommended Route ({best_route.recommendation}):**\n"
            f"• **Corridor Path:** {waypoints_str}\n"
            f"• **Estimated Distance:** **{best_route.distance} km**\n"
            f"• **Expected Travel Time:** **{best_route.travelTime} hours** (including terrain gradient factor)\n"
            f"• **Corridor Safety Factor:** **{100 - best_route.riskScore}/100** (Risk Index: {best_route.riskScore})\n"
            f"• **Estimated Fuel & Freight Cost:** ₹{best_route.cost:,}\n\n"
            f"**Terrain & Multi-Hazard Analysis:**\n"
            f"• {best_route.explanation.primaryReason}\n"
            f"• Weather Impact: {best_route.explanation.weatherConsideration}\n"
            f"• Road Condition: {best_route.explanation.roadQualityImpact}"
        )
        metrics = [
            MetricItem(label="Distance", value=f"{best_route.distance} km"),
            MetricItem(label="Travel Time", value=f"{best_route.travelTime} hrs"),
            MetricItem(label="Safety Score", value=f"{100 - best_route.riskScore}/100"),
            MetricItem(label="Freight Cost", value=f"₹{best_route.cost:,}"),
        ]
    else:
        content = (
            f"**Route Analysis for {origin} → {dest}:**\n\n"
            f"Connecting the regional freight nodes between **{origin}** and **{dest}**.\n"
            f"• Standard Hill Corridor Velocity: 30–45 km/h depending on gradient\n"
            f"• Primary Highway: National Highway network links with checkpost monitoring\n"
            f"• Fuel Burn Penalty: +18% on high altitude climb sections."
        )
        metrics = [
            MetricItem(label="Origin", value=origin),
            MetricItem(label="Destination", value=dest),
            MetricItem(label="Status", value="Operational"),
        ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            f"Schedule departures from {origin} before 06:00 to avoid hill pass congestion",
            "Verify tire tread depth and air brake pressure for descending gradients",
            "Check live landslide cameras at border transshipment checkpoints",
        ],
    )


def handle_district_query(db: Session, district_id: str, district_name: str) -> CopilotMessage:
    now = datetime.now()
    d = db.query(District).filter(District.id == district_id).first()
    if not d:
        d = db.query(District).filter(District.name.ilike(f"%{district_name}%")).first()

    if not d:
        return handle_general_query()

    state = db.query(State).filter(State.id == d.state_id).first()
    state_name = state.name if state else "NER"

    content = (
        f"**Logistics & Accessibility Dossier: {d.name} ({state_name})**\n\n"
        f"• **Overall Accessibility Score:** **{d.accessibility_score}/100**\n"
        f"• **Multi-Hazard Vulnerability Index:** **{d.risk_score}/100** ({'CRITICAL' if d.risk_score > 70 else 'HIGH' if d.risk_score > 50 else 'MODERATE'})\n"
        f"• **Road Density & Quality:** {d.road_connectivity}/100\n"
        f"• **Terrain Classification:** **{d.terrain.capitalize()}** (Gradient penalty applied to vehicle speeds)\n"
        f"• **Distance to Nearest Logistics Hub:** **{d.nearest_hub_distance} km**\n"
        f"• **Average Inbound Delivery Time:** **{d.avg_delivery_time} hours**\n"
        f"• **District Population:** {d.population:,} residents\n"
        f"• **Daily Freight Demand:** ~{d.demand_level * 18} tons/day\n\n"
        f"**Key Operational Bottlenecks:**\n"
        f"Terrain ruggedness and long distances to major multi-modal terminals create high freight markup. "
        f"Establishing micro-fulfillment depots and cold storage solves supply perishability."
    )

    metrics = [
        MetricItem(label="Accessibility", value=f"{d.accessibility_score}/100"),
        MetricItem(label="Risk Factor", value=f"{d.risk_score}/100"),
        MetricItem(label="Hub Distance", value=f"{d.nearest_hub_distance} km"),
        MetricItem(label="Avg Delivery", value=f"{d.avg_delivery_time} hrs"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            f"Construct cold-chain staging facility in {d.name} for perishables and vaccines",
            "Establish secondary all-weather bypass to reduce hub transit lag",
            "Deploy all-wheel drive medium tonnage trucks (<12t) for mountainous climbs",
        ],
    )


def handle_state_query(db: Session, state_id: str, state_name: str) -> CopilotMessage:
    now = datetime.now()
    districts = db.query(District).filter(District.state_id == state_id).all()
    if not districts:
        districts = db.query(District).all()

    avg_acc = round(sum(d.accessibility_score for d in districts) / len(districts), 1) if districts else 50
    avg_risk = round(sum(d.risk_score for d in districts) / len(districts), 1) if districts else 40
    total_pop = sum(d.population for d in districts)

    district_breakdown = ", ".join(f"{d.name} ({d.accessibility_score}/100)" for d in districts[:6])

    content = (
        f"**State Logistics Intelligence: {state_name}**\n\n"
        f"• **Average Accessibility Score:** **{avg_acc}/100**\n"
        f"• **Average Hazard Risk Score:** **{avg_risk}/100**\n"
        f"• **Covered Districts:** {len(districts)} districts ({district_breakdown})\n"
        f"• **Total Recorded Population:** {total_pop:,}\n\n"
        f"**Supply Chain Strategic Overview:**\n"
        f"• Connectivity relies on primary arterial corridors crossing difficult elevation changes.\n"
        f"• Monsoon resilience requires proactive buffer stock prepositioning 30 days prior to peak rain.\n"
        f"• Multi-modal integration with railheads and inland waterway NW-2 significantly reduces cost-per-ton."
    )

    metrics = [
        MetricItem(label="Avg Access", value=f"{avg_acc}/100"),
        MetricItem(label="Avg Risk", value=f"{avg_risk}/100"),
        MetricItem(label="Districts", value=str(len(districts))),
        MetricItem(label="Total Population", value=f"{total_pop / 1000000:.1f}M"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            f"Enhance freight transshipment points connecting {state_name} with the Siliguri corridor",
            "Integrate automated early warning sensors for active landslide corridors",
            "Establish regional warehousing hubs near state administrative centers",
        ],
    )


def handle_commodity_query(db: Session, query: str) -> CopilotMessage:
    now = datetime.now()
    lower = query.lower()

    if "tea" in lower:
        commodity = "Assam & Tripura Tea"
        details = "Bulk tea transport requires moisture-controlled containers. Major exit routes: Upper Assam (Jorhat, Dibrugarh) via NH-37 to Guwahati Multi-Modal Park, then via inland waterway NW-2 barges or broad-gauge freight trains to Kolkata Port."
        recommendation = "Utilize NW-2 Brahmaputra waterway freight barges from Pandu Port to Kolkata to reduce shipping costs by 34%."
    elif "medicine" in lower or "medical" in lower or "pharma" in lower:
        commodity = "Pharmaceuticals & Cold-Chain"
        details = "Vaccines and temperature-sensitive medicine suffer high wastage during mountain transit delays. Active cold storage nodes exist in Guwahati, Siliguri, and Gangtok."
        recommendation = "Deploy IoT-monitored refrigerated reefers with backup generators on NH-10 and NH-6 routes."
    elif "fuel" in lower or "petroleum" in lower:
        commodity = "POL & Petroleum Products"
        details = "Refineries in Digboi, Numaligarh, and Guwahati supply petroleum tankers across hill states. High fire hazard on mountain curves requires daytime escort and regulated convoy spacing."
        recommendation = "Strictly limit tanker speeds to 35 km/h on descending gradients and enforce mandatory brake cooling halts."
    else:
        commodity = "Essential Food Grains & PDS"
        details = "FCI (Food Corporation of India) moves rice and wheat from Punjab/Haryana through the Siliguri corridor to Northeast buffer godowns. Storage buffers must cover minimum 45 days consumption for hill states during monsoon."
        recommendation = "Pre-position 60,000 tons of buffer grains in Silchar and Dimapur before July rains."

    content = (
        f"**Commodity Freight Intelligence: {commodity}**\n\n"
        f"{details}\n\n"
        f"**Strategic Logistics Advisory:**\n"
        f"{recommendation}"
    )

    metrics = [
        MetricItem(label="Commodity", value=commodity.split()[0]),
        MetricItem(label="Corridor Priority", value="Critical"),
        MetricItem(label="Buffer Target", value="45 Days"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            recommendation,
            "Establish real-time temperature telemetry for sensitive consignments",
            "Prioritize green corridor clearance at border checkposts",
        ],
    )


def handle_scenario_query(db: Session, query: str, entities: List[str]) -> CopilotMessage:
    now = datetime.now()
    lower = query.lower()

    corridor = "NH-10 (Sevoke-Gangtok)" if "nh-10" in lower or "gangtok" in lower else "NH-6 (Guwahati-Shillong)" if "nh-6" in lower or "shillong" in lower else "NH-29 (Dimapur-Kohima)"

    content = (
        f"**Disruption Scenario Simulation: Complete Closure of {corridor}**\n\n"
        f"**Immediate Impact Assessment:**\n"
        f"• **Direct Freight Flow Halted:** ~1,850 tons/day diverted to secondary hill arteries\n"
        f"• **Detour Route:** Rerouted via state interior roads with +140 km additional travel\n"
        f"• **Transit Time Penalty:** +4.5 to +7.2 hours depending on road width and single-lane bottlenecks\n"
        f"• **Freight Cost Increase:** +28% due to steep gradient fuel consumption and vehicle wear\n\n"
        f"**Automated Contingency Plan:**\n"
        f"1. Activate emergency multi-modal transshipment at nearest operational railhead.\n"
        f"2. Pre-position heavy road clearance machinery with BRO (Border Roads Organisation).\n"
        f"3. Prioritize medical and oxygen tankers for police escort convoys."
    )

    metrics = [
        MetricItem(label="Disrupted Corridor", value=corridor.split()[0]),
        MetricItem(label="Detour Penalty", value="+140 km"),
        MetricItem(label="Time Delay", value="+5.8 hrs"),
        MetricItem(label="Cost Impact", value="+28%"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            f"Notify all logistics hubs of temporary embargo on {corridor}",
            "Reroute non-perishable freight to secondary state highways",
            "Deploy emergency fuel reserves at alternate mountain passes",
        ],
    )


def handle_accessibility_query(db: Session, intent: Dict[str, Any]) -> CopilotMessage:
    all_acc = compute_all_accessibility(db)
    states_dict = {s.id: s.name for s in db.query(State).all()}

    if intent["parameters"].get("sort") == "worst":
        worst_5 = list(reversed(all_acc[-5:]))
        details = "\n".join(
            f"{i + 1}. **{d.districtName}** ({states_dict.get(d.stateId, '')}): {d.overallScore}/100 — {d.level}"
            for i, d in enumerate(worst_5)
        )
        content = (
            f"Based on real-time logistics intelligence data, here are the districts with the **worst logistics accessibility** in the NER:\n\n"
            f"{details}\n\n"
            f"**Primary factors** limiting accessibility in these areas:\n"
            f"• Limited road connectivity and high elevation terrain\n"
            f"• Severe distance from major multi-modal logistics hubs\n"
            f"• High hazard vulnerability (monsoon landslides & flash floods)\n\n"
            f"**Recommendation:** Prioritize road quality upgrades and establish regional staging hubs in remote mountain corridors."
        )
        metrics = [MetricItem(label=d.districtName, value=f"{d.overallScore}/100") for d in worst_5]
        return CopilotMessage(
            role="assistant",
            content=content,
            timestamp=datetime.now().isoformat(),
            metrics=metrics,
            recommendations=[
                "Establish logistics staging hub in Tawang corridor",
                "Upgrade NH-13 all-weather pavement quality",
                "Deploy emergency helipad network for monsoon cutoffs",
                "Pre-position essential supplies in remote districts",
            ],
        )
    else:
        best_5 = all_acc[:5]
        details = "\n".join(
            f"{i + 1}. **{d.districtName}** ({states_dict.get(d.stateId, '')}): {d.overallScore}/100 — {d.level}"
            for i, d in enumerate(best_5)
        )
        content = f"Districts with the **best logistics accessibility** in the NER:\n\n{details}"
        metrics = [MetricItem(label=d.districtName, value=f"{d.overallScore}/100") for d in best_5]
        return CopilotMessage(
            role="assistant",
            content=content,
            timestamp=datetime.now().isoformat(),
            metrics=metrics,
            recommendations=["Maintain infrastructure quality", "Utilize high connectivity for regional spoke distribution"],
        )


def handle_demand_query(db: Session, intent: Dict[str, Any]) -> CopilotMessage:
    top_districts = (
        db.query(District).order_by(District.demand_level.desc()).limit(5).all()
    )
    forecasts = [forecast_demand(db, d.id) for d in top_districts]
    increasing = [f for f in forecasts if f.trend == "increasing"]

    details = "\n".join(
        f"{i + 1}. **{f.districtName}**: Current {f.currentDemand} tons/day, 7-day forecast: {f.forecast7Day} tons/day ({f.trend}, {f.trendPercentage:+.1f}%)"
        for i, f in enumerate(forecasts)
    )

    content = (
        f"**NER Logistics Demand Intelligence:**\n\n"
        f"**Top demand centers:**\n{details}\n\n"
        f"**Demand trends:**\n"
        f"• {len(increasing)} of top 5 districts showing **increasing** demand\n"
        f"• Primary driver: Monsoon season logistics surge\n"
        f"• Pattern: {forecasts[0].seasonalPattern if forecasts else 'Stable'}\n\n"
        f"**Recommendation:** Increase buffer stock at Guwahati and Siliguri hubs by 15-20% to handle projected surge."
    )

    metrics = [MetricItem(label=f.districtName, value=f"{f.currentDemand} t/day") for f in forecasts]
    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=datetime.now().isoformat(),
        metrics=metrics,
        recommendations=[
            "Increase buffer stock at major hubs",
            "Pre-position monsoon supplies",
            "Activate overflow logistics capacity",
        ],
    )


def handle_hub_query(db: Session, intent: Dict[str, Any]) -> CopilotMessage:
    gaps = get_top_gaps(db, limit=5)
    hubs = (
        db.query(LogisticsHub)
        .order_by(LogisticsHub.current_utilization.desc())
        .all()
    )

    hub_status = "\n".join(
        f"• **{h.name}** ({h.city}): {h.current_utilization}% utilized, {h.storage_available} tons available"
        for h in hubs
    )
    rec_locations = "\n".join(
        f"{i + 1}. **{g.districtName}** ({g.stateName}): Gap score {g.gapScore}/100, nearest hub {g.nearestHubDistance} km away"
        for i, g in enumerate(gaps)
    )

    top_district = gaps[0].districtName if gaps else "Tawang"
    content = (
        f"**Logistics Hub Intelligence:**\n\n"
        f"**Current hub status:**\n{hub_status}\n\n"
        f"**Recommended locations for new hubs:**\n{rec_locations}\n\n"
        f"**Analysis:**\n"
        f"The most impactful new hub location would be in **{top_district}**, which would drastically cut transit times and establish redundancy.\n\n"
        f"**Recommendation:** Prioritize hub development in {top_district} with multi-modal transshipment facilities."
    )

    metrics = [MetricItem(label=h.city, value=f"{h.current_utilization}%") for h in hubs[:4]]
    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=datetime.now().isoformat(),
        metrics=metrics,
        recommendations=[f"New hub in {g.districtName}: {g.recommendedIntervention}" for g in gaps[:3]],
    )


def handle_infrastructure_query(db: Session, intent: Dict[str, Any]) -> CopilotMessage:
    gaps = get_top_gaps(db, limit=8)
    total_cost = sum(g.estimatedCost for g in gaps)

    details = "\n\n".join(
        f"**Priority #{i + 1}: {g.districtName}** ({g.stateName})\n"
        f"• Gap Score: {g.gapScore}/100 ({g.priority.upper()})\n"
        f"• Accessibility: {100 - g.accessibilityDeficit}/100\n"
        f"• Nearest Hub: {g.nearestHubDistance} km\n"
        f"• Intervention: {g.recommendedIntervention}\n"
        f"• Est. Cost: ₹{g.estimatedCost} Cr"
        for i, g in enumerate(gaps[:5])
    )

    content = (
        f"**Infrastructure Gap Analysis — Priority Interventions:**\n\n"
        f"{details}\n\n"
        f"**Total estimated investment for top 8 priorities:** ₹{total_cost} Crores\n\n"
        f"**Recommendation:** Phase implementation starting with road connectivity upgrades (highest ROI), followed by hub establishment, and then rail extension projects."
    )

    metrics = [
        MetricItem(label="Priority Areas", value=str(len([g for g in gaps if g.priority in ("critical", "high")]))),
        MetricItem(label="Total Investment", value=f"₹{total_cost} Cr"),
    ]
    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=datetime.now().isoformat(),
        metrics=metrics,
        recommendations=[f"{g.districtName}: {g.recommendedIntervention}" for g in gaps[:4]],
    )


def handle_risk_query(db: Session) -> CopilotMessage:
    all_risks = assess_all_risks(db)
    crit_high = [r for r in all_risks if r.level in ("CRITICAL", "HIGH")]

    details = "\n".join(
        f"• **{r.districtName}**: Risk Score {r.overallRisk}/100 ({r.level}) — Primary Hazard: {r.primaryHazard.capitalize()}"
        for r in crit_high[:6]
    )

    content = (
        f"**NER Multi-Hazard Logistics Vulnerability Assessment:**\n\n"
        f"Identified **{len(crit_high)} districts** in critical or high risk zones:\n\n"
        f"{details}\n\n"
        f"**Top Seasonal Vulnerabilities:**\n"
        f"• High landslide probability along NH-10 (Sikkim) and NH-13 (Arunachal)\n"
        f"• Inundation risk along Brahmaputra river valleys in Assam during peak monsoon\n"
        f"• Seismic Zone V considerations for bridge and warehouse construction."
    )

    metrics = [
        MetricItem(label="Critical/High Districts", value=str(len(crit_high))),
        MetricItem(label="Primary Hazard", value="Landslide & Floods"),
        MetricItem(label="Monitoring Frequency", value="Real-Time"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=datetime.now().isoformat(),
        metrics=metrics,
        recommendations=[
            "Maintain live bridge sensor telemetry on Brahmaputra crossings",
            "Stock pile gabion wall repair mesh near landslide hot-spots",
            "Reroute hazardous cargo away from narrow cliff corridors during downpours",
        ],
    )


def try_gemini_query(query: str, db: Session, user_api_key: Optional[str] = None) -> Optional[CopilotMessage]:
    """If GEMINI_API_KEY is configured or passed, queries Google Gemini with active real-time context."""
    api_key = user_api_key or settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        # Real-time state summary
        live_convoys_summary = f"{len(ACTIVE_CONVOYS)} active trucks on NER roads (Guwahati-Tawang, Dimapur-Imphal, Siliguri-Gangtok, Guwahati-Silchar, Silchar-Aizawl)."
        system_context = (
            "You are the NER Logistics AI Copilot, an expert AI decision assistant for logistics in India's 8 North Eastern States "
            "(Assam, Meghalaya, Arunachal Pradesh, Sikkim, Tripura, Mizoram, Nagaland, Manipur). "
            f"Current real-time operations state: {live_convoys_summary}. "
            "Always respond concisely with factual, data-driven analysis, citing corridors, terrain factors, and recommendations."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_context}\n\nUser Question: {query}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.35,
                "maxOutputTokens": 850,
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidate = res_data["candidates"][0]["content"]["parts"][0]["text"]

            return CopilotMessage(
                role="assistant",
                content=candidate,
                timestamp=datetime.now().isoformat(),
                metrics=[
                    MetricItem(label="AI Engine", value="Gemini 1.5 Flash"),
                    MetricItem(label="Platform Data", value="Real-Time Synced"),
                ],
                recommendations=[
                    "Real-time route simulation available in Route Optimizer",
                    "Monitor live convoy telemetry in Dashboard",
                ],
            )
    except Exception as e:
        print(f"Gemini API query error: {e}")
        return None


def try_openai_query(query: str, db: Session) -> Optional[CopilotMessage]:
    """If OPENAI_API_KEY is configured, queries OpenAI gpt-4o-mini."""
    if not settings.OPENAI_API_KEY:
        return None

    try:
        url = "https://api.openai.com/v1/chat/completions"
        live_convoys_summary = f"{len(ACTIVE_CONVOYS)} active commercial convoys on NER roads."
        system_context = (
            "You are the NER Logistics AI Copilot, an expert AI decision assistant for logistics in India's 8 North Eastern States. "
            f"Current state: {live_convoys_summary}. Always respond with clear, factual, logistics-grade analysis."
        )

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": query}
            ],
            "temperature": 0.3,
            "max_tokens": 800,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            reply = res_data["choices"][0]["message"]["content"]
            return CopilotMessage(
                role="assistant",
                content=reply,
                timestamp=datetime.now().isoformat(),
                metrics=[
                    MetricItem(label="AI Engine", value="OpenAI GPT-4o-mini"),
                    MetricItem(label="Platform Data", value="Real-Time Synced"),
                ],
                recommendations=[
                    "Real-time route simulation available in Route Optimizer",
                    "Monitor live convoy telemetry in Dashboard",
                ],
            )
    except Exception as e:
        print(f"OpenAI API query error: {e}")
        return None


def handle_general_query(query: str = "") -> CopilotMessage:
    now = datetime.now()

    content = (
        f"**NER Logistics Intelligence Insights:**\n\n"
        f"Analyzing supply chain dynamics across the **8 North Eastern States**:\n\n"
        f"• **Corridor Geography:** The Siliguri Corridor ('Chicken's Neck', 22 km width) handles over 85% of all inbound surface freight into the NER. Establishing multimodal redundancy via National Waterway 2 (Brahmaputra) and rail links is the primary regional resilience goal.\n"
        f"• **Live Operations:** {len(ACTIVE_CONVOYS)} monitored commercial convoys are currently in transit, with automated speed and delay monitoring active on NH-6, NH-10, NH-29, and NH-13.\n"
        f"• **Terrain Adaptation:** Mountain gradients reduce average commercial vehicle speed from 60 km/h (plains) to 28-35 km/h, requiring specialized staging depots.\n\n"
        f"You can ask me about:\n"
        f"1. **Real-time Convoys:** *\"Where are moving trucks right now?\"* or *\"Status of CONVOY-NER-101\"*\n"
        f"2. **Live Hazards:** *\"Any landslides or active road alerts?\"*\n"
        f"3. **Route Planning:** *\"Safest route from Guwahati to Tawang\"*\n"
        f"4. **Districts & States:** *\"How is logistics in Meghalaya?\"* or *\"Logistics score for Aizawl\"*\n"
        f"5. **Commodities:** *\"How to ship Assam tea efficiently?\"*"
    )

    metrics = [
        MetricItem(label="NER States", value="8 Covered"),
        MetricItem(label="Live Convoys", value=str(len(ACTIVE_CONVOYS))),
        MetricItem(label="Road Network", value="94.2% Operational"),
        MetricItem(label="Data Sync", value="Real-Time"),
    ]

    return CopilotMessage(
        role="assistant",
        content=content,
        timestamp=now.isoformat(),
        metrics=metrics,
        recommendations=[
            "Ask about specific moving trucks, corridors, or districts",
            "Use the Scenario Simulator to model sudden corridor blockages",
            "Examine the Infrastructure Gaps module for prioritized investments",
        ],
    )


# --------------------------------------------------------------------------
# MAIN DISPATCHER
# --------------------------------------------------------------------------

def process_copilot_query(db: Session, query: str, user_api_key: Optional[str] = None) -> CopilotMessage:
    # 1. Try Gemini LLM if API key is provided or passed
    gemini_res = try_gemini_query(query, db, user_api_key)
    if gemini_res:
        return gemini_res

    # 2. Try OpenAI LLM if configured
    openai_res = try_openai_query(query, db)
    if openai_res:
        return openai_res

    # 2. Extract database entities
    districts = db.query(District).all()
    states = db.query(State).all()
    intent = parse_query_intent(query, districts, states)

    t = intent["type"]
    p = intent["parameters"]

    if t == "realtime_convoys":
        return handle_realtime_convoys_query(query)
    elif t == "live_alerts":
        return handle_live_alerts_query(db)
    elif t == "route":
        return handle_route_query(db, query, intent["entities"])
    elif t == "district":
        return handle_district_query(db, p["district_id"], p["district_name"])
    elif t == "state":
        return handle_state_query(db, p["state_id"], p["state_name"])
    elif t == "commodity":
        return handle_commodity_query(db, query)
    elif t == "scenario":
        return handle_scenario_query(db, query, intent["entities"])
    elif t == "accessibility":
        return handle_accessibility_query(db, intent)
    elif t == "demand":
        return handle_demand_query(db, intent)
    elif t == "hub":
        return handle_hub_query(db, intent)
    elif t == "infrastructure":
        return handle_infrastructure_query(db, intent)
    elif t == "risk":
        return handle_risk_query(db)
    else:
        return handle_general_query(query)
