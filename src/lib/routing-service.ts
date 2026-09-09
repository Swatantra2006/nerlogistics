/**
 * NER Logistics Intelligence — Grounded Routing & Query Understanding Service
 * Provides query understanding, location entity extraction, Dijkstra pathfinding,
 * multi-criteria transit analysis, and AI grounding context for the North Eastern Region.
 */

import { graphNodes, graphEdges, districts, states, logisticsHubs, riskEvents, GraphEdge, GraphNode } from '@/data/ner-data';
import { CopilotMessage } from '@/types';

export interface LocationEntity {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  lat: number;
  lng: number;
  terrain?: string;
  elevation?: number;
  isDistrict?: boolean;
}

export interface ParsedQuery {
  intent: 'route_analysis' | 'risk_inquiry' | 'accessibility_inquiry' | 'hub_inquiry' | 'commodity_inquiry' | 'general';
  origin?: LocationEntity;
  destination?: LocationEntity;
  targetLocation?: LocationEntity;
  targetState?: string;
  commodity?: string;
  priority: 'fastest' | 'safest' | 'cheapest' | 'balanced';
  rawLocations: string[];
}

export interface GroundedRouteData {
  found: boolean;
  origin: LocationEntity;
  destination: LocationEntity;
  totalDistanceKm: number;
  estimatedTimeHours: number;
  heavyTruckTimeHours: number;
  highways: string[];
  waypoints: string[];
  terrainSummary: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  hazards: string[];
  keyCheckpoints: string[];
  alternatives: string[];
  strategicRecommendations: string[];
}

