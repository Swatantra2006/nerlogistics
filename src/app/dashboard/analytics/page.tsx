'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Filter } from 'lucide-react';
import { districts, states, logisticsHubs, roads } from '@/data/ner-data';
import { computeAllAccessibility, getStateAccessibility } from '@/modules/accessibility/engine';
import { assessAllRisks } from '@/modules/risk/engine';
import { getGapsByState } from '@/modules/infrastructure/engine';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a78bfa', '#fb923c', '#34d399', '#f472b6'];

export default function AnalyticsPage() {
  const [stateFilter, setStateFilter] = useState('all');

  const accessibility = useMemo(() => computeAllAccessibility(districts), []);
  const stateAccess = useMemo(() => getStateAccessibility(districts), []);
  const risks = useMemo(() => assessAllRisks(), []);
  const stateGaps = useMemo(() => getGapsByState(), []);

  const accessByState = stateAccess.map(sa => ({
    state: states.find(s => s.id === sa.stateId)?.name?.split(' ')[0] || sa.stateId,
    score: sa.avgScore,
  })).sort((a, b) => b.score - a.score);

  const riskByState = states.map(s => {
    const stateRisks = risks.filter(r => r.stateId === s.id);
    return { state: s.name.split(' ')[0], risk: Math.round(stateRisks.reduce((sum, r) => sum + r.overallRisk, 0) / stateRisks.length) };
  }).sort((a, b) => b.risk - a.risk);

  const hubUtilization = logisticsHubs.map(h => ({ name: h.city, value: h.currentUtilization }));

  const accessibilityDistribution = [
    { name: 'Critical (<20)', value: accessibility.filter(a => a.overallScore < 20).length },
    { name: 'Poor (20-40)', value: accessibility.filter(a => a.overallScore >= 20 && a.overallScore < 40).length },
    { name: 'Moderate (40-60)', value: accessibility.filter(a => a.overallScore >= 40 && a.overallScore < 60).length },
    { name: 'Accessible (60-80)', value: accessibility.filter(a => a.overallScore >= 60 && a.overallScore < 80).length },
    { name: 'High (80+)', value: accessibility.filter(a => a.overallScore >= 80).length },
  ];

  const routeCondition = [
    { name: 'Excellent', value: roads.filter(r => r.condition === 'excellent').length },
    { name: 'Good', value: roads.filter(r => r.condition === 'good').length },
    { name: 'Fair', value: roads.filter(r => r.condition === 'fair').length },
    { name: 'Poor', value: roads.filter(r => r.condition === 'poor').length },
  ];

  const radarData = states.map(s => {
    const stateDistricts = districts.filter(d => d.stateId === s.id);
    return {
      state: s.name.split(' ')[0],
      access: Math.round(stateDistricts.reduce((sum, d) => sum + d.accessibilityScore, 0) / stateDistricts.length),
      road: Math.round(stateDistricts.reduce((sum, d) => sum + d.roadConnectivity, 0) / stateDistricts.length),
      rail: Math.round(stateDistricts.reduce((sum, d) => sum + d.railConnectivity, 0) / stateDistricts.length),
      air: Math.round(stateDistricts.reduce((sum, d) => sum + d.airportAccess, 0) / stateDistricts.length),
      infra: Math.round(stateDistricts.reduce((sum, d) => sum + d.infrastructureQuality, 0) / stateDistricts.length),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            Regional Analytics
          </h1>
          <p className="text-sm text-surface-400 mt-1">Comprehensive analytics across the NER logistics network</p>
        </div>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="select-field max-w-[200px]">
          <option value="all">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* State Accessibility */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">State-wise Accessibility Score</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={accessByState}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">State-wise Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskByState}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="risk" fill="#f97316" radius={[4, 4, 0, 0]} barSize={28} name="Avg Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accessibility Distribution Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Accessibility Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={accessibilityDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#475569' }}>
                {accessibilityDistribution.map((_, i) => <Cell key={i} fill={['#ef4444', '#f97316', '#fbbf24', '#34d399', '#10b981'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Route Condition */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Road Condition Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={routeCondition} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#475569' }}>
                {routeCondition.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hub Utilization */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Logistics Hub Utilization</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hubUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={24} name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Infrastructure Gap by State */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Infrastructure Gap by State</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stateGaps.map(sg => ({ state: sg.stateName.split(' ')[0], gap: sg.avgGap, critical: sg.criticalCount }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="gap" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} name="Avg Gap Score" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
