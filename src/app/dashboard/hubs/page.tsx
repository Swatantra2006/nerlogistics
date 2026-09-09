'use client';

import { logisticsHubs, states } from '@/data/ner-data';
import { Warehouse, Truck, Package, ArrowUpRight, ArrowDownRight, Train, Plane } from 'lucide-react';
import { getUtilizationColor, getUtilizationStatus } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HubsPage() {
  const utilizationData = logisticsHubs.map(h => ({
    name: h.city,
    utilization: h.currentUtilization,
    capacity: h.capacity / 1000,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Warehouse className="w-6 h-6 text-primary-400" />
          Logistics Hub Intelligence
        </h1>
        <p className="text-sm text-surface-400 mt-1">Real-time monitoring of NER logistics hub network</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Total Hubs</div>
          <div className="text-2xl font-bold text-white">{logisticsHubs.length}</div>
          <div className="text-[11px] text-surface-500">{logisticsHubs.filter(h => h.type === 'major').length} major, {logisticsHubs.filter(h => h.type === 'regional').length} regional</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Avg Utilization</div>
          <div className="text-2xl font-bold text-white">{Math.round(logisticsHubs.reduce((s, h) => s + h.currentUtilization, 0) / logisticsHubs.length)}%</div>
          <div className="text-[11px] text-surface-500">Across all hubs</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Total Capacity</div>
          <div className="text-2xl font-bold text-white">{(logisticsHubs.reduce((s, h) => s + h.capacity, 0) / 1000).toFixed(0)}K tons</div>
          <div className="text-[11px] text-surface-500">Combined storage</div>
        </div>
        <div className="kpi-card">
          <div className="text-[10px] font-semibold text-surface-400 uppercase mb-1">Daily Shipments</div>
          <div className="text-2xl font-bold text-white">{logisticsHubs.reduce((s, h) => s + h.incomingShipments + h.outgoingShipments, 0)}</div>
          <div className="text-[11px] text-surface-500">In + Out combined</div>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Hub Utilization Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={utilizationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }} />
            <Bar dataKey="utilization" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} name="Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {logisticsHubs.map(hub => (
          <div key={hub.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{hub.name}</h3>
                <p className="text-[11px] text-surface-500">{hub.city}, {states.find(s => s.id === hub.stateId)?.name}</p>
              </div>
              <span className={`badge text-[10px] ${hub.type === 'major' ? 'badge-info' : hub.type === 'regional' ? 'badge-success' : 'badge-warning'}`}>
                {hub.type}
              </span>
            </div>

            {/* Utilization Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-surface-400">Utilization</span>
                <span className="font-semibold" style={{ color: getUtilizationColor(hub.currentUtilization) }}>
                  {hub.currentUtilization}% — {getUtilizationStatus(hub.currentUtilization)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${hub.currentUtilization}%`,
                  backgroundColor: getUtilizationColor(hub.currentUtilization),
                }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-surface-900/50">
                <div className="text-surface-500 text-[10px]">Capacity</div>
                <div className="font-medium text-white">{(hub.capacity / 1000).toFixed(0)}K tons</div>
              </div>
              <div className="p-2 rounded-lg bg-surface-900/50">
                <div className="text-surface-500 text-[10px]">Available</div>
                <div className="font-medium text-accent-400">{(hub.storageAvailable / 1000).toFixed(1)}K tons</div>
              </div>
              <div className="p-2 rounded-lg bg-surface-900/50">
                <div className="text-surface-500 text-[10px] flex items-center gap-1"><ArrowDownRight className="w-2.5 h-2.5" /> Incoming</div>
                <div className="font-medium text-white">{hub.incomingShipments}/day</div>
              </div>
              <div className="p-2 rounded-lg bg-surface-900/50">
                <div className="text-surface-500 text-[10px] flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5" /> Outgoing</div>
                <div className="font-medium text-white">{hub.outgoingShipments}/day</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-primary-500/10 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-surface-400">
                <div className={`w-2 h-2 rounded-full ${hub.hasRailAccess ? 'bg-accent-400' : 'bg-surface-600'}`} />
                <Train className="w-3 h-3" /> Rail
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-surface-400">
                <div className={`w-2 h-2 rounded-full ${hub.hasAirAccess ? 'bg-accent-400' : 'bg-surface-600'}`} />
                <Plane className="w-3 h-3" /> Air
              </div>
              <div className="ml-auto text-[11px] text-surface-500">
                Score: <span className="font-semibold text-white">{hub.connectivityScore}/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
