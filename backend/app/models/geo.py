"""
Geographic models: State and District.
Core entities for the NER region.
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class State(Base):
    __tablename__ = "states"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    capital = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    area = Column(Integer, nullable=False)  # sq km
    population = Column(Integer, nullable=False)
    accessibility_score = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    demand_level = Column(String(20), default="medium")  # low | medium | high | very-high

    # Relationships
    districts = relationship("District", back_populates="state")
    logistics_hubs = relationship("LogisticsHub", back_populates="state")
    airports = relationship("Airport", back_populates="state")
    railway_stations = relationship("RailwayStation", back_populates="state")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "capital": self.capital,
            "lat": self.lat,
            "lng": self.lng,
            "area": self.area,
            "population": self.population,
            "accessibilityScore": self.accessibility_score,
            "riskScore": self.risk_score,
            "demandLevel": self.demand_level,
        }


class District(Base):
    __tablename__ = "districts"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)
    area = Column(Integer, nullable=False)
    accessibility_score = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    road_connectivity = Column(Integer, default=0)  # 0-100
    rail_connectivity = Column(Integer, default=0)  # 0-100
    airport_access = Column(Integer, default=0)  # 0-100
    nearest_hub = Column(String(50))
    nearest_hub_distance = Column(Float, default=0)  # km
    avg_delivery_time = Column(Float, default=0)  # hours
    avg_travel_time = Column(Float, default=0)  # hours
    last_mile_difficulty = Column(String(20), default="medium")
    infrastructure_quality = Column(Integer, default=0)  # 0-100
    demand_level = Column(Integer, default=0)  # 0-100
    elevation = Column(Float, default=0)  # meters
    terrain = Column(String(20), default="plain")  # plain | hilly | mountainous | riverine

    # Relationships
    state = relationship("State", back_populates="districts")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "stateId": self.state_id,
            "lat": self.lat,
            "lng": self.lng,
            "population": self.population,
            "area": self.area,
            "accessibilityScore": self.accessibility_score,
            "riskScore": self.risk_score,
            "roadConnectivity": self.road_connectivity,
            "railConnectivity": self.rail_connectivity,
            "airportAccess": self.airport_access,
            "nearestHub": self.nearest_hub,
            "nearestHubDistance": self.nearest_hub_distance,
            "avgDeliveryTime": self.avg_delivery_time,
            "avgTravelTime": self.avg_travel_time,
            "lastMileDifficulty": self.last_mile_difficulty,
            "infrastructureQuality": self.infrastructure_quality,
            "demandLevel": self.demand_level,
            "elevation": self.elevation,
            "terrain": self.terrain,
        }
