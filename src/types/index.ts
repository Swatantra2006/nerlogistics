// ============================================================
// NER Logistics Intelligence Platform — Core Type Definitions
// ============================================================

export interface State {
  id: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  area: number; // sq km
  population: number;
  accessibilityScore: number;
  riskScore: number;
  demandLevel: 'low' | 'medium' | 'high' | 'very-high';
}

export interface District {
  id: string;
  name: string;
  stateId: string;
  lat: number;
  lng: number;
  population: number;
  area: number;
  accessibilityScore: number;
  riskScore: number;
  roadConnectivity: number;    // 0-100
  railConnectivity: number;    // 0-100
  airportAccess: number;       // 0-100
  nearestHub: string;
  nearestHubDistance: number;   // km
  avgDeliveryTime: number;     // hours
  avgTravelTime: number;       // hours
  lastMileDifficulty: 'low' | 'medium' | 'high' | 'very-high';
  infrastructureQuality: number; // 0-100
  demandLevel: number;         // 0-100
  elevation: number;           // meters
  terrain: 'plain' | 'hilly' | 'mountainous' | 'riverine';
}

export interface Road {
  id: string;
  name: string;
  type: 'NH' | 'SH' | 'district' | 'rural';
  fromCity: string;
  toCity: string;
  distance: number;           // km
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  lanes: number;
  riskScore: number;          // 0-100
  avgSpeed: number;           // km/h
  isOperational: boolean;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  roads: string[];            // road IDs
  totalDistance: number;       // km
  estimatedTime: number;      // hours
  estimatedCost: number;      // INR
  riskScore: number;          // 0-100
  accessibilityScore: number; // 0-100
  waypoints: [number, number][]; // [lat, lng] pairs
}

export interface LogisticsHub {
  id: string;
  name: string;
  type: 'major' | 'regional' | 'local';
  city: string;
  stateId: string;
  lat: number;
  lng: number;
  capacity: number;           // tons
  currentUtilization: number; // percentage
  incomingShipments: number;
  outgoingShipments: number;
  storageAvailable: number;   // tons
  connectivityScore: number;  // 0-100
  nearbyPopulation: number;
  avgDeliveryTime: number;    // hours
  hasRailAccess: boolean;
  hasAirAccess: boolean;
}

export interface Airport {
  id: string;
  name: string;
  code: string;
  city: string;
  stateId: string;
  lat: number;
  lng: number;
  type: 'international' | 'domestic' | 'airstrip';
  isOperational: boolean;
}

export interface RailwayStation {
  id: string;
  name: string;
  city: string;
  stateId: string;
  lat: number;
  lng: number;
  type: 'junction' | 'terminal' | 'regular';
  hasFreight: boolean;
}

export interface DemandRecord {
  districtId: string;
  date: string;              // YYYY-MM-DD
  demand: number;            // tons
  category: string;
  predicted?: number;
  confidence?: number;
}

export interface RiskEvent {
  id: string;
  type: 'flood' | 'landslide' | 'earthquake' | 'road_blockage' | 'heavy_rainfall' | 'infrastructure_failure' | 'border_disruption' | 'traffic_congestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  districtId: string;
  stateId: string;
  lat: number;
  lng: number;
  description: string;
  startDate: string;
  endDate?: string;
  affectedRoutes: string[];
  riskScore: number;
  recommendation: string;
}

export interface WeatherEvent {
  districtId: string;
  date: string;
  rainfall: number;          // mm
  temperature: number;       // celsius
  humidity: number;           // percentage
  condition: 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'storm';
  floodRisk: number;         // 0-100
  landslideRisk: number;     // 0-100
}

export interface InfrastructureGap {
  id: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  demandPressure: number;
  populationImportance: number;
  accessibilityDeficit: number;
  riskFactor: number;
  gapScore: number;          // computed composite
  nearestHubDistance: number;
  recommendedIntervention: string;
  estimatedCost: number;     // crores
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface RouteOptimizationRequest {
  origin: string;
  destination: string;
  cargoWeight: number;       // kg
  cargoType: string;
  vehicleType: string;
  priority: 'fastest' | 'cheapest' | 'safest' | 'balanced';
}

export interface OptimizedRoute {
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;     // hours
  estimatedCost: number;     // INR
  riskScore: number;
  accessibilityScore: number;
  routeScore: number;
  recommendation: string;
  waypoints: [number, number][];
  segments: RouteSegment[];
  explanation: RouteExplanation;
}

export interface RouteSegment {
  from: string;
  to: string;
  road: string;
  distance: number;
  time: number;
  risk: number;
}

export interface RouteExplanation {
  summary: string;
  factors: { label: string; value: string; impact: 'positive' | 'negative' | 'neutral' }[];
  recommendation: string;
}

export interface ScenarioInput {
  type: 'road_closure' | 'flood' | 'landslide' | 'demand_surge' | 'new_hub';
  target: string;            // road/district/location ID
  severity?: number;         // 0-100
  details?: string;
}

export interface ScenarioResult {
  scenario: ScenarioInput;
  affectedDistricts: number;
  routesDisrupted: number;
  estimatedDelay: number;    // hours
  additionalCost: number;    // INR per day
  populationImpacted: number;
  accessibilityImpact: { districtId: string; before: number; after: number }[];
  recommendation: string;
  alternateRoutes: string[];
}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metrics?: { label: string; value: string }[];
  recommendations?: string[];
}

export interface DashboardKPIs {
  accessibilityScore: number;
  accessibilityTrend: number;
  activeRoutes: number;
  highRiskRoutes: number;
  predictedDemand: number;
  demandTrend: number;
  avgTravelTime: number;
  infrastructureGaps: number;
  disruptionAlerts: number;
}

export type AccessibilityLevel = 'critical' | 'poor' | 'moderate' | 'accessible' | 'highly-accessible';

export function getAccessibilityLevel(score: number): AccessibilityLevel {
  if (score >= 80) return 'highly-accessible';
  if (score >= 60) return 'accessible';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'poor';
  return 'critical';
}

export function getAccessibilityColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#34d399';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export function getRiskColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#34d399';
  return '#10b981';
}

export function getRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function getUtilizationStatus(pct: number): string {
  if (pct > 90) return 'Critical';
  if (pct > 80) return 'High';
  if (pct > 60) return 'Moderate';
  return 'Available';
}

export function getUtilizationColor(pct: number): string {
  if (pct > 90) return '#ef4444';
  if (pct > 80) return '#f97316';
  if (pct > 60) return '#fbbf24';
  return '#10b981';
}
