/**
 * NER Logistics Intelligence — Unified Copilot Intelligence Engine
 * 
 * Bridges all existing platform datasets and calculation engines:
 * - 40+ Districts & 8 States (ner-data.ts)
 * - Accessibility Engine (accessibility/engine.ts)
 * - Demand Forecasting Engine (demand/engine.ts)
 * - Multi-Hazard Risk Scoring Engine (risk/engine.ts)
 * - Infrastructure Gap Analysis Engine (infrastructure/engine.ts)
 * - Dijkstra & OSRM Routing Engine (routing/engine.ts & routing-service.ts)
 * - Logistics Hubs, Airports & Rail Terminals (ner-data.ts)
 * 
 * Strict architectural rule:
 * REAL DATA > REAL CALCULATIONS > DYNAMIC LOCATION SUPPORT > LLM EXPLANATION
 */

import { District, State, LogisticsHub, Airport, RailwayStation, RiskEvent, InfrastructureGap, OptimizedRoute, CopilotMessage } from '@/types';
import {
  districts,
  states,
  logisticsHubs,
  airports,
  railwayStations,
  riskEvents,
  roads,
  graphNodes,
  graphEdges,
} from '@/data/ner-data';
import { computeAccessibility, computeAllAccessibility, AccessibilityBreakdown } from '@/modules/accessibility/engine';
import { forecastDemand, getTopDemandDistricts, forecastAllDistricts } from '@/modules/demand/engine';
import { assessDistrictRisk, assessAllRisks, getActiveAlerts, RiskAssessment } from '@/modules/risk/engine';
import { analyzeInfrastructureGaps, getTopGaps, getGapsByState } from '@/modules/infrastructure/engine';
import { optimizeRoutes } from '@/modules/routing/engine';
import { RoutingService, GroundedRouteData, ParsedQuery } from '@/lib/routing-service';

export interface LocationResolutionResult {
  found: boolean;
  type: 'district' | 'state' | 'city' | 'hub' | 'custom_coords' | 'unknown';
  district?: District;
  state?: State;
  cityNode?: typeof graphNodes[0];
  hub?: LogisticsHub;
  lat?: number;
  lng?: number;
  matchedName: string;
  normalizedQuery: string;
}

export interface ExtractedCargo {
  weightTons?: number;
  weightKg?: number;
  commodity?: string;
  isPerishable?: boolean;
  isEmergency?: boolean;
}

export interface CopilotParsedIntent {
  rawQuery: string;
  intents: ('route' | 'accessibility' | 'demand' | 'risk' | 'infrastructure' | 'hub' | 'comparison' | 'state' | 'general')[];
  primaryIntent: 'route' | 'accessibility' | 'demand' | 'risk' | 'infrastructure' | 'hub' | 'comparison' | 'state' | 'general';
  locations: LocationResolutionResult[];
  unknownLocationStrings: string[];
  cargo?: ExtractedCargo;
  priority: 'fastest' | 'cheapest' | 'safest' | 'balanced';
  sortOrder?: 'worst' | 'best' | 'highest' | 'lowest';
}

export interface StructuredFactsResult {
  intent: string;
  locationsFound: string[];
  sources: string[];
  factsText: string;
  metrics: { label: string; value: string }[];
  recommendations: string[];
  rawRoute?: GroundedRouteData | null;
  dijkstraRoute?: OptimizedRoute | null;
}

export class CopilotIntelligence {
  // Common alias mapping for spelling variations, districts, and capitals
  private static readonly ALIAS_MAP: Record<string, string> = {
    // Assam
    'guwahati': 'kamrup-metro',
    'gauhati': 'kamrup-metro',
    'dispur': 'kamrup-metro',
    'kamrup': 'kamrup-metro',
    'kamrup metropolitan': 'kamrup-metro',
    'kamrup metro': 'kamrup-metro',
    'cachar': 'silchar',
    'silchar': 'silchar',
    'tezpur': 'sonitpur',
    'sonitpur': 'sonitpur',
    'dibrugarh': 'dibrugarh',
    'tinsukia': 'tinsukia',
    'jorhat': 'jorhat',
    'nagaon': 'nagaon',
    'nowgong': 'nagaon',
    'barpeta': 'barpeta',
    'lumding': 'nagaon',

    // Arunachal Pradesh
    'itanagar': 'itanagar',
    'papum pare': 'itanagar',
    'naharlagun': 'itanagar',
    'tawang': 'tawang',
    'bomdila': 'west-kameng',
    'west kameng': 'west-kameng',
    'east siang': 'east-siang',
    'pasighat': 'east-siang',
    'changlang': 'changlang',
    'ziro': 'lower-subansiri',
    'lower subansiri': 'lower-subansiri',
    'anini': 'dibang-valley',
    'dibang valley': 'dibang-valley',
    'dibang': 'dibang-valley',
    'roing': 'lower-dibang',
    'lower dibang': 'lower-dibang',
    'lower dibang valley': 'lower-dibang',
    'tezu': 'lohit',
    'lohit': 'lohit',

    // Manipur
    'imphal': 'imphal-west',
    'imphal west': 'imphal-west',
    'imphal east': 'imphal-east',
    'churachandpur': 'churachandpur',
    'ccpur': 'churachandpur',
    'ukhrul': 'ukhrul',
    'moreh': 'imphal-west',

    // Meghalaya
    'shillong': 'east-khasi',
    'east khasi': 'east-khasi',
    'east khasi hills': 'east-khasi',
    'cherrapunji': 'east-khasi',
    'sohra': 'east-khasi',
    'tura': 'west-garo',
    'west garo': 'west-garo',
    'west garo hills': 'west-garo',
    'ri-bhoi': 'ri-bhoi',
    'ribhoi': 'ri-bhoi',
    'nongpoh': 'ri-bhoi',
    'south garo': 'south-garo',
    'baghmara': 'south-garo',
    'dawki': 'east-khasi',
    'mawlynnong': 'east-khasi',

    // Mizoram
    'aizawl': 'aizawl-dist',
    'aizawl district': 'aizawl-dist',
    'lunglei': 'lunglei',
    'champhai': 'champhai',
    'lengpui': 'aizawl-dist',

    // Nagaland
    'kohima': 'kohima',
    'dimapur': 'dimapur',
    'mon': 'mon',
    'tuensang': 'tuensang',
    'mokokchung': 'kohima',

    // Sikkim
    'gangtok': 'east-sikkim',
    'east sikkim': 'east-sikkim',
    'north sikkim': 'north-sikkim',
    'mangan': 'north-sikkim',
    'south sikkim': 'south-sikkim',
    'namchi': 'south-sikkim',
    'west sikkim': 'west-sikkim',
    'gyalshing': 'west-sikkim',
    'pelling': 'west-sikkim',
    'siliguri': 'siliguri-hub',

    // Tripura
    'agartala': 'west-tripura',
    'west tripura': 'west-tripura',
    'dhalai': 'dhalai',
    'ambassa': 'dhalai',
    'north tripura': 'north-tripura',
    'dharmanagar': 'north-tripura',
    'south tripura': 'south-tripura',
    'belonia': 'south-tripura',
    'sabroom': 'south-tripura',
  };

