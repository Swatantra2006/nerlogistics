"""
Real-Time Telemetry & Live Logistics Feed API router.
Provides live convoy tracking, GPS simulation along NER corridors, and real-time hazard alerts.
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from datetime import datetime
import random
import math

router = APIRouter(prefix="/api/realtime", tags=["Real-Time Intelligence"])

# Active freight corridors with simulated GPS paths
ACTIVE_CONVOYS = [
    {
        "id": "CONVOY-NER-101",
        "corridor": "Guwahati → Tawang (NH-13)",
        "origin": "Guwahati",
        "destination": "Tawang",
        "driver": "Tsering Dorjee",
        "cargo": "High-Altitude Medical Supplies & Fuel",
        "weightTons": 14.5,
        "currentLat": 27.2660,
        "currentLng": 92.4200,
        "speedKmh": 28.4,
        "status": "in_transit",
        "delayRisk": "High (Sela Pass Debris)",
        "etaHours": 4.5,
    },
    {
        "id": "CONVOY-NER-204",
        "corridor": "Dimapur → Imphal (NH-2)",
        "origin": "Dimapur",
        "destination": "Imphal",
        "driver": "Rajen Singh",
        "cargo": "Essential FMCG & Grains",
        "weightTons": 22.0,
        "currentLat": 25.3500,
        "currentLng": 94.0200,
        "speedKmh": 35.2,
        "status": "in_transit",
        "delayRisk": "Medium (Mao Gate Single Lane)",
        "etaHours": 2.2,
    },
    {
        "id": "CONVOY-NER-309",
        "corridor": "Siliguri → Gangtok (NH-10)",
        "origin": "Siliguri",
        "destination": "Gangtok",
        "driver": "Bikash Pradhan",
        "cargo": "Pharmaceuticals & Cold Storage",
        "weightTons": 8.0,
        "currentLat": 27.1500,
        "currentLng": 88.5200,
        "speedKmh": 41.0,
        "status": "in_transit",
        "delayRisk": "Low (Clear Corridors)",
        "etaHours": 1.1,
    },
    {
        "id": "CONVOY-NER-412",
        "corridor": "Guwahati → Silchar (NH-44)",
        "origin": "Guwahati",
        "destination": "Silchar",
        "driver": "Amal Barman",
        "cargo": "Construction Steel & Cement",
        "weightTons": 32.5,
        "currentLat": 25.4000,
        "currentLng": 92.5000,
        "speedKmh": 52.0,
        "status": "in_transit",
        "delayRisk": "Low",
        "etaHours": 3.8,
    },
    {
        "id": "CONVOY-NER-518",
        "corridor": "Silchar → Aizawl (NH-306)",
        "origin": "Silchar",
        "destination": "Aizawl",
        "driver": "Lalrinawma",
        "cargo": "Petroleum & Gas Cylinders",
        "weightTons": 18.0,
        "currentLat": 24.1500,
        "currentLng": 92.7100,
        "speedKmh": 31.5,
        "status": "in_transit",
        "delayRisk": "Medium (Steep Grade)",
        "etaHours": 1.9,
    },
]


@router.get("/feed")
def get_realtime_feed() -> Dict[str, Any]:
    """Returns real-time telemetry metrics, moving convoys, and live sensory notifications."""
    now = datetime.now()
    now_iso = now.isoformat()

    # Dynamic micro-jitter to simulate real-time live vehicle telemetry
    second = now.second
    updated_convoys = []
    for c in ACTIVE_CONVOYS:
        jitter_lat = math.sin(second * 0.1 + c["weightTons"]) * 0.005
        jitter_lng = math.cos(second * 0.1 + c["weightTons"]) * 0.005
        speed_delta = round((math.sin(second * 0.2) * 4), 1)

        updated_convoys.append({
            **c,
            "currentLat": round(c["currentLat"] + jitter_lat, 5),
            "currentLng": round(c["currentLng"] + jitter_lng, 5),
            "speedKmh": max(15.0, round(c["speedKmh"] + speed_delta, 1)),
            "lastTelemetryPing": now_iso,
        })

    live_alerts = [
        {
            "id": f"live-alert-{second % 10}",
            "corridor": "NH-13 (Tawang Access)",
            "message": "Heavy fog & 1.2mm rain recorded near Sela Pass. Recommended speed limit 25 km/h.",
            "severity": "high",
            "timestamp": "Just now",
        },
        {
            "id": "live-alert-2",
            "corridor": "NH-2 (Dimapur-Kohima)",
            "message": "Freight transit flowing normally through Dimapur bypass. Road friction index optimal.",
            "severity": "low",
            "timestamp": "2 min ago",
        },
        {
            "id": "live-alert-3",
            "corridor": "Guwahati Hub Terminal",
            "message": "Outbound bay 4 operational. Automated weighbridge throughput +14% above average.",
            "severity": "low",
            "timestamp": "5 min ago",
        },
    ]

    return {
        "timestamp": now_iso,
        "networkStatus": "OPTIMAL",
        "activeVehiclesCount": len(updated_convoys),
        "activeCorridors": 18,
        "liveTelemetryPingsPerMin": 840,
        "convoys": updated_convoys,
        "liveAlerts": live_alerts,
        "telemetryFrequencyHz": 1.0,
    }


@router.get("/convoys")
def get_active_convoys() -> List[Dict[str, Any]]:
    """Returns active freight convoys with live GPS coordinates."""
    feed = get_realtime_feed()
    return feed["convoys"]
