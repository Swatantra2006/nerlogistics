// ============================================================
// Accessibility Intelligence Engine
// Computes multi-factor accessibility scores for districts
// ============================================================

import { District } from '@/types';

export interface AccessibilityBreakdown {
  districtId: string;
  districtName: string;
  stateId: string;
  overallScore: number;
  factors: {
    roadConnectivity: { score: number; weight: number; contribution: number };
    railConnectivity: { score: number; weight: number; contribution: number };
    airportAccess: { score: number; weight: number; contribution: number };
    travelTime: { score: number; weight: number; contribution: number };
    hubProximity: { score: number; weight: number; contribution: number };
    infrastructureQuality: { score: number; weight: number; contribution: number };
    riskPenalty: { score: number; weight: number; contribution: number };
  };
  level: string;
  recommendations: string[];
}

const WEIGHTS = {
  roadConnectivity: 0.22,
  railConnectivity: 0.15,
  airportAccess: 0.13,
  travelTime: 0.15,
  hubProximity: 0.15,
  infrastructureQuality: 0.10,
  riskPenalty: 0.10,
};

function travelTimeScore(avgHours: number): number {
  if (avgHours <= 2) return 95;
  if (avgHours <= 5) return 80;
  if (avgHours <= 8) return 65;
  if (avgHours <= 12) return 45;
  if (avgHours <= 18) return 25;
  return 10;
}

function hubProximityScore(distanceKm: number): number {
  if (distanceKm <= 10) return 95;
  if (distanceKm <= 50) return 80;
  if (distanceKm <= 100) return 65;
  if (distanceKm <= 200) return 45;
  if (distanceKm <= 350) return 25;
  return 10;
}

export function computeAccessibility(district: District): AccessibilityBreakdown {
  const travelScore = travelTimeScore(district.avgTravelTime);
  const hubScore = hubProximityScore(district.nearestHubDistance);
  const riskPenalty = Math.max(0, 100 - district.riskScore);

  const factors = {
    roadConnectivity: { score: district.roadConnectivity, weight: WEIGHTS.roadConnectivity, contribution: district.roadConnectivity * WEIGHTS.roadConnectivity },
    railConnectivity: { score: district.railConnectivity, weight: WEIGHTS.railConnectivity, contribution: district.railConnectivity * WEIGHTS.railConnectivity },
    airportAccess: { score: district.airportAccess, weight: WEIGHTS.airportAccess, contribution: district.airportAccess * WEIGHTS.airportAccess },
    travelTime: { score: travelScore, weight: WEIGHTS.travelTime, contribution: travelScore * WEIGHTS.travelTime },
    hubProximity: { score: hubScore, weight: WEIGHTS.hubProximity, contribution: hubScore * WEIGHTS.hubProximity },
    infrastructureQuality: { score: district.infrastructureQuality, weight: WEIGHTS.infrastructureQuality, contribution: district.infrastructureQuality * WEIGHTS.infrastructureQuality },
    riskPenalty: { score: riskPenalty, weight: WEIGHTS.riskPenalty, contribution: riskPenalty * WEIGHTS.riskPenalty },
  };

  const overallScore = Math.round(
    factors.roadConnectivity.contribution +
    factors.railConnectivity.contribution +
    factors.airportAccess.contribution +
    factors.travelTime.contribution +
    factors.hubProximity.contribution +
    factors.infrastructureQuality.contribution +
    factors.riskPenalty.contribution
  );

  let level: string;
  if (overallScore >= 80) level = 'Highly Accessible';
  else if (overallScore >= 60) level = 'Accessible';
  else if (overallScore >= 40) level = 'Moderate';
  else if (overallScore >= 20) level = 'Poor';
  else level = 'Critical';

  const recommendations: string[] = [];
  if (district.roadConnectivity < 40) recommendations.push('Priority: Road connectivity improvement required. Current road network is inadequate for logistics operations.');
  if (district.railConnectivity < 20) recommendations.push('Extend rail connectivity. Rail freight would significantly reduce logistics costs and improve reliability.');
  if (district.airportAccess < 20) recommendations.push('Consider regional airstrip development for emergency logistics and high-value cargo.');
  if (district.nearestHubDistance > 200) recommendations.push(`Establish a regional logistics hub. Nearest hub is ${district.nearestHubDistance}km away, causing excessive delivery times.`);
  if (district.infrastructureQuality < 30) recommendations.push('Urgent infrastructure investment needed. Road surface quality and bridge capacity are limiting factors.');
  if (district.riskScore > 70) recommendations.push('High natural hazard risk. Implement disaster-resilient logistics infrastructure and maintain emergency supply corridors.');
  if (district.avgTravelTime > 12) recommendations.push(`Average travel time of ${district.avgTravelTime}h is excessive. Road upgrades and alternate route development needed.`);
  if (recommendations.length === 0) recommendations.push('Maintain current infrastructure standards. Consider capacity expansion for growing demand.');

  return {
    districtId: district.id,
    districtName: district.name,
    stateId: district.stateId,
    overallScore,
    factors,
    level,
    recommendations,
  };
}

export function computeAllAccessibility(districts: District[]): AccessibilityBreakdown[] {
  return districts.map(computeAccessibility).sort((a, b) => b.overallScore - a.overallScore);
}

export function getStateAccessibility(districts: District[]): { stateId: string; avgScore: number; districtCount: number }[] {
  const stateMap = new Map<string, { total: number; count: number }>();
  districts.forEach(d => {
    const entry = stateMap.get(d.stateId) || { total: 0, count: 0 };
    const breakdown = computeAccessibility(d);
    entry.total += breakdown.overallScore;
    entry.count += 1;
    stateMap.set(d.stateId, entry);
  });
  return Array.from(stateMap.entries()).map(([stateId, { total, count }]) => ({
    stateId,
    avgScore: Math.round(total / count),
    districtCount: count,
  }));
}
