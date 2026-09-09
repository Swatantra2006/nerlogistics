// ============================================================
// Scenario Simulation Engine
// What-if analysis for logistics disruptions and interventions
// ============================================================

import { ScenarioInput, ScenarioResult } from '@/types';
import { districts, roads, graphEdges, states, logisticsHubs } from '@/data/ner-data';
import { computeAccessibility } from '@/modules/accessibility/engine';

export function simulateScenario(input: ScenarioInput): ScenarioResult {
  switch (input.type) {
    case 'road_closure':
      return simulateRoadClosure(input);
    case 'flood':
      return simulateFlood(input);
    case 'landslide':
      return simulateLandslide(input);
    case 'demand_surge':
      return simulateDemandSurge(input);
    case 'new_hub':
      return simulateNewHub(input);
    default:
      return simulateRoadClosure(input);
  }
}

function simulateRoadClosure(input: ScenarioInput): ScenarioResult {
  const road = roads.find(r => r.id === input.target);
  if (!road) {
    return createDefaultResult(input, 'Road not found');
  }

  // Find affected edges
  const affectedEdges = graphEdges.filter(e => e.roadId === input.target);
  const affectedStateIds = new Set<string>();
  affectedEdges.forEach(e => {
    const fromNode = districts.find(d => d.stateId && d.id)?.stateId;
    if (fromNode) affectedStateIds.add(fromNode);
  });

  // Calculate affected districts (those that depend on this road)
  const affectedDistrictIds = districts.filter(d => {
    const stateRoads = roads.filter(r => r.fromCity === d.name || r.toCity === d.name);
    return stateRoads.some(r => r.id === input.target) || d.nearestHubDistance > 200;
  }).map(d => d.id);

  // For NH closures, estimate based on corridor importance
  const routeImportance = road.type === 'NH' ? 0.8 : 0.5;
  const numAffected = Math.max(3, Math.round(districts.length * routeImportance * 0.3));
  const relevantDistricts = districts
    .filter(d => affectedEdges.some(e => d.stateId === states.find(s =>
      roads.some(r => r.id === input.target && (r.fromCity.includes(s.capital) || r.toCity.includes(s.capital)))
    )?.id))
    .slice(0, numAffected);

  const actualAffected = Math.max(relevantDistricts.length, Math.round(numAffected * 0.6));

  // Calculate delays
  const avgDelay = road.distance / road.avgSpeed * 1.8; // 80% more time via detour
  const additionalCost = Math.round(road.distance * 85 * actualAffected * 0.3); // per day estimate

  // Accessibility impact
  const accessibilityImpact = relevantDistricts.map(d => {
    const before = computeAccessibility(d).overallScore;
    const after = Math.max(5, before - Math.round(15 + Math.random() * 20));
    return { districtId: d.id, before, after };
  });

  // Population impacted
  const popImpacted = relevantDistricts.reduce((s, d) => s + d.population, 0);

  // Find alternate routes
  const allRoads = roads.filter(r => r.id !== input.target && r.isOperational);
  const alternateRoutes = allRoads
    .filter(r => r.type === 'NH')
    .slice(0, 3)
    .map(r => `${r.name} (${r.fromCity} → ${r.toCity})`);

  const nearestHub = logisticsHubs
    .sort((a, b) => a.currentUtilization - b.currentUtilization)[0];

  return {
    scenario: input,
    affectedDistricts: actualAffected,
    routesDisrupted: affectedEdges.length + 2,
    estimatedDelay: Math.round(avgDelay * 10) / 10,
    additionalCost,
    populationImpacted: popImpacted,
    accessibilityImpact,
    recommendation: `Activate alternate routes: ${alternateRoutes[0] || 'available corridors'}. Redistribute cargo through ${nearestHub?.name || 'nearest available hub'}. Pre-position 72-hour buffer stock in affected districts. Deploy emergency road repair teams to ${road.name}.`,
    alternateRoutes,
  };
}

