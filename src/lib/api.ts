/**
 * NER Logistics Intelligence — Backend API Client
 * Connects the frontend to the FastAPI REST + Geospatial backend.
 * Provides resilient fallbacks to client-side data/engines if the backend is unreachable.
 */

import {
  State,
  District,
  Road,
  LogisticsHub,
  Airport,
  RailwayStation,
  RiskEvent,
  OptimizedRoute,
  RouteOptimizationRequest,
  InfrastructureGap,
  ScenarioInput,
  ScenarioResult,
  CopilotMessage,
} from '@/types';
import {
  states as localStates,
  districts as localDistricts,
  roads as localRoads,
  logisticsHubs as localHubs,
  airports as localAirports,
  railwayStations as localRailways,
  riskEvents as localRiskEvents,
  graphNodes as localGraphNodes,
  graphEdges as localGraphEdges,
} from '@/data/ner-data';
import { optimizeRoutes as localOptimizeRoutes } from '@/modules/routing/engine';
import { computeAllAccessibility as localComputeAllAcc, computeAccessibility as localComputeAcc } from '@/modules/accessibility/engine';
import { assessAllRisks as localAssessRisks, assessDistrictRisk as localAssessDistrictRisk, generateWeatherData as localGenWeather } from '@/modules/risk/engine';
import { forecastDemand as localForecastDemand, forecastAllDistricts as localForecastAll } from '@/modules/demand/engine';
import { analyzeInfrastructureGaps as localAnalyzeGaps, getGapsByState as localGapsByState } from '@/modules/infrastructure/engine';
import { simulateScenario as localSimulateScenario, getScenarioPresets as localGetPresets } from '@/modules/scenario/engine';
import { processQuery as localProcessCopilot } from '@/modules/copilot/engine';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithTimeout<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 3000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  // ===== HEALTH CHECK =====
  async checkHealth(): Promise<boolean> {
    try {
      const data = await fetchWithTimeout<{ status: string }>('/api/health', {}, 1500);
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },

  // ===== GEOGRAPHY =====
  async getStates(): Promise<State[]> {
    try {
      return await fetchWithTimeout<State[]>('/api/geo/states');
    } catch {
      return localStates;
    }
  },

  async getState(id: string): Promise<State | undefined> {
    try {
      return await fetchWithTimeout<State>(`/api/geo/states/${id}`);
    } catch {
      return localStates.find(s => s.id === id);
    }
  },

  async getDistricts(stateId?: string): Promise<District[]> {
    try {
      const query = stateId ? `?state_id=${stateId}` : '';
      return await fetchWithTimeout<District[]>(`/api/geo/districts${query}`);
    } catch {
      return stateId ? localDistricts.filter(d => d.stateId === stateId) : localDistricts;
    }
  },

  async getDistrict(id: string): Promise<District | undefined> {
    try {
      return await fetchWithTimeout<District>(`/api/geo/districts/${id}`);
    } catch {
      return localDistricts.find(d => d.id === id);
    }
  },

  // ===== LOGISTICS =====
  async getHubs(): Promise<LogisticsHub[]> {
    try {
      return await fetchWithTimeout<LogisticsHub[]>('/api/logistics/hubs');
    } catch {
      return localHubs;
    }
  },

  async getRoads(operationalOnly = false): Promise<Road[]> {
    try {
      const query = operationalOnly ? '?operational_only=true' : '';
      return await fetchWithTimeout<Road[]>(`/api/logistics/roads${query}`);
    } catch {
      return operationalOnly ? localRoads.filter(r => r.isOperational) : localRoads;
    }
  },

  async getAirports(): Promise<Airport[]> {
    try {
      return await fetchWithTimeout<Airport[]>('/api/logistics/airports');
    } catch {
      return localAirports;
    }
  },

  async getRailwayStations(): Promise<RailwayStation[]> {
    try {
      return await fetchWithTimeout<RailwayStation[]>('/api/logistics/railway-stations');
    } catch {
      return localRailways;
    }
  },

  async getLogisticsKPIs(): Promise<any> {
    try {
      return await fetchWithTimeout('/api/logistics/kpis');
    } catch {
      return {
        totalDistricts: localDistricts.length,
        totalPopulation: localDistricts.reduce((s, d) => s + d.population, 0),
        avgAccessibilityScore: Math.round(localDistricts.reduce((s, d) => s + d.accessibilityScore, 0) / localDistricts.length),
        avgRiskScore: Math.round(localDistricts.reduce((s, d) => s + d.riskScore, 0) / localDistricts.length),
        activeHubs: localHubs.length,
        totalHubCapacityTons: localHubs.reduce((s, h) => s + h.capacity, 0),
        avgHubUtilizationPercent: Math.round(localHubs.reduce((s, h) => s + h.currentUtilization, 0) / localHubs.length),
        totalRoadNetworkKm: localRoads.reduce((s, r) => s + r.distance, 0),
        operationalRoadsCount: localRoads.filter(r => r.isOperational).length,
      };
    }
  },

  // ===== ROUTE OPTIMIZATION =====
  async optimizeRoute(request: RouteOptimizationRequest): Promise<OptimizedRoute[]> {
    try {
      return await fetchWithTimeout<OptimizedRoute[]>('/api/routing/optimize', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch {
      return localOptimizeRoutes(request);
    }
  },

  async getRouteGraph(): Promise<{ nodes: any[]; edges: any[] }> {
    try {
      return await fetchWithTimeout<{ nodes: any[]; edges: any[] }>('/api/routing/graph');
    } catch {
      return { nodes: localGraphNodes, edges: localGraphEdges };
    }
  },

  // ===== ACCESSIBILITY =====
  async getAccessibilityScores(): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>('/api/accessibility/districts');
    } catch {
      return localComputeAllAcc(localDistricts);
    }
  },

  async getDistrictAccessibility(id: string): Promise<any> {
    try {
      return await fetchWithTimeout<any>(`/api/accessibility/districts/${id}`);
    } catch {
      const d = localDistricts.find(item => item.id === id);
      return d ? localComputeAcc(d) : null;
    }
  },

  // ===== RISK INTELLIGENCE =====
  async getDistrictRisks(): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>('/api/risk/districts');
    } catch {
      return localAssessRisks();
    }
  },

  async getRiskEvents(activeOnly = false): Promise<RiskEvent[]> {
    try {
      const query = activeOnly ? '?active_only=true' : '';
      return await fetchWithTimeout<RiskEvent[]>(`/api/risk/events${query}`);
    } catch {
      return activeOnly
        ? localRiskEvents.filter(e => !e.endDate || e.endDate >= '2026-08-28')
        : localRiskEvents;
    }
  },

  async getDistrictWeather(districtId: string): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>(`/api/risk/weather/${districtId}`);
    } catch {
      const d = localDistricts.find(item => item.id === districtId);
      return d ? localGenWeather(districtId, d.terrain) : [];
    }
  },

  // ===== DEMAND FORECASTING =====
  async getDemandForecasts(): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>('/api/demand/forecasts');
    } catch {
      return localForecastAll();
    }
  },

  async getDistrictDemandForecast(districtId: string): Promise<any> {
    try {
      return await fetchWithTimeout<any>(`/api/demand/forecasts/${districtId}`);
    } catch {
      return localForecastDemand(districtId);
    }
  },

  // ===== INFRASTRUCTURE GAPS =====
  async getInfrastructureGaps(): Promise<InfrastructureGap[]> {
    try {
      return await fetchWithTimeout<InfrastructureGap[]>('/api/infrastructure/gaps');
    } catch {
      return localAnalyzeGaps();
    }
  },

  async getInfrastructureGapsByState(): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>('/api/infrastructure/by-state');
    } catch {
      return localGapsByState();
    }
  },

  // ===== SCENARIO SIMULATOR =====
  async simulateScenario(input: ScenarioInput): Promise<ScenarioResult> {
    try {
      return await fetchWithTimeout<ScenarioResult>('/api/scenario/simulate', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return localSimulateScenario(input);
    }
  },

  async getScenarioPresets(): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>('/api/scenario/presets');
    } catch {
      return localGetPresets();
    }
  },

  // ===== AI COPILOT =====
  async askCopilot(
    query: string,
    apiKey?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<CopilotMessage> {
    // 1. Try FastAPI backend if accessible
    try {
      return await fetchWithTimeout<CopilotMessage>('/api/copilot/query', {
        method: 'POST',
        body: JSON.stringify({ query, api_key: apiKey }),
      }, 3500);
    } catch {
      // 2. Try Next.js serverless route /api/copilot (works natively on Vercel and local)
      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, apiKey, conversationHistory }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (serverlessErr) {
        console.warn('Next.js serverless copilot route error:', serverlessErr);
      }
      // 3. Resilient fallback to local engine
      return localProcessCopilot(query);
    }
  },

  // ===== SPATIAL QUERIES =====
  async getNearestHubs(lat: number, lng: number, limit = 5): Promise<any[]> {
    try {
      return await fetchWithTimeout<any[]>(`/api/spatial/nearest-hubs?lat=${lat}&lng=${lng}&limit=${limit}`);
    } catch {
      // Haversine fallback
      return localHubs
        .map(h => {
          const dLat = ((h.lat - lat) * Math.PI) / 180;
          const dLng = ((h.lng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((h.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...h, distanceKm: Math.round(dist * 10) / 10 };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit);
    }
  },

  async searchRadius(lat: number, lng: number, radiusKm = 100): Promise<any> {
    try {
      return await fetchWithTimeout(`/api/spatial/radius-search?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
    } catch {
      return { center: { lat, lng }, radiusKm, counts: { hubs: 0, airports: 0 } };
    }
  },

  async searchBoundingBox(minLat: number, minLng: number, maxLat: number, maxLng: number): Promise<any> {
    try {
      return await fetchWithTimeout(`/api/spatial/bbox?min_lat=${minLat}&min_lng=${minLng}&max_lat=${maxLat}&max_lng=${maxLng}`);
    } catch {
      return { bbox: { minLat, minLng, maxLat, maxLng }, districts: [], hubs: [] };
    }
  },

  // ===== REAL-TIME TELEMETRY =====
  async getRealtimeFeed(): Promise<any> {
    try {
      return await fetchWithTimeout('/api/realtime/feed');
    } catch {
      const now = new Date();
      return {
        timestamp: now.toISOString(),
        networkStatus: 'OPTIMAL',
        activeVehiclesCount: 5,
        activeCorridors: 18,
        liveTelemetryPingsPerMin: 840,
        convoys: [
          {
            id: 'CONVOY-NER-101',
            corridor: 'Guwahati → Tawang (NH-13)',
            origin: 'Guwahati',
            destination: 'Tawang',
            driver: 'Tsering Dorjee',
            cargo: 'High-Altitude Medical Supplies & Fuel',
            weightTons: 14.5,
            currentLat: 27.266,
            currentLng: 92.42,
            speedKmh: 28.4,
            status: 'in_transit',
            delayRisk: 'High (Sela Pass Debris)',
            etaHours: 4.5,
            lastTelemetryPing: now.toISOString(),
          },
          {
            id: 'CONVOY-NER-204',
            corridor: 'Dimapur → Imphal (NH-2)',
            origin: 'Dimapur',
            destination: 'Imphal',
            driver: 'Rajen Singh',
            cargo: 'Essential FMCG & Grains',
            weightTons: 22.0,
            currentLat: 25.35,
            currentLng: 94.02,
            speedKmh: 35.2,
            status: 'in_transit',
            delayRisk: 'Medium (Mao Gate Single Lane)',
            etaHours: 2.2,
            lastTelemetryPing: now.toISOString(),
          },
          {
            id: 'CONVOY-NER-309',
            corridor: 'Siliguri → Gangtok (NH-10)',
            origin: 'Siliguri',
            destination: 'Gangtok',
            driver: 'Bikash Pradhan',
            cargo: 'Pharmaceuticals & Cold Storage',
            weightTons: 8.0,
            currentLat: 27.15,
            currentLng: 88.52,
            speedKmh: 41.0,
            status: 'in_transit',
            delayRisk: 'Low (Clear Corridors)',
            etaHours: 1.1,
            lastTelemetryPing: now.toISOString(),
          },
        ],
        liveAlerts: [
          {
            id: 'live-alert-1',
            corridor: 'NH-13 (Tawang Access)',
            message: 'Active monitoring: Fog advisory near Sela Pass. Recommended speed 25 km/h.',
            severity: 'high',
            timestamp: 'Just now',
          },
        ],
      };
    }
  },
};

export default api;
