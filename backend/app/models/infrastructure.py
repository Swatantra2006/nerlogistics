"""
Infrastructure models: Airport, RailwayStation, Warehouse, Hospital.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Airport(Base):
    __tablename__ = "airports"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    code = Column(String(10), nullable=False)
    city = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # international | domestic | airstrip
    is_operational = Column(Boolean, default=True)

    state = relationship("State", back_populates="airports")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "city": self.city,
            "stateId": self.state_id,
            "lat": self.lat,
            "lng": self.lng,
            "type": self.type,
            "isOperational": self.is_operational,
        }


class RailwayStation(Base):
    __tablename__ = "railway_stations"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # junction | terminal | regular
    has_freight = Column(Boolean, default=False)

    state = relationship("State", back_populates="railway_stations")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "city": self.city,
            "stateId": self.state_id,
            "lat": self.lat,
            "lng": self.lng,
            "type": self.type,
            "hasFreight": self.has_freight,
        }


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, default=0)  # tons
    current_utilization = Column(Integer, default=0)  # percentage
    type = Column(String(50), default="general")  # general | cold_storage | hazmat


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    type = Column(String(50), default="district")  # district | community | primary
    beds = Column(Integer, default=0)
