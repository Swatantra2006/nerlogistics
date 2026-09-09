'use client';

import { useMemo, useState } from 'react';
import { districts, states } from '@/data/ner-data';
import { computeAllAccessibility, AccessibilityBreakdown } from '@/modules/accessibility/engine';
import { getAccessibilityColor } from '@/types';
import { Accessibility, Search, ArrowUpDown, ChevronDown, Info, MapPin } from 'lucide-react';

export default function AccessibilityPage() {
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'state'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterState, setFilterState] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<AccessibilityBreakdown | null>(null);

  const allAccessibility = useMemo(() => computeAllAccessibility(districts), []);

  const filtered = useMemo(() => {
    let result = [...allAccessibility];
    if (filterState !== 'all') result = result.filter(a => a.stateId === filterState);
    if (search) result = result.filter(a => a.districtName.toLowerCase().includes(search.toLowerCase()));
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'score') cmp = a.overallScore - b.overallScore;
      else if (sortBy === 'name') cmp = a.districtName.localeCompare(b.districtName);
      else cmp = a.stateId.localeCompare(b.stateId);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [allAccessibility, filterState, search, sortBy, sortDir]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Accessibility className="w-6 h-6 text-primary-400" />
          Accessibility Intelligence
        </h1>
        <p className="text-sm text-surface-400 mt-1">Multi-factor accessibility scoring for all NER districts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {['critical', 'poor', 'moderate', 'accessible', 'highly-accessible'].map(level => {
          const count = allAccessibility.filter(a => {
            const s = a.overallScore;
            if (level === 'critical') return s < 20;
            if (level === 'poor') return s >= 20 && s < 40;
            if (level === 'moderate') return s >= 40 && s < 60;
            if (level === 'accessible') return s >= 60 && s < 80;
            return s >= 80;
          }).length;
          const colors: Record<string, string> = { critical: '#ef4444', poor: '#f97316', moderate: '#fbbf24', accessible: '#34d399', 'highly-accessible': '#10b981' };
          return (
            <div key={level} className="kpi-card">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[level] }} />
                <span className="text-[10px] font-semibold text-surface-400 uppercase">{level.replace('-', ' ')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-[11px] text-surface-500">districts</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search districts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="select-field max-w-[200px]">
          <option value="all">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Table */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="cursor-pointer" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">District <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="cursor-pointer" onClick={() => toggleSort('state')}>
                    <div className="flex items-center gap-1">State <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="cursor-pointer" onClick={() => toggleSort('score')}>
                    <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th>Level</th>
                  <th>Road</th>
                  <th>Rail</th>
                  <th>Air</th>
                  <th>Hub Dist.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const district = districts.find(d => d.id === item.districtId)!;
                  return (
                    <tr key={item.districtId} className="cursor-pointer" onClick={() => setSelectedDistrict(item)}>
                      <td className="font-medium">{item.districtName}</td>
                      <td className="text-surface-400 text-xs">{states.find(s => s.id === item.stateId)?.name}</td>
                      <td>
                        <span className="font-bold text-sm" style={{ color: getAccessibilityColor(item.overallScore) }}>
                          {item.overallScore}
                        </span>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${item.overallScore >= 60 ? 'badge-success' : item.overallScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                          {item.level}
                        </span>
                      </td>
                      <td className="text-xs">{item.factors.roadConnectivity.score}</td>
                      <td className="text-xs">{item.factors.railConnectivity.score}</td>
                      <td className="text-xs">{item.factors.airportAccess.score}</td>
                      <td className="text-xs">{district.nearestHubDistance} km</td>
                      <td><Info className="w-3.5 h-3.5 text-surface-500" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedDistrict ? (
            <div className="glass-card p-5 animate-slide-in-right">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-primary-400" />
                <h3 className="text-base font-bold text-white">{selectedDistrict.districtName}</h3>
              </div>

              {/* Score Circle */}
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={getAccessibilityColor(selectedDistrict.overallScore)} strokeWidth="8"
                      strokeDasharray={`${selectedDistrict.overallScore * 3.27} ${327 - selectedDistrict.overallScore * 3.27}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: getAccessibilityColor(selectedDistrict.overallScore) }}>
                      {selectedDistrict.overallScore}
                    </span>
                    <span className="text-[10px] text-surface-500">/100</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <span className={`badge ${selectedDistrict.overallScore >= 60 ? 'badge-success' : selectedDistrict.overallScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                  {selectedDistrict.level}
                </span>
              </div>

              {/* Factor bars */}
              <div className="space-y-3">
                {Object.entries(selectedDistrict.factors).map(([key, factor]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium text-white">{factor.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${factor.score}%`,
                        backgroundColor: getAccessibilityColor(factor.score),
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-5 pt-4 border-t border-primary-500/10">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">AI Recommendations</p>
                <div className="space-y-2">
                  {selectedDistrict.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-primary-400 flex-shrink-0">💡</span>
                      <span className="text-surface-300 leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Info className="w-8 h-8 text-surface-600 mx-auto mb-2" />
              <p className="text-sm text-surface-500">Select a district from the table to view detailed accessibility analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
