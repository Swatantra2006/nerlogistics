'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { districts, states } from '@/data/ner-data';
import { forecastDemand } from '@/modules/demand/engine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';

export default function DemandPage() {
  const [selectedDistrict, setSelectedDistrict] = useState('kamrup-metro');
  const [selectedState, setSelectedState] = useState('all');

  const forecast = useMemo(() => forecastDemand(selectedDistrict), [selectedDistrict]);

  const filteredDistricts = selectedState === 'all' ? districts : districts.filter(d => d.stateId === selectedState);
  const allForecasts = useMemo(() => filteredDistricts.slice(0, 12).map(d => {
    try { return forecastDemand(d.id); } catch { return null; }
  }).filter(Boolean), [filteredDistricts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary-400" />
          Logistics Demand Intelligence
        </h1>
        <p className="text-sm text-surface-400 mt-1">AI-powered demand forecasting with seasonal decomposition</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="select-field max-w-[200px]">
          <option value="all">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="select-field max-w-[250px]">
          {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name} ({states.find(s => s.id === d.stateId)?.name})</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Current Demand</div>
          <div className="text-xl font-bold text-white">{forecast.currentDemand} t/day</div>
          <div className="text-[11px] text-surface-500">{forecast.districtName}</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">7-Day Forecast</div>
          <div className="text-xl font-bold text-accent-400">{forecast.forecast7Day} t/day</div>
          <div className="flex items-center gap-1 text-[11px]">
            {forecast.trend === 'increasing' ? <ArrowUpRight className="w-3 h-3 text-accent-400" /> : forecast.trend === 'decreasing' ? <ArrowDownRight className="w-3 h-3 text-rose-400" /> : <Minus className="w-3 h-3 text-surface-400" />}
            <span className="text-surface-500">{forecast.trend}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">30-Day Forecast</div>
          <div className="text-xl font-bold text-primary-400">{forecast.forecast30Day} t/day</div>
          <div className="text-[11px] text-surface-500">{forecast.trendPercentage > 0 ? '+' : ''}{forecast.trendPercentage}% trend</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Confidence</div>
          <div className="text-xl font-bold text-white">{forecast.confidence}%</div>
          <div className="text-[11px] text-surface-500">Model confidence</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Seasonal Pattern</div>
          <div className="text-xs text-surface-300 leading-relaxed">{forecast.seasonalPattern.slice(0, 60)}...</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Historical + Forecast Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Historical Demand & Forecast — {forecast.districtName}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[...forecast.historicalData.slice(-20), ...forecast.forecastData.map(f => ({ date: f.date, actual: undefined, predicted: f.predicted }))]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={2} name="Actual" dot={false} />
              <Area type="monotone" dataKey="predicted" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} strokeDasharray="4 4" name="Predicted" dot={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast with confidence band */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">14-Day Forecast with Confidence Band</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecast.forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="rgba(99,102,241,0.08)" name="Upper Bound" />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="rgba(15,23,42,0.9)" name="Lower Bound" />
              <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Forecast" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District comparison table */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">District Demand Comparison</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Current (t/day)</th>
                <th>7-Day Forecast</th>
                <th>30-Day Forecast</th>
                <th>Trend</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(allForecasts as NonNullable<typeof allForecasts[0]>[]).map(f => (
                <tr key={f.districtId} className="cursor-pointer" onClick={() => setSelectedDistrict(f.districtId)}>
                  <td className={`font-medium text-xs ${f.districtId === selectedDistrict ? 'text-primary-400' : ''}`}>{f.districtName}</td>
                  <td className="text-xs text-surface-400">{states.find(s => s.id === districts.find(d => d.id === f.districtId)?.stateId)?.name}</td>
                  <td className="text-xs font-medium">{f.currentDemand}</td>
                  <td className="text-xs text-accent-400 font-medium">{f.forecast7Day}</td>
                  <td className="text-xs text-primary-400 font-medium">{f.forecast30Day}</td>
                  <td>
                    <span className={`badge text-[10px] ${f.trend === 'increasing' ? 'badge-success' : f.trend === 'decreasing' ? 'badge-danger' : 'badge-info'}`}>
                      {f.trend === 'increasing' ? '↑' : f.trend === 'decreasing' ? '↓' : '→'} {f.trendPercentage}%
                    </span>
                  </td>
                  <td className="text-xs">{f.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