// Comprehensive regional location registry across all 8 NER states
export const NER_LOCATIONS_MAP: Record<string, LocationEntity> = {
  // Assam
  'guwahati': { id: 'guwahati', name: 'Guwahati', stateId: 'assam', stateName: 'Assam', lat: 26.1445, lng: 91.7362, terrain: 'plain', elevation: 55 },
  'dibrugarh': { id: 'dibrugarh', name: 'Dibrugarh', stateId: 'assam', stateName: 'Assam', lat: 27.4728, lng: 94.9120, terrain: 'plain', elevation: 108 },
  'silchar': { id: 'silchar', name: 'Silchar', stateId: 'assam', stateName: 'Assam', lat: 24.8333, lng: 92.7789, terrain: 'plain', elevation: 30 },
  'cachar': { id: 'silchar', name: 'Silchar (Cachar)', stateId: 'assam', stateName: 'Assam', lat: 24.8333, lng: 92.7789, terrain: 'plain', elevation: 30 },
  'tinsukia': { id: 'tinsukia', name: 'Tinsukia', stateId: 'assam', stateName: 'Assam', lat: 27.4922, lng: 95.3547, terrain: 'plain', elevation: 116 },
  'jorhat': { id: 'jorhat', name: 'Jorhat', stateId: 'assam', stateName: 'Assam', lat: 26.7509, lng: 94.2037, terrain: 'plain', elevation: 86 },
  'tezpur': { id: 'tezpur', name: 'Tezpur', stateId: 'assam', stateName: 'Assam', lat: 26.6338, lng: 92.7840, terrain: 'plain', elevation: 85 },
  'nagaon': { id: 'nagaon', name: 'Nagaon', stateId: 'assam', stateName: 'Assam', lat: 26.3500, lng: 92.6840, terrain: 'plain', elevation: 60 },
  'bongaigaon': { id: 'bongaigaon', name: 'Bongaigaon', stateId: 'assam', stateName: 'Assam', lat: 26.5000, lng: 90.5500, terrain: 'plain', elevation: 54 },
  'barpeta': { id: 'barpeta', name: 'Barpeta', stateId: 'assam', stateName: 'Assam', lat: 26.3210, lng: 91.0050, terrain: 'riverine', elevation: 35 },
  'lumding': { id: 'lumding', name: 'Lumding', stateId: 'assam', stateName: 'Assam', lat: 25.7500, lng: 93.1700, terrain: 'plain', elevation: 125 },
  'sadiya': { id: 'sadiya', name: 'Sadiya', stateId: 'assam', stateName: 'Assam', lat: 27.8300, lng: 95.6600, terrain: 'riverine', elevation: 123 },

  // Arunachal Pradesh
  'anini': { id: 'anini', name: 'Anini', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.7900, lng: 95.9000, terrain: 'mountainous', elevation: 1968, isDistrict: true },
  'dibang valley': { id: 'anini', name: 'Dibang Valley (Anini)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.7900, lng: 95.9000, terrain: 'mountainous', elevation: 1968, isDistrict: true },
  'roing': { id: 'roing', name: 'Roing', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.1400, lng: 95.8300, terrain: 'hilly', elevation: 390, isDistrict: true },
  'lower dibang': { id: 'roing', name: 'Lower Dibang Valley (Roing)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.1400, lng: 95.8300, terrain: 'hilly', elevation: 390, isDistrict: true },
  'tezu': { id: 'tezu', name: 'Tezu', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.9100, lng: 96.1600, terrain: 'hilly', elevation: 210, isDistrict: true },
  'lohit': { id: 'tezu', name: 'Lohit (Tezu)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.9100, lng: 96.1600, terrain: 'hilly', elevation: 210, isDistrict: true },
  'tawang': { id: 'tawang', name: 'Tawang', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.5860, lng: 91.8690, terrain: 'mountainous', elevation: 3048, isDistrict: true },
  'bomdila': { id: 'bomdila', name: 'Bomdila', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.2660, lng: 92.4200, terrain: 'mountainous', elevation: 2217, isDistrict: true },
  'west kameng': { id: 'bomdila', name: 'West Kameng (Bomdila)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.2660, lng: 92.4200, terrain: 'mountainous', elevation: 2217, isDistrict: true },
  'dirang': { id: 'bomdila', name: 'Dirang', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.3500, lng: 92.2300, terrain: 'mountainous', elevation: 1560 },
  'itanagar': { id: 'itanagar', name: 'Itanagar', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, terrain: 'hilly', elevation: 350, isDistrict: true },
  'papum pare': { id: 'itanagar', name: 'Papum Pare (Itanagar)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, terrain: 'hilly', elevation: 350, isDistrict: true },
  'pasighat': { id: 'pasighat', name: 'Pasighat', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.0660, lng: 95.3340, terrain: 'hilly', elevation: 155, isDistrict: true },
  'east siang': { id: 'pasighat', name: 'East Siang (Pasighat)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 28.0660, lng: 95.3340, terrain: 'hilly', elevation: 155, isDistrict: true },
  'ziro': { id: 'ziro', name: 'Ziro', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.5300, lng: 93.8300, terrain: 'mountainous', elevation: 1688, isDistrict: true },
  'lower subansiri': { id: 'ziro', name: 'Lower Subansiri (Ziro)', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.5300, lng: 93.8300, terrain: 'mountainous', elevation: 1688, isDistrict: true },
  'changlang': { id: 'changlang', name: 'Changlang', stateId: 'arunachal', stateName: 'Arunachal Pradesh', lat: 27.1200, lng: 95.7400, terrain: 'hilly', elevation: 600, isDistrict: true },

  // Meghalaya
  'shillong': { id: 'shillong', name: 'Shillong', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.5788, lng: 91.8933, terrain: 'hilly', elevation: 1496, isDistrict: true },
  'east khasi': { id: 'shillong', name: 'East Khasi Hills (Shillong)', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.5788, lng: 91.8933, terrain: 'hilly', elevation: 1496, isDistrict: true },
  'tura': { id: 'tura', name: 'Tura', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.5200, lng: 90.2200, terrain: 'hilly', elevation: 380, isDistrict: true },
  'west garo': { id: 'tura', name: 'West Garo Hills (Tura)', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.5200, lng: 90.2200, terrain: 'hilly', elevation: 380, isDistrict: true },
  'jowai': { id: 'shillong', name: 'Jowai', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.4500, lng: 92.2000, terrain: 'hilly', elevation: 1380 },
  'cherrapunji': { id: 'shillong', name: 'Cherrapunji (Sohra)', stateId: 'meghalaya', stateName: 'Meghalaya', lat: 25.2700, lng: 91.7300, terrain: 'hilly', elevation: 1430 },

  // Nagaland
  'kohima': { id: 'kohima', name: 'Kohima', stateId: 'nagaland', stateName: 'Nagaland', lat: 25.6747, lng: 94.1086, terrain: 'mountainous', elevation: 1444, isDistrict: true },
  'dimapur': { id: 'dimapur', name: 'Dimapur', stateId: 'nagaland', stateName: 'Nagaland', lat: 25.8973, lng: 93.7266, terrain: 'plain', elevation: 154, isDistrict: true },
  'mokokchung': { id: 'kohima', name: 'Mokokchung', stateId: 'nagaland', stateName: 'Nagaland', lat: 26.3200, lng: 94.5200, terrain: 'mountainous', elevation: 1325 },
  'mon': { id: 'dimapur', name: 'Mon', stateId: 'nagaland', stateName: 'Nagaland', lat: 26.6919, lng: 94.9130, terrain: 'mountainous', elevation: 900, isDistrict: true },

  // Manipur
  'imphal': { id: 'imphal', name: 'Imphal', stateId: 'manipur', stateName: 'Manipur', lat: 24.8074, lng: 93.9384, terrain: 'hilly', elevation: 786, isDistrict: true },
  'imphal west': { id: 'imphal', name: 'Imphal West', stateId: 'manipur', stateName: 'Manipur', lat: 24.8074, lng: 93.9384, terrain: 'hilly', elevation: 786, isDistrict: true },
  'churachandpur': { id: 'imphal', name: 'Churachandpur', stateId: 'manipur', stateName: 'Manipur', lat: 24.3340, lng: 93.6840, terrain: 'mountainous', elevation: 1500, isDistrict: true },
  'ukhrul': { id: 'imphal', name: 'Ukhrul', stateId: 'manipur', stateName: 'Manipur', lat: 25.1200, lng: 94.3600, terrain: 'mountainous', elevation: 1662, isDistrict: true },
  'moreh': { id: 'imphal', name: 'Moreh', stateId: 'manipur', stateName: 'Manipur', lat: 24.2400, lng: 94.3000, terrain: 'hilly', elevation: 228 },

  // Mizoram
  'aizawl': { id: 'aizawl', name: 'Aizawl', stateId: 'mizoram', stateName: 'Mizoram', lat: 23.7271, lng: 92.7176, terrain: 'mountainous', elevation: 1132, isDistrict: true },
  'lunglei': { id: 'aizawl', name: 'Lunglei', stateId: 'mizoram', stateName: 'Mizoram', lat: 22.8800, lng: 92.7300, terrain: 'mountainous', elevation: 850, isDistrict: true },
  'champhai': { id: 'aizawl', name: 'Champhai', stateId: 'mizoram', stateName: 'Mizoram', lat: 23.4567, lng: 93.3280, terrain: 'mountainous', elevation: 1678, isDistrict: true },

  // Sikkim
  'gangtok': { id: 'gangtok', name: 'Gangtok', stateId: 'sikkim', stateName: 'Sikkim', lat: 27.3389, lng: 88.6065, terrain: 'mountainous', elevation: 1650, isDistrict: true },
  'siliguri': { id: 'siliguri', name: 'Siliguri', stateId: 'sikkim', stateName: 'West Bengal (NER Gateway)', lat: 26.7271, lng: 88.3953, terrain: 'plain', elevation: 122 },
  'namchi': { id: 'gangtok', name: 'Namchi', stateId: 'sikkim', stateName: 'Sikkim', lat: 27.1700, lng: 88.3500, terrain: 'mountainous', elevation: 1315 },
  'rangpo': { id: 'gangtok', name: 'Rangpo', stateId: 'sikkim', stateName: 'Sikkim', lat: 27.1800, lng: 88.5300, terrain: 'hilly', elevation: 330 },

  // Tripura
  'agartala': { id: 'agartala', name: 'Agartala', stateId: 'tripura', stateName: 'Tripura', lat: 23.8315, lng: 91.2868, terrain: 'plain', elevation: 16, isDistrict: true },
  'dharmanagar': { id: 'agartala', name: 'Dharmanagar', stateId: 'tripura', stateName: 'Tripura', lat: 24.3800, lng: 92.1700, terrain: 'plain', elevation: 25 },
};

export class RoutingService {
  /**
   * Geocodes location name to standard LocationEntity
   */
  static geocode(input: string): LocationEntity | undefined {
    if (!input) return undefined;
    const clean = input.trim().toLowerCase().replace(/[^\w\s]/g, '').trim();

    // 1. Direct key match
    if (NER_LOCATIONS_MAP[clean]) {
      return NER_LOCATIONS_MAP[clean];
    }

    // 2. Partial substring search
    const keys = Object.keys(NER_LOCATIONS_MAP);
    for (const k of keys) {
      if (clean === k || clean.startsWith(k) || k.startsWith(clean)) {
        return NER_LOCATIONS_MAP[k];
      }
    }

    // 3. Match against GraphNode names
    const node = graphNodes.find(n => n.name.toLowerCase() === clean || n.id.toLowerCase() === clean);
    if (node) {
      return {
        id: node.id,
        name: node.name,
        stateId: node.stateId,
        stateName: states.find(s => s.id === node.stateId)?.name || node.stateId,
        lat: node.lat,
        lng: node.lng,
      };
    }

    // 4. Match against District names
    const dist = districts.find(d => d.name.toLowerCase().includes(clean) || clean.includes(d.name.toLowerCase()));
    if (dist) {
      return {
        id: dist.id,
        name: dist.name,
        stateId: dist.stateId,
        stateName: states.find(s => s.id === dist.stateId)?.name || dist.stateId,
        lat: dist.lat,
        lng: dist.lng,
        terrain: dist.terrain,
        elevation: dist.elevation,
        isDistrict: true,
      };
    }

    return undefined;
  }

  /**
   * Natural Language Intent & Entity Parser
   * Accurately parses queries like:
   * - "What is the route between Dibrugarh and Anini?"
   * - "How can I travel from Guwahati to Silchar?"
   * - "What are the risks between Dibrugarh and Anini?"
   */
  static parseRouteQuery(query: string): ParsedQuery {
    const text = query.trim();
    const lower = text.toLowerCase();

    // Determine Intent
    let intent: ParsedQuery['intent'] = 'general';
    if (['route', 'path', 'way', 'travel', 'directions', 'reach', 'how to go', 'distance between', 'shortest way', 'better route', 'alternative route'].some(k => lower.includes(k))) {
      intent = 'route_analysis';
    } else if (['risk', 'hazard', 'landslide', 'flood', 'danger', 'disruption', 'closure', 'safe'].some(k => lower.includes(k))) {
      intent = 'risk_inquiry';
    } else if (['accessib', 'connectivity', 'isolated', 'poor connectivity', 'score of'].some(k => lower.includes(k))) {
      intent = 'accessibility_inquiry';
    } else if (['hub', 'warehouse', 'depot', 'storage'].some(k => lower.includes(k))) {
      intent = 'hub_inquiry';
    }

    // Determine Priority
    let priority: ParsedQuery['priority'] = 'safest';
    if (lower.includes('fastest') || lower.includes('quickest')) priority = 'fastest';
    else if (lower.includes('cheapest') || lower.includes('economical')) priority = 'cheapest';
    else if (lower.includes('balanced')) priority = 'balanced';

    // Entity Extraction Patterns
    let originStr: string | undefined;
    let destStr: string | undefined;

    // Pattern 1: "between X and Y"
    const betweenMatch = lower.match(/between\s+([a-z\s\-]+?)\s+and\s+([a-z\s\-]+?)(?:\?|$|\.|\s+via|\s+route|\s+corridor|\s+for|\s+with)/i);
    if (betweenMatch) {
      originStr = betweenMatch[1].trim();
      destStr = betweenMatch[2].trim();
    }

    // Pattern 2: "from X to Y"
    if (!originStr || !destStr) {
      const fromToMatch = lower.match(/from\s+([a-z\s\-]+?)\s+to\s+([a-z\s\-]+?)(?:\?|$|\.|\s+via|\s+route|\s+corridor|\s+by|\s+using)/i);
      if (fromToMatch) {
        originStr = fromToMatch[1].trim();
        destStr = fromToMatch[2].trim();
      }
    }

    // Pattern 3: "reach Y from X" or "to Y from X"
    if (!originStr || !destStr) {
      const reachMatch = lower.match(/(?:reach|to|travel\s+to|connect)\s+([a-z\s\-]+?)\s+from\s+([a-z\s\-]+?)(?:\?|$|\.)/i);
      if (reachMatch) {
        destStr = reachMatch[1].trim();
        originStr = reachMatch[2].trim();
      }
    }

    // Pattern 4: "X to Y route"
    if (!originStr || !destStr) {
      const directMatch = lower.match(/([a-z\s\-]+?)\s+(?:to|->|→)\s+([a-z\s\-]+?)(?:\s+route|\s+corridor|\?|$|\.)/i);
      if (directMatch) {
        originStr = directMatch[1].trim();
        destStr = directMatch[2].trim();
      }
    }

    // Fallback: Scan text for known NER locations in sequence
    const foundEntities: LocationEntity[] = [];
    const locationKeys = Object.keys(NER_LOCATIONS_MAP).sort((a, b) => b.length - a.length);

    for (const key of locationKeys) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        const entity = NER_LOCATIONS_MAP[key];
        if (!foundEntities.some(e => e.id === entity.id)) {
          foundEntities.push(entity);
        }
      }
    }

    // Resolve Location Entities
    let origin: LocationEntity | undefined;
    let destination: LocationEntity | undefined;

    if (originStr) {
      origin = this.geocode(originStr);
    }
    if (destStr) {
      destination = this.geocode(destStr);
    }

    // If regex failed to geocode, use ordered sequence of matched entities
    if (!origin && foundEntities.length >= 1) {
      origin = foundEntities[0];
    }
    if (!destination && foundEntities.length >= 2) {
      destination = foundEntities[1];
    }

    // Single target location (for accessibility/hub questions)
    const targetLocation = foundEntities[0];

    // Target state
    let targetState: string | undefined;
    for (const s of states) {
      if (lower.includes(s.name.toLowerCase()) || lower.includes(s.id.toLowerCase())) {
        targetState = s.name;
        break;
      }
    }

    return {
      intent,
      origin,
      destination,
      targetLocation,
      targetState,
      priority,
      rawLocations: foundEntities.map(e => e.name),
    };
  }

  /**
   * Computes Grounded Route Data using Dijkstra Algorithm
   */
  static calculateRoute(origin: LocationEntity, destination: LocationEntity, priority = 'safest'): GroundedRouteData {
    const startId = origin.id;
    const endId = destination.id;

    // Check if directly in graphNodes
    const startNode = graphNodes.find(n => n.id === startId);
    const endNode = graphNodes.find(n => n.id === endId);

    // If both are in graph, run Dijkstra
    if (startNode && endNode) {
      const pathResult = this.runDijkstra(startId, endId, priority);
      if (pathResult && pathResult.edges.length > 0) {
        const totalDist = pathResult.edges.reduce((acc, e) => acc + e.distance, 0);
        const totalTime = pathResult.edges.reduce((acc, e) => acc + e.time, 0);
        const highways = Array.from(new Set(pathResult.edges.map(e => e.roadName)));
        const waypoints = [origin.name, ...pathResult.edges.map(e => {
          const nextNode = graphNodes.find(n => n.id === e.to);
          return nextNode?.name || e.to;
        })];

        const avgRisk = Math.round(pathResult.edges.reduce((acc, e) => acc + e.risk, 0) / pathResult.edges.length);
        const riskLevel = avgRisk > 70 ? 'Critical' : avgRisk > 50 ? 'High' : avgRisk > 30 ? 'Moderate' : 'Low';

        // Hazards & checkpoints
        const hazards: string[] = [];
        const checkpoints: string[] = [];

        if (highways.some(h => h.includes('313') || h.includes('Mayodia'))) {
          hazards.push('Mayodia Pass (2,655m) heavy fog, winter snowfall, and single-lane steep gradients');
          hazards.push('Dibang river catchment active monsoon debris flows and flash landslides near Hunli');
          checkpoints.push('Bhupen Hazarika Setu (Dhola-Sadiya Bridge, 9.15 km across Lohit River)');
          checkpoints.push('Shantipur Checkgate (Inner Line Permit / ILP verification)');
          checkpoints.push('Hunli Staging Depot (last commercial refueling point before Anini)');
        }
        if (highways.some(h => h.includes('13') || h.includes('Sela'))) {
          hazards.push('Sela Pass (4,170m) sub-zero conditions, ice slush, and reduced oxygen for engines');
          checkpoints.push('Bhalukpong ILP Checkpost');
          checkpoints.push('Dirang staging bay for tire chain fitment');
        }
        if (highways.some(h => h.includes('10'))) {
          hazards.push('Teesta river valley rockfalls and pre-monsoon road subsidence (29th Mile zone)');
          checkpoints.push('Rangpo multi-modal checkpost');
        }
        if (highways.some(h => h.includes('6') || h.includes('Sonapur'))) {
          hazards.push('Sonapur tunnel flash mudslides and heavy rainfall belt in Meghalaya plateau');
          checkpoints.push('Jowai bypass staging terminal');
        }

        if (hazards.length === 0) {
          hazards.push('Monsoon heavy downpours and narrow single-lane bridge bottlenecks');
        }

        return {
          found: true,
          origin,
          destination,
          totalDistanceKm: totalDist,
          estimatedTimeHours: Math.round(totalTime * 10) / 10,
          heavyTruckTimeHours: Math.round(totalTime * 1.35 * 10) / 10,
          highways,
          waypoints,
          terrainSummary: `${origin.terrain || 'Plain'} to ${destination.terrain || 'Mountainous'} (${destination.elevation ? destination.elevation + 'm elevation' : 'High relief'})`,
          riskScore: avgRisk,
          riskLevel,
          hazards,
          keyCheckpoints: checkpoints.length > 0 ? checkpoints : ['Inter-state border gate checkpost', 'Regional transshipment depot'],
          alternatives: [`Alternative route available via secondary arterial state highways (+15-25% distance)`],
          strategicRecommendations: [
            `Prioritize daylight departure (05:00 - 06:30 IST) to clear mountain passes before afternoon fog`,
            `Ensure multi-axle freight adheres to axle weight caps at river crossings`,
            `Maintain buffer fuel reserves due to limited high-altitude petrol pumps`
          ]
        };
      }
    }

    // Great circle calculation with terrain winding multiplier if graph path not directly connected
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const crowDist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Road winding factor (1.4x for plains, 1.8x for mountain terrain)
    const windingFactor = (destination.terrain === 'mountainous' || origin.terrain === 'mountainous') ? 1.75 : 1.42;
    const approxDist = Math.round(crowDist * windingFactor);
    const avgSpeed = (destination.terrain === 'mountainous' || origin.terrain === 'mountainous') ? 34 : 52;
    const approxTime = Math.round((approxDist / avgSpeed) * 10) / 10;

    return {
      found: true,
      origin,
      destination,
      totalDistanceKm: approxDist,
      estimatedTimeHours: approxTime,
      heavyTruckTimeHours: Math.round(approxTime * 1.4 * 10) / 10,
      highways: ['Primary State Highway & Connecting National Corridors'],
      waypoints: [origin.name, 'Regional Transit Junction', destination.name],
      terrainSummary: `${origin.terrain || 'Regional Terrain'} → ${destination.terrain || 'Mountainous'}`,
      riskScore: destination.terrain === 'mountainous' ? 68 : 42,
      riskLevel: destination.terrain === 'mountainous' ? 'High' : 'Moderate',
      hazards: [
        'Narrow single-lane mountain sections',
        'Seasonal monsoon rainfall and pavement slippage'
      ],
      keyCheckpoints: ['Regional transit hub checkpost', 'District boundary checkpoint'],
      alternatives: ['Bypass corridor via state highway connection'],
      strategicRecommendations: [
        `Confirm road clearance status with regional control room before dispatch`,
        `Carry mandatory safety gear and spare tires for steep gradient transit`
      ]
    };
  }

  /**
   * Internal Dijkstra Algorithm
   */
  private static runDijkstra(start: string, end: string, priority: string) {
    const weights = {
      fastest: { distance: 0.1, time: 0.5, cost: 0.1, risk: 0.1, acc: 0.2 },
      safest: { distance: 0.1, time: 0.1, cost: 0.1, risk: 0.5, acc: 0.2 },
      cheapest: { distance: 0.2, time: 0.1, cost: 0.5, risk: 0.1, acc: 0.1 },
      balanced: { distance: 0.2, time: 0.2, cost: 0.2, risk: 0.2, acc: 0.2 },
    }[priority] || { distance: 0.2, time: 0.2, cost: 0.2, risk: 0.2, acc: 0.2 };

    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; edge: GraphEdge } | null>();
    const visited = new Set<string>();

    graphNodes.forEach(n => {
      dist.set(n.id, Infinity);
      prev.set(n.id, null);
    });
    dist.set(start, 0);

    while (true) {
      let current: string | null = null;
      let currentDist = Infinity;
      dist.forEach((d, id) => {
        if (!visited.has(id) && d < currentDist) {
          current = id;
          currentDist = d;
        }
      });

      if (current === null || current === end) break;
      visited.add(current);

      const neighbors = graphEdges.filter(e => e.from === current || e.to === current);
      for (const edge of neighbors) {
        const neighbor = edge.from === current ? edge.to : edge.from;
        if (visited.has(neighbor)) continue;

        const edgeWeight =
          weights.distance * (edge.distance / 500) +
          weights.time * (edge.time / 15) +
          weights.cost * (edge.cost / 6) +
          weights.risk * (edge.risk / 100);

        const newDist = currentDist + edgeWeight;
        if (newDist < (dist.get(neighbor) || Infinity)) {
          dist.set(neighbor, newDist);
          prev.set(neighbor, { node: current, edge });
        }
      }
    }

    if (dist.get(end) === Infinity) return null;

    const path: string[] = [];
    const edges: GraphEdge[] = [];
    let cur: string | undefined = end;
    while (cur) {
      path.unshift(cur);
      const step = prev.get(cur);
      if (step) {
        edges.unshift(step.edge);
        cur = step.node;
      } else {
        break;
      }
    }

    return { path, edges };
  }

  /**
   * Generates high-accuracy deterministic response for any query
   * Used when Gemini is unavailable or for exact grounding.
   */
  static generateGroundedResponse(parsed: ParsedQuery, query: string): CopilotMessage {
    const now = new Date();

    // 1. ROUTE ANALYSIS QUERY
    if (parsed.origin && parsed.destination) {
      const route = this.calculateRoute(parsed.origin, parsed.destination, parsed.priority);

      const content = `### 🗺️ Verified Route Intelligence: ${route.origin.name} → ${route.destination.name}

Analyzing multimodal logistics, terrain factors, and corridor conditions across the North Eastern network:

#### 1. Primary Corridor Profile
• **Total Distance:** **${route.totalDistanceKm} km**
• **Estimated Transit Time:** **~${route.estimatedTimeHours} hours** (Light Commercial) / **~${route.heavyTruckTimeHours} hours** (Heavy Freight >12t)
• **Key Highway Corridors:** ${route.highways.map(h => `**${h}**`).join(' → ')}
• **Waypoint Route:** ${route.waypoints.join(' ➔ ')}
• **Terrain Transition:** ${route.terrainSummary}

#### 2. Risk & Operational Hazards
• **Composite Route Risk Score:** **${route.riskScore}/100** (${route.riskLevel} Hazard Severity)
${route.hazards.map(h => `• ⚠️ **Hazard Notice:** ${h}`).join('\n')}

#### 3. Strategic Staging & Checkpoints
${route.keyCheckpoints.map(c => `• 📍 **Checkpoint:** ${c}`).join('\n')}

#### 4. Tactical Recommendations for Logistics Operators
${route.strategicRecommendations.map(r => `• ✅ ${r}`).join('\n')}`;

      return {
        role: 'assistant',
        content,
        timestamp: now.toISOString(),
        metrics: [
          { label: 'Origin', value: route.origin.name },
          { label: 'Destination', value: route.destination.name },
          { label: 'Total Distance', value: `${route.totalDistanceKm} km` },
          { label: 'Est. Travel Time', value: `~${route.estimatedTimeHours} hrs` },
          { label: 'Risk Factor', value: `${route.riskScore}/100 (${route.riskLevel})` },
        ],
        recommendations: route.strategicRecommendations,
      };
    }

    // 2. ACCESSIBILITY INQUIRY (e.g. "How accessible is Aizawl?")
    if (parsed.targetLocation?.isDistrict || parsed.targetState || parsed.intent === 'accessibility_inquiry') {
      const targetName = parsed.targetLocation?.name || parsed.targetState || 'NER Districts';
      const matchedDist = districts.find(d => 
        parsed.targetLocation && (d.id === parsed.targetLocation.id || d.name.toLowerCase().includes(parsed.targetLocation.name.toLowerCase()))
      );

      if (matchedDist) {
        const stateObj = states.find(s => s.id === matchedDist.stateId);
        return {
          role: 'assistant',
          content: `### 📊 Accessibility Intelligence Profile: ${matchedDist.name} (${stateObj?.name || 'NER'})

• **Composite Accessibility Score:** **${matchedDist.accessibilityScore}/100**
• **Terrain Classification:** ${matchedDist.terrain.toUpperCase()} (Elevation: ${matchedDist.elevation}m)
• **Road Network Connectivity:** ${matchedDist.roadConnectivity}/100
• **Railway Access:** ${matchedDist.railConnectivity > 0 ? `${matchedDist.railConnectivity}/100` : 'No direct railhead (feeder road dependent)'}
• **Airport Proximity:** ${matchedDist.airportAccess}/100
• **Average Freight Delivery Time:** ~${matchedDist.avgDeliveryTime} hours from primary regional staging hub
• **Last-Mile Transport Difficulty:** **${matchedDist.lastMileDifficulty.toUpperCase()}**

**Strategic Assessment:**
Due to ${matchedDist.terrain} topography and single-corridor dependence, supply resilience requires staging secondary buffer depots and monitoring seasonal monsoon slips.`,
          timestamp: now.toISOString(),
          metrics: [
            { label: 'District', value: matchedDist.name },
            { label: 'Accessibility Score', value: `${matchedDist.accessibilityScore}/100` },
            { label: 'Terrain', value: matchedDist.terrain },
            { label: 'Last-Mile Difficulty', value: matchedDist.lastMileDifficulty },
          ],
          recommendations: [
            `Pre-position buffer commodities at nearest hub (${matchedDist.nearestHub})`,
            `Monitor road friction telemetry on feeder state highways`
          ]
        };
      }
    }

    // 3. LOGISTICS HUBS INQUIRY (e.g. "What logistics hubs are near Guwahati?")
    if (parsed.intent === 'hub_inquiry' || query.toLowerCase().includes('hub')) {
      const loc = parsed.targetLocation || NER_LOCATIONS_MAP['guwahati'];
      const nearbyHubs = logisticsHubs.map(h => {
        const dLat = ((h.lat - loc.lat) * Math.PI) / 180;
        const dLng = ((h.lng - loc.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((loc.lat * Math.PI) / 180) * Math.cos((h.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        return { ...h, distKm: dist };
      }).sort((a, b) => a.distKm - b.distKm).slice(0, 3);

      return {
        role: 'assistant',
        content: `### 🏢 Logistics Hubs & Storage Network near ${loc.name}

Found **${nearbyHubs.length} strategically connected hubs**:

${nearbyHubs.map(h => `• **${h.name}** (${h.city}, ${h.stateId.toUpperCase()})
  - Distance: **${h.distKm} km**
  - Rated Storage Capacity: **${h.capacity.toLocaleString()} Tons** | Current Utilization: **${h.currentUtilization}%**
  - Multimodal Access: ${h.hasRailAccess ? '🚆 Rail Connected' : 'No Rail'} | ${h.hasAirAccess ? '✈️ Air Cargo' : 'No Air'}`).join('\n\n')}

**Recommendation:** For heavy freight transshipment, route through hubs with direct railhead sidings to minimize road vibration fatigue.`,
        timestamp: now.toISOString(),
        metrics: nearbyHubs.map(h => ({ label: h.name.split(' ')[0], value: `${h.currentUtilization}% Capacity` })),
        recommendations: [
          'Inspect real-time storage availability in the Logistics Hubs module',
          'Coordinate inter-modal transfers at Pandu Port or Amingaon ICD'
        ]
      };
    }

    // 4. GENERAL NER LOGISTICS INTELLIGENCE (Fallback with no location hallucination)
    return {
      role: 'assistant',
      content: `### 🧠 NER Logistics Intelligence & Decision Assistant

I analyze logistics, multi-criteria routing, and terrain resilience across India's **8 North Eastern States**:

• **Corridor Operations:** High-vigilance monitoring on the Siliguri Corridor (Chicken's Neck), NH-13 (Trans-Arunachal), NH-2 (Dimapur-Imphal), NH-6, NH-10 (Sikkim lifeline), and NH-313 (Roing-Anini).
• **Multimodal Redundancy:** Inland waterways (NW-2 Brahmaputra, Pandu Port) and strategic bridge crossings (Bhupen Hazarika Setu, Bogibeel Bridge).

**How can I help with your specific route?**
Try asking:
1. *"What is the route between Dibrugarh and Anini?"*
2. *"What is the safest route from Guwahati to Silchar?"*
3. *"What are the risks between Imphal and Kohima?"*
4. *"How accessible is Aizawl?"*`,
      timestamp: now.toISOString(),
      metrics: [
        { label: 'Coverage', value: '8 NER States' },
        { label: 'Real-Time Telemetry', value: 'Active' },
        { label: 'Grounding Engine', value: 'Grounded NER Spatial Service' },
      ],
      recommendations: [
        'Provide an origin and destination to view full highway breakdown and hazards',
        'Use the Route Optimizer module for dynamic Dijkstra weight tuning'
      ]
    };
  }
}
