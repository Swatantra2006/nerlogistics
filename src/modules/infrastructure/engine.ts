// ============================================================
// Infrastructure Gap Analysis Engine
// Identifies areas where logistics infrastructure is most needed
// ============================================================

import { InfrastructureGap, District } from '@/types';
import { districts, states } from '@/data/ner-data';

export function analyzeInfrastructureGaps(): InfrastructureGap[] {
  const gaps: InfrastructureGap[] = districts.map(district => {
    const state = states.find(s => s.id === district.stateId);

    // Demand pressure: normalized 0-1
    const demandPressure = district.demandLevel / 100;

    // Population importance: log-scaled relative to region
    const maxPop = Math.max(...districts.map(d => d.population));
    const populationImportance = Math.log10(district.population + 1) / Math.log10(maxPop + 1);

    // Accessibility deficit: inverse of accessibility (higher = bigger gap)
    const accessibilityDeficit = (100 - district.accessibilityScore) / 100;

    // Risk factor
    const riskFactor = district.riskScore / 100;

    // Composite gap score
    const gapScore = Math.round(
      (demandPressure * 30 +
       populationImportance * 25 +
       accessibilityDeficit * 30 +
       riskFactor * 15) * 100 / 100
    );

    // Determine priority
    let priority: InfrastructureGap['priority'];
    if (gapScore >= 65) priority = 'critical';
    else if (gapScore >= 50) priority = 'high';
    else if (gapScore >= 35) priority = 'medium';
    else priority = 'low';

    // Generate recommendations
    let recommendedIntervention = '';
    const interventions: string[] = [];

    if (district.nearestHubDistance > 200) {
      interventions.push('Establish a new regional logistics hub');
    }
    if (district.roadConnectivity < 40) {
      interventions.push('Major road infrastructure upgrade required');
    }
    if (district.railConnectivity < 15 && district.population > 100000) {
      interventions.push('Extend rail connectivity for freight logistics');
    }
    if (district.infrastructureQuality < 35) {
      interventions.push('Road surface and bridge capacity improvements');
    }
    if (district.riskScore > 70) {
      interventions.push('Disaster-resilient infrastructure development');
    }
    if (district.airportAccess < 15 && district.terrain === 'mountainous') {
      interventions.push('Develop regional airstrip for emergency logistics');
    }
    if (district.lastMileDifficulty === 'very-high') {
      interventions.push('Last-mile delivery infrastructure (feeder roads, warehousing)');
    }

    if (interventions.length === 0) {
      interventions.push('Capacity enhancement and maintenance of existing infrastructure');
    }

    recommendedIntervention = interventions.join('; ');

    // Estimate cost (rough estimate based on intervention type)
    let estimatedCost = 0;
    if (district.nearestHubDistance > 200) estimatedCost += 120;
    if (district.roadConnectivity < 40) estimatedCost += 250;
    if (district.railConnectivity < 15) estimatedCost += 800;
    if (district.infrastructureQuality < 35) estimatedCost += 150;
    if (interventions.length === 1 && estimatedCost === 0) estimatedCost = 50;

    return {
      id: `gap-${district.id}`,
      districtId: district.id,
      districtName: district.name,
      stateId: district.stateId,
      stateName: state?.name || '',
      demandPressure: Math.round(demandPressure * 100),
      populationImportance: Math.round(populationImportance * 100),
      accessibilityDeficit: Math.round(accessibilityDeficit * 100),
      riskFactor: Math.round(riskFactor * 100),
      gapScore,
      nearestHubDistance: district.nearestHubDistance,
      recommendedIntervention,
      estimatedCost,
      priority,
    };
  });

  return gaps.sort((a, b) => b.gapScore - a.gapScore);
}

export function getTopGaps(limit: number = 15): InfrastructureGap[] {
  return analyzeInfrastructureGaps().slice(0, limit);
}

export function getGapsByState(): { stateId: string; stateName: string; avgGap: number; criticalCount: number; totalCost: number }[] {
  const gaps = analyzeInfrastructureGaps();
  const stateMap = new Map<string, InfrastructureGap[]>();
  gaps.forEach(g => {
    const arr = stateMap.get(g.stateId) || [];
    arr.push(g);
    stateMap.set(g.stateId, arr);
  });

  return Array.from(stateMap.entries()).map(([stateId, stateGaps]) => ({
    stateId,
    stateName: stateGaps[0].stateName,
    avgGap: Math.round(stateGaps.reduce((s, g) => s + g.gapScore, 0) / stateGaps.length),
    criticalCount: stateGaps.filter(g => g.priority === 'critical' || g.priority === 'high').length,
    totalCost: stateGaps.reduce((s, g) => s + g.estimatedCost, 0),
  })).sort((a, b) => b.avgGap - a.avgGap);
}
