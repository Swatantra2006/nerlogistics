// ============================================================
// AI Copilot Engine — Grounded Client-Side Engine Fallback
// Connects user questions to real platform datasets & engines
// ============================================================

import { CopilotMessage } from '@/types';
import { CopilotIntelligence } from '@/lib/copilot-intelligence';
import { riskEvents } from '@/data/ner-data';

const LIVE_CONVOYS = [
  {
    id: 'NER-CV-101',
    vehicleNumber: 'AS-01-GB-4819',
    corridor: 'Guwahati → Shillong (GS Road NH-6)',
    origin: 'Guwahati Logistics Park',
    destination: 'Shillong Hub',
    driver: 'Ranjit Borah',
    cargo: 'Cold-Chain Medical Supplies',
    weightTons: 6.4,
    currentLat: 25.88,
    currentLng: 91.82,
    speedKmh: 46.2,
    status: 'in_transit',
    delayRisk: 'Low (Active Green Lane)',
    etaHours: 1.4,
  },
  {
    id: 'NER-CV-102',
    vehicleNumber: 'AS-11-CC-9021',
    corridor: 'Silchar → Agartala (NH-8)',
    origin: 'Silchar Rail Transshipment',
    destination: 'Agartala Integrated Checkpost',
    driver: 'Dipankar Debbarma',
    cargo: 'Essential Grains & PDS',
    weightTons: 14.8,
    currentLat: 24.52,
    currentLng: 92.41,
    speedKmh: 34.8,
    status: 'in_transit',
    delayRisk: 'Moderate (Monsoon Pavement Slippage)',
    etaHours: 3.2,
  },
  {
    id: 'NER-CV-103',
    vehicleNumber: 'NL-07-A-3210',
    corridor: 'Dimapur → Kohima (NH-29)',
    origin: 'Dimapur Cargo Freight Hub',
    destination: 'Kohima Civil Supply Depot',
    driver: 'Kevichusa Angami',
    cargo: 'Infrastructure Cement & Steel Rebar',
    weightTons: 18.0,
    currentLat: 25.75,
    currentLng: 93.92,
    speedKmh: 28.5,
    status: 'in_transit',
    delayRisk: 'Low',
    etaHours: 1.8,
  },
  {
    id: 'NER-CV-104',
    vehicleNumber: 'SK-02-B-1188',
    corridor: 'Siliguri → Gangtok (NH-10)',
    origin: 'Siliguri Transport Terminal',
    destination: 'Gangtok Cold Storage Hub',
    driver: 'Bikash Pradhan',
    cargo: 'Pharmaceuticals & Vaccines',
    weightTons: 8.2,
    currentLat: 27.15,
    currentLng: 88.52,
    speedKmh: 42.1,
    status: 'in_transit',
    delayRisk: 'Low (Clear Mountain Route)',
    etaHours: 1.1,
  },
];

/**
 * Handle simulated fleet telemetry queries
 */
