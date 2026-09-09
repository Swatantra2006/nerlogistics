"""
Pydantic schemas matching the frontend TypeScript interfaces.
These mirror src/types/index.ts exactly.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ============ GEO ============

class StateSchema(BaseModel):
    id: str
    name: str
    capital: str
    lat: float
    lng: float
    area: int
    population: int
    accessibilityScore: int
    riskScore: int
    demandLevel: str

    class Config:
        from_attributes = True


class DistrictSchema(BaseModel):
    id: str
    name: str
    stateId: str
    lat: float
    lng: float
    population: int
    area: int
    accessibilityScore: int
    riskScore: int
    roadConnectivity: int
    railConnectivity: int
    airportAccess: int
    nearestHub: str
    nearestHubDistance: float
    avgDeliveryTime: float
    avgTravelTime: float
    lastMileDifficulty: str
    infrastructureQuality: int
    demandLevel: int
    elevation: float
    terrain: str

    class Config:
        from_attributes = True


# ============ LOGISTICS ============

class LogisticsHubSchema(BaseModel):
    id: str
    name: str
    type: str
    city: str
    stateId: str
    lat: float
    lng: float
    capacity: int
    currentUtilization: int
    incomingShipments: int
    outgoingShipments: int
    storageAvailable: int
    connectivityScore: int
    nearbyPopulation: int
    avgDeliveryTime: float
    hasRailAccess: bool
    hasAirAccess: bool

    class Config:
        from_attributes = True


class RoadSchema(BaseModel):
    id: str
    name: str
    type: str
    fromCity: str
    toCity: str
    distance: float
    condition: str
    lanes: int
    riskScore: int
    avgSpeed: float
    isOperational: bool

    class Config:
        from_attributes = True


class GraphNodeSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    stateId: str

    class Config:
        from_attributes = True


class GraphEdgeSchema(BaseModel):
    from_node: str  # 'from' in frontend
    to_node: str    # 'to' in frontend
    distance: float
    time: float
    cost: float
    risk: int
    accessibility: int
    roadId: str
    roadName: str
    condition: str
    waypoints: List[List[float]]

    class Config:
        from_attributes = True


# ============ INFRASTRUCTURE ============

class AirportSchema(BaseModel):
    id: str
    name: str
    code: str
    city: str
    stateId: str
    lat: float
    lng: float
    type: str
    isOperational: bool

    class Config:
        from_attributes = True


class RailwayStationSchema(BaseModel):
    id: str
    name: str
    city: str
    stateId: str
    lat: float
    lng: float
    type: str
    hasFreight: bool

    class Config:
        from_attributes = True


# ============ RISK ============

class RiskEventSchema(BaseModel):
    id: str
    type: str
    severity: str
    location: str
    districtId: str
    stateId: str
    lat: float
    lng: float
    description: str
    startDate: str
    endDate: Optional[str] = None
    affectedRoutes: List[str]
    riskScore: int
    recommendation: str

    class Config:
        from_attributes = True


class RiskFactorsSchema(BaseModel):
    floodRisk: int
    landslideRisk: int
    earthquakeRisk: int
    infrastructureRisk: int
    weatherRisk: int
    connectivityRisk: int


class RiskAssessmentSchema(BaseModel):
    districtId: str
    districtName: str
    stateId: str
    overallRisk: int
    level: str
    factors: RiskFactorsSchema
    activeAlerts: List[RiskEventSchema]
    recommendation: str


# ============ ACCESSIBILITY ============

class AccessibilityFactorSchema(BaseModel):
    score: int
    weight: float
    contribution: float


class AccessibilityBreakdownSchema(BaseModel):
    districtId: str
    districtName: str
    stateId: str
    overallScore: int
    factors: Dict[str, AccessibilityFactorSchema]
    level: str
    recommendations: List[str]


# ============ DEMAND ============

class HistoricalDataPointSchema(BaseModel):
    date: str
    actual: int
    predicted: Optional[int] = None


class ForecastDataPointSchema(BaseModel):
    date: str
    predicted: int
    lower: int
    upper: int


class DemandForecastSchema(BaseModel):
    districtId: str
    districtName: str
    currentDemand: int
    forecast7Day: int
    forecast30Day: int
    trend: str
    trendPercentage: float
    confidence: float
    seasonalPattern: str
    historicalData: List[HistoricalDataPointSchema]
    forecastData: List[ForecastDataPointSchema]


# ============ ROUTE OPTIMIZATION ============

class RouteOptimizationRequestSchema(BaseModel):
    origin: str
    destination: str
    cargoWeight: float = 500
    cargoType: str = "General"
    vehicleType: str = "Medium Truck (3.5-12t)"
    priority: str = "balanced"  # fastest | cheapest | safest | balanced


class RouteSegmentSchema(BaseModel):
    from_: str = Field(default="", alias="from")
    to: str = ""
    road: str = ""
    distance: float = 0.0
    time: float = 0.0
    risk: int = 0

    class Config:
        populate_by_name = True


class RouteFactorSchema(BaseModel):
    label: str
    value: str
    impact: str  # positive | negative | neutral


class RouteExplanationSchema(BaseModel):
    summary: str
    factors: List[RouteFactorSchema]
    recommendation: str


class OptimizedRouteSchema(BaseModel):
    id: str
    name: str
    distance: float
    estimatedTime: float
    estimatedCost: float
    riskScore: int
    accessibilityScore: int
    routeScore: int
    recommendation: str
    waypoints: List[List[float]]
    segments: List[RouteSegmentSchema]
    explanation: RouteExplanationSchema


# ============ INFRASTRUCTURE GAP ============

class InfrastructureGapSchema(BaseModel):
    id: str
    districtId: str
    districtName: str
    stateId: str
    stateName: str
    demandPressure: int
    populationImportance: int
    accessibilityDeficit: int
    riskFactor: int
    gapScore: int
    nearestHubDistance: float
    recommendedIntervention: str
    estimatedCost: float
    priority: str

    class Config:
        from_attributes = True


class GapByStateSchema(BaseModel):
    stateId: str
    stateName: str
    avgGap: int
    criticalCount: int
    totalCost: float


# ============ SCENARIO ============

class ScenarioInputSchema(BaseModel):
    type: str  # road_closure | flood | landslide | demand_surge | new_hub
    target: str
    severity: Optional[int] = None
    details: Optional[str] = None


class ScenarioPresetSchema(BaseModel):
    id: str
    name: str
    description: str
    input: ScenarioInputSchema


class AccessibilityImpactSchema(BaseModel):
    districtId: str
    before: int
    after: int


class ScenarioResultSchema(BaseModel):
    scenario: ScenarioInputSchema
    affectedDistricts: int
    routesDisrupted: int
    estimatedDelay: float
    additionalCost: float
    populationImpacted: int
    accessibilityImpact: List[AccessibilityImpactSchema]
    recommendation: str
    alternateRoutes: List[str]


# ============ COPILOT ============

class CopilotMetricSchema(BaseModel):
    label: str
    value: str


class CopilotRequestSchema(BaseModel):
    query: str


class CopilotMessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str
    metrics: Optional[List[CopilotMetricSchema]] = None
    recommendations: Optional[List[str]] = None


# ============ DASHBOARD ============

class DashboardOverviewSchema(BaseModel):
    states: int
    districts: int
    logisticsHubs: int
    highRiskZones: int
    activeDisruptions: int
    avgAccessibility: int
    activeRoutes: int
    totalRoutes: int
    highRiskRoutes: int
    predictedDemand: str
    avgTravelTime: str
    infrastructureGaps: int
    alerts: List[RiskEventSchema]
    topGaps: List[InfrastructureGapSchema]


class StateOverviewSchema(BaseModel):
    stateId: str
    stateName: str
    avgAccessibility: int
    avgRisk: int
    districtCount: int


# ============ AUTH ============

class UserCreateSchema(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class UserLoginSchema(BaseModel):
    username: str
    password: str


class UserSchema(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============ MAP ============

class MapLocationSchema(BaseModel):
    id: str
    name: str
    type: str  # district | hub | airport | railway
    lat: float
    lng: float
    stateId: str
    data: Dict[str, Any] = {}


# ============ COMPATIBILITY ALIASES ============
State = StateSchema
District = DistrictSchema
LogisticsHub = LogisticsHubSchema
Road = RoadSchema
Airport = AirportSchema
RailwayStation = RailwayStationSchema
RiskEvent = RiskEventSchema
RiskAssessment = RiskAssessmentSchema
DistrictAccessibilityScore = AccessibilityBreakdownSchema
AccessibilityBreakdown = AccessibilityBreakdownSchema
DemandForecast = DemandForecastSchema
HistoricalDataPoint = HistoricalDataPointSchema
ForecastDataPoint = ForecastDataPointSchema
RouteOptimizationRequest = RouteOptimizationRequestSchema
RouteSegment = RouteSegmentSchema
RouteExplanation = RouteExplanationSchema
FactorImpact = RouteFactorSchema
OptimizedRoute = OptimizedRouteSchema
InfrastructureGap = InfrastructureGapSchema
StateGapSummary = GapByStateSchema
ScenarioInput = ScenarioInputSchema
ScenarioResult = ScenarioResultSchema
ScenarioPreset = ScenarioPresetSchema
DistrictAccessibilityImpact = AccessibilityImpactSchema
CopilotMessage = CopilotMessageSchema
MetricItem = CopilotMetricSchema
