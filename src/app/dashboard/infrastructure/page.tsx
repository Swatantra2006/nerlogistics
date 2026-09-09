'use client';

import { useMemo } from 'react';
import { Building2, MapPin, AlertTriangle, IndianRupee } from 'lucide-react';
import { states, districts } from '@/data/ner-data';
import { getTopGaps, getGapsByState } from '@/modules/infrastructure/engine';
import { getAccessibilityColor } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InfrastructurePage() {
  const gaps = useMemo(() => getTopGaps(20), []);
  const stateGaps = useMemo(() => getGapsByState(), []);

  const totalInvestment = gaps.reduce((s, g) => s + g.estimatedCost, 0);
  const criticalCount = gaps.filter(g => g.priority === 'critical').length;
  const highCount = gaps.filter(g => g.priority === 'high').length;

  const chartData = stateGaps.map(sg => ({
    state: sg.stateName.split(' ')[0],
    gap: sg.avgGap,
    critical: sg.criticalCount,
    cost: sg.totalCost,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-6 h-6 text-rose-400" />
          Infrastructure Gap Analysis
        </h1>
        <p className="text-sm text-surface-400 mt-1">Identifying priority areas for logistics infrastructure investment</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Critical Gaps</div>
          <div className="text-2xl font-bold text-rose-400">{criticalCount}</div>
          <div className="text-[11px] text-surface-500">Urgent intervention needed</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">High Priority</div>
          <div className="text-2xl font-bold text-orange-400">{highCount}</div>
          <div className="text-[11px] text-surface-500">Near-term planning needed</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Est. Investment</div>
          <div className="text-2xl font-bold text-white">₹{totalInvestment} Cr</div>
          <div className="text-[11px] text-surface-500">For top 20 priorities</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Districts Analyzed</div>
          <div className="text-2xl font-bold text-white">{districts.length}</div>
          <div className="text-[11px] text-surface-500">Across 8 states</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* State gap chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">State-wise Infrastructure Gap</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="gap" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} name="Avg Gap Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top priority cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Top Priority Areas</h3>
          {gaps.slice(0, 5).map((gap, i) => {
            const priorityColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#fbbf24', low: '#10b981' };
            return (
              <div key={gap.id} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: priorityColors[gap.priority] + '30', color: priorityColors[gap.priority] }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{gap.districtName}</h4>
                      <p className="text-[10px] text-surface-500">{gap.stateName}</p>
                    </div>
                  </div>
                  <span className="badge text-[10px]" style={{ backgroundColor: priorityColors[gap.priority] + '15', color: priorityColors[gap.priority], borderColor: priorityColors[gap.priority] + '25' }}>
                    {gap.priority.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                  <div className="p-1.5 rounded bg-surface-900/50">
                    <div className="text-[10px] text-surface-500">Demand</div>
                    <div className="text-xs font-bold text-white">{gap.demandPressure}</div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-900/50">
                    <div className="text-[10px] text-surface-500">Access</div>
                    <div className="text-xs font-bold" style={{ color: getAccessibilityColor(100 - gap.accessibilityDeficit) }}>{100 - gap.accessibilityDeficit}</div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-900/50">
                    <div className="text-[10px] text-surface-500">Hub Dist</div>
                    <div className="text-xs font-bold text-white">{gap.nearestHubDistance}km</div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-900/50">
                    <div className="text-[10px] text-surface-500">Gap</div>
                    <div className="text-xs font-bold text-rose-400">{gap.gapScore}</div>
                  </div>
                </div>
                <p className="text-[11px] text-surface-400 italic">💡 {gap.recommendedIntervention}</p>
                <div className="mt-2 text-[10px] text-surface-500">Est. Cost: ₹{gap.estimatedCost} Cr</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full table */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Complete Infrastructure Gap Rankings</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>District</th><th>State</th><th>Gap Score</th><th>Demand</th><th>Access Deficit</th><th>Risk</th><th>Hub Dist.</th><th>Priority</th><th>Est. Cost</th></tr>
            </thead>
            <tbody>
              {gaps.map((gap, i) => (
                <tr key={gap.id}>
                  <td className="text-xs text-surface-500">{i + 1}</td>
                  <td className="text-xs font-medium">{gap.districtName}</td>
                  <td className="text-xs text-surface-400">{gap.stateName}</td>
                  <td className="text-xs font-bold text-rose-400">{gap.gapScore}</td>
                  <td className="text-xs">{gap.demandPressure}</td>
                  <td className="text-xs">{gap.accessibilityDeficit}</td>
                  <td className="text-xs">{gap.riskFactor}</td>
                  <td className="text-xs">{gap.nearestHubDistance}km</td>
                  <td><span className={`badge text-[10px] ${gap.priority === 'critical' ? 'badge-danger' : gap.priority === 'high' ? 'badge-warning' : 'badge-success'}`}>{gap.priority}</span></td>
                  <td className="text-xs">₹{gap.estimatedCost}Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
