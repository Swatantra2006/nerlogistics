'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Route as RouteIcon, Navigation, Weight, Package, Truck, Shield, Gauge, Clock, IndianRupee, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cityOptions } from '@/data/ner-data';
import { optimizeRoutes } from '@/modules/routing/engine';
import { OptimizedRoute, RouteOptimizationRequest, getAccessibilityColor, getRiskColor } from '@/types';

const NERMap = dynamic(() => import('@/components/maps/NERMap'), { ssr: false, loading: () => <div className="skeleton" style={{ height: '450px' }} /> });

const cargoTypes = ['General', 'FMCG', 'Construction', 'Agriculture', 'Fuel', 'Medical', 'Electronics', 'Perishable'];
const vehicleTypes = ['Light Truck (< 3.5t)', 'Medium Truck (3.5-12t)', 'Heavy Truck (12-25t)', 'Multi-axle (25t+)'];

export default function RouteOptimizerPage() {
  const [origin, setOrigin] = useState('guwahati');
  const [destination, setDestination] = useState('tawang');
  const [cargoWeight, setCargoWeight] = useState(500);
  const [cargoType, setCargoType] = useState('General');
  const [vehicleType, setVehicleType] = useState('Medium Truck (3.5-12t)');
  const [priority, setPriority] = useState<'fastest' | 'cheapest' | 'safest' | 'balanced'>('safest');
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [isComputing, setIsComputing] = useState(false);
  const [hasComputed, setHasComputed] = useState(false);

  const handleOptimize = () => {
    setIsComputing(true);
    // Simulate computation time for UX
    setTimeout(() => {
      const result = optimizeRoutes({
        origin, destination, cargoWeight, cargoType, vehicleType, priority,
      });
      setRoutes(result);
      setSelectedRoute(0);
      setIsComputing(false);
      setHasComputed(true);
    }, 800);
  };

  const activeRoute = routes[selectedRoute];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <RouteIcon className="w-6 h-6 text-primary-400" />
          AI Route Optimizer
        </h1>
        <p className="text-sm text-surface-400 mt-1">Dijkstra-based weighted routing with multi-priority optimization</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Input Panel */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary-400" />
            Route Configuration
          </h3>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Origin</label>
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="select-field">
              {cityOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Destination</label>
            <select value={destination} onChange={e => setDestination(e.target.value)} className="select-field">
              {cityOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Cargo Weight (kg)</label>
            <input type="number" value={cargoWeight} onChange={e => setCargoWeight(Number(e.target.value))} className="input-field" min={1} max={50000} />
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Cargo Type</label>
            <select value={cargoType} onChange={e => setCargoType(e.target.value)} className="select-field">
              {cargoTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-1 block">Vehicle Type</label>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="select-field">
              {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-surface-400 mb-2 block">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {(['fastest', 'cheapest', 'safest', 'balanced'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                    priority === p
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                      : 'bg-surface-900/50 text-surface-400 border border-transparent hover:border-primary-500/15'
                  }`}
                >
                  {p === 'fastest' && <Clock className="w-3 h-3 inline mr-1" />}
                  {p === 'cheapest' && <IndianRupee className="w-3 h-3 inline mr-1" />}
                  {p === 'safest' && <Shield className="w-3 h-3 inline mr-1" />}
                  {p === 'balanced' && <Gauge className="w-3 h-3 inline mr-1" />}
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={isComputing || origin === destination}
            className="btn-primary w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComputing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Computing Routes...</>
            ) : (
              <>Optimize Routes <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
          {origin === destination && <p className="text-xs text-rose-400">Origin and destination must be different</p>}
        </div>

        {/* Results */}
        <div className="xl:col-span-2 space-y-4">
          {/* Map */}
          <div className="glass-card overflow-hidden">
            <NERMap
              height="350px"
              showLayers={false}
              routeWaypoints={activeRoute?.waypoints}
            />
          </div>

          {/* Routes comparison */}
          {hasComputed && routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {routes.map((route, i) => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(i)}
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedRoute === i ? 'border-primary-500/40 shadow-lg shadow-primary-500/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{route.name}</span>
                    <span className="badge badge-info text-[10px]">{route.recommendation}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">Distance</span>
                      <span className="text-white font-medium">{route.distance} km</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">ETA</span>
                      <span className="text-white font-medium">{route.estimatedTime}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">Cost</span>
                      <span className="text-white font-medium">₹{route.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">Risk</span>
                      <span className="font-medium" style={{ color: getRiskColor(route.riskScore) }}>{route.riskScore}/100</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">Accessibility</span>
                      <span className="font-medium" style={{ color: getAccessibilityColor(route.accessibilityScore) }}>{route.accessibilityScore}/100</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-primary-500/10">
                    <div className="text-center">
                      <span className="text-lg font-bold text-primary-400">{route.routeScore}</span>
                      <span className="text-xs text-surface-500">/100 score</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasComputed ? (
            <div className="glass-card p-8 text-center">
              <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-surface-400">No route found between these locations.</p>
            </div>
          ) : null}

          {/* Route explanation */}
          {activeRoute && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Route Analysis — {activeRoute.name}</h3>
              <p className="text-xs text-surface-400 mb-3">{activeRoute.explanation.summary}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {activeRoute.explanation.factors.map((f, i) => (
                  <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
                    f.impact === 'positive' ? 'bg-accent-500/10 text-accent-400' :
                    f.impact === 'negative' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-surface-800 text-surface-400'
                  }`}>
                    {f.impact === 'positive' ? <CheckCircle2 className="w-3 h-3" /> :
                     f.impact === 'negative' ? <AlertTriangle className="w-3 h-3" /> : null}
                    {f.label}: {f.value}
                  </div>
                ))}
              </div>

              <div className="bg-surface-900/50 rounded-lg p-3 border border-primary-500/5">
                <p className="text-xs text-primary-300 italic">💡 {activeRoute.explanation.recommendation}</p>
              </div>

              {/* Segments table */}
              <div className="mt-4 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>From</th><th>To</th><th>Road</th><th>Distance</th><th>Time</th><th>Risk</th></tr>
                  </thead>
                  <tbody>
                    {activeRoute.segments.map((seg, i) => (
                      <tr key={i}>
                        <td className="capitalize text-xs">{seg.from}</td>
                        <td className="capitalize text-xs">{seg.to}</td>
                        <td className="text-xs font-medium">{seg.road}</td>
                        <td className="text-xs">{seg.distance} km</td>
                        <td className="text-xs">{seg.time}h</td>
                        <td className="text-xs font-medium" style={{ color: getRiskColor(seg.risk) }}>{seg.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
