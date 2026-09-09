'use client';

import { useState, useMemo } from 'react';
import { FlaskConical, Play, RotateCcw, AlertTriangle, ArrowDown, ArrowUp, MapPin, Clock, IndianRupee, Users } from 'lucide-react';
import { districts, states } from '@/data/ner-data';
import { simulateScenario, getScenarioPresets } from '@/modules/scenario/engine';
import { ScenarioResult, getAccessibilityColor } from '@/types';

export default function SimulatorPage() {
  const presets = getScenarioPresets();
  const [selectedPreset, setSelectedPreset] = useState(presets[0].id);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleSimulate = () => {
    setIsRunning(true);
    const preset = presets.find(p => p.id === selectedPreset)!;
    setTimeout(() => {
      const simResult = simulateScenario(preset.input);
      setResult(simResult);
      setIsRunning(false);
    }, 1000);
  };

  const currentPreset = presets.find(p => p.id === selectedPreset)!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-purple-400" />
          Scenario Simulator
        </h1>
        <p className="text-sm text-surface-400 mt-1">What-if analysis for logistics disruptions and interventions</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Scenario Selection */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Select Scenario</h3>
          <div className="space-y-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => { setSelectedPreset(preset.id); setResult(null); }}
                className={`w-full text-left p-3 rounded-lg transition-all text-xs ${
                  selectedPreset === preset.id
                    ? 'bg-primary-500/15 border border-primary-500/30 text-white'
                    : 'bg-surface-900/30 border border-transparent text-surface-400 hover:bg-surface-900/50'
                }`}
              >
                <div className="font-semibold text-sm mb-0.5">{preset.name}</div>
                <div className="text-[11px] opacity-80">{preset.description}</div>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-surface-900/50 border border-primary-500/5">
            <p className="text-xs text-surface-400 mb-1">Scenario Type:</p>
            <p className="text-sm font-medium text-white capitalize">{currentPreset.input.type.replace('_', ' ')}</p>
            {currentPreset.input.details && (
              <p className="text-[11px] text-surface-500 mt-1">{currentPreset.input.details}</p>
            )}
          </div>

          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {isRunning ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulating...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Simulation</>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="xl:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Impact KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="kpi-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] font-semibold text-surface-400 uppercase">Affected Districts</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-400">{result.affectedDistricts}</div>
                </div>
                <div className="kpi-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] font-semibold text-surface-400 uppercase">Routes Disrupted</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{result.routesDisrupted}</div>
                </div>
                <div className="kpi-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-semibold text-surface-400 uppercase">Est. Delay</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {result.estimatedDelay > 0 ? '+' : ''}{result.estimatedDelay} hrs
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-[10px] font-semibold text-surface-400 uppercase">
                      {result.additionalCost >= 0 ? 'Add. Cost/Day' : 'Savings/Day'}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${result.additionalCost >= 0 ? 'text-rose-400' : 'text-accent-400'}`}>
                    ₹{Math.abs(result.additionalCost).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="kpi-card flex items-center gap-3">
                <Users className="w-5 h-5 text-primary-400" />
                <div>
                  <div className="text-[10px] font-semibold text-surface-400 uppercase">Population Impacted</div>
                  <div className="text-lg font-bold text-white">{(result.populationImpacted / 100000).toFixed(1)} Lakh</div>
                </div>
              </div>

              {/* Accessibility Impact */}
              {result.accessibilityImpact.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Accessibility Impact</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {result.accessibilityImpact.map(impact => {
                      const district = districts.find(d => d.id === impact.districtId);
                      const change = impact.after - impact.before;
                      return (
                        <div key={impact.districtId} className="flex items-center gap-3 p-2 rounded-lg bg-surface-900/30">
                          <div className="flex-1">
                            <span className="text-xs font-medium text-white">{district?.name || impact.districtId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium" style={{ color: getAccessibilityColor(impact.before) }}>{impact.before}</span>
                            <span className="text-surface-600">→</span>
                            <span className="text-xs font-medium" style={{ color: getAccessibilityColor(impact.after) }}>{impact.after}</span>
                            <span className={`text-[10px] font-bold ${change > 0 ? 'text-accent-400' : 'text-rose-400'}`}>
                              {change > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                              {Math.abs(change)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">AI Recommendation</h3>
                <div className="p-4 rounded-lg bg-primary-500/5 border border-primary-500/10">
                  <p className="text-sm text-surface-300 leading-relaxed">{result.recommendation}</p>
                </div>
                {result.alternateRoutes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-surface-400 mb-2">Alternate Routes:</p>
                    <div className="space-y-1">
                      {result.alternateRoutes.map((route, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-surface-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                          {route}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <FlaskConical className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-surface-400 mb-2">Select a scenario and run simulation</h3>
              <p className="text-sm text-surface-500">The simulator will analyze the impact on districts, routes, accessibility, and costs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
