// ============================================================
// Risk Scoring Engine
// Multi-hazard assessment for routes and districts
// ============================================================

import { District, RiskEvent } from '@/types';
import { districts, riskEvents, generateWeatherData } from '@/data/ner-data';

export interface RiskAssessment {
  districtId: string;
  districtName: string;
  stateId: string;
  overallRisk: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    floodRisk: number;
    landslideRisk: number;
    earthquakeRisk: number;
    infrastructureRisk: number;
    weatherRisk: number;
    connectivityRisk: number;
  };
  activeAlerts: RiskEvent[];
  recommendation: string;
}

// Seismic zone mapping for NER (actual zones)
const seismicZones: Record<string, number> = {
  assam: 72, arunachal: 80, manipur: 75, meghalaya: 68,
  mizoram: 72, nagaland: 78, sikkim: 82, tripura: 65,
};

export function assessDistrictRisk(districtId: string): RiskAssessment {
  const district = districts.find(d => d.id === districtId);
  if (!district) throw new Error(`District ${districtId} not found`);

  const weather = generateWeatherData(districtId, district.terrain);
  const recentWeather = weather.slice(-7);
  const avgRainfall = recentWeather.reduce((s, w) => s + w.rainfall, 0) / recentWeather.length;
  const maxFloodRisk = Math.max(...recentWeather.map(w => w.floodRisk));
  const maxLandslideRisk = Math.max(...recentWeather.map(w => w.landslideRisk));

  // Flood risk: terrain + rainfall + river proximity
  const floodRisk = Math.min(100, Math.round(
    (district.terrain === 'riverine' ? 40 : district.terrain === 'plain' ? 20 : 10) +
    Math.min(40, avgRainfall * 0.8) +
    (maxFloodRisk * 0.3)
  ));

  // Landslide risk: terrain + rainfall + elevation
  const landslideRisk = Math.min(100, Math.round(
    (district.terrain === 'mountainous' ? 45 : district.terrain === 'hilly' ? 30 : 5) +
    Math.min(30, avgRainfall * 0.5) +
    (district.elevation > 2000 ? 20 : district.elevation > 1000 ? 12 : 5)
  ));

  // Earthquake risk: seismic zone
  const earthquakeRisk = Math.round((seismicZones[district.stateId] || 60) * 0.8 +
    (district.terrain === 'mountainous' ? 15 : 5));

  // Infrastructure risk: inverse of quality
  const infrastructureRisk = Math.round(100 - district.infrastructureQuality);

  // Weather risk: current conditions
  const weatherRisk = Math.min(100, Math.round(avgRainfall * 1.5 + (maxFloodRisk + maxLandslideRisk) / 4));

  // Connectivity risk: how isolated
  const connectivityRisk = Math.round(
    (100 - district.roadConnectivity) * 0.4 +
    (100 - district.railConnectivity) * 0.3 +
    Math.min(100, district.nearestHubDistance / 4) * 0.3
  );

  // Overall risk: weighted composite
  const overallRisk = Math.round(
    floodRisk * 0.22 +
    landslideRisk * 0.22 +
    earthquakeRisk * 0.15 +
    infrastructureRisk * 0.15 +
    weatherRisk * 0.14 +
    connectivityRisk * 0.12
  );

  let level: RiskAssessment['level'];
  if (overallRisk >= 75) level = 'CRITICAL';
  else if (overallRisk >= 55) level = 'HIGH';
  else if (overallRisk >= 35) level = 'MEDIUM';
  else level = 'LOW';

  const activeAlerts = riskEvents.filter(e => e.districtId === districtId || e.stateId === district.stateId);

  let recommendation = '';
  if (level === 'CRITICAL') {
    recommendation = `Critical risk level in ${district.name}. Activate emergency logistics protocols. Maintain buffer stock for 72 hours. Deploy monitoring teams. Consider airlift for essential supplies.`;
  } else if (level === 'HIGH') {
    recommendation = `High risk in ${district.name}. Pre-position emergency supplies. Monitor weather forecasts closely. Identify and prepare alternate supply routes. Increase shipment frequency to build buffer.`;
  } else if (level === 'MEDIUM') {
    recommendation = `Moderate risk in ${district.name}. Maintain standard monitoring. Ensure contingency plans are updated. Monitor seasonal patterns for potential escalation.`;
  } else {
    recommendation = `Low risk in ${district.name}. Normal operations. Continue routine monitoring and preventive maintenance.`;
  }

  return {
    districtId,
    districtName: district.name,
    stateId: district.stateId,
    overallRisk,
    level,
    factors: { floodRisk, landslideRisk, earthquakeRisk, infrastructureRisk, weatherRisk, connectivityRisk },
    activeAlerts,
    recommendation,
  };
}

export function assessAllRisks(): RiskAssessment[] {
  return districts.map(d => assessDistrictRisk(d.id)).sort((a, b) => b.overallRisk - a.overallRisk);
}

export function getHighRiskDistricts(threshold: number = 55): RiskAssessment[] {
  return assessAllRisks().filter(r => r.overallRisk >= threshold);
}

export function getActiveAlerts(): RiskEvent[] {
  return riskEvents.filter(e => !e.endDate || new Date(e.endDate) >= new Date('2026-08-28'));
}
