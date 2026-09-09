"""
Demand models: DemandRecord, DemandForecast.
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey
from app.database import Base


class DemandRecord(Base):
    __tablename__ = "demand_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False)
    date = Column(String(20), nullable=False)
    demand = Column(Integer, nullable=False)  # tons
    category = Column(String(50), default="General")
    predicted = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(50), ForeignKey("districts.id"), nullable=False, unique=True)
    district_name = Column(String(100), nullable=False)
    current_demand = Column(Integer, default=0)
    forecast_7day = Column(Integer, default=0)
    forecast_30day = Column(Integer, default=0)
    trend = Column(String(20), default="stable")
    trend_percentage = Column(Float, default=0)
    confidence = Column(Float, default=0)
    seasonal_pattern = Column(String(200), default="")


# Compatibility alias
DemandHistory = DemandRecord
DemandForecastRecord = DemandForecast
