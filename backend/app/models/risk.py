"""
Risk models: RiskEvent, WeatherEvent, DisasterEvent, RouteDisruption, RiskAssessment.
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, Date
from app.database import Base


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(String(50), primary_key=True)
    type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # low | medium | high | critical
    location = Column(String(200), nullable=False)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String(1000), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=True)
    affected_routes = Column(JSON, default=list)
    risk_score = Column(Integer, default=0)
    recommendation = Column(String(1000), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "location": self.location,
            "districtId": self.district_id,
            "stateId": self.state_id,
            "lat": self.lat,
            "lng": self.lng,
            "description": self.description,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "affectedRoutes": self.affected_routes or [],
            "riskScore": self.risk_score,
            "recommendation": self.recommendation,
        }


class WeatherEvent(Base):
    __tablename__ = "weather_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    date = Column(String(20), nullable=False)
    rainfall = Column(Float, default=0)  # mm
    temperature = Column(Float, default=0)  # celsius
    humidity = Column(Float, default=0)  # percentage
    condition = Column(String(20), default="clear")
    flood_risk = Column(Integer, default=0)  # 0-100
    landslide_risk = Column(Integer, default=0)  # 0-100


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(String(50), primary_key=True)
    type = Column(String(50), nullable=False)  # flood | earthquake | landslide | cyclone
    severity = Column(String(20), nullable=False)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String(1000), nullable=False)
    date = Column(String(20), nullable=False)
    casualties = Column(Integer, default=0)
    damage_crores = Column(Float, default=0)
    affected_population = Column(Integer, default=0)


class RouteDisruption(Base):
    __tablename__ = "route_disruptions"

    id = Column(String(50), primary_key=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False)
    type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(String(1000), default="")
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=True)
    is_active = Column(Integer, default=1)


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, unique=True)
    overall_risk = Column(Integer, default=0)
    level = Column(String(20), default="LOW")
    flood_risk = Column(Integer, default=0)
    landslide_risk = Column(Integer, default=0)
    earthquake_risk = Column(Integer, default=0)
    infrastructure_risk = Column(Integer, default=0)
    weather_risk = Column(Integer, default=0)
    connectivity_risk = Column(Integer, default=0)
    recommendation = Column(String(1000), default="")