function simulateFlood(input: ScenarioInput): ScenarioResult {
  const severity = input.severity || 70;
  const district = districts.find(d => d.id === input.target);

  if (!district) return createDefaultResult(input, 'District not found');

  const state = states.find(s => s.id === district.stateId);
  const affectedDistricts = districts.filter(d =>
    d.stateId === district.stateId &&
    (d.terrain === 'riverine' || d.terrain === 'plain' || d.elevation < 200)
  );

  const numAffected = Math.min(affectedDistricts.length, Math.round(severity / 10));
  const selected = affectedDistricts.slice(0, numAffected);

  return {
    scenario: input,
    affectedDistricts: numAffected,
    routesDisrupted: Math.round(severity / 12),
    estimatedDelay: Math.round(severity * 0.15 * 10) / 10,
    additionalCost: Math.round(severity * 4200 * numAffected / 10),
    populationImpacted: selected.reduce((s, d) => s + d.population, 0),
    accessibilityImpact: selected.map(d => ({
      districtId: d.id,
      before: computeAccessibility(d).overallScore,
      after: Math.max(5, computeAccessibility(d).overallScore - Math.round(severity * 0.35)),
    })),
    recommendation: `Activate flood emergency logistics protocol for ${state?.name || 'affected state'}. Deploy watercraft for last-mile delivery. Airlift critical supplies to cut-off areas. Establish relief distribution points at elevated locations. Pre-position rescue and medical supplies.`,
    alternateRoutes: ['Elevated highway corridors', 'Rail freight (where tracks are above flood level)', 'Air cargo via nearest operational airport'],
  };
}

function simulateLandslide(input: ScenarioInput): ScenarioResult {
  const road = roads.find(r => r.id === input.target);

  if (!road) return createDefaultResult(input, 'Road not found');

  const affectedDistricts = districts.filter(d =>
    d.terrain === 'mountainous' || d.terrain === 'hilly'
  ).slice(0, 8);

  return {
    scenario: input,
    affectedDistricts: affectedDistricts.length,
    routesDisrupted: 4,
    estimatedDelay: Math.round((road.distance / road.avgSpeed) * 2.5 * 10) / 10,
    additionalCost: Math.round(road.distance * 120 * affectedDistricts.length * 0.2),
    populationImpacted: affectedDistricts.reduce((s, d) => s + d.population, 0),
    accessibilityImpact: affectedDistricts.map(d => ({
      districtId: d.id,
      before: computeAccessibility(d).overallScore,
      after: Math.max(5, computeAccessibility(d).overallScore - Math.round(20 + Math.random() * 15)),
    })),
    recommendation: `Deploy road clearing teams to ${road.name}. Activate alternate mountain corridors. Airlift essential supplies for isolated communities. Deploy helicopter logistics for critical medical supplies. Estimated road clearance: 72-120 hours.`,
    alternateRoutes: roads.filter(r => r.id !== input.target && r.type === 'NH').slice(0, 3).map(r => `${r.name} (${r.fromCity} → ${r.toCity})`),
  };
}

function simulateDemandSurge(input: ScenarioInput): ScenarioResult {
  const district = districts.find(d => d.id === input.target);
  if (!district) return createDefaultResult(input, 'District not found');

  const surgeMultiplier = (input.severity || 50) / 100 + 1; // 1.5x to 2x
  const nearbyDistricts = districts.filter(d =>
    d.stateId === district.stateId && d.id !== district.id
  );

  return {
    scenario: input,
    affectedDistricts: nearbyDistricts.length + 1,
    routesDisrupted: 0,
    estimatedDelay: Math.round(surgeMultiplier * 2 * 10) / 10,
    additionalCost: Math.round(district.demandLevel * surgeMultiplier * 1800),
    populationImpacted: district.population + nearbyDistricts.reduce((s, d) => s + d.population, 0),
    accessibilityImpact: [{ districtId: district.id, before: computeAccessibility(district).overallScore, after: computeAccessibility(district).overallScore }],
    recommendation: `Increase shipment frequency by ${Math.round((surgeMultiplier - 1) * 100)}%. Activate overflow capacity at nearby logistics hubs. Coordinate with regional warehouses for stock redistribution. Deploy additional vehicles on primary supply corridors.`,
    alternateRoutes: [],
  };
}