  /**
   * Resolve any place name into an existing platform district, state, city, or hub.
   * Recognizes spelling variations, prefixes/suffixes ("district", "city"), and state names.
   */
  public static resolveLocation(rawInput: string): LocationResolutionResult {
    const query = (rawInput || '').trim().toLowerCase();
    if (!query) {
      return { found: false, type: 'unknown', matchedName: rawInput, normalizedQuery: query };
    }

    // 1. Clean query of noise words
    const clean = query
      .replace(/\b(district|dist|city|town|junction|hub|depot|terminal|railway station|airport|state)\b/g, '')
      .replace(/[,\-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. Check State names directly
    const matchedState = states.find(s =>
      s.id === clean ||
      s.name.toLowerCase() === clean ||
      s.name.toLowerCase().includes(clean) ||
      clean.includes(s.name.toLowerCase())
    );
    if (matchedState && (clean === matchedState.name.toLowerCase() || clean === matchedState.id || ['nagaland', 'arunachal', 'assam', 'meghalaya', 'mizoram', 'manipur', 'tripura', 'sikkim'].includes(clean))) {
      return {
        found: true,
        type: 'state',
        state: matchedState,
        matchedName: matchedState.name,
        normalizedQuery: clean,
        lat: matchedState.lat,
        lng: matchedState.lng,
      };
    }

    // 3. Check Alias Map
    const aliasTarget = this.ALIAS_MAP[clean] || this.ALIAS_MAP[query];
    if (aliasTarget) {
      const d = districts.find(item => item.id === aliasTarget);
      if (d) {
        const s = states.find(item => item.id === d.stateId);
        return {
          found: true,
          type: 'district',
          district: d,
          state: s,
          lat: d.lat,
          lng: d.lng,
          matchedName: d.name,
          normalizedQuery: clean,
        };
      }
      const h = logisticsHubs.find(item => item.id === aliasTarget);
      if (h) {
        return {
          found: true,
          type: 'hub',
          hub: h,
          lat: h.lat,
          lng: h.lng,
          matchedName: h.name,
          normalizedQuery: clean,
        };
      }
    }

    // 4. Check Districts exact or substring
    const matchedDistrict = districts.find(d => {
      const dName = d.name.toLowerCase();
      const dId = d.id.toLowerCase();
      return (
        dName === clean ||
        dId === clean ||
        dName.startsWith(clean) ||
        clean.startsWith(dName) ||
        (clean.length >= 4 && dName.includes(clean))
      );
    });
    if (matchedDistrict) {
      const s = states.find(item => item.id === matchedDistrict.stateId);
      return {
        found: true,
        type: 'district',
        district: matchedDistrict,
        state: s,
        lat: matchedDistrict.lat,
        lng: matchedDistrict.lng,
        matchedName: matchedDistrict.name,
        normalizedQuery: clean,
      };
    }

    // 5. Check Graph Nodes (e.g. Tezpur, Bomdila, Pelling, Anini, etc.)
    const matchedNode = graphNodes.find(n => {
      const nName = n.name.toLowerCase();
      const nId = n.id.toLowerCase();
      return nName === clean || nId === clean || nName.includes(clean) || clean.includes(nName);
    });
    if (matchedNode) {
      const s = states.find(item => item.id === matchedNode.stateId);
      return {
        found: true,
        type: 'city',
        cityNode: matchedNode,
        state: s,
        lat: matchedNode.lat,
        lng: matchedNode.lng,
        matchedName: matchedNode.name,
        normalizedQuery: clean,
      };
    }

    // 6. Check Logistics Hubs
    const matchedHub = logisticsHubs.find(h => {
      const hName = h.name.toLowerCase();
      const hCity = h.city.toLowerCase();
      return hName.includes(clean) || hCity === clean || clean.includes(hCity);
    });
    if (matchedHub) {
      return {
        found: true,
        type: 'hub',
        hub: matchedHub,
        lat: matchedHub.lat,
        lng: matchedHub.lng,
        matchedName: matchedHub.name,
        normalizedQuery: clean,
      };
    }

    return {
      found: false,
      type: 'unknown',
      matchedName: rawInput,
      normalizedQuery: clean,
    };
  }

  /**
   * Comprehensive intent & entity parser
   */
  public static parseQuery(
    rawQuery: string,
    userLocation?: { lat: number; lng: number }
  ): CopilotParsedIntent {
    const lower = rawQuery.toLowerCase();
    const intents: CopilotParsedIntent['intents'] = [];

    // --- 1. Extract Cargo & Weight details ---
    const cargo: ExtractedCargo = {};
    const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tonnes|tonne|tons|ton|t\b|metric tons|kg\b|kilos)/i);
    if (weightMatch) {
      const val = parseFloat(weightMatch[1]);
      if (lower.includes('kg')) {
        cargo.weightKg = val;
        cargo.weightTons = val / 1000;
      } else {
        cargo.weightTons = val;
        cargo.weightKg = val * 1000;
      }
    }

    if (lower.includes('medicine') || lower.includes('pharma') || lower.includes('vaccine') || lower.includes('medical')) {
      cargo.commodity = 'Pharmaceuticals / Cold-Chain Medicines';
      cargo.isPerishable = true;
    } else if (lower.includes('tea')) {
      cargo.commodity = 'Assam Orthodox & CTC Tea';
    } else if (lower.includes('grain') || lower.includes('pds') || lower.includes('food') || lower.includes('rice') || lower.includes('wheat')) {
      cargo.commodity = 'PDS Essential Food Grains';
    } else if (lower.includes('cement') || lower.includes('steel') || lower.includes('construction') || lower.includes('iron')) {
      cargo.commodity = 'Heavy Construction Materials';
    } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel')) {
      cargo.commodity = 'Petroleum, Oil & Lubricants (POL)';
    }

    if (lower.includes('emergency') || lower.includes('relief') || lower.includes('urgent') || lower.includes('critical cargo')) {
      cargo.isEmergency = true;
    }

    // --- 2. Determine Priority ---
    let priority: 'fastest' | 'cheapest' | 'safest' | 'balanced' = 'balanced';
    if (lower.includes('safest') || lower.includes('lowest risk') || lower.includes('safe route') || lower.includes('secure')) {
      priority = 'safest';
    } else if (lower.includes('fastest') || lower.includes('quickest') || lower.includes('fast route') || lower.includes('shortest time')) {
      priority = 'fastest';
    } else if (lower.includes('cheapest') || lower.includes('economical') || lower.includes('lowest cost')) {
      priority = 'cheapest';
    }

    // --- 3. Extract Locations ---
    const locations: LocationResolutionResult[] = [];
    const unknownStrings: string[] = [];

    // Check for explicit "from X to Y" or "between X and Y"
    const fromToPattern = /(?:route|path|travel|transport|distance)?\s*(?:from|between)?\s*([a-zA-Z\s.-]+?)\s*(?:to|and|-->|->)\s*([a-zA-Z\s.-]+?)(?:\s+for|\s+with|\s+considering|\s*\?|$)/i;
    const match = rawQuery.match(fromToPattern);

    if (match && match[1] && match[2]) {
      const origStr = match[1].replace(/\b(what is the|find the|best|safest|fastest|route|from|between)\b/gi, '').trim();
      const destStr = match[2].replace(/\b(route|road|highway|safely|considering|risks|hazards)\b/gi, '').trim();

      if (origStr.length > 2) {
        if (/my (?:current )?location|here|current gps/i.test(origStr) && userLocation) {
          locations.push({
            found: true,
            type: 'custom_coords',
            lat: userLocation.lat,
            lng: userLocation.lng,
            matchedName: `Current Location (${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E)`,
            normalizedQuery: 'my location',
          });
        } else {
          const res = this.resolveLocation(origStr);
          if (res.found) locations.push(res);
          else unknownStrings.push(origStr);
        }
      }

      if (destStr.length > 2) {
        const res = this.resolveLocation(destStr);
        if (res.found) locations.push(res);
        else unknownStrings.push(destStr);
      }
    }

