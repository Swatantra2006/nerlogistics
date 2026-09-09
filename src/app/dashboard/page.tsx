'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Gauge, Route, AlertTriangle, TrendingUp, Clock,
  Building2, Bell, MapPin, ArrowUpRight, ArrowDownRight,
  ChevronRight, Shield, Activity, RefreshCw, Truck, Radio,
  Compass, Zap, Eye
} from 'lucide-react';
import { districts, states, logisticsHubs, riskEvents, roads } from '@/data/ner-data';
import { computeAllAccessibility } from '@/modules/accessibility/engine';
import { assessAllRisks, getActiveAlerts } from '@/modules/risk/engine';
import { getTopGaps } from '@/modules/infrastructure/engine';
import { DashboardKPIs, getAccessibilityColor, getRiskColor } from '@/types';
import { formatNumber } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

const NERMap = dynamic(() => import('@/components/maps/NERMap'), {
  ssr: false,
  loading: () => <div className="skeleton rounded-xl" style={{ height: '480px' }} />
});

export default function DashboardPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [realtimeFeed, setRealtimeFeed] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [filterCorridor, setFilterCorridor] = useState<string>('all');

  // Baseline calculated models
  const accessibility = useMemo(() => computeAllAccessibility(districts), []);
  const risks = useMemo(() => assessAllRisks(), []);
  const alerts = useMemo(() => getActiveAlerts(), []);
  const gaps = useMemo(() => getTopGaps(5), []);

  const avgAccessibility = Math.round(
    accessibility.reduce((s, a) => s + a.overallScore, 0) / accessibility.length
  );
  const highRiskCount = risks.filter(r => r.level === 'CRITICAL' || r.level === 'HIGH').length;
  const activeRoutes = roads.filter(r => r.isOperational).length;

  // Real-time feed fetcher
  const fetchLiveTelemetry = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const feed = await api.getRealtimeFeed();
      setRealtimeFeed(feed);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Live telemetry fetch fallback used:', err);
    } finally {
      if (manual) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  // Poll real-time updates every 6 seconds
  useEffect(() => {
    fetchLiveTelemetry(false);
    const interval = setInterval(() => {
      fetchLiveTelemetry(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  const convoys = realtimeFeed?.convoys || [
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
      lastTelemetryPing: new Date().toISOString(),
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
      lastTelemetryPing: new Date().toISOString(),
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
      lastTelemetryPing: new Date().toISOString(),
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
      lastTelemetryPing: new Date().toISOString(),
    },
  ];

  const filteredConvoys = filterCorridor === 'all' 
    ? convoys 
    : convoys.filter((c: any) => c.id === filterCorridor || c.status === filterCorridor);

  const kpis: { icon: any; label: string; value: string; sub: string; trend?: number; color: string }[] = [
    { icon: Gauge, label: 'Accessibility Score', value: `${avgAccessibility}/100`, sub: '↑ 4.8% this month', trend: 4.8, color: '#6366f1' },
    { icon: Route, label: 'Active Routes', value: `${activeRoutes}`, sub: `${roads.length} total corridors`, color: '#34d399' },
    { icon: Radio, label: 'Live Convoys Tracked', value: `${realtimeFeed?.summary?.activeConvoys || convoys.length}`, sub: `${realtimeFeed?.summary?.totalFreightTons || '47.4'} tons active`, color: '#38bdf8' },
    { icon: AlertTriangle, label: 'Hazard Warnings', value: `${roads.filter(r => r.riskScore > 65).length}`, sub: `${highRiskCount} critical districts`, color: '#f97316' },
    { icon: TrendingUp, label: 'Predicted Demand', value: '2,840 t/d', sub: '↑ 12.3% vs benchmark', trend: 12.3, color: '#a78bfa' },
    { icon: Clock, label: 'Avg Travel Time', value: '8.2 hrs', sub: 'Regional corridor avg', color: '#fbbf24' },
    { icon: Bell, label: 'Disruption Alerts', value: `${alerts.length}`, sub: `${alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} high severity`, color: '#f43f5e' },
  ];

  const selectedDistrictData = selectedDistrict ? districts.find(d => d.id === selectedDistrict) : null;
  const selectedAccessibility = selectedDistrict ? accessibility.find(a => a.districtId === selectedDistrict) : null;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header with Live Status & Manual Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-900/60 p-4 rounded-xl border border-primary-500/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">NER Logistics Intelligence</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              v2.4 REAL-TIME
            </span>
          </div>
          <p className="text-xs sm:text-sm text-surface-400 mt-0.5">
            AI-Powered Multi-Modal Corridor Operations & Risk Intelligence for North Eastern India
          </p>
        </div>

        {/* Live Pulse Indicator & Sync Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 -ml-4" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Live Stream
            </span>
          </div>

          <div className="text-[11px] text-surface-400 hidden md:block">
            Synced: <span className="text-surface-200 font-mono">{lastSyncTime}</span>
          </div>

          <button
            onClick={() => fetchLiveTelemetry(true)}
            disabled={isRefreshing}
            aria-label="Refresh real-time telemetry"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-xs font-medium text-surface-200 border border-surface-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Mobile: 2 cols, Tablet: 4 cols, Desktop: 7 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card p-3 sm:p-4 rounded-xl">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider line-clamp-1">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: kpi.color }} />
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mb-0.5 tracking-tight">{kpi.value}</div>
              <div className="flex items-center gap-1">
                {kpi.trend !== undefined && (
                  kpi.trend > 0 
                    ? <ArrowUpRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    : <ArrowDownRight className="w-3 h-3 text-rose-400 flex-shrink-0" />
                )}
                <span className="text-[10px] text-surface-400 line-clamp-1">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time GPS Freight Convoys Telemetry Strip */}
      <div className="glass-card p-4 rounded-xl border border-primary-500/20 bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-surface-900/90 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-surface-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Live Freight Telemetry Stream
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                  {convoys.length} ACTIVE UNITS
                </span>
              </h2>
              <p className="text-[11px] text-surface-400">
                GPS telemetry, real-time vehicle velocity, cargo type & dynamic route delay assessments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-surface-400 text-[11px]">Filter:</span>
            <select
              value={filterCorridor}
              onChange={(e) => setFilterCorridor(e.target.value)}
              className="bg-surface-800 text-surface-200 text-xs rounded-lg px-2.5 py-1 border border-surface-700 outline-none focus:border-primary-500"
            >
              <option value="all">All Live Units</option>
              <option value="in_transit">In Transit Only</option>
              {convoys.map((c: any) => (
                <option key={c.id} value={c.id}>{c.vehicleNumber} ({c.id})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Moving Convoys Responsive Cards / Horizontal Scroller */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {filteredConvoys.map((convoy: any) => (
            <div
              key={convoy.id}
              className="p-3.5 rounded-xl bg-surface-900/80 border border-surface-800 hover:border-cyan-500/30 transition-all shadow-md group relative overflow-hidden"
            >
              {/* Top Row: Unit ID & Live Velocity */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-white">{convoy.vehicleNumber}</span>
                  <span className="text-[10px] text-surface-400">({convoy.id})</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-surface-800 text-[11px] font-mono font-semibold text-cyan-300 border border-cyan-500/20">
                  {convoy.speedKmh} km/h
                </div>
              </div>

              {/* Corridor Route */}
              <div className="text-xs font-semibold text-surface-100 mb-1 flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <span className="truncate">{convoy.corridor}</span>
              </div>

              {/* Cargo & Driver */}
              <div className="text-[11px] text-surface-400 space-y-1 mb-2.5">
                <div className="flex justify-between">
                  <span>Cargo:</span>
                  <span className="text-surface-200 font-medium truncate max-w-[140px]">{convoy.cargo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight & Driver:</span>
                  <span className="text-surface-300">{convoy.weightTons}t • {convoy.driver}</span>
                </div>
                <div className="flex justify-between font-mono text-[10px]">
                  <span>GPS Ping:</span>
                  <span className="text-surface-400">{convoy.currentLat.toFixed(2)}°N, {convoy.currentLng.toFixed(2)}°E</span>
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-2 border-t border-surface-800/80 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ETA {convoy.etaHours}h
                </span>
                <span className={`px-1.5 py-0.5 rounded font-medium ${
                  convoy.delayRisk?.toLowerCase().includes('low') 
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}>
                  {convoy.delayRisk?.split(' ')[0] || 'Nominal'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Sidebar Details */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Interactive Map */}
        <div className="xl:col-span-3">
          <div className="glass-card overflow-hidden rounded-xl border border-primary-500/10">
            <div className="px-4 py-3 border-b border-primary-500/10 flex flex-wrap items-center justify-between gap-2 bg-surface-900/40">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-semibold text-white">NER Geospatial Operations Map</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-surface-400 hidden sm:inline">
                  8 States • 24 Key Nodes
                </span>
              </div>
              <span className="text-[11px] text-surface-400">Tap / click districts for metrics</span>
            </div>

            <NERMap
              height="480px"
              showLayers={true}
              highlightDistrict={selectedDistrict || undefined}
              onDistrictClick={setSelectedDistrict}
            />
          </div>
        </div>

        {/* Selected District and Real-time Alerts */}
        <div className="space-y-4">
          {/* Selected District Card */}
          {selectedDistrictData && selectedAccessibility ? (
            <div className="glass-card p-4 rounded-xl animate-slide-in-right border border-primary-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedDistrictData.name}</h3>
                  <span className="text-[10px] text-surface-400">
                    {states.find(s => s.id === selectedDistrictData.stateId)?.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="text-[10px] text-surface-400 hover:text-white px-2 py-1 rounded bg-surface-800"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="text-center p-2 rounded-lg bg-surface-900/60 border border-surface-800">
                  <div className="text-lg font-bold" style={{ color: getAccessibilityColor(selectedAccessibility.overallScore) }}>
                    {selectedAccessibility.overallScore}
                  </div>
                  <div className="text-[10px] text-surface-400">Accessibility</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-900/60 border border-surface-800">
                  <div className="text-lg font-bold" style={{ color: getRiskColor(selectedDistrictData.riskScore) }}>
                    {selectedDistrictData.riskScore}
                  </div>
                  <div className="text-[10px] text-surface-400">Risk Factor</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-surface-800/50">
                  <span className="text-surface-400">Population</span>
                  <span className="text-white font-medium">{formatNumber(selectedDistrictData.population)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-800/50">
                  <span className="text-surface-400">Road Connectivity</span>
                  <span className="text-white font-medium">{selectedDistrictData.roadConnectivity}/100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-800/50">
                  <span className="text-surface-400">Nearest Hub</span>
                  <span className="text-white font-medium">{selectedDistrictData.nearestHubDistance} km</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-800/50">
                  <span className="text-surface-400">Avg Delivery Time</span>
                  <span className="text-white font-medium">{selectedDistrictData.avgDeliveryTime} hrs</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-surface-400">Terrain Gradient</span>
                  <span className="text-white font-medium capitalize">{selectedDistrictData.terrain}</span>
                </div>
              </div>

              <Link
                href={`/dashboard/accessibility`}
                className="mt-3.5 w-full btn-secondary text-xs justify-center py-2 flex items-center gap-1.5"
              >
                Deep-Dive Analytics <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="glass-card p-5 text-center rounded-xl border border-surface-800">
              <MapPin className="w-6 h-6 text-primary-400/60 mx-auto mb-2" />
              <p className="text-xs text-white font-medium">Interactive Regional Inspection</p>
              <p className="text-[11px] text-surface-400 mt-1">
                Select any district on the map above to view road density, ruggedness index, and hub transit delays.
              </p>
            </div>
          )}

          {/* Active Alerts */}
          <div className="glass-card p-4 rounded-xl border border-surface-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Active Alerts</span>
              </div>
              <span className="badge badge-warning text-[10px]">{alerts.length}</span>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-surface-900/60 border border-surface-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/15 text-rose-400'
                        : alert.severity === 'high'
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-surface-400">{alert.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-white font-medium mb-0.5">{alert.location}</p>
                  <p className="text-[11px] text-surface-400 leading-snug line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>

            <Link href="/dashboard/risk" className="mt-3 w-full btn-secondary text-xs justify-center py-2 flex items-center gap-1">
              View All Hazard Alerts <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Infrastructure Gaps & State Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Infrastructure Gaps */}
        <div className="glass-card p-4 rounded-xl border border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-semibold text-white">Priority Infrastructure Gaps</span>
            </div>
            <Link href="/dashboard/infrastructure" className="text-[11px] text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View Gaps <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <div key={gap.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-900/40 hover:bg-surface-900/70 transition-colors">
                <div className="w-6 h-6 rounded-md bg-surface-800 flex items-center justify-center text-[10px] font-bold text-surface-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{gap.districtName}</div>
                  <div className="text-[10px] text-surface-500">{gap.stateName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: gap.priority === 'critical' ? '#f43f5e' : gap.priority === 'high' ? '#f97316' : '#fbbf24' }}>
                    {gap.gapScore}/100
                  </div>
                  <div className="text-[9px] text-surface-500 uppercase">{gap.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Overview */}
        <div className="glass-card p-4 rounded-xl border border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-white">NER State Breakdown</span>
            </div>
            <Link href="/dashboard/analytics" className="text-[11px] text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Analytics <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {states.map((state) => {
              const stateDistricts = accessibility.filter(a => a.stateId === state.id);
              const avgScore = Math.round(
                stateDistricts.reduce((s, d) => s + d.overallScore, 0) / (stateDistricts.length || 1)
              );
              const stateRisks = risks.filter(r => r.stateId === state.id);
              const avgRisk = Math.round(
                stateRisks.reduce((s, r) => s + r.overallRisk, 0) / (stateRisks.length || 1)
              );

              return (
                <div key={state.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-900/40">
                  <div className="w-2 h-7 rounded-full" style={{ backgroundColor: getAccessibilityColor(avgScore) }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{state.name}</div>
                    <div className="text-[10px] text-surface-500">{stateDistricts.length} districts recorded</div>
                  </div>
                  <div className="flex gap-4 items-center flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: getAccessibilityColor(avgScore) }}>{avgScore}</div>
                      <div className="text-[9px] text-surface-500">Access</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: getRiskColor(avgRisk) }}>{avgRisk}</div>
                      <div className="text-[9px] text-surface-500">Risk</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