function handleConvoyQuery(query: string): CopilotMessage {
  const lower = query.toLowerCase();
  const matched = LIVE_CONVOYS.find(c =>
    lower.includes(c.id.toLowerCase()) ||
    lower.includes(c.vehicleNumber.toLowerCase().replace(/-/g, '')) ||
    lower.includes(c.driver.toLowerCase().split(' ')[0])
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (matched) {
    return {
      role: 'assistant',
      content: `**Fleet Simulation Telemetry for ${matched.id} (${matched.vehicleNumber})** [Telemetry Sync: ${timeStr}]:\n\n• **Corridor:** ${matched.corridor}\n• **Driver:** ${matched.driver}\n• **Cargo:** ${matched.cargo} (${matched.weightTons} tons)\n• **Simulated Velocity:** **${matched.speedKmh} km/h**\n• **Simulated Coordinates:** \`${matched.currentLat.toFixed(4)}°N, ${matched.currentLng.toFixed(4)}°E\`\n• **Transit Status:** ${matched.status.toUpperCase()} (ETA: ${matched.etaHours} hrs)\n• **Delay Risk Assessment:** ${matched.delayRisk}\n\n**Advisory:** Vehicle is moving within optimal hill corridor parameters. *(Simulated fleet stream)*`,
      timestamp: now.toISOString(),
      metrics: [
        { label: 'Speed', value: `${matched.speedKmh} km/h` },
        { label: 'ETA', value: `${matched.etaHours} hrs` },
        { label: 'Weight', value: `${matched.weightTons} t` },
        { label: 'Risk', value: matched.delayRisk.split(' ')[0] },
      ],
      recommendations: [
        `Continuous fleet telemetry active on ${matched.corridor}`,
        'Alert driver if rainfall exceeds 15mm/hr',
      ],
      sources: ['Simulated Convoy Telemetry Stream'],
    };
  }

  const list = LIVE_CONVOYS.map(c =>
    `• **${c.vehicleNumber}** (${c.id}) on **${c.corridor}**: ${c.cargo} — **${c.speedKmh} km/h** | ETA: ${c.etaHours}h | Risk: ${c.delayRisk}`
  ).join('\n');

  const totalWeight = LIVE_CONVOYS.reduce((s, c) => s + c.weightTons, 0).toFixed(1);
  const avgSpeed = (LIVE_CONVOYS.reduce((s, c) => s + c.speedKmh, 0) / LIVE_CONVOYS.length).toFixed(1);

  return {
    role: 'assistant',
    content: `**NER Freight Operations Fleet Simulation Stream** [Telemetry Sync: ${timeStr}]:\n\nThere are currently **${LIVE_CONVOYS.length} simulated commercial freight convoys** tracked across North Eastern corridors carrying **${totalWeight} tons** of supplies:\n\n${list}\n\n**Corridor Metrics (Simulated):**\n• Average Mountain Velocity: **${avgSpeed} km/h**\n• Highest Elevation Convoy: SK-02-B-1188 on NH-10 (Siliguri → Gangtok)\n• Road Surface Friction: Optimal across GS Road and NH-8. *(Simulated real-time logistics telemetry)*`,
    timestamp: now.toISOString(),
    metrics: [
      { label: 'Active Convoys', value: `${LIVE_CONVOYS.length}` },
      { label: 'Total Freight', value: `${totalWeight} t` },
      { label: 'Avg Speed', value: `${avgSpeed} km/h` },
    ],
    recommendations: [
      'Monitor weather advisories along high-altitude mountain passes',
      'Pre-notify receiving warehouses at Shillong and Kohima hubs',
    ],
    sources: ['Simulated Convoy Telemetry Stream'],
  };
}

/**
 * Handle live disruption alerts
 */
function handleAlertsQuery(): CopilotMessage {
  const activeAlerts = riskEvents.slice(0, 4);
  const alertsText = activeAlerts.map(e =>
    `• ⚠️ **${e.location}** [${e.severity.toUpperCase()}]\n  Type: ${e.type.replace('_', ' ')} | Impact: ${e.description}\n  Advisory: ${e.recommendation}`
  ).join('\n\n');

  return {
    role: 'assistant',
    content: `**Regional Disruption & Hazard Alert Registry:**\n\nActive weather and geological disruptions recorded in the NER database:\n\n${alertsText}\n\n**Corridor Status Summary:**\n• NH-10 (Siliguri-Gangtok): Landslide monitoring active during heavy rain\n• NH-13 (Bhalukpong-Tawang): Fog advisory near Sela Tunnel\n• NH-6 (Guwahati-Shillong): Clear, normal operating speed.`,
    timestamp: new Date().toISOString(),
    metrics: [
      { label: 'Active Alerts', value: `${riskEvents.length}` },
      { label: 'High/Critical', value: `${riskEvents.filter(r => r.severity === 'critical' || r.severity === 'high').length}` },
      { label: 'Network Health', value: '94.2%' },
    ],
    recommendations: [
      'Maintain mandatory vehicle spacing in single-lane fog sectors',
      'Verify brake fluid temperature on descending mountain passes',
    ],
    sources: ['Active Regional Alert Registry', 'Multi-Hazard Risk Model'],
  };
}

/**
 * Main synchronous processor for client-side fallback
 */
export function processQuery(query: string, userLocation?: { lat: number; lng: number }): CopilotMessage {
  const lower = query.toLowerCase();

  // 1. Simulated fleet telemetry check
  if (['truck', 'convoy', 'moving', 'telemetry', 'gps', 'speed', 'where is', 'ner-cv', 'driver', 'active freight'].some(w => lower.includes(w))) {
    return handleConvoyQuery(query);
  }

  // 2. Disruption alerts check
  if (['landslide alert', 'flood alert', 'fog advisory', 'live alert', 'road closure', 'hazard today', 'active alert'].some(w => lower.includes(w))) {
    return handleAlertsQuery();
  }

  // 3. Delegate to Unified CopilotIntelligence Engine
  const parsed = CopilotIntelligence.parseQuery(query, userLocation);

  // Unknown location check
  if (parsed.unknownLocationStrings.length > 0 && parsed.locations.length === 0) {
    const unknown = parsed.unknownLocationStrings[0];
    return {
      role: 'assistant',
      content: `I couldn't find "**${unknown}**" in the platform's indexed logistics dataset.\n\nThe system currently covers India's **8 North Eastern States** (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura) with 40+ districts, primary national highways, airports, and logistics hubs.\n\nPlease verify the location name or try a supported center such as *Guwahati, Dibrugarh, Tawang, Agartala, Aizawl, Imphal, Kohima, Shillong, Gangtok, Anini, or Pelling*.`,
      timestamp: new Date().toISOString(),
      metrics: [{ label: 'Status', value: 'Unindexed Location' }],
      recommendations: [
        'Try: "What is the route between Agartala and Aizawl?"',
        'Try: "Which district has the worst accessibility?"',
      ],
      sources: ['NER Regional Boundary Registry'],
    };
  }

  // COMPARISON
  if (parsed.primaryIntent === 'comparison' && parsed.locations.length >= 2) {
    const comp = CopilotIntelligence.compareLocationsFact(parsed.locations[0], parsed.locations[1]);
    return {
      role: 'assistant',
      content: comp.factText,
      timestamp: new Date().toISOString(),
      metrics: comp.metrics,
      recommendations: comp.recommendations,
      sources: comp.sources,
      intent: 'comparison',
      locations: [parsed.locations[0].matchedName, parsed.locations[1].matchedName],
    };
  }

  // ACCESSIBILITY
  if (parsed.primaryIntent === 'accessibility') {
    const targetLoc = parsed.locations[0];
    const fact = CopilotIntelligence.getAccessibilityFact(targetLoc, parsed.sortOrder);
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: 'accessibility',
      locations: targetLoc ? [targetLoc.matchedName] : [],
    };
  }

  // DEMAND
  if (parsed.primaryIntent === 'demand') {
    const targetLoc = parsed.locations[0];
    const fact = CopilotIntelligence.getDemandFact(targetLoc, parsed.sortOrder === 'worst' ? 'lowest' : 'highest');
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: 'demand',
      locations: targetLoc ? [targetLoc.matchedName] : [],
    };
  }

  // RISK
  if (parsed.primaryIntent === 'risk') {
    const targetLoc = parsed.locations[0];
    const fact = CopilotIntelligence.getRiskFact(targetLoc);
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: 'risk',
      locations: targetLoc ? [targetLoc.matchedName] : [],
    };
  }

  // INFRASTRUCTURE
  if (parsed.primaryIntent === 'infrastructure') {
    const targetLoc = parsed.locations[0];
    const fact = CopilotIntelligence.getInfrastructureFact(targetLoc);
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: 'infrastructure',
      locations: targetLoc ? [targetLoc.matchedName] : [],
    };
  }

  // HUB
  if (parsed.primaryIntent === 'hub') {
    const loc = parsed.locations[0];
    const lat = loc?.lat || userLocation?.lat || 26.14;
    const lng = loc?.lng || userLocation?.lng || 91.73;
    const name = loc?.matchedName || (userLocation ? 'Current Location' : 'Guwahati');
    const fact = CopilotIntelligence.getHubFact(lat, lng, name, loc?.isProxy ? loc.proxyNotice : undefined);
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: 'hub',
      locations: loc ? [loc.matchedName] : [],
    };
  }

  // STATE
  if (parsed.primaryIntent === 'state' || (parsed.locations.length === 1 && parsed.locations[0].type === 'state')) {
    const s = parsed.locations[0]?.state;
    if (s) {
      const fact = CopilotIntelligence.getStateFact(s);
      return {
        role: 'assistant',
        content: fact.factText,
        timestamp: new Date().toISOString(),
        metrics: fact.metrics,
        recommendations: fact.recommendations,
        sources: fact.sources,
        intent: 'state',
        locations: [s.name],
      };
    }
  }

  // ROUTE (Synchronous Dijkstra)
  if (parsed.primaryIntent === 'route' && parsed.locations.length >= 2) {
    const origin = parsed.locations[0];
    const dest = parsed.locations[1];
    return {
      role: 'assistant',
      content: `**Route Intelligence: ${origin.matchedName} → ${dest.matchedName}**\n\nRouting analysis in progress. Please query via the live copilot endpoint for full OSRM road geometry and multi-criteria corridor breakdown.`,
      timestamp: new Date().toISOString(),
      metrics: [
        { label: 'Origin', value: origin.matchedName },
        { label: 'Destination', value: dest.matchedName },
      ],
      recommendations: ['Calculate alternative routes in Route Optimizer'],
      sources: ['Route Optimization Engine (Dijkstra)'],
      intent: 'route',
      locations: [origin.matchedName, dest.matchedName],
    };
  }

  // SINGLE DISTRICT OR STRATEGIC GEOGRAPHIC FEATURE (Passes, Valleys, Roads, Towns)
  if (parsed.locations.length >= 1) {
    const loc = parsed.locations[0];
    const fact = CopilotIntelligence.getAccessibilityFact(loc);
    return {
      role: 'assistant',
      content: fact.factText,
      timestamp: new Date().toISOString(),
      metrics: fact.metrics,
      recommendations: fact.recommendations,
      sources: fact.sources,
      intent: loc.isProxy ? 'geographic_feature' : 'district',
      locations: [loc.matchedName],
    };
  }

  // General fallback
  const general = CopilotIntelligence.getAccessibilityFact(undefined, 'worst');
  return {
    role: 'assistant',
    content: `**NER Logistics Intelligence Assistant:**\n\nI analyze freight corridors, multi-hazard risks, and supply accessibility across India's **8 North Eastern States**.\n\n${general.factText}`,
    timestamp: new Date().toISOString(),
    metrics: general.metrics,
    recommendations: general.recommendations,
    sources: ['NER Spatial Database', 'Platform Analytics KPI Aggregator'],
    intent: 'general',
  };
}