    // If no route endpoints detected via regex, scan all states and districts
    if (locations.length === 0) {
      // Check states
      for (const s of states) {
        const nameLower = s.name.toLowerCase();
        if (lower.includes(nameLower) || (nameLower === 'arunachal pradesh' && lower.includes('arunachal'))) {
          locations.push({
            found: true,
            type: 'state',
            state: s,
            matchedName: s.name,
            normalizedQuery: s.name.toLowerCase(),
            lat: s.lat,
            lng: s.lng,
          });
        }
      }

      // Check districts & aliases
      const candidateTokens = Object.keys(this.ALIAS_MAP).sort((a, b) => b.length - a.length);
      for (const token of candidateTokens) {
        // Regex word boundary match
        const regex = new RegExp(`\\b${token}\\b`, 'i');
        if (regex.test(rawQuery)) {
          const resolved = this.resolveLocation(token);
          if (resolved.found && !locations.some(l => l.matchedName.toLowerCase() === resolved.matchedName.toLowerCase())) {
            locations.push(resolved);
          }
        }
      }
    }

    // Handle "my location" standalone
    if ((lower.includes('my location') || lower.includes('where i am') || lower.includes('current location')) && userLocation) {
      if (!locations.some(l => l.type === 'custom_coords')) {
        locations.unshift({
          found: true,
          type: 'custom_coords',
          lat: userLocation.lat,
          lng: userLocation.lng,
          matchedName: `Current Location (${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E)`,
          normalizedQuery: 'my location',
        });
      }
    }

    // --- 4. Intent Detection ---
    let sortOrder: 'worst' | 'best' | 'highest' | 'lowest' | undefined;
    if (lower.includes('worst') || lower.includes('lowest') || lower.includes('least') || lower.includes('poor')) {
      sortOrder = 'worst';
    } else if (lower.includes('best') || lower.includes('highest') || lower.includes('top') || lower.includes('most')) {
      sortOrder = 'best';
    }

    // Check ROUTE intent
    if (
      locations.length >= 2 ||
      ['route', 'path', 'how to reach', 'directions', 'transport', 'deliver', 'how should i transport', 'distance from', 'to reach'].some(k => lower.includes(k)) ||
      /\b(?:from|between)\s+[a-z\s]+\s+(?:to|and)\b/i.test(lower)
    ) {
      intents.push('route');
    }

    // Check ACCESSIBILITY intent
    if (['accessibility', 'accessible', 'connectivity', 'access score', 'how accessible'].some(k => lower.includes(k))) {
      intents.push('accessibility');
    }

    // Check DEMAND intent
    if (['demand', 'forecast', 'predicted demand', 'consumption', 'goods required', 'volume'].some(k => lower.includes(k))) {
      intents.push('demand');
    }

    // Check RISK intent
    if (['risk', 'hazard', 'safest', 'vulnerability', 'flood', 'landslide', 'earthquake', 'disaster', 'danger', 'alert'].some(k => lower.includes(k))) {
      intents.push('risk');
    }

    // Check INFRASTRUCTURE intent
    if (['infrastructure', 'gap', 'invest', 'investment', 'upgrade', 'road quality', 'where should a', 'need road'].some(k => lower.includes(k))) {
      intents.push('infrastructure');
    }

    // Check HUB intent
    if (['hub', 'warehouse', 'depot', 'storage', 'distribution center', 'fulfillment', 'nearest hub', 'closest hub'].some(k => lower.includes(k))) {
      intents.push('hub');
    }

    // Check COMPARISON intent
    if (
      (locations.length >= 2 && !intents.includes('route')) ||
      ['compare', 'versus', ' vs ', 'difference between', 'which is better', 'which one is'].some(k => lower.includes(k))
    ) {
      intents.push('comparison');
    }

    // Check STATE intent
    if (locations.some(l => l.type === 'state') && !intents.includes('route') && !intents.includes('comparison')) {
      intents.push('state');
    }

    // Fallback intent if none matched
    if (intents.length === 0) {
      intents.push('general');
    }

    // Primary intent priority hierarchy
    let primaryIntent: CopilotParsedIntent['primaryIntent'] = 'general';
    if (intents.includes('route')) primaryIntent = 'route';
    else if (intents.includes('comparison')) primaryIntent = 'comparison';
    else if (intents.includes('accessibility')) primaryIntent = 'accessibility';
    else if (intents.includes('demand')) primaryIntent = 'demand';
    else if (intents.includes('infrastructure')) primaryIntent = 'infrastructure';
    else if (intents.includes('risk')) primaryIntent = 'risk';
    else if (intents.includes('hub')) primaryIntent = 'hub';
    else if (intents.includes('state')) primaryIntent = 'state';

