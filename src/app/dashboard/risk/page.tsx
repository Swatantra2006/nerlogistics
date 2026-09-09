'use client';

import { useMemo } from 'react';
import { AlertTriangle, Shield, Droplets, Mountain, Zap, Building, CloudRain, Globe } from 'lucide-react';
import { districts, states, riskEvents, roads } from '@/data/ner-data';
import { assessAllRisks, getActiveAlerts } from '@/modules/risk/engine';
import { getRiskColor } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function RiskPage() {
  const allRisks = useMemo(() => assessAllRisks(), []);
  const alerts = useMemo(() => getActiveAlerts(), []);
  const highRiskRoutes = roads.filter(r => r.riskScore > 60);

  const riskDistribution = [
    { level: 'Critical', count: allRisks.filter(r => r.level === 'CRITICAL').length, color: '#ef4444' },
    { level: 'High', count: allRisks.filter(r => r.level === 'HIGH').length, color: '#f97316' },
    { level: 'Medium', count: allRisks.filter(r => r.level === 'MEDIUM').length, color: '#fbbf24' },
    { level: 'Low', count: allRisks.filter(r => r.level === 'LOW').length, color: '#10b981' },
  ];

  const stateRiskData = states.map(s => {
    const stateRisks = allRisks.filter(r => r.stateId === s.id);
    const avg = Math.round(stateRisks.reduce((sum, r) => sum + r.overallRisk, 0) / stateRisks.length);
    return { state: s.name.split(' ')[0], risk: avg };
  }).sort((a, b) => b.risk - a.risk);

  const topRisk = allRisks[0];
  const radarData = topRisk ? [
    { factor: 'Flood', value: topRisk.factors.floodRisk },
    { factor: 'Landslide', value: topRisk.factors.landslideRisk },
    { factor: 'Earthquake', value: topRisk.factors.earthquakeRisk },
    { factor: 'Infrastructure', value: topRisk.factors.infrastructureRisk },
    { factor: 'Weather', value: topRisk.factors.weatherRisk },
    { factor: 'Connectivity', value: topRisk.factors.connectivityRisk },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          Risk & Disruption Intelligence
        </h1>
        <p className="text-sm text-surface-400 mt-1">Multi-hazard assessment and disruption monitoring</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {riskDistribution.map(rd => (
          <div key={rd.level} className="kpi-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rd.color }} />
              <span className="text-[10px] font-semibold text-surface-400 uppercase">{rd.level} Risk</span>
            </div>
            <div className="text-2xl font-bold text-white">{rd.count}</div>
            <div className="text-[11px] text-surface-500">districts</div>
          </div>
        ))}
      </div>

      {/* Active Alerts */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Active Disruption Alerts ({alerts.length})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map(alert => {
            const severityColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#fbbf24', low: '#10b981' };
            const icons: Record<string, any> = { flood: Droplets, landslide: Mountain, earthquake: Zap, heavy_rainfall: CloudRain, road_blockage: Shield, infrastructure_failure: Building };
            const Icon = icons[alert.type] || AlertTriangle;

            return (
              <div key={alert.id} className="p-4 rounded-xl bg-surface-900/40 border border-primary-500/5 hover:border-primary-500/15 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${severityColors[alert.severity]}15` }}>
                    <Icon className="w-4 h-4" style={{ color: severityColors[alert.severity] }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase" style={{ color: severityColors[alert.severity] }}>{alert.severity}</span>
                      <span className="text-[10px] text-surface-500">Risk: {alert.riskScore}/100</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{alert.location}</p>
                  </div>
                </div>
                <p className="text-xs text-surface-400 leading-relaxed mb-2">{alert.description}</p>
                <div className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/10">
                  <p className="text-xs text-primary-300 italic">💡 {alert.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* State-wise risk chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">State-wise Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stateRiskData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="risk" fill="#f97316" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top risk radar */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Risk Factor Analysis — {topRisk?.districtName}</h3>
          <p className="text-xs text-surface-500 mb-3">Highest risk district breakdown</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(99,102,241,0.1)" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} />
              <Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-risk routes */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">High-Risk Routes</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Route</th><th>From</th><th>To</th><th>Distance</th><th>Condition</th><th>Risk Score</th></tr>
            </thead>
            <tbody>
              {highRiskRoutes.sort((a, b) => b.riskScore - a.riskScore).map(road => (
                <tr key={road.id}>
                  <td className="font-medium text-xs">{road.name}</td>
                  <td className="text-xs text-surface-400">{road.fromCity}</td>
                  <td className="text-xs text-surface-400">{road.toCity}</td>
                  <td className="text-xs">{road.distance} km</td>
                  <td><span className={`badge text-[10px] ${road.condition === 'poor' ? 'badge-danger' : 'badge-warning'}`}>{road.condition}</span></td>
                  <td className="text-xs font-bold" style={{ color: getRiskColor(road.riskScore) }}>{road.riskScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top risk districts */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">District Risk Rankings</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>District</th><th>State</th><th>Overall</th><th>Flood</th><th>Landslide</th><th>Earthquake</th><th>Level</th></tr>
            </thead>
            <tbody>
              {allRisks.slice(0, 20).map((risk, i) => (
                <tr key={risk.districtId}>
                  <td className="text-xs text-surface-500">{i + 1}</td>
                  <td className="text-xs font-medium">{risk.districtName}</td>
                  <td className="text-xs text-surface-400">{states.find(s => s.id === risk.stateId)?.name}</td>
                  <td className="text-xs font-bold" style={{ color: getRiskColor(risk.overallRisk) }}>{risk.overallRisk}</td>
                  <td className="text-xs">{risk.factors.floodRisk}</td>
                  <td className="text-xs">{risk.factors.landslideRisk}</td>
                  <td className="text-xs">{risk.factors.earthquakeRisk}</td>
                  <td><span className={`badge text-[10px] ${risk.level === 'CRITICAL' ? 'badge-danger' : risk.level === 'HIGH' ? 'badge-warning' : 'badge-success'}`}>{risk.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
