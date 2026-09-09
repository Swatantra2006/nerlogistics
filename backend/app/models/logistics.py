"""
Logistics models: LogisticsHub, Road, GraphNode, GraphEdge.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class LogisticsHub(Base):
    __tablename__ = "logistics_hubs"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # major | regional | local
    city = Column(String(100), nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, default=0)  # tons
    current_utilization = Column(Integer, default=0)  # percentage
    incoming_shipments = Column(Integer, default=0)
    outgoing_shipments = Column(Integer, default=0)
    storage_available = Column(Integer, default=0)  # tons
    connectivity_score = Column(Integer, default=0)  # 0-100
    nearby_population = Column(Integer, default=0)
    avg_delivery_time = Column(Float, default=0)  # hours
    has_rail_access = Column(Boolean, default=False)
    has_air_access = Column(Boolean, default=False)

    state = relationship("State", back_populates="logistics_hubs")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "city": self.city,
            "stateId": self.state_id,
            "lat": self.lat,
            "lng": self.lng,
            "capacity": self.capacity,
            "currentUtilization": self.current_utilization,
            "incomingShipments": self.incoming_shipments,
            "outgoingShipments": self.outgoing_shipments,
            "storageAvailable": self.storage_available,
            "connectivityScore": self.connectivity_score,
            "nearbyPopulation": self.nearby_population,
            "avgDeliveryTime": self.avg_delivery_time,
            "hasRailAccess": self.has_rail_access,
            "hasAirAccess": self.has_air_access,
        }


class Road(Base):
    __tablename__ = "roads"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # NH | SH | district | rural
    from_city = Column(String(100), nullable=False)
    to_city = Column(String(100), nullable=False)
    distance = Column(Float, nullable=False)  # km
    condition = Column(String(20), default="fair")  # excellent | good | fair | poor
    lanes = Column(Integer, default=2)
    risk_score = Column(Integer, default=0)  # 0-100
    avg_speed = Column(Float, default=30)  # km/h
    is_operational = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "fromCity": self.from_city,
            "toCity": self.to_city,
            "distance": self.distance,
            "condition": self.condition,
            "lanes": self.lanes,
            "riskScore": self.risk_score,
            "avgSpeed": self.avg_speed,
            "isOperational": self.is_operational,
        }


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    state_id = Column(String(50), ForeignKey("states.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "stateId": self.state_id,
        }


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_node = Column(String(50), ForeignKey("graph_nodes.id"), nullable=False)
    to_node = Column(String(50), ForeignKey("graph_nodes.id"), nullable=False)
    distance = Column(Float, nullable=False)  # km
    time = Column(Float, nullable=False)  # hours
    cost = Column(Float, nullable=False)  # INR per ton-km
    risk = Column(Integer, default=0)  # 0-100
    accessibility = Column(Integer, default=0)  # 0-100
    road_id = Column(String(50))
    road_name = Column(String(200))
    condition = Column(String(20), default="fair")
    waypoints = Column(JSON, default=list)  # [[lat, lng], ...]

    def to_dict(self):
        return {
            "from": self.from_node,
            "to": self.to_node,
            "distance": self.distance,
            "time": self.time,
            "cost": self.cost,
            "risk": self.risk,
            "accessibility": self.accessibility,
            "roadId": self.road_id,
            "roadName": self.road_name,
            "condition": self.condition,
            "waypoints": self.waypoints or [],
        }