function simulateNewHub(input: ScenarioInput): ScenarioResult {
  const district = districts.find(d => d.id === input.target);
  if (!district) return createDefaultResult(input, 'District not found');

  const beneficiaryDistricts = districts.filter(d =>
    Math.abs(d.lat - district.lat) < 1.5 && Math.abs(d.lng - district.lng) < 1.5
  );

  return {
    scenario: input,
    affectedDistricts: beneficiaryDistricts.length,
    routesDisrupted: 0,
    estimatedDelay: -Math.round(district.avgDeliveryTime * 0.35 * 10) / 10, // negative = improvement
    additionalCost: -Math.round(beneficiaryDistricts.length * 12000), // savings
    populationImpacted: beneficiaryDistricts.reduce((s, d) => s + d.population, 0),
    accessibilityImpact: beneficiaryDistricts.map(d => ({
      districtId: d.id,
      before: computeAccessibility(d).overallScore,
      after: Math.min(95, computeAccessibility(d).overallScore + Math.round(12 + Math.random() * 10)),
    })),
    recommendation: `New logistics hub in ${district.name} would improve accessibility for ${beneficiaryDistricts.length} districts. Estimated reduction in average delivery time: ${Math.round(district.avgDeliveryTime * 0.35)} hours. Annual logistics cost savings: ₹${Math.round(beneficiaryDistricts.length * 12000 * 365 / 100000)} lakhs. Recommended hub capacity: ${Math.round(district.population / 100)} tons.`,
    alternateRoutes: [],
  };
}

function createDefaultResult(input: ScenarioInput, error: string): ScenarioResult {
  return {
    scenario: input,
    affectedDistricts: 0,
    routesDisrupted: 0,
    estimatedDelay: 0,
    additionalCost: 0,
    populationImpacted: 0,
    accessibilityImpact: [],
    recommendation: `Unable to simulate: ${error}. Please check the target identifier.`,
    alternateRoutes: [],
  };
}

export function getScenarioPresets(): { id: string; name: string; description: string; input: ScenarioInput }[] {
  return [
    { id: 'sc-1', name: 'NH-13 Closure (Tawang Road)', description: 'Major corridor to Tawang closed due to landslide', input: { type: 'road_closure', target: 'nh-13', details: 'Complete road closure due to massive landslide near Sela Pass' } },
    { id: 'sc-2', name: 'NH-10 Closure (Sikkim Highway)', description: 'Gangtok-Siliguri corridor disrupted', input: { type: 'road_closure', target: 'nh-10', details: 'Landslide blocks both lanes near Rangpo' } },
    { id: 'sc-3', name: 'Brahmaputra Flood (Barpeta)', description: 'Severe flooding in Brahmaputra basin', input: { type: 'flood', target: 'barpeta', severity: 80, details: 'River water above danger mark, low-lying areas inundated' } },
    { id: 'sc-4', name: 'Landslide on NH-2 (Manipur)', description: 'Dimapur-Imphal corridor blocked', input: { type: 'landslide', target: 'nh-2', details: 'Multiple debris flows blocking road near Mao Gate' } },
    { id: 'sc-5', name: 'Demand Surge (Guwahati)', description: 'Festival season demand increase', input: { type: 'demand_surge', target: 'kamrup-metro', severity: 60, details: 'Bihu festival driving 60% demand surge' } },
    { id: 'sc-6', name: 'New Hub: Tawang', description: 'Establish logistics hub in Tawang', input: { type: 'new_hub', target: 'tawang', details: 'Proposed new logistics staging point' } },
    { id: 'sc-7', name: 'NH-44 Disruption (Silchar)', description: 'Major link to Barak Valley disrupted', input: { type: 'road_closure', target: 'nh-44', details: 'Bridge load restriction + heavy rainfall combination' } },
    { id: 'sc-8', name: 'Flood (Silchar Basin)', description: 'Barak river flooding', input: { type: 'flood', target: 'silchar', severity: 75, details: 'Barak river flooding, affecting logistics to Mizoram and Tripura' } },
  ];
}
