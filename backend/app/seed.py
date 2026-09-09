"""
Database Seed Script: Populates the database with realistic NER logistics, geospatial, and risk datasets.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.geo import State, District
from app.models.logistics import LogisticsHub, Road, GraphNode, GraphEdge
from app.models.infrastructure import Airport, RailwayStation
from app.models.risk import RiskEvent
from app.models.auth import User
from app.models.demand import DemandHistory
from app.models.analysis import AccessibilityScore
from app.services.accessibility import compute_accessibility
from app.config import settings
import hashlib
from datetime import datetime, timedelta
import math


def hash_pw(pw: str) -> str:
    return hashlib.sha256((pw + settings.SECRET_KEY).encode()).hexdigest()


STATES_DATA = [
    {"id": "assam", "name": "Assam", "capital": "Dispur", "lat": 26.2006, "lng": 92.9376, "area": 78438, "population": 35607039, "accessibility_score": 72, "risk_score": 55, "demand_level": "very-high"},
    {"id": "arunachal", "name": "Arunachal Pradesh", "capital": "Itanagar", "lat": 27.0844, "lng": 93.6053, "area": 83743, "population": 1570000, "accessibility_score": 34, "risk_score": 72, "demand_level": "low"},
    {"id": "manipur", "name": "Manipur", "capital": "Imphal", "lat": 24.8170, "lng": 93.9368, "area": 22327, "population": 3092000, "accessibility_score": 48, "risk_score": 62, "demand_level": "medium"},
    {"id": "meghalaya", "name": "Meghalaya", "capital": "Shillong", "lat": 25.5788, "lng": 91.8933, "area": 22429, "population": 3772000, "accessibility_score": 58, "risk_score": 52, "demand_level": "medium"},
    {"id": "mizoram", "name": "Mizoram", "capital": "Aizawl", "lat": 23.1645, "lng": 92.9376, "area": 21081, "population": 1240000, "accessibility_score": 42, "risk_score": 58, "demand_level": "low"},
    {"id": "nagaland", "name": "Nagaland", "capital": "Kohima", "lat": 25.6747, "lng": 94.1086, "area": 16579, "population": 2250000, "accessibility_score": 45, "risk_score": 60, "demand_level": "medium"},
    {"id": "sikkim", "name": "Sikkim", "capital": "Gangtok", "lat": 27.3389, "lng": 88.6065, "area": 7096, "population": 690000, "accessibility_score": 52, "risk_score": 65, "demand_level": "low"},
    {"id": "tripura", "name": "Tripura", "capital": "Agartala", "lat": 23.9408, "lng": 91.9882, "area": 10486, "population": 4169000, "accessibility_score": 55, "risk_score": 48, "demand_level": "medium"},
]

DISTRICTS_DATA = [
    # ASSAM
    {"id": "kamrup-metro", "name": "Kamrup Metropolitan", "state_id": "assam", "lat": 26.1445, "lng": 91.7362, "population": 1260000, "area": 1528, "accessibility_score": 88, "risk_score": 35, "road_connectivity": 92, "rail_connectivity": 90, "airport_access": 95, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 5, "avg_delivery_time": 4, "avg_travel_time": 1, "last_mile_difficulty": "low", "infrastructure_quality": 85, "demand_level": 90, "elevation": 55, "terrain": "plain"},
    {"id": "dibrugarh", "name": "Dibrugarh", "state_id": "assam", "lat": 27.4728, "lng": 94.9120, "population": 1327748, "area": 3381, "accessibility_score": 71, "risk_score": 48, "road_connectivity": 75, "rail_connectivity": 80, "airport_access": 72, "nearest_hub": "dibrugarh-hub", "nearest_hub_distance": 8, "avg_delivery_time": 8, "avg_travel_time": 5, "last_mile_difficulty": "low", "infrastructure_quality": 68, "demand_level": 72, "elevation": 108, "terrain": "plain"},
    {"id": "silchar", "name": "Cachar", "state_id": "assam", "lat": 24.8333, "lng": 92.7789, "population": 1736617, "area": 3786, "accessibility_score": 58, "risk_score": 52, "road_connectivity": 62, "rail_connectivity": 60, "airport_access": 55, "nearest_hub": "silchar-hub", "nearest_hub_distance": 12, "avg_delivery_time": 14, "avg_travel_time": 8, "last_mile_difficulty": "medium", "infrastructure_quality": 55, "demand_level": 65, "elevation": 30, "terrain": "plain"},
    {"id": "nagaon", "name": "Nagaon", "state_id": "assam", "lat": 26.3500, "lng": 92.6840, "population": 2823768, "area": 3831, "accessibility_score": 65, "risk_score": 55, "road_connectivity": 70, "rail_connectivity": 68, "airport_access": 45, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 120, "avg_delivery_time": 10, "avg_travel_time": 4, "last_mile_difficulty": "medium", "infrastructure_quality": 58, "demand_level": 68, "elevation": 60, "terrain": "plain"},
    {"id": "tinsukia", "name": "Tinsukia", "state_id": "assam", "lat": 27.4922, "lng": 95.3547, "population": 1327929, "area": 3790, "accessibility_score": 62, "risk_score": 50, "road_connectivity": 68, "rail_connectivity": 72, "airport_access": 40, "nearest_hub": "dibrugarh-hub", "nearest_hub_distance": 80, "avg_delivery_time": 12, "avg_travel_time": 6, "last_mile_difficulty": "medium", "infrastructure_quality": 55, "demand_level": 58, "elevation": 116, "terrain": "plain"},
    {"id": "jorhat", "name": "Jorhat", "state_id": "assam", "lat": 26.7509, "lng": 94.2037, "population": 1092256, "area": 2851, "accessibility_score": 68, "risk_score": 42, "road_connectivity": 72, "rail_connectivity": 70, "airport_access": 65, "nearest_hub": "dibrugarh-hub", "nearest_hub_distance": 130, "avg_delivery_time": 9, "avg_travel_time": 4.5, "last_mile_difficulty": "low", "infrastructure_quality": 62, "demand_level": 60, "elevation": 86, "terrain": "plain"},
    {"id": "sonitpur", "name": "Sonitpur", "state_id": "assam", "lat": 26.7000, "lng": 92.9700, "population": 1925975, "area": 5324, "accessibility_score": 60, "risk_score": 48, "road_connectivity": 65, "rail_connectivity": 62, "airport_access": 38, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 180, "avg_delivery_time": 11, "avg_travel_time": 5, "last_mile_difficulty": "medium", "infrastructure_quality": 52, "demand_level": 55, "elevation": 85, "terrain": "plain"},
    {"id": "barpeta", "name": "Barpeta", "state_id": "assam", "lat": 26.3210, "lng": 91.0050, "population": 1693622, "area": 3245, "accessibility_score": 56, "risk_score": 62, "road_connectivity": 58, "rail_connectivity": 55, "airport_access": 35, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 105, "avg_delivery_time": 12, "avg_travel_time": 4.5, "last_mile_difficulty": "medium", "infrastructure_quality": 48, "demand_level": 52, "elevation": 35, "terrain": "riverine"},
    # ARUNACHAL PRADESH
    {"id": "itanagar", "name": "Papum Pare", "state_id": "arunachal", "lat": 27.0844, "lng": 93.6053, "population": 176573, "area": 3462, "accessibility_score": 48, "risk_score": 62, "road_connectivity": 52, "rail_connectivity": 25, "airport_access": 42, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 350, "avg_delivery_time": 24, "avg_travel_time": 10, "last_mile_difficulty": "high", "infrastructure_quality": 42, "demand_level": 45, "elevation": 350, "terrain": "hilly"},
    {"id": "tawang", "name": "Tawang", "state_id": "arunachal", "lat": 27.5860, "lng": 91.8690, "population": 49977, "area": 2085, "accessibility_score": 22, "risk_score": 82, "road_connectivity": 28, "rail_connectivity": 0, "airport_access": 10, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 520, "avg_delivery_time": 48, "avg_travel_time": 18, "last_mile_difficulty": "very-high", "infrastructure_quality": 25, "demand_level": 35, "elevation": 3048, "terrain": "mountainous"},
    {"id": "west-kameng", "name": "West Kameng", "state_id": "arunachal", "lat": 27.2340, "lng": 92.3640, "population": 87013, "area": 7422, "accessibility_score": 28, "risk_score": 78, "road_connectivity": 32, "rail_connectivity": 0, "airport_access": 12, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 420, "avg_delivery_time": 42, "avg_travel_time": 15, "last_mile_difficulty": "very-high", "infrastructure_quality": 28, "demand_level": 30, "elevation": 1800, "terrain": "mountainous"},
    {"id": "east-siang", "name": "East Siang", "state_id": "arunachal", "lat": 28.0690, "lng": 95.3350, "population": 99214, "area": 4005, "accessibility_score": 32, "risk_score": 70, "road_connectivity": 38, "rail_connectivity": 5, "airport_access": 20, "nearest_hub": "dibrugarh-hub", "nearest_hub_distance": 280, "avg_delivery_time": 36, "avg_travel_time": 14, "last_mile_difficulty": "very-high", "infrastructure_quality": 30, "demand_level": 28, "elevation": 420, "terrain": "hilly"},
    {"id": "changlang", "name": "Changlang", "state_id": "arunachal", "lat": 27.1200, "lng": 95.7400, "population": 148226, "area": 4662, "accessibility_score": 25, "risk_score": 75, "road_connectivity": 30, "rail_connectivity": 8, "airport_access": 15, "nearest_hub": "dibrugarh-hub", "nearest_hub_distance": 320, "avg_delivery_time": 40, "avg_travel_time": 16, "last_mile_difficulty": "very-high", "infrastructure_quality": 22, "demand_level": 32, "elevation": 600, "terrain": "hilly"},
    {"id": "lower-subansiri", "name": "Lower Subansiri", "state_id": "arunachal", "lat": 27.6000, "lng": 93.8000, "population": 83030, "area": 3460, "accessibility_score": 30, "risk_score": 72, "road_connectivity": 35, "rail_connectivity": 0, "airport_access": 18, "nearest_hub": "guwahati-hub", "nearest_hub_distance": 400, "avg_delivery_time": 38, "avg_travel_time": 14, "last_mile_difficulty": "very-high", "infrastructure_quality": 26, "demand_level": 25, "elevation": 1200, "terrain": "mountainous"},
    # MANIPUR
    {"id": "imphal-west", "name": "Imphal West", "state_id": "manipur", "lat": 24.8074, "lng": 93.9384, "population": 517992, "area": 519, "accessibility_score": 62, "risk_score": 48, "road_connectivity": 68, "rail_connectivity": 15, "airport_access": 70, "nearest_hub": "imphal-hub", "nearest_hub_distance": 5, "avg_delivery_time": 10, "avg_travel_time": 6, "last_mile_difficulty": "medium", "infrastructure_quality": 58, "demand_level": 70, "elevation": 786, "terrain": "hilly"},
    {"id": "imphal-east", "name": "Imphal East", "state_id": "manipur", "lat": 24.8500, "lng": 94.0500, "population": 452661, "area": 710, "accessibility_score": 58, "risk_score": 50, "road_connectivity": 62, "rail_connectivity": 10, "airport_access": 65, "nearest_hub": "imphal-hub", "nearest_hub_distance": 12, "avg_delivery_time": 11, "avg_travel_time": 6.5, "last_mile_difficulty": "medium", "infrastructure_quality": 52, "demand_level": 62, "elevation": 790, "terrain": "hilly"},
    {"id": "churachandpur", "name": "Churachandpur", "state_id": "manipur", "lat": 24.3340, "lng": 93.6840, "population": 274143, "area": 4570, "accessibility_score": 28, "risk_score": 72, "road_connectivity": 30, "rail_connectivity": 0, "airport_access": 15, "nearest_hub": "imphal-hub", "nearest_hub_distance": 60, "avg_delivery_time": 32, "avg_travel_time": 12, "last_mile_difficulty": "very-high", "infrastructure_quality": 25, "demand_level": 38, "elevation": 1500, "terrain": "mountainous"},
    {"id": "ukhrul", "name": "Ukhrul", "state_id": "manipur", "lat": 25.1200, "lng": 94.3600, "population": 183998, "area": 4544, "accessibility_score": 24, "risk_score": 74, "road_connectivity": 28, "rail_connectivity": 0, "airport_access": 12, "nearest_hub": "imphal-hub", "nearest_hub_distance": 85, "avg_delivery_time": 36, "avg_travel_time": 14, "last_mile_difficulty": "very-high", "infrastructure_quality": 22, "demand_level": 30, "elevation": 1662, "terrain": "mountainous"},
    # MEGHALAYA
    {"id": "east-khasi", "name": "East Khasi Hills", "state_id": "meghalaya", "lat": 25.5788, "lng": 91.8933, "population": 825922, "area": 2748, "accessibility_score": 68, "risk_score": 48, "road_connectivity": 72, "rail_connectivity": 15, "airport_access": 62, "nearest_hub": "shillong-hub", "nearest_hub_distance": 5, "avg_delivery_time": 8, "avg_travel_time": 4, "last_mile_difficulty": "medium", "infrastructure_quality": 62, "demand_level": 68, "elevation": 1496, "terrain": "hilly"},
    {"id": "west-garo", "name": "West Garo Hills", "state_id": "meghalaya", "lat": 25.5200, "lng": 90.2200, "population": 643291, "area": 3714, "accessibility_score": 45, "risk_score": 58, "road_connectivity": 48, "rail_connectivity": 8, "airport_access": 30, "nearest_hub": "shillong-hub", "nearest_hub_distance": 320, "avg_delivery_time": 18, "avg_travel_time": 9, "last_mile_difficulty": "high", "infrastructure_quality": 40, "demand_level": 52, "elevation": 380, "terrain": "hilly"},
    {"id": "ri-bhoi", "name": "Ri-Bhoi", "state_id": "meghalaya", "lat": 25.7700, "lng": 91.8500, "population": 258840, "area": 2448, "accessibility_score": 60, "risk_score": 45, "road_connectivity": 65, "rail_connectivity": 12, "airport_access": 48, "nearest_hub": "shillong-hub", "nearest_hub_distance": 45, "avg_delivery_time": 10, "avg_travel_time": 4.5, "last_mile_difficulty": "medium", "infrastructure_quality": 52, "demand_level": 45, "elevation": 800, "terrain": "hilly"},
    {"id": "south-garo", "name": "South Garo Hills", "state_id": "meghalaya", "lat": 25.2800, "lng": 90.6200, "population": 142574, "area": 1850, "accessibility_score": 32, "risk_score": 65, "road_connectivity": 35, "rail_connectivity": 0, "airport_access": 15, "nearest_hub": "shillong-hub", "nearest_hub_distance": 380, "avg_delivery_time": 28, "avg_travel_time": 12, "last_mile_difficulty": "very-high", "infrastructure_quality": 28, "demand_level": 35, "elevation": 450, "terrain": "hilly"},
    # MIZORAM
    {"id": "aizawl-dist", "name": "Aizawl", "state_id": "mizoram", "lat": 23.7271, "lng": 92.7176, "population": 404054, "area": 3576, "accessibility_score": 52, "risk_score": 55, "road_connectivity": 55, "rail_connectivity": 0, "airport_access": 55, "nearest_hub": "aizawl-hub", "nearest_hub_distance": 5, "avg_delivery_time": 16, "avg_travel_time": 10, "last_mile_difficulty": "high", "infrastructure_quality": 48, "demand_level": 55, "elevation": 1132, "terrain": "mountainous"},
    {"id": "lunglei", "name": "Lunglei", "state_id": "mizoram", "lat": 22.8800, "lng": 92.7300, "population": 161428, "area": 4538, "accessibility_score": 28, "risk_score": 68, "road_connectivity": 30, "rail_connectivity": 0, "airport_access": 12, "nearest_hub": "aizawl-hub", "nearest_hub_distance": 180, "avg_delivery_time": 36, "avg_travel_time": 14, "last_mile_difficulty": "very-high", "infrastructure_quality": 25, "demand_level": 32, "elevation": 850, "terrain": "mountainous"},
    {"id": "champhai", "name": "Champhai", "state_id": "mizoram", "lat": 23.4567, "lng": 93.3280, "population": 125370, "area": 3185, "accessibility_score": 30, "risk_score": 65, "road_connectivity": 32, "rail_connectivity": 0, "airport_access": 10, "nearest_hub": "aizawl-hub", "nearest_hub_distance": 190, "avg_delivery_time": 34, "avg_travel_time": 13, "last_mile_difficulty": "very-high", "infrastructure_quality": 28, "demand_level": 28, "elevation": 1678, "terrain": "mountainous"},
    # NAGALAND
    {"id": "kohima", "name": "Kohima", "state_id": "nagaland", "lat": 25.6747, "lng": 94.1086, "population": 267988, "area": 1463, "accessibility_score": 52, "risk_score": 58, "road_connectivity": 55, "rail_connectivity": 0, "airport_access": 30, "nearest_hub": "dimapur-hub", "nearest_hub_distance": 74, "avg_delivery_time": 14, "avg_travel_time": 7, "last_mile_difficulty": "high", "infrastructure_quality": 48, "demand_level": 55, "elevation": 1444, "terrain": "mountainous"},
    {"id": "dimapur", "name": "Dimapur", "state_id": "nagaland", "lat": 25.8973, "lng": 93.7266, "population": 378811, "area": 927, "accessibility_score": 65, "risk_score": 42, "road_connectivity": 70, "rail_connectivity": 72, "airport_access": 60, "nearest_hub": "dimapur-hub", "nearest_hub_distance": 3, "avg_delivery_time": 8, "avg_travel_time": 5, "last_mile_difficulty": "low", "infrastructure_quality": 58, "demand_level": 68, "elevation": 154, "terrain": "plain"},
    {"id": "mon", "name": "Mon", "state_id": "nagaland", "lat": 26.6919, "lng": 94.9130, "population": 250260, "area": 1786, "accessibility_score": 22, "risk_score": 75, "road_connectivity": 25, "rail_connectivity": 0, "airport_access": 8, "nearest_hub": "dimapur-hub", "nearest_hub_distance": 340, "avg_delivery_time": 42, "avg_travel_time": 16, "last_mile_difficulty": "very-high", "infrastructure_quality": 18, "demand_level": 28, "elevation": 900, "terrain": "mountainous"},
    {"id": "tuensang", "name": "Tuensang", "state_id": "nagaland", "lat": 26.2700, "lng": 94.8300, "population": 196801, "area": 4228, "accessibility_score": 20, "risk_score": 78, "road_connectivity": 22, "rail_connectivity": 0, "airport_access": 5, "nearest_hub": "dimapur-hub", "nearest_hub_distance": 360, "avg_delivery_time": 44, "avg_travel_time": 18, "last_mile_difficulty": "very-high", "infrastructure_quality": 15, "demand_level": 25, "elevation": 1400, "terrain": "mountainous"},
    # SIKKIM
    {"id": "east-sikkim", "name": "East Sikkim", "state_id": "sikkim", "lat": 27.3389, "lng": 88.6065, "population": 283583, "area": 954, "accessibility_score": 62, "risk_score": 55, "road_connectivity": 65, "rail_connectivity": 18, "airport_access": 52, "nearest_hub": "siliguri-hub", "nearest_hub_distance": 120, "avg_delivery_time": 12, "avg_travel_time": 6, "last_mile_difficulty": "high", "infrastructure_quality": 55, "demand_level": 58, "elevation": 1650, "terrain": "mountainous"},
    {"id": "north-sikkim", "name": "North Sikkim", "state_id": "sikkim", "lat": 27.8500, "lng": 88.5500, "population": 43354, "area": 4226, "accessibility_score": 18, "risk_score": 85, "road_connectivity": 20, "rail_connectivity": 0, "airport_access": 8, "nearest_hub": "siliguri-hub", "nearest_hub_distance": 280, "avg_delivery_time": 48, "avg_travel_time": 18, "last_mile_difficulty": "very-high", "infrastructure_quality": 15, "demand_level": 15, "elevation": 4500, "terrain": "mountainous"},
    {"id": "south-sikkim", "name": "South Sikkim", "state_id": "sikkim", "lat": 27.1300, "lng": 88.4100, "population": 146850, "area": 750, "accessibility_score": 48, "risk_score": 60, "road_connectivity": 50, "rail_connectivity": 10, "airport_access": 35, "nearest_hub": "siliguri-hub", "nearest_hub_distance": 150, "avg_delivery_time": 16, "avg_travel_time": 8, "last_mile_difficulty": "high", "infrastructure_quality": 42, "demand_level": 38, "elevation": 1500, "terrain": "mountainous"},
    {"id": "west-sikkim", "name": "West Sikkim", "state_id": "sikkim", "lat": 27.2000, "lng": 88.2500, "population": 136435, "area": 1166, "accessibility_score": 35, "risk_score": 70, "road_connectivity": 38, "rail_connectivity": 0, "airport_access": 15, "nearest_hub": "siliguri-hub", "nearest_hub_distance": 200, "avg_delivery_time": 24, "avg_travel_time": 12, "last_mile_difficulty": "very-high", "infrastructure_quality": 30, "demand_level": 28, "elevation": 2200, "terrain": "mountainous"},
    # TRIPURA
    {"id": "west-tripura", "name": "West Tripura", "state_id": "tripura", "lat": 23.8315, "lng": 91.2868, "population": 917534, "area": 942, "accessibility_score": 68, "risk_score": 38, "road_connectivity": 72, "rail_connectivity": 65, "airport_access": 70, "nearest_hub": "agartala-hub", "nearest_hub_distance": 5, "avg_delivery_time": 8, "avg_travel_time": 4, "last_mile_difficulty": "low", "infrastructure_quality": 62, "demand_level": 72, "elevation": 15, "terrain": "plain"},
    {"id": "dhalai", "name": "Dhalai", "state_id": "tripura", "lat": 23.8400, "lng": 91.9800, "population": 377988, "area": 2523, "accessibility_score": 38, "risk_score": 55, "road_connectivity": 40, "rail_connectivity": 20, "airport_access": 18, "nearest_hub": "agartala-hub", "nearest_hub_distance": 120, "avg_delivery_time": 22, "avg_travel_time": 10, "last_mile_difficulty": "high", "infrastructure_quality": 32, "demand_level": 35, "elevation": 100, "terrain": "hilly"},
    {"id": "north-tripura", "name": "North Tripura", "state_id": "tripura", "lat": 24.3200, "lng": 92.0200, "population": 415946, "area": 2036, "accessibility_score": 42, "risk_score": 48, "road_connectivity": 45, "rail_connectivity": 30, "airport_access": 22, "nearest_hub": "agartala-hub", "nearest_hub_distance": 170, "avg_delivery_time": 18, "avg_travel_time": 8, "last_mile_difficulty": "medium", "infrastructure_quality": 38, "demand_level": 42, "elevation": 55, "terrain": "hilly"},
    {"id": "south-tripura", "name": "South Tripura", "state_id": "tripura", "lat": 23.3600, "lng": 91.4200, "population": 433737, "area": 1534, "accessibility_score": 45, "risk_score": 45, "road_connectivity": 48, "rail_connectivity": 32, "airport_access": 25, "nearest_hub": "agartala-hub", "nearest_hub_distance": 90, "avg_delivery_time": 16, "avg_travel_time": 7, "last_mile_difficulty": "medium", "infrastructure_quality": 40, "demand_level": 45, "elevation": 25, "terrain": "plain"},
]

HUBS_DATA = [
    {"id": "guwahati-hub", "name": "Guwahati Central Logistics Hub", "type": "major", "city": "Guwahati", "state_id": "assam", "lat": 26.1445, "lng": 91.7362, "capacity": 50000, "current_utilization": 78, "incoming_shipments": 1250, "outgoing_shipments": 1180, "storage_available": 11000, "connectivity_score": 92, "nearby_population": 1260000, "avg_delivery_time": 4, "has_rail_access": True, "has_air_access": True},
    {"id": "dibrugarh-hub", "name": "Dibrugarh Regional Hub", "type": "regional", "city": "Dibrugarh", "state_id": "assam", "lat": 27.4728, "lng": 94.9120, "capacity": 18000, "current_utilization": 65, "incoming_shipments": 420, "outgoing_shipments": 380, "storage_available": 6300, "connectivity_score": 74, "nearby_population": 1327748, "avg_delivery_time": 8, "has_rail_access": True, "has_air_access": True},
    {"id": "silchar-hub", "name": "Silchar Distribution Center", "type": "regional", "city": "Silchar", "state_id": "assam", "lat": 24.8333, "lng": 92.7789, "capacity": 12000, "current_utilization": 72, "incoming_shipments": 310, "outgoing_shipments": 280, "storage_available": 3360, "connectivity_score": 62, "nearby_population": 1736617, "avg_delivery_time": 14, "has_rail_access": True, "has_air_access": True},
    {"id": "dimapur-hub", "name": "Dimapur Gateway Hub", "type": "regional", "city": "Dimapur", "state_id": "nagaland", "lat": 25.8973, "lng": 93.7266, "capacity": 15000, "current_utilization": 70, "incoming_shipments": 380, "outgoing_shipments": 340, "storage_available": 4500, "connectivity_score": 68, "nearby_population": 378811, "avg_delivery_time": 8, "has_rail_access": True, "has_air_access": True},
    {"id": "imphal-hub", "name": "Imphal Logistics Center", "type": "regional", "city": "Imphal", "state_id": "manipur", "lat": 24.8074, "lng": 93.9384, "capacity": 10000, "current_utilization": 82, "incoming_shipments": 280, "outgoing_shipments": 220, "storage_available": 1800, "connectivity_score": 55, "nearby_population": 517992, "avg_delivery_time": 10, "has_rail_access": False, "has_air_access": True},
    {"id": "shillong-hub", "name": "Shillong Regional Hub", "type": "regional", "city": "Shillong", "state_id": "meghalaya", "lat": 25.5788, "lng": 91.8933, "capacity": 8000, "current_utilization": 68, "incoming_shipments": 210, "outgoing_shipments": 190, "storage_available": 2560, "connectivity_score": 58, "nearby_population": 825922, "avg_delivery_time": 8, "has_rail_access": False, "has_air_access": True},
    {"id": "aizawl-hub", "name": "Aizawl Distribution Point", "type": "local", "city": "Aizawl", "state_id": "mizoram", "lat": 23.7271, "lng": 92.7176, "capacity": 5000, "current_utilization": 75, "incoming_shipments": 140, "outgoing_shipments": 110, "storage_available": 1250, "connectivity_score": 42, "nearby_population": 404054, "avg_delivery_time": 16, "has_rail_access": False, "has_air_access": True},
    {"id": "agartala-hub", "name": "Agartala Freight Terminal", "type": "regional", "city": "Agartala", "state_id": "tripura", "lat": 23.8315, "lng": 91.2868, "capacity": 12000, "current_utilization": 62, "incoming_shipments": 260, "outgoing_shipments": 230, "storage_available": 4560, "connectivity_score": 60, "nearby_population": 917534, "avg_delivery_time": 8, "has_rail_access": True, "has_air_access": True},
    {"id": "siliguri-hub", "name": "Siliguri Chicken Neck Hub", "type": "major", "city": "Siliguri", "state_id": "sikkim", "lat": 26.7271, "lng": 88.3953, "capacity": 35000, "current_utilization": 85, "incoming_shipments": 980, "outgoing_shipments": 1050, "storage_available": 5250, "connectivity_score": 88, "nearby_population": 700000, "avg_delivery_time": 6, "has_rail_access": True, "has_air_access": True},
    {"id": "jorhat-hub", "name": "Jorhat Local Hub", "type": "local", "city": "Jorhat", "state_id": "assam", "lat": 26.7509, "lng": 94.2037, "capacity": 6000, "current_utilization": 55, "incoming_shipments": 150, "outgoing_shipments": 130, "storage_available": 2700, "connectivity_score": 60, "nearby_population": 1092256, "avg_delivery_time": 9, "has_rail_access": True, "has_air_access": True},
]

ROADS_DATA = [
    {"id": "nh-27", "name": "NH-27 (East-West Corridor)", "type": "NH", "from_city": "Guwahati", "to_city": "Dibrugarh", "distance": 480, "condition": "good", "lanes": 4, "risk_score": 35, "avg_speed": 55, "is_operational": True},
    {"id": "nh-37", "name": "NH-37 (Assam Trunk)", "type": "NH", "from_city": "Guwahati", "to_city": "Sadiya", "distance": 620, "condition": "good", "lanes": 2, "risk_score": 40, "avg_speed": 50, "is_operational": True},
    {"id": "nh-6", "name": "NH-6 (Jorabat-Shillong)", "type": "NH", "from_city": "Guwahati", "to_city": "Shillong", "distance": 103, "condition": "good", "lanes": 2, "risk_score": 45, "avg_speed": 40, "is_operational": True},
    {"id": "nh-29", "name": "NH-29 (Nagaland Link)", "type": "NH", "from_city": "Dimapur", "to_city": "Kohima", "distance": 74, "condition": "fair", "lanes": 2, "risk_score": 60, "avg_speed": 30, "is_operational": True},
    {"id": "nh-2", "name": "NH-2 (Imphal Road)", "type": "NH", "from_city": "Dimapur", "to_city": "Imphal", "distance": 215, "condition": "fair", "lanes": 2, "risk_score": 65, "avg_speed": 30, "is_operational": True},
    {"id": "nh-306", "name": "NH-306 (Aizawl Highway)", "type": "NH", "from_city": "Silchar", "to_city": "Aizawl", "distance": 180, "condition": "fair", "lanes": 2, "risk_score": 62, "avg_speed": 28, "is_operational": True},
    {"id": "nh-8", "name": "NH-8 (Agartala Highway)", "type": "NH", "from_city": "Silchar", "to_city": "Agartala", "distance": 302, "condition": "good", "lanes": 2, "risk_score": 42, "avg_speed": 45, "is_operational": True},
    {"id": "nh-13", "name": "NH-13 (Tawang Road)", "type": "NH", "from_city": "Tezpur", "to_city": "Tawang", "distance": 317, "condition": "poor", "lanes": 2, "risk_score": 82, "avg_speed": 20, "is_operational": True},
    {"id": "nh-15", "name": "NH-15 (Itanagar Highway)", "type": "NH", "from_city": "Banderdewa", "to_city": "Itanagar", "distance": 22, "condition": "good", "lanes": 2, "risk_score": 40, "avg_speed": 40, "is_operational": True},
    {"id": "nh-10", "name": "NH-10 (Sikkim Highway)", "type": "NH", "from_city": "Siliguri", "to_city": "Gangtok", "distance": 114, "condition": "fair", "lanes": 2, "risk_score": 58, "avg_speed": 32, "is_operational": True},
    {"id": "nh-44", "name": "NH-44 (Trans-India)", "type": "NH", "from_city": "Guwahati", "to_city": "Silchar", "distance": 340, "condition": "good", "lanes": 4, "risk_score": 38, "avg_speed": 55, "is_operational": True},
    {"id": "nh-54", "name": "NH-54 (Mizoram Corridor)", "type": "NH", "from_city": "Aizawl", "to_city": "Tuipang", "distance": 280, "condition": "poor", "lanes": 2, "risk_score": 70, "avg_speed": 25, "is_operational": True},
    {"id": "nh-36", "name": "NH-36 (Upper Assam)", "type": "NH", "from_city": "Nagaon", "to_city": "Dibrugarh", "distance": 280, "condition": "good", "lanes": 2, "risk_score": 42, "avg_speed": 48, "is_operational": True},
    {"id": "nh-53", "name": "NH-53 (Meghalaya Link)", "type": "NH", "from_city": "Shillong", "to_city": "Tura", "distance": 325, "condition": "fair", "lanes": 2, "risk_score": 55, "avg_speed": 35, "is_operational": True},
    {"id": "sh-sikkim-1", "name": "Gangtok-Nathula Road", "type": "SH", "from_city": "Gangtok", "to_city": "Nathula", "distance": 56, "condition": "fair", "lanes": 2, "risk_score": 72, "avg_speed": 22, "is_operational": True},
    {"id": "nh-702a", "name": "NH-702A (Manipur-Myanmar)", "type": "NH", "from_city": "Imphal", "to_city": "Moreh", "distance": 110, "condition": "fair", "lanes": 2, "risk_score": 55, "avg_speed": 35, "is_operational": True},
    {"id": "nh-127b", "name": "NH-127B (Tripura Interior)", "type": "NH", "from_city": "Agartala", "to_city": "Sabroom", "distance": 185, "condition": "fair", "lanes": 2, "risk_score": 48, "avg_speed": 38, "is_operational": True},
    {"id": "nh-208", "name": "NH-208 (Nagaland-Mon)", "type": "NH", "from_city": "Dimapur", "to_city": "Mon", "distance": 280, "condition": "poor", "lanes": 2, "risk_score": 72, "avg_speed": 22, "is_operational": True},
]

AIRPORTS_DATA = [
    {"id": "guwahati-apt", "name": "Lokpriya Gopinath Bordoloi International", "code": "GAU", "city": "Guwahati", "state_id": "assam", "lat": 26.1061, "lng": 91.5859, "type": "international", "is_operational": True},
    {"id": "dibrugarh-apt", "name": "Dibrugarh Airport", "code": "DIB", "city": "Dibrugarh", "state_id": "assam", "lat": 27.4839, "lng": 95.0169, "type": "domestic", "is_operational": True},
    {"id": "silchar-apt", "name": "Silchar Airport", "code": "IXS", "city": "Silchar", "state_id": "assam", "lat": 24.9129, "lng": 92.9787, "type": "domestic", "is_operational": True},
    {"id": "jorhat-apt", "name": "Jorhat Airport", "code": "JRH", "city": "Jorhat", "state_id": "assam", "lat": 26.7315, "lng": 94.1753, "type": "domestic", "is_operational": True},
    {"id": "imphal-apt", "name": "Bir Tikendrajit International", "code": "IMF", "city": "Imphal", "state_id": "manipur", "lat": 24.7600, "lng": 93.8967, "type": "international", "is_operational": True},
    {"id": "shillong-apt", "name": "Shillong Airport", "code": "SHL", "city": "Shillong", "state_id": "meghalaya", "lat": 25.7036, "lng": 91.9787, "type": "domestic", "is_operational": True},
    {"id": "aizawl-apt", "name": "Lengpui Airport", "code": "AJL", "city": "Aizawl", "state_id": "mizoram", "lat": 23.8406, "lng": 92.6197, "type": "domestic", "is_operational": True},
    {"id": "dimapur-apt", "name": "Dimapur Airport", "code": "DMU", "city": "Dimapur", "state_id": "nagaland", "lat": 25.8839, "lng": 93.7711, "type": "domestic", "is_operational": True},
    {"id": "pakyong-apt", "name": "Pakyong Airport", "code": "PYG", "city": "Gangtok", "state_id": "sikkim", "lat": 27.2256, "lng": 88.5842, "type": "domestic", "is_operational": True},
    {"id": "agartala-apt", "name": "Maharaja Bir Bikram Airport", "code": "IXA", "city": "Agartala", "state_id": "tripura", "lat": 23.8870, "lng": 91.2404, "type": "domestic", "is_operational": True},
    {"id": "itanagar-apt", "name": "Donyi Polo Airport", "code": "HGI", "city": "Itanagar", "state_id": "arunachal", "lat": 27.1800, "lng": 93.7000, "type": "domestic", "is_operational": True},
    {"id": "pasighat-apt", "name": "Pasighat Airport", "code": "IXT", "city": "Pasighat", "state_id": "arunachal", "lat": 28.0660, "lng": 95.3340, "type": "domestic", "is_operational": True},
]

RAILWAY_DATA = [
    {"id": "ghy-rly", "name": "Guwahati Junction", "city": "Guwahati", "state_id": "assam", "lat": 26.1850, "lng": 91.7460, "type": "junction", "has_freight": True},
    {"id": "dib-rly", "name": "Dibrugarh Town", "city": "Dibrugarh", "state_id": "assam", "lat": 27.4800, "lng": 94.9100, "type": "terminal", "has_freight": True},
    {"id": "slr-rly", "name": "Silchar", "city": "Silchar", "state_id": "assam", "lat": 24.8200, "lng": 92.7800, "type": "terminal", "has_freight": True},
    {"id": "ngs-rly", "name": "Nagaon", "city": "Nagaon", "state_id": "assam", "lat": 26.3400, "lng": 92.6900, "type": "regular", "has_freight": True},
    {"id": "lmg-rly", "name": "Lumding Junction", "city": "Lumding", "state_id": "assam", "lat": 25.7500, "lng": 93.1700, "type": "junction", "has_freight": True},
    {"id": "dmp-rly", "name": "Dimapur", "city": "Dimapur", "state_id": "nagaland", "lat": 25.8900, "lng": 93.7300, "type": "terminal", "has_freight": True},
    {"id": "agt-rly", "name": "Agartala", "city": "Agartala", "state_id": "tripura", "lat": 23.8400, "lng": 91.2800, "type": "terminal", "has_freight": True},
    {"id": "njp-rly", "name": "New Jalpaiguri", "city": "Siliguri", "state_id": "sikkim", "lat": 26.7100, "lng": 88.4300, "type": "junction", "has_freight": True},
    {"id": "tsk-rly", "name": "Tinsukia Junction", "city": "Tinsukia", "state_id": "assam", "lat": 27.4900, "lng": 95.3600, "type": "junction", "has_freight": True},
    {"id": "jrh-rly", "name": "Jorhat Town", "city": "Jorhat", "state_id": "assam", "lat": 26.7600, "lng": 94.2000, "type": "regular", "has_freight": True},
]

RISK_EVENTS_DATA = [
    {"id": "risk-1", "type": "heavy_rainfall", "severity": "high", "location": "NH-13 Tezpur-Tawang", "district_id": "tawang", "state_id": "arunachal", "lat": 27.4, "lng": 92.1, "description": "Heavy monsoon rainfall causing road waterlogging and reduced visibility on NH-13 corridor", "start_date": "2026-08-25", "affected_routes": ["nh-13"], "risk_score": 81, "recommendation": "Use alternate route via Bhalukpong-Bomdila corridor. Delay non-essential cargo by 48 hours."},
    {"id": "risk-2", "type": "landslide", "severity": "critical", "location": "Sela Pass, West Kameng", "district_id": "west-kameng", "state_id": "arunachal", "lat": 27.5, "lng": 92.1, "description": "Active landslide zone near Sela Pass. Multiple debris flows reported. Road partially blocked.", "start_date": "2026-08-26", "affected_routes": ["nh-13"], "risk_score": 92, "recommendation": "Avoid Sela Pass route. Critical cargo should be airlifted from Guwahati. Regular cargo should be rerouted through Itanagar corridor."},
    {"id": "risk-3", "type": "flood", "severity": "high", "location": "Brahmaputra basin, Barpeta", "district_id": "barpeta", "state_id": "assam", "lat": 26.3, "lng": 91.0, "description": "Brahmaputra river water level above danger mark. Low-lying areas inundated. NH-31 partially submerged.", "start_date": "2026-08-22", "affected_routes": ["nh-27"], "risk_score": 78, "recommendation": "Reroute through elevated NH-27 corridor. Deploy watercraft for last-mile delivery in affected areas."},
    {"id": "risk-4", "type": "road_blockage", "severity": "medium", "location": "NH-2 Mao Gate, Manipur", "district_id": "imphal-west", "state_id": "manipur", "lat": 25.4, "lng": 94.0, "description": "Road maintenance work causing single-lane traffic at Mao Gate. Expected delays of 3-5 hours.", "start_date": "2026-08-27", "end_date": "2026-09-05", "affected_routes": ["nh-2"], "risk_score": 55, "recommendation": "Plan for additional 4-hour buffer. Cargo exceeding 10 tons should use Jiribam corridor."},
    {"id": "risk-5", "type": "earthquake", "severity": "low", "location": "North Sikkim zone", "district_id": "north-sikkim", "state_id": "sikkim", "lat": 27.9, "lng": 88.5, "description": "Seismic activity detected (3.2 magnitude). No infrastructure damage reported. Monitoring ongoing.", "start_date": "2026-08-28", "affected_routes": ["nh-10", "sh-sikkim-1"], "risk_score": 35, "recommendation": "Normal operations. Monitor seismic activity feed. Drivers should report any road damage."},
    {"id": "risk-6", "type": "heavy_rainfall", "severity": "high", "location": "Cherrapunji-Dawki corridor, Meghalaya", "district_id": "east-khasi", "state_id": "meghalaya", "lat": 25.3, "lng": 91.7, "description": "Extreme rainfall (300mm+) in Cherrapunji area. Flash flood risk elevated. Road sections washed out.", "start_date": "2026-08-24", "affected_routes": ["nh-6"], "risk_score": 75, "recommendation": "Avoid Dawki corridor. Use Guwahati-Shillong highway with caution. Check road conditions before departure."},
    {"id": "risk-7", "type": "infrastructure_failure", "severity": "medium", "location": "Barak Bridge, NH-44 Silchar", "district_id": "silchar", "state_id": "assam", "lat": 24.9, "lng": 92.8, "description": "Load restriction imposed on Barak Bridge. Vehicles above 20 tons not permitted.", "start_date": "2026-08-20", "affected_routes": ["nh-44", "nh-8"], "risk_score": 58, "recommendation": "Heavy cargo (>20 tons) should use alternate bridge 12km upstream. Light vehicles can proceed normally."},
    {"id": "risk-8", "type": "landslide", "severity": "high", "location": "NH-10 Rangpo-Gangtok, Sikkim", "district_id": "east-sikkim", "state_id": "sikkim", "lat": 27.2, "lng": 88.5, "description": "Landslide debris on NH-10 near Rangpo. One lane cleared for alternating traffic.", "start_date": "2026-08-26", "affected_routes": ["nh-10"], "risk_score": 72, "recommendation": "Use NH-10 with 6-hour additional buffer. Critical supplies should be airlifted via Pakyong Airport."},
]

GRAPH_NODES_DATA = [
    {"id": "guwahati", "name": "Guwahati", "lat": 26.1445, "lng": 91.7362, "state_id": "assam"},
    {"id": "dibrugarh", "name": "Dibrugarh", "lat": 27.4728, "lng": 94.9120, "state_id": "assam"},
    {"id": "silchar", "name": "Silchar", "lat": 24.8333, "lng": 92.7789, "state_id": "assam"},
    {"id": "nagaon", "name": "Nagaon", "lat": 26.3500, "lng": 92.6840, "state_id": "assam"},
    {"id": "tezpur", "name": "Tezpur", "lat": 26.6338, "lng": 92.7840, "state_id": "assam"},
    {"id": "jorhat", "name": "Jorhat", "lat": 26.7509, "lng": 94.2037, "state_id": "assam"},
    {"id": "tinsukia", "name": "Tinsukia", "lat": 27.4922, "lng": 95.3547, "state_id": "assam"},
    {"id": "itanagar", "name": "Itanagar", "lat": 27.0844, "lng": 93.6053, "state_id": "arunachal"},
    {"id": "tawang", "name": "Tawang", "lat": 27.5860, "lng": 91.8690, "state_id": "arunachal"},
    {"id": "bomdila", "name": "Bomdila", "lat": 27.2660, "lng": 92.4200, "state_id": "arunachal"},
    {"id": "pasighat", "name": "Pasighat", "lat": 28.0660, "lng": 95.3340, "state_id": "arunachal"},
    {"id": "shillong", "name": "Shillong", "lat": 25.5788, "lng": 91.8933, "state_id": "meghalaya"},
    {"id": "tura", "name": "Tura", "lat": 25.5200, "lng": 90.2200, "state_id": "meghalaya"},
    {"id": "kohima", "name": "Kohima", "lat": 25.6747, "lng": 94.1086, "state_id": "nagaland"},
    {"id": "dimapur", "name": "Dimapur", "lat": 25.8973, "lng": 93.7266, "state_id": "nagaland"},
    {"id": "imphal", "name": "Imphal", "lat": 24.8074, "lng": 93.9384, "state_id": "manipur"},
    {"id": "aizawl", "name": "Aizawl", "lat": 23.7271, "lng": 92.7176, "state_id": "mizoram"},
    {"id": "gangtok", "name": "Gangtok", "lat": 27.3389, "lng": 88.6065, "state_id": "sikkim"},
    {"id": "siliguri", "name": "Siliguri", "lat": 26.7271, "lng": 88.3953, "state_id": "sikkim"},
    {"id": "agartala", "name": "Agartala", "lat": 23.8315, "lng": 91.2868, "state_id": "tripura"},
    {"id": "lumding", "name": "Lumding", "lat": 25.7500, "lng": 93.1700, "state_id": "assam"},
    {"id": "barpeta", "name": "Barpeta", "lat": 26.3210, "lng": 91.0050, "state_id": "assam"},
]

GRAPH_EDGES_DATA = [
    {"from_node": "guwahati", "to_node": "nagaon", "distance": 120, "time": 2.5, "cost": 3.2, "risk": 30, "accessibility": 75, "road_id": "nh-27", "road_name": "NH-27", "condition": "good", "waypoints": [[26.1445, 91.7362], [26.2, 92.1], [26.35, 92.684]]},
    {"from_node": "nagaon", "to_node": "jorhat", "distance": 160, "time": 3.2, "cost": 3.0, "risk": 35, "accessibility": 70, "road_id": "nh-36", "road_name": "NH-36", "condition": "good", "waypoints": [[26.35, 92.684], [26.5, 93.2], [26.75, 94.2]]},
    {"from_node": "jorhat", "to_node": "dibrugarh", "distance": 138, "time": 2.8, "cost": 3.0, "risk": 32, "accessibility": 72, "road_id": "nh-37", "road_name": "NH-37", "condition": "good", "waypoints": [[26.75, 94.2], [27.1, 94.5], [27.47, 94.91]]},
    {"from_node": "dibrugarh", "to_node": "tinsukia", "distance": 85, "time": 1.5, "cost": 2.8, "risk": 28, "accessibility": 68, "road_id": "nh-37", "road_name": "NH-37", "condition": "good", "waypoints": [[27.47, 94.91], [27.49, 95.35]]},
    {"from_node": "guwahati", "to_node": "tezpur", "distance": 180, "time": 3.5, "cost": 3.2, "risk": 35, "accessibility": 70, "road_id": "nh-27", "road_name": "NH-27", "condition": "good", "waypoints": [[26.1445, 91.7362], [26.3, 92.0], [26.63, 92.78]]},
    {"from_node": "guwahati", "to_node": "barpeta", "distance": 105, "time": 2.2, "cost": 3.0, "risk": 45, "accessibility": 60, "road_id": "nh-27", "road_name": "NH-27", "condition": "good", "waypoints": [[26.1445, 91.7362], [26.3, 91.3], [26.32, 91.0]]},
    {"from_node": "guwahati", "to_node": "silchar", "distance": 340, "time": 7.5, "cost": 3.8, "risk": 42, "accessibility": 62, "road_id": "nh-44", "road_name": "NH-44", "condition": "good", "waypoints": [[26.1445, 91.7362], [25.9, 92.1], [25.4, 92.5], [24.83, 92.78]]},
    {"from_node": "nagaon", "to_node": "lumding", "distance": 70, "time": 1.5, "cost": 2.8, "risk": 30, "accessibility": 65, "road_id": "nh-36", "road_name": "NH-36", "condition": "good", "waypoints": [[26.35, 92.684], [25.9, 93.0], [25.75, 93.17]]},
    {"from_node": "tezpur", "to_node": "bomdila", "distance": 150, "time": 5.5, "cost": 5.0, "risk": 68, "accessibility": 35, "road_id": "nh-13", "road_name": "NH-13", "condition": "poor", "waypoints": [[26.63, 92.78], [27.0, 92.5], [27.27, 92.42]]},
    {"from_node": "bomdila", "to_node": "tawang", "distance": 180, "time": 7.0, "cost": 6.0, "risk": 82, "accessibility": 22, "road_id": "nh-13", "road_name": "NH-13", "condition": "poor", "waypoints": [[27.27, 92.42], [27.4, 92.1], [27.59, 91.87]]},
    {"from_node": "guwahati", "to_node": "itanagar", "distance": 350, "time": 8.5, "cost": 4.5, "risk": 55, "accessibility": 45, "road_id": "nh-15", "road_name": "NH-15", "condition": "fair", "waypoints": [[26.1445, 91.7362], [26.5, 92.3], [26.9, 93.0], [27.08, 93.61]]},
    {"from_node": "dibrugarh", "to_node": "pasighat", "distance": 195, "time": 5.5, "cost": 4.8, "risk": 60, "accessibility": 35, "road_id": "nh-15", "road_name": "NH-515", "condition": "fair", "waypoints": [[27.47, 94.91], [27.8, 95.1], [28.07, 95.33]]},
    {"from_node": "guwahati", "to_node": "shillong", "distance": 103, "time": 2.8, "cost": 3.5, "risk": 42, "accessibility": 65, "road_id": "nh-6", "road_name": "NH-6", "condition": "good", "waypoints": [[26.1445, 91.7362], [25.8, 91.8], [25.58, 91.89]]},
    {"from_node": "shillong", "to_node": "tura", "distance": 325, "time": 8.5, "cost": 4.2, "risk": 55, "accessibility": 48, "road_id": "nh-53", "road_name": "NH-53", "condition": "fair", "waypoints": [[25.58, 91.89], [25.5, 91.2], [25.4, 90.5], [25.52, 90.22]]},
    {"from_node": "jorhat", "to_node": "dimapur", "distance": 142, "time": 3.5, "cost": 3.5, "risk": 40, "accessibility": 62, "road_id": "nh-36", "road_name": "NH-36", "condition": "good", "waypoints": [[26.75, 94.2], [26.3, 93.9], [25.9, 93.73]]},
    {"from_node": "lumding", "to_node": "dimapur", "distance": 95, "time": 2.5, "cost": 3.2, "risk": 38, "accessibility": 65, "road_id": "nh-29", "road_name": "NH-29", "condition": "fair", "waypoints": [[25.75, 93.17], [25.85, 93.5], [25.9, 93.73]]},
    {"from_node": "dimapur", "to_node": "kohima", "distance": 74, "time": 2.5, "cost": 4.0, "risk": 58, "accessibility": 52, "road_id": "nh-29", "road_name": "NH-29", "condition": "fair", "waypoints": [[25.9, 93.73], [25.8, 93.9], [25.67, 94.11]]},
    {"from_node": "kohima", "to_node": "imphal", "distance": 138, "time": 4.5, "cost": 4.5, "risk": 62, "accessibility": 48, "road_id": "nh-2", "road_name": "NH-2", "condition": "fair", "waypoints": [[25.67, 94.11], [25.3, 94.0], [24.81, 93.94]]},
    {"from_node": "dimapur", "to_node": "imphal", "distance": 215, "time": 6.5, "cost": 4.8, "risk": 65, "accessibility": 45, "road_id": "nh-2", "road_name": "NH-2", "condition": "fair", "waypoints": [[25.9, 93.73], [25.67, 94.11], [25.3, 94.0], [24.81, 93.94]]},
    {"from_node": "silchar", "to_node": "aizawl", "distance": 180, "time": 6.0, "cost": 5.0, "risk": 62, "accessibility": 42, "road_id": "nh-306", "road_name": "NH-306", "condition": "fair", "waypoints": [[24.83, 92.78], [24.2, 92.7], [23.73, 92.72]]},
    {"from_node": "silchar", "to_node": "agartala", "distance": 302, "time": 7.0, "cost": 3.8, "risk": 42, "accessibility": 58, "road_id": "nh-8", "road_name": "NH-8", "condition": "good", "waypoints": [[24.83, 92.78], [24.2, 92.2], [23.9, 91.7], [23.83, 91.29]]},
    {"from_node": "guwahati", "to_node": "agartala", "distance": 599, "time": 14.0, "cost": 4.0, "risk": 48, "accessibility": 55, "road_id": "nh-44", "road_name": "NH-44 + NH-8", "condition": "good", "waypoints": [[26.1445, 91.7362], [25.9, 92.1], [24.83, 92.78], [24.2, 92.2], [23.83, 91.29]]},
    {"from_node": "siliguri", "to_node": "gangtok", "distance": 114, "time": 3.5, "cost": 4.0, "risk": 58, "accessibility": 55, "road_id": "nh-10", "road_name": "NH-10", "condition": "fair", "waypoints": [[26.7271, 88.3953], [27.0, 88.5], [27.34, 88.61]]},
    {"from_node": "guwahati", "to_node": "siliguri", "distance": 560, "time": 9.5, "cost": 3.5, "risk": 35, "accessibility": 72, "road_id": "nh-27", "road_name": "NH-27", "condition": "good", "waypoints": [[26.1445, 91.7362], [26.4, 90.5], [26.5, 89.5], [26.73, 88.4]]},
]


def seed_database():
    """Idempotently populates the database."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Users
        if db.query(User).count() == 0:
            now_str = datetime.utcnow().isoformat()
            users = [
                User(username="admin", email="director@ner-logistics.gov.in", hashed_password=hash_pw("admin123"), full_name="NER Logistics Director", role="ADMIN", created_at=now_str),
                User(username="operator", email="ops@ner-logistics.gov.in", hashed_password=hash_pw("operator123"), full_name="Logistics Dispatch Officer", role="OPERATOR", created_at=now_str),
                User(username="viewer", email="analyst@ner-logistics.gov.in", hashed_password=hash_pw("user123"), full_name="Research Analyst", role="USER", created_at=now_str),
            ]
            db.add_all(users)
            db.commit()

        # 2. States
        if db.query(State).count() == 0:
            for s in STATES_DATA:
                db.add(State(**s))
            db.commit()

        # 3. Districts
        if db.query(District).count() == 0:
            for d in DISTRICTS_DATA:
                db.add(District(**d))
            db.commit()

        # 4. Hubs
        if db.query(LogisticsHub).count() == 0:
            for h in HUBS_DATA:
                db.add(LogisticsHub(**h))
            db.commit()

        # 5. Roads
        if db.query(Road).count() == 0:
            for r in ROADS_DATA:
                db.add(Road(**r))
            db.commit()

        # 6. Airports
        if db.query(Airport).count() == 0:
            for a in AIRPORTS_DATA:
                db.add(Airport(**a))
            db.commit()

        # 7. Railways
        if db.query(RailwayStation).count() == 0:
            for r in RAILWAY_DATA:
                db.add(RailwayStation(**r))
            db.commit()

        # 8. Risk Events
        if db.query(RiskEvent).count() == 0:
            for re in RISK_EVENTS_DATA:
                db.add(RiskEvent(**re))
            db.commit()

        # 9. Graph Nodes
        if db.query(GraphNode).count() == 0:
            for gn in GRAPH_NODES_DATA:
                db.add(GraphNode(**gn))
            db.commit()

        # 10. Graph Edges
        if db.query(GraphEdge).count() == 0:
            for ge in GRAPH_EDGES_DATA:
                db.add(GraphEdge(**ge))
            db.commit()

        # 11. Demand History (60 days per district)
        if db.query(DemandHistory).count() == 0:
            start_date = datetime.now() - timedelta(days=60)
            demand_records = []
            districts = db.query(District).all()
            for dist in districts:
                base = dist.demand_level * 4.5 + 40.0
                for d in range(60):
                    curr_dt = start_date + timedelta(days=d)
                    month = curr_dt.month
                    seasonal = 1.25 if month in [6, 7, 8, 9] else 1.0
                    harmonic = 1.0 + (math.sin(d * 0.15) * 0.12)
                    tons = round(base * seasonal * harmonic)
                    demand_records.append(
                        DemandHistory(
                            district_id=dist.id,
                            date=curr_dt.strftime("%Y-%m-%d"),
                            demand=max(10.0, float(tons)),
                            category="General Freight",
                        )
                    )
            db.bulk_save_objects(demand_records)
            db.commit()

        # 12. Accessibility Scores
        if db.query(AccessibilityScore).count() == 0:
            districts = db.query(District).all()
            for d in districts:
                breakdown = compute_accessibility(d)
                db.add(
                    AccessibilityScore(
                        district_id=d.id,
                        district_name=d.name,
                        state_id=d.state_id,
                        overall_score=breakdown["overallScore"],
                        level=breakdown["level"],
                        road_connectivity_score=breakdown["factors"]["roadConnectivity"]["score"],
                        road_connectivity_weight=breakdown["factors"]["roadConnectivity"]["weight"],
                        road_connectivity_contribution=breakdown["factors"]["roadConnectivity"]["contribution"],
                        rail_connectivity_score=breakdown["factors"]["railConnectivity"]["score"],
                        rail_connectivity_weight=breakdown["factors"]["railConnectivity"]["weight"],
                        rail_connectivity_contribution=breakdown["factors"]["railConnectivity"]["contribution"],
                        airport_access_score=breakdown["factors"]["airportAccess"]["score"],
                        airport_access_weight=breakdown["factors"]["airportAccess"]["weight"],
                        airport_access_contribution=breakdown["factors"]["airportAccess"]["contribution"],
                        travel_time_score=breakdown["factors"]["travelTime"]["score"],
                        travel_time_weight=breakdown["factors"]["travelTime"]["weight"],
                        travel_time_contribution=breakdown["factors"]["travelTime"]["contribution"],
                        hub_proximity_score=breakdown["factors"]["hubProximity"]["score"],
                        hub_proximity_weight=breakdown["factors"]["hubProximity"]["weight"],
                        hub_proximity_contribution=breakdown["factors"]["hubProximity"]["contribution"],
                        infrastructure_quality_score=breakdown["factors"]["infrastructureQuality"]["score"],
                        infrastructure_quality_weight=breakdown["factors"]["infrastructureQuality"]["weight"],
                        infrastructure_quality_contribution=breakdown["factors"]["infrastructureQuality"]["contribution"],
                        risk_penalty_score=breakdown["factors"]["riskPenalty"]["score"],
                        risk_penalty_weight=breakdown["factors"]["riskPenalty"]["weight"],
                        risk_penalty_contribution=breakdown["factors"]["riskPenalty"]["contribution"],
                        recommendations=breakdown.get("recommendations", []),
                    )
                )
            db.commit()

        print("Database seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