    return {
      rawQuery,
      intents,
      primaryIntent,
      locations,
      unknownLocationStrings: unknownStrings,
      cargo,
      priority,
      sortOrder,
    };
  }

  // ============================================================
  // INTERNAL TOOL IMPLEMENTATIONS (Calling existing engines)
  // ============================================================

  /**
   * TOOL: Accessibility Intelligence
   */
  public static getAccessibilityFact(district?: District, sort?: 'worst' | 'best'): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const all = computeAllAccessibility(districts);

    if (!district) {
      // Ranking query: worst or best
      const isWorst = sort === 'worst' || !sort;
      const sorted = isWorst ? all.slice().reverse() : all;
      const top5 = sorted.slice(0, 5);

      const listStr = top5.map((d, i) =>
        `${i + 1}. **${d.districtName}** (${states.find(s => s.id === d.stateId)?.name || 'NER'}): **${d.overallScore}/100** (${d.level}) — Road Connectivity: ${d.factors.roadConnectivity.score}/100, Hub Distance: ${districts.find(item => item.id === d.districtId)?.nearestHubDistance || 0} km`
      ).join('\n');

      return {
        factText: `**Logistics Accessibility Analysis (${isWorst ? 'Lowest / Most Critical' : 'Highest / Best Accessible'}):**\n\n${listStr}\n\n• **Core Constraining Factors:** Mountain elevation, high distance to multi-modal railheads, and extreme seasonal rainfall penalisations.`,
        metrics: top5.slice(0, 4).map(d => ({ label: d.districtName, value: `${d.overallScore}/100` })),
        recommendations: top5[0]?.recommendations || [
          'Establish regional staging hubs in remote mountain corridors',
          'Deploy cold-chain storage for critical medical supplies',
        ],
        sources: ['Accessibility Intelligence Engine', 'NER District Spatial Dataset'],
      };
    }

    // Specific district fact
    const breakdown = computeAccessibility(district);
    const s = states.find(item => item.id === district.stateId);

    const factText = `**Accessibility Profile for ${district.name} (${s?.name || 'NER'}):**\n` +
      `• **Overall Accessibility Score:** **${breakdown.overallScore}/100** (${breakdown.level})\n` +
      `• **Road Connectivity:** ${district.roadConnectivity}/100\n` +
      `• **Rail Access Score:** ${district.railConnectivity}/100\n` +
      `• **Airport Accessibility:** ${district.airportAccess}/100\n` +
      `• **Average Freight Delivery Time:** ${district.avgDeliveryTime} hours (Travel Time: ~${district.avgTravelTime}h)\n` +
      `• **Nearest Logistics Hub Distance:** ${district.nearestHubDistance} km\n` +
      `• **Infrastructure Quality Index:** ${district.infrastructureQuality}/100\n` +
      `• **Terrain:** ${district.terrain.toUpperCase()} (Elevation: ${district.elevation}m)`;

    return {
      factText,
      metrics: [
        { label: 'Accessibility', value: `${breakdown.overallScore}/100` },
        { label: 'Road Score', value: `${district.roadConnectivity}/100` },
        { label: 'Nearest Hub', value: `${district.nearestHubDistance} km` },
        { label: 'Delivery Time', value: `${district.avgDeliveryTime}h` },
      ],
      recommendations: breakdown.recommendations,
      sources: ['Accessibility Intelligence Engine', 'NER Spatial Data'],
    };
  }

  /**
   * TOOL: Demand Forecasting Intelligence
   */
  public static getDemandFact(district?: District, sort?: 'highest' | 'lowest'): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    if (!district) {
      const top5 = getTopDemandDistricts(5);
      const listStr = top5.map((f, i) =>
        `${i + 1}. **${f.districtName}**: Current **${f.currentDemand} t/day**, 7-Day Forecast: **${f.forecast7Day} t/day** (${f.trend.toUpperCase()} by ${f.trendPercentage > 0 ? '+' : ''}${f.trendPercentage}%) | Confidence: ${f.confidence}%`
      ).join('\n');

      return {
        factText: `**NER Regional Freight Demand Forecast (Top Centers):**\n\n${listStr}\n\n• **Seasonal Trend Model:** 180-day regression with monsoon surge adjustments for essential commodities.`,
        metrics: top5.slice(0, 4).map(f => ({ label: f.districtName, value: `${f.currentDemand} t/d` })),
        recommendations: [
          'Pre-position 30-day buffer stocks at Guwahati and Silchar regional hubs',
          'Increase fleet allocation along rising demand corridors',
        ],
        sources: ['Demand Forecasting Engine (Time-Series & Regression)', 'NER Production & Inflow Data'],
      };
    }

    const forecast = forecastDemand(district.id);
    const factText = `**Demand Forecast Analysis for ${district.name}:**\n` +
      `• **Current Freight Inflow Demand:** **${forecast.currentDemand} tons/day**\n` +
      `• **7-Day Projected Demand:** **${forecast.forecast7Day} tons/day**\n` +
      `• **30-Day Projected Demand:** **${forecast.forecast30Day} tons/day**\n` +
      `• **Demand Trend:** **${forecast.trend.toUpperCase()}** (${forecast.trendPercentage > 0 ? '+' : ''}${forecast.trendPercentage}%)\n` +
      `• **Model Confidence:** ${forecast.confidence}%\n` +
      `• **Seasonal Pattern:** ${forecast.seasonalPattern}`;

    return {
      factText,
      metrics: [
        { label: 'Current Demand', value: `${forecast.currentDemand} t/d` },
        { label: '7-Day Forecast', value: `${forecast.forecast7Day} t/d` },
        { label: 'Trend', value: `${forecast.trend} (${forecast.trendPercentage}%)` },
        { label: 'Confidence', value: `${forecast.confidence}%` },
      ],
      recommendations: [
        `Ensure staging warehouse capacity at ${district.name} can accommodate ${forecast.forecast7Day} t/day`,
        'Coordinate with FCI and essential goods distributors ahead of seasonal shifts',
      ],
      sources: ['Demand Forecasting Engine (180-Day Seasonal Regression)', 'Historical Inflow Telemetry'],
    };
  }

  /**
   * TOOL: Multi-Hazard Risk Intelligence
   */
  public static getRiskFact(district?: District): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    if (!district) {
      const allRisks = assessAllRisks();
      const highRisks = allRisks.filter(r => r.level === 'CRITICAL' || r.level === 'HIGH').slice(0, 5);
      const alerts = getActiveAlerts().slice(0, 3);

      const listStr = highRisks.map((r, i) =>
        `${i + 1}. **${r.districtName}**: Composite Risk **${r.overallRisk}/100** [${r.level}] — Landslide: ${r.factors.landslideRisk}/100, Flood: ${r.factors.floodRisk}/100, Weather: ${r.factors.weatherRisk}/100`
      ).join('\n');

      const alertsStr = alerts.length > 0
        ? `\n\n**Active Environmental Alerts:**\n` + alerts.map(a => `• ⚠️ **${a.location}** (${a.severity.toUpperCase()}): ${a.description}`).join('\n')
        : '';

      return {
        factText: `**NER Multi-Hazard Risk Overview:**\n\n${listStr}${alertsStr}`,
        metrics: highRisks.slice(0, 4).map(r => ({ label: r.districtName, value: `${r.overallRisk}/100 (${r.level})` })),
        recommendations: [
          'Mandate daytime mountain transit across high landslide corridors',
          'Deploy IoT geotechnical slope monitors along NH-10 and NH-13',
        ],
        sources: ['Multi-Hazard Risk Scoring Engine', 'Active Regional Alert Registry'],
      };
    }

    const risk = assessDistrictRisk(district.id);
    const factText = `**Multi-Hazard Risk Assessment for ${district.name}:**\n` +
      `• **Composite Risk Score:** **${risk.overallRisk}/100** (Severity: **${risk.level}**)\n` +
      `• **Landslide Risk Factor:** ${risk.factors.landslideRisk}/100\n` +
      `• **Flood Inundation Risk:** ${risk.factors.floodRisk}/100\n` +
      `• **Earthquake Vulnerability:** ${risk.factors.earthquakeRisk}/100 (Seismic Zone V)\n` +
      `• **Infrastructure Fragility:** ${risk.factors.infrastructureRisk}/100\n` +
      `• **Connectivity Isolation Risk:** ${risk.factors.connectivityRisk}/100\n` +
      `• **Operational Recommendation:** ${risk.recommendation}`;

    return {
      factText,
      metrics: [
        { label: 'Overall Risk', value: `${risk.overallRisk}/100` },
        { label: 'Severity Level', value: risk.level },
        { label: 'Landslide Risk', value: `${risk.factors.landslideRisk}/100` },
        { label: 'Flood Risk', value: `${risk.factors.floodRisk}/100` },
      ],
      recommendations: [
        risk.recommendation,
        `Maintain 72-hour emergency stock buffer in ${district.name}`,
      ],
      sources: ['Multi-Hazard Risk Scoring Engine', 'District Topography & Rainfall Data'],
    };
  }

  /**
   * TOOL: Infrastructure Gap Intelligence
   */
  public static getInfrastructureFact(district?: District): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const gaps = analyzeInfrastructureGaps();

    if (!district) {
      const top5 = getTopGaps(5);
      const totalCost = top5.reduce((s, g) => s + g.estimatedCost, 0);

      const listStr = top5.map((g, i) =>
        `**#${i + 1}: ${g.districtName}** (${g.stateName})\n• Priority: **${g.priority.toUpperCase()}** | Gap Score: **${g.gapScore}/100**\n• Accessibility Deficit: ${g.accessibilityDeficit}/100 | Demand Pressure: ${g.demandPressure}/100\n• Recommended Intervention: ${g.recommendedIntervention}\n• Estimated Capex: **₹${g.estimatedCost} Crores**`
      ).join('\n\n');

      return {
        factText: `**Infrastructure Investment & Gap Priorities:**\n\n${listStr}\n\n**Total Capital Requirement (Top 5):** ₹${totalCost} Crores.`,
        metrics: [
          { label: '#1 Priority', value: `${top5[0]?.districtName || 'N/A'}` },
          { label: 'Gap Score', value: `${top5[0]?.gapScore || 0}/100` },
          { label: 'Priority Level', value: `${top5[0]?.priority.toUpperCase() || 'HIGH'}` },
          { label: 'Est. Cost', value: `₹${top5[0]?.estimatedCost || 0} Cr` },
        ],
        recommendations: top5.map(g => `${g.districtName}: ${g.recommendedIntervention}`),
        sources: ['Infrastructure Gap Analysis Engine', 'Multi-Criteria Capex Model'],
      };
    }

    const g = gaps.find(item => item.districtId === district.id);
    if (!g) {
      return {
        factText: `Infrastructure gap data currently unavailable for ${district.name}.`,
        metrics: [],
        recommendations: [],
        sources: ['Infrastructure Gap Analysis Engine'],
      };
    }

    const factText = `**Infrastructure Gap Assessment for ${district.name} (${g.stateName}):**\n` +
      `• **Composite Infrastructure Gap Score:** **${g.gapScore}/100** (Priority: **${g.priority.toUpperCase()}**)\n` +
      `• **Accessibility Deficit:** ${g.accessibilityDeficit}/100\n` +
      `• **Demand Pressure:** ${g.demandPressure}/100\n` +
      `• **Population Importance Factor:** ${g.populationImportance}/100\n` +
      `• **Nearest Hub Distance:** ${g.nearestHubDistance} km\n` +
      `• **Recommended Infrastructure Intervention:** ${g.recommendedIntervention}\n` +
      `• **Estimated Project Cost:** **₹${g.estimatedCost} Crores**`;

    return {
      factText,
      metrics: [
        { label: 'Gap Score', value: `${g.gapScore}/100` },
        { label: 'Priority', value: g.priority.toUpperCase() },
        { label: 'Intervention Cost', value: `₹${g.estimatedCost} Cr` },
        { label: 'Deficit', value: `${g.accessibilityDeficit}%` },
      ],
      recommendations: [
        g.recommendedIntervention,
        `Include ${district.name} in the PM GatiShakti North-East Logistics Master Plan`,
      ],
      sources: ['Infrastructure Gap Analysis Engine', 'Regional Logistics Capex Estimates'],
    };
  }

  /**
   * TOOL: Logistics Hub Intelligence (Programmatic Haversine Distance)
   */
  public static getHubFact(lat: number, lng: number, locName: string): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    // Calculate exact geometric distance to each hub
    const sorted = logisticsHubs.map(h => {
      const dLat = ((h.lat - lat) * Math.PI) / 180;
      const dLng = ((h.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((h.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      return { ...h, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    const nearest = sorted[0];
    const top3 = sorted.slice(0, 3);

    const listStr = top3.map((h, i) =>
      `${i + 1}. **${h.name}** (${h.city}): **${h.distanceKm} km** away | Capacity: ${h.capacity.toLocaleString()} tons | Utilization: ${h.currentUtilization}% (${(h.storageAvailable / 1000).toFixed(1)}k t free)`
    ).join('\n');

    const factText = `**Logistics Hub Intelligence for ${locName}:**\n\n` +
      `The **closest logistics hub** is **${nearest.name}** in **${nearest.city}**, located approximately **${nearest.distanceKm} km** straight-line distance away.\n\n` +
      `**Top 3 Accessible Logistics Hubs:**\n${listStr}\n\n` +
      `• **Multi-Modal Connectivity:** ${nearest.hasRailAccess ? 'Direct Railhead Access Available' : 'Road Transport Only'}; ${nearest.hasAirAccess ? 'Dedicated Air Cargo Access' : 'No Direct Airport'}.`;

    return {
      factText,
      metrics: [
        { label: 'Closest Hub', value: nearest.city },
        { label: 'Distance', value: `${nearest.distanceKm} km` },
        { label: 'Utilization', value: `${nearest.currentUtilization}%` },
        { label: 'Available Space', value: `${(nearest.storageAvailable / 1000).toFixed(1)}k tons` },
      ],
      recommendations: [
        `Route freight destined for ${locName} through the ${nearest.name}`,
        nearest.distanceKm > 200
          ? `High hub distance (${nearest.distanceKm} km) indicates an urgent need for an intermediate satellite depot closer to ${locName}.`
          : `Current hub distance of ${nearest.distanceKm} km enables reasonable turnaround within local staging limits.`,
      ],
      sources: ['Logistics Hub Geospatial Dataset', 'Programmatic Haversine Distance Engine'],
    };
  }

  /**
   * TOOL: Location Comparison (Side-by-side programmatic comparison)
   */
  public static compareLocationsFact(loc1: LocationResolutionResult, loc2: LocationResolutionResult): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const d1 = loc1.district || districts.find(d => d.name.toLowerCase().includes(loc1.matchedName.toLowerCase())) || districts[0];
    const d2 = loc2.district || districts.find(d => d.name.toLowerCase().includes(loc2.matchedName.toLowerCase())) || districts[1];

    const acc1 = computeAccessibility(d1);
    const acc2 = computeAccessibility(d2);
    const risk1 = assessDistrictRisk(d1.id);
    const risk2 = assessDistrictRisk(d2.id);
    const dem1 = forecastDemand(d1.id);
    const dem2 = forecastDemand(d2.id);

    const factText = `### Comparative Logistics Dossier: ${d1.name} vs ${d2.name}\n\n` +
      `| Indicator | **${d1.name}** | **${d2.name}** | Advantage |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Accessibility Score** | **${acc1.overallScore}/100** (${acc1.level}) | **${acc2.overallScore}/100** (${acc2.level}) | ${acc1.overallScore >= acc2.overallScore ? d1.name : d2.name} |\n` +
      `| **Multi-Hazard Risk** | **${risk1.overallRisk}/100** (${risk1.level}) | **${risk2.overallRisk}/100** (${risk2.level}) | ${risk1.overallRisk <= risk2.overallRisk ? d1.name + ' (Lower Risk)' : d2.name + ' (Lower Risk)'} |\n` +
      `| **Road Connectivity** | ${d1.roadConnectivity}/100 | ${d2.roadConnectivity}/100 | ${d1.roadConnectivity >= d2.roadConnectivity ? d1.name : d2.name} |\n` +
      `| **Daily Freight Demand** | ${dem1.currentDemand} t/day (${dem1.trend}) | ${dem2.currentDemand} t/day (${dem2.trend}) | ${dem1.currentDemand >= dem2.currentDemand ? d1.name : d2.name} |\n` +
      `| **Nearest Hub Distance** | ${d1.nearestHubDistance} km | ${d2.nearestHubDistance} km | ${d1.nearestHubDistance <= d2.nearestHubDistance ? d1.name : d2.name} |\n` +
      `| **Average Delivery Time** | ${d1.avgDeliveryTime} hours | ${d2.avgDeliveryTime} hours | ${d1.avgDeliveryTime <= d2.avgDeliveryTime ? d1.name : d2.name} |\n` +
      `| **Terrain & Elevation** | ${d1.terrain} (${d1.elevation}m) | ${d2.terrain} (${d2.elevation}m) | — |\n\n` +
      `**Operational Assessment:**\n` +
      (acc1.overallScore >= acc2.overallScore
        ? `**${d1.name}** is currently the stronger and more accessible logistics location due to superior arterial road connectivity and lower transit penalties.`
        : `**${d2.name}** offers superior logistics accessibility and more reliable transport throughput compared to ${d1.name}.`);

    return {
      factText,
      metrics: [
        { label: `${d1.name} Acc`, value: `${acc1.overallScore}/100` },
        { label: `${d2.name} Acc`, value: `${acc2.overallScore}/100` },
        { label: `${d1.name} Risk`, value: `${risk1.overallRisk}/100` },
        { label: `${d2.name} Risk`, value: `${risk2.overallRisk}/100` },
      ],
      recommendations: [
        `Prioritize high-volume hub staging in ${acc1.overallScore >= acc2.overallScore ? d1.name : d2.name}`,
        `Deploy specialized hill-climb vehicles when servicing the ${d1.elevation >= d2.elevation ? d1.name : d2.name} sector`,
      ],
      sources: ['Accessibility Intelligence Engine', 'Multi-Hazard Risk Scoring Engine', 'Demand Forecasting Engine'],
    };
  }

  /**
   * TOOL: State Logistics Intelligence
   */
  public static getStateFact(state: State): {
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
  } {
    const stateDistricts = districts.filter(d => d.stateId === state.id);
    const avgAcc = Math.round(stateDistricts.reduce((s, d) => s + d.accessibilityScore, 0) / (stateDistricts.length || 1));
    const avgRisk = Math.round(stateDistricts.reduce((s, d) => s + d.riskScore, 0) / (stateDistricts.length || 1));
    const totalPop = stateDistricts.reduce((s, d) => s + d.population, 0);
    const stateHubs = logisticsHubs.filter(h => h.stateId === state.id);
    const stateAirports = airports.filter(a => a.stateId === state.id);
    const stateRailways = railwayStations.filter(r => r.stateId === state.id);

    const factText = `**State Logistics Dossier: ${state.name}**\n\n` +
      `• **Average State Accessibility:** **${avgAcc}/100**\n` +
      `• **Average Multi-Hazard Risk:** **${avgRisk}/100**\n` +
      `• **Indexed Districts:** ${stateDistricts.length} (${stateDistricts.map(d => d.name).join(', ')})\n` +
      `• **Total Population:** ${totalPop.toLocaleString()}\n` +
      `• **Logistics Hubs:** ${stateHubs.length > 0 ? stateHubs.map(h => `${h.name} (${h.capacity.toLocaleString()}t capacity)`).join(', ') : 'No Tier-1 Multi-Modal Hub directly within state borders (serviced via neighboring regional hubs)'}\n` +
      `• **Air Cargo / Airports:** ${stateAirports.map(a => `${a.name} (${a.code})`).join(', ') || 'No major commercial airport'}\n` +
      `• **Railhead Freight Facilities:** ${stateRailways.map(r => r.name).join(', ') || 'Limited/No broad-gauge freight railhead currently operational in state'}\n\n` +
      `**Strategic Lifeline Corridors:**\n` +
      `Logistics in ${state.name} depends critically on high-altitude arterial highways connecting back through Assam and the Siliguri corridor. Pre-monsoon buffer storage of 45-60 days is recommended for high-altitude sectors.`;

    return {
      factText,
      metrics: [
        { label: 'Avg Accessibility', value: `${avgAcc}/100` },
        { label: 'Avg Risk', value: `${avgRisk}/100` },
        { label: 'Districts', value: `${stateDistricts.length}` },
        { label: 'Hubs', value: `${stateHubs.length}` },
      ],
      recommendations: [
        `Pre-position essential buffer stocks in ${state.capital || state.name} ahead of seasonal rains`,
        'Upgrade primary arterial highways to disaster-resilient double-lane standards',
      ],
      sources: ['State Geospatial Dataset', 'Regional Transport & Connectivity Matrix'],
    };
  }

  /**
   * TOOL: Dynamic Route Calculation (Dijkstra + OSRM)
   */
  public static async getRouteFact(
    originLoc: LocationResolutionResult,
    destLoc: LocationResolutionResult,
    priority: 'fastest' | 'cheapest' | 'safest' | 'balanced',
    cargo?: ExtractedCargo
  ): Promise<{
    factText: string;
    metrics: { label: string; value: string }[];
    recommendations: string[];
    sources: string[];
    groundedRoute?: GroundedRouteData | null;
  }> {
    // 1. Prepare graph node IDs for Dijkstra
    let startNodeId = originLoc.cityNode?.id || originLoc.district?.id || originLoc.hub?.id;
    let endNodeId = destLoc.cityNode?.id || destLoc.district?.id || destLoc.hub?.id;

    // Normalization helper to match graphNodes
    const mapToGraphId = (loc: LocationResolutionResult): string | undefined => {
      const q = loc.normalizedQuery;
      const found = graphNodes.find(n => n.id === q || n.name.toLowerCase() === q || q.includes(n.id) || n.id.includes(q));
      if (found) return found.id;
      if (loc.district) {
        const foundD = graphNodes.find(n => n.id === loc.district?.id || loc.district?.name.toLowerCase().includes(n.id));
        if (foundD) return foundD.id;
      }
      return undefined;
    };

    startNodeId = startNodeId || mapToGraphId(originLoc);
    endNodeId = endNodeId || mapToGraphId(destLoc);

    // 2. Try OSRM Road Routing + Local Graph Routing via RoutingService
    const origInput = originLoc.matchedName;
    const destInput = destLoc.matchedName;

    let grounded: GroundedRouteData | null = null;
    try {
      const origResolved = {
        id: startNodeId || originLoc.matchedName.toLowerCase().replace(/\s+/g, '-'),
        name: originLoc.matchedName,
        lat: originLoc.lat || 26.14,
        lng: originLoc.lng || 91.73,
        stateName: originLoc.state?.name || 'Assam',
      };
      const destResolved = {
        id: endNodeId || destLoc.matchedName.toLowerCase().replace(/\s+/g, '-'),
        name: destLoc.matchedName,
        lat: destLoc.lat || 27.47,
        lng: destLoc.lng || 94.91,
        stateName: destLoc.state?.name || 'Arunachal Pradesh',
      };

      grounded = await RoutingService.calculateRouteAsync(origResolved, destResolved, priority);
    } catch (err) {
      console.warn('Dynamic route calculation failed:', err);
    }

    // 3. Run Dijkstra with cargo weights if both are graph nodes
    let dijkstraResult = null;
    if (startNodeId && endNodeId && graphNodes.some(n => n.id === startNodeId) && graphNodes.some(n => n.id === endNodeId)) {
      try {
        const routes = optimizeRoutes({
          origin: startNodeId,
          destination: endNodeId,
          cargoWeight: cargo?.weightKg || 8000,
          cargoType: cargo?.commodity || 'General Freight',
          vehicleType: 'Heavy Truck (16t)',
          priority,
        });
        if (routes && routes.length > 0) {
          dijkstraResult = routes[0];
        }
      } catch (dErr) {
        console.warn('Dijkstra optimization failed:', dErr);
      }
    }

    const sources = ['Route Optimization Engine (Dijkstra)'];
    if (grounded?.provider === 'osrm') {
      sources.push('OpenStreetMap OSRM Live Road Network');
    }
    sources.push('Multi-Hazard Risk Registry', 'Logistics Hub Dataset');

    const distanceKm = grounded?.totalDistanceKm || dijkstraResult?.distance || 0;
    const timeHrs = grounded?.estimatedTimeHours || dijkstraResult?.estimatedTime || 0;
    const heavyHrs = grounded?.heavyTruckTimeHours || Math.round(timeHrs * 1.35 * 10) / 10;
    const highways = grounded?.highways.join(' → ') || dijkstraResult?.segments.map(s => s.roadName).filter(Boolean).join(' → ') || 'National Highway Network';
    const waypoints = grounded?.waypoints.join(' ➔ ') || dijkstraResult?.path.join(' ➔ ') || `${originLoc.matchedName} ➔ ${destLoc.matchedName}`;
    const riskScore = grounded?.riskScore || dijkstraResult?.riskScore || 50;

    let cargoNotice = '';
    if (cargo?.weightTons) {
      cargoNotice = `\n• **Cargo Specified:** ${cargo.weightTons} tons of ${cargo.commodity || 'freight'}.\n  *(The current route engine evaluates cost/risk weighting based on ${cargo.weightTons}t cargo rather than strict axle-load road bridge bans.)*`;
    }

    const factText = `**Route Intelligence: ${originLoc.matchedName} → ${destLoc.matchedName}**\n\n` +
      `• **Driving Distance:** **${distanceKm} km**\n` +
      `• **Estimated Travel Time:** **~${timeHrs} hours** (Standard/Light Commercial) / **~${heavyHrs} hours** (Heavy Truck >12t)\n` +
      `• **Optimization Criterion:** ${priority.toUpperCase()}\n` +
      `• **Highway Corridors:** ${highways}\n` +
      `• **Transshipment Corridor / Waypoints:** ${waypoints}\n` +
      `• **Route Hazard Risk Index:** **${riskScore}/100**\n` +
      `• **Terrain Profile:** ${grounded?.terrainSummary || 'Rugged Mountain & Plain Transshipment Corridors'}` +
      cargoNotice + `\n\n` +
      `**Active Route Advisories:**\n` +
      (grounded?.hazards?.length ? grounded.hazards.map(h => `• ${h}`).join('\n') : '• Monitor mountain pass weather and enforce vehicle spacing.');

    const metrics = [
      { label: 'Total Distance', value: `${distanceKm} km` },
      { label: 'Travel Time', value: `~${timeHrs} hrs` },
      { label: 'Heavy Truck ETA', value: `~${heavyHrs} hrs` },
      { label: 'Risk Factor', value: `${riskScore}/100` },
      { label: 'Routing Engine', value: grounded?.provider === 'osrm' ? 'OSRM Live Road' : 'Dijkstra Network' },
    ];

    const recommendations = grounded?.strategicRecommendations || [
      'Carry mandatory mechanical spares for steep hill climbs',
      'Verify fuel stops and staging depot availability at intermediate waypoints',
    ];

    return {
      factText,
      metrics,
      recommendations,
      sources,
      groundedRoute: grounded,
    };
  }

  // ============================================================
  // MASTER QUERY EXECUTION PIPELINE
  // ============================================================

  /**
   * Execute query dynamically across all real engines and return structured facts
   */
  public static async executeQuery(
    rawQuery: string,
    options?: { userLocation?: { lat: number; lng: number } }
  ): Promise<StructuredFactsResult> {
    const parsed = this.parseQuery(rawQuery, options?.userLocation);

    // If query has unknown locations outside NER
    if (parsed.unknownLocationStrings.length > 0 && parsed.locations.length === 0) {
      const unknown = parsed.unknownLocationStrings[0];
      return {
        intent: 'unknown_location',
        locationsFound: [],
        sources: ['NER Regional Boundary Registry'],
        factsText: `I couldn't find "**${unknown}**" in the platform's indexed logistics dataset.\n\nThe system currently covers India's **8 North Eastern States** (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura) with 40+ districts, primary national highways, airports, and logistics hubs.\n\nPlease verify the location name or try a supported center such as *Guwahati, Dibrugarh, Tawang, Agartala, Aizawl, Imphal, Kohima, Shillong, Gangtok, Anini, or Pelling*.`,
        metrics: [{ label: 'Status', value: 'Unindexed Location' }],
        recommendations: [
          'Try asking: "What is the route between Agartala and Aizawl?"',
          'Try asking: "Which district has the worst accessibility?"',
        ],
      };
    }

    // ----------------------------------------------------
    // CASE 1: ROUTE ANALYSIS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'route') {
      if (parsed.locations.length >= 2) {
        const origin = parsed.locations[0];
        const dest = parsed.locations[1];
        const routeData = await this.getRouteFact(origin, dest, parsed.priority, parsed.cargo);

        // If multi-intent: also include risk breakdown or infrastructure if asked
        let extraFacts = '';
        if (parsed.intents.includes('risk')) {
          const origRisk = origin.district ? assessDistrictRisk(origin.district.id) : null;
          const destRisk = dest.district ? assessDistrictRisk(dest.district.id) : null;
          extraFacts += `\n\n**Hazard & Risk Details for Route Endpoints:**\n`;
          if (origRisk) extraFacts += `• **${origin.matchedName}:** ${origRisk.overallRisk}/100 Risk (${origRisk.recommendation})\n`;
          if (destRisk) extraFacts += `• **${dest.matchedName}:** ${destRisk.overallRisk}/100 Risk (${destRisk.recommendation})\n`;
        }

        if (parsed.intents.includes('infrastructure')) {
          const origGap = origin.district ? analyzeInfrastructureGaps().find(g => g.districtId === origin.district?.id) : null;
          const destGap = dest.district ? analyzeInfrastructureGaps().find(g => g.districtId === dest.district?.id) : null;
          if (origGap || destGap) {
            extraFacts += `\n\n**Infrastructure Corridor Context:**\n`;
            if (origGap) extraFacts += `• **${origin.matchedName} Capex Need:** ₹${origGap.estimatedCost} Cr (${origGap.recommendedIntervention})\n`;
            if (destGap) extraFacts += `• **${dest.matchedName} Capex Need:** ₹${destGap.estimatedCost} Cr (${destGap.recommendedIntervention})\n`;
          }
        }

        return {
          intent: 'route_analysis',
          locationsFound: [origin.matchedName, dest.matchedName],
          sources: routeData.sources,
          factsText: routeData.factText + extraFacts,
          metrics: routeData.metrics,
          recommendations: routeData.recommendations,
          rawRoute: routeData.groundedRoute,
        };
      } else if (parsed.locations.length === 1) {
        // Only one location provided in route query
        const loc = parsed.locations[0];
        return {
          intent: 'route_analysis',
          locationsFound: [loc.matchedName],
          sources: ['Route Engine'],
          factsText: `You mentioned **${loc.matchedName}**, but a route requires both an origin and a destination.\n\nPlease specify where you are traveling to or from (e.g. *"Route from ${loc.matchedName} to Imphal"* or *"Route from Guwahati to ${loc.matchedName}"*).`,
          metrics: [{ label: 'Location', value: loc.matchedName }],
          recommendations: [
            `Try: "Find best route from ${loc.matchedName} to Guwahati"`,
            `Try: "What is the nearest logistics hub to ${loc.matchedName}?"`,
          ],
        };
      }
    }

    // ----------------------------------------------------
    // CASE 2: COMPARISON
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'comparison' && parsed.locations.length >= 2) {
      const comp = this.compareLocationsFact(parsed.locations[0], parsed.locations[1]);
      return {
        intent: 'comparison',
        locationsFound: [parsed.locations[0].matchedName, parsed.locations[1].matchedName],
        sources: comp.sources,
        factsText: comp.factText,
        metrics: comp.metrics,
        recommendations: comp.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 3: ACCESSIBILITY
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'accessibility') {
      const targetDist = parsed.locations.find(l => l.district)?.district;
      const fact = this.getAccessibilityFact(targetDist, parsed.sortOrder);
      return {
        intent: 'accessibility_analysis',
        locationsFound: targetDist ? [targetDist.name] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 4: DEMAND FORECAST
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'demand') {
      const targetDist = parsed.locations.find(l => l.district)?.district;
      const fact = this.getDemandFact(targetDist, parsed.sortOrder === 'worst' ? 'lowest' : 'highest');
      return {
        intent: 'demand_forecast',
        locationsFound: targetDist ? [targetDist.name] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 5: RISK & HAZARDS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'risk') {
      const targetDist = parsed.locations.find(l => l.district)?.district;
      const fact = this.getRiskFact(targetDist);
      return {
        intent: 'risk_analysis',
        locationsFound: targetDist ? [targetDist.name] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 6: INFRASTRUCTURE GAP
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'infrastructure') {
      const targetDist = parsed.locations.find(l => l.district)?.district;
      const fact = this.getInfrastructureFact(targetDist);
      return {
        intent: 'infrastructure_gap',
        locationsFound: targetDist ? [targetDist.name] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 7: LOGISTICS HUBS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'hub') {
      const loc = parsed.locations[0];
      const lat = loc?.lat || options?.userLocation?.lat || 26.14;
      const lng = loc?.lng || options?.userLocation?.lng || 91.73;
      const name = loc?.matchedName || (options?.userLocation ? 'Your Current Location' : 'Guwahati');

      const fact = this.getHubFact(lat, lng, name);
      return {
        intent: 'hub_intelligence',
        locationsFound: loc ? [loc.matchedName] : [],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 8: STATE-LEVEL LOGISTICS
    // ----------------------------------------------------
    if (parsed.primaryIntent === 'state' || (parsed.locations.length === 1 && parsed.locations[0].type === 'state')) {
      const s = parsed.locations[0]?.state || states[0];
      const fact = this.getStateFact(s);
      return {
        intent: 'state_logistics',
        locationsFound: [s.name],
        sources: fact.sources,
        factsText: fact.factText,
        metrics: fact.metrics,
        recommendations: fact.recommendations,
      };
    }

    // ----------------------------------------------------
    // CASE 9: SINGLE DISTRICT DOSSIER (Default when single location mentioned)
    // ----------------------------------------------------
    if (parsed.locations.length === 1 && parsed.locations[0].district) {
      const d = parsed.locations[0].district;
      const acc = computeAccessibility(d);
      const risk = assessDistrictRisk(d.id);
      const dem = forecastDemand(d.id);
      const gap = analyzeInfrastructureGaps().find(g => g.districtId === d.id);
      const s = states.find(item => item.id === d.stateId);

      const factsText = `**Comprehensive Logistics Dossier: ${d.name} (${s?.name || 'NER'})**\n\n` +
        `• **Accessibility Score:** **${acc.overallScore}/100** (${acc.level})\n` +
        `• **Multi-Hazard Risk:** **${risk.overallRisk}/100** (${risk.level} - ${risk.factors.landslideRisk} Landslide, ${risk.factors.floodRisk} Flood)\n` +
        `• **Current Daily Demand:** **${dem.currentDemand} t/day** (7-day forecast: ${dem.forecast7Day} t/day, ${dem.trend})\n` +
        `• **Nearest Logistics Hub:** **${d.nearestHubDistance} km** away\n` +
        `• **Infrastructure Gap Score:** ${gap ? `${gap.gapScore}/100 (${gap.priority.toUpperCase()} priority)` : 'Evaluated'}\n` +
        `• **Recommended Intervention:** ${gap?.recommendedIntervention || 'Upgrade secondary road access'}\n` +
        `• **Terrain:** ${d.terrain.toUpperCase()} (Elevation: ${d.elevation}m)`;

      return {
        intent: 'district_dossier',
        locationsFound: [d.name],
        sources: ['Accessibility Engine', 'Hazard Risk Model', 'Demand Forecast Engine', 'Infrastructure Gap Engine'],
        factsText,
        metrics: [
          { label: 'Accessibility', value: `${acc.overallScore}/100` },
          { label: 'Risk Factor', value: `${risk.overallRisk}/100` },
          { label: 'Daily Demand', value: `${dem.currentDemand} t/d` },
          { label: 'Hub Distance', value: `${d.nearestHubDistance} km` },
        ],
        recommendations: [
          risk.recommendation,
          `Deploy cold-chain storage in ${d.name} for essential medicine buffers`,
        ],
      };
    }

    // ----------------------------------------------------
    // DEFAULT GENERAL FALLBACK
    // ----------------------------------------------------
    const allAcc = computeAllAccessibility(districts);
    const avgScore = Math.round(allAcc.reduce((s, a) => s + a.overallScore, 0) / allAcc.length);
    const highRisks = assessAllRisks().filter(r => r.level === 'CRITICAL' || r.level === 'HIGH').length;
    const totalGaps = analyzeInfrastructureGaps().filter(g => g.priority === 'critical').length;

    return {
      intent: 'general_overview',
      locationsFound: [],
      sources: ['NER Spatial Database', 'Platform Analytics KPI Aggregator'],
      factsText: `**NER Logistics Intelligence — Operational Data Summary:**\n\n` +
        `• **Coverage:** 8 North Eastern States, 40+ districts, all major interstate highway links\n` +
        `• **Regional Average Accessibility:** **${avgScore}/100**\n` +
        `• **High-Risk Disruption Sectors:** **${highRisks} districts** requiring monsoon monitoring\n` +
        `• **Critical Infrastructure Gaps:** **${totalGaps} priority bottlenecks** identified\n` +
        `• **Siliguri Corridor Dependency:** 85% of bulk inbound goods transit the 22 km bottleneck\n\n` +
        `**You can ask me specific questions such as:**\n` +
        `1. *"What is the accessibility score of Tawang?"*\n` +
        `2. *"Compare Tawang and Dibrugarh."*\n` +
        `3. *"Which district has the worst accessibility?"*\n` +
        `4. *"What is the demand forecast for Dibrugarh?"*\n` +
        `5. *"What are the major risks around Tawang?"*\n` +
        `6. *"Which district has the largest infrastructure gap?"*\n` +
        `7. *"Which hub is closest to Tawang?"*\n` +
        `8. *"Find the best route from Agartala to Aizawl."*\n` +
        `9. *"Tell me about logistics in Nagaland."*`,
      metrics: [
        { label: 'States', value: '8' },
        { label: 'Districts', value: `${districts.length}` },
        { label: 'Avg Accessibility', value: `${avgScore}/100` },
        { label: 'High Risk Zones', value: `${highRisks}` },
      ],
      recommendations: [
        'Ask about any specific route, district, or state across NER',
        'Compare logistics accessibility between any two locations',
      ],
    };
  }
}
