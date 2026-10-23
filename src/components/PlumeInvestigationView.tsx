/**
 * Upwind vs Downwind Plume & Gradient Investigation View
 * Physical directional analysis comparing ambient PM2.5 at upwind reference stations vs
 * downwind receptors relative to known construction, landfill, and industrial complexes in Mumbai.
 */

import React, { useEffect, useState } from 'react';
import { 
  Wind, 
  Flame, 
  Construction, 
  Factory, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Compass
} from 'lucide-react';
import { UpwindDownwindAnalysis } from '../types';

export const PlumeInvestigationView: React.FC = () => {
  const [analyses, setAnalyses] = useState<UpwindDownwindAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  const fetchPlumes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plume/analysis');
      const data = await res.json();
      if (data.success) {
        setAnalyses(data.analyses);
        if (!selectedHotspotId && data.analyses.length > 0) {
          setSelectedHotspotId(data.analyses[0].hotspot.id);
        }
      }
    } catch (err) {
      console.error('Failed to load plume analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlumes();
  }, []);

  const activeAnalysis = analyses.find(a => a.hotspot.id === selectedHotspotId) || analyses[0];

  return (
    <div className="space-y-6">
      {/* Header & Methodology Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Geospatial Atmospheric Physics</span>
              <span aria-hidden="true">·</span>
              <span>Vector Gradient Decomposition</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Upwind vs Downwind Plume Investigation
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Evaluates directional emission signatures from infrastructure works, municipal landfills, and industrial clusters by comparing upwind background vs downwind receptors under current wind vectors.
            </p>
          </div>

          <button
            onClick={fetchPlumes}
            className="px-3.5 py-2 text-xs font-semibold rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate Wind Vectors</span>
          </button>
        </div>

        {/* Physical Principle Note */}
        <div className="mt-4 p-3 bg-teal-50/50 border border-teal-200/60 rounded-md text-xs text-teal-950 flex items-start gap-2.5">
          <Compass className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Geometric Criteria:</strong> Stations are partitioned into active cones: Downwind (within ±55° of downwind vector) and Upwind (within ±55° of prevailing wind origin). A positive gradient (Delta PM2.5 = PM_downwind - PM_upwind ≥ 15 µg/m³) under steady wind speeds (&gt; 5 km/h) provides physical directional evidence of source emission.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          Calculating upwind/downwind vectors across Mumbai stations...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hotspot Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Registered Activity Nodes & Infrastructure ({analyses.length})
            </div>

            <div className="space-y-2">
              {analyses.map(item => {
                const isSelected = item.hotspot.id === selectedHotspotId;
                const h = item.hotspot;

                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHotspotId(h.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {h.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Ward {h.ward}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                      {h.description}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="font-mono text-[11px] text-slate-500">
                        Wind: {item.windDirectionLabel} @ {item.currentWindSpeedKmh} km/h
                      </span>

                      {item.deltaPM25 !== null ? (
                        <span className={`font-mono font-bold text-xs ${item.isPlumeDetected ? 'text-amber-700' : 'text-slate-600'}`}>
                          {item.deltaPM25 > 0 ? `+${item.deltaPM25}` : item.deltaPM25} µg/m³ gradient
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Geometry limited</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Directional Vector Evidence (7 cols) */}
          {activeAnalysis && (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Target Investigation Site</div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeAnalysis.hotspot.name}
                  </h2>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Ward {activeAnalysis.hotspot.ward} · Category: {activeAnalysis.hotspot.category.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200 text-right">
                  <div className="text-[10px] text-slate-500">Prevailing Regional Wind</div>
                  <div className="font-mono font-bold text-xs text-slate-900">
                    {activeAnalysis.windDirectionLabel} @ {activeAnalysis.currentWindSpeedKmh} km/h
                  </div>
                </div>
              </div>

              {/* Gradient Calculation Box */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Spatial PM2.5 Gradient (Downwind vs Upwind)
                  </span>
                  {activeAnalysis.isPlumeDetected ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      Plume Signature Detected
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      No Statistically Significant Plume
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <div className="text-slate-500 text-[10px]">Upwind Reference Stations ({activeAnalysis.upwindStations.length})</div>
                    <div className="font-mono text-lg font-bold text-teal-800 mt-0.5">
                      {activeAnalysis.upwindStations.length > 0 
                        ? (activeAnalysis.upwindStations.reduce((a, b) => a + b.pm2_5, 0) / activeAnalysis.upwindStations.length).toFixed(1)
                        : '—'} µg/m³
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <div className="text-slate-500 text-[10px]">Downwind Receptor Stations ({activeAnalysis.downwindStations.length})</div>
                    <div className="font-mono text-lg font-bold text-amber-800 mt-0.5">
                      {activeAnalysis.downwindStations.length > 0 
                        ? (activeAnalysis.downwindStations.reduce((a, b) => a + b.pm2_5, 0) / activeAnalysis.downwindStations.length).toFixed(1)
                        : '—'} µg/m³
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <div className="text-slate-500 text-[10px]">Net Vector Delta (Δ)</div>
                    <div className={`font-mono text-lg font-bold mt-0.5 ${activeAnalysis.isPlumeDetected ? 'text-amber-700' : 'text-slate-800'}`}>
                      {activeAnalysis.deltaPM25 !== null ? `${activeAnalysis.deltaPM25 > 0 ? `+${activeAnalysis.deltaPM25}` : activeAnalysis.deltaPM25} µg/m³` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                  <strong>Assessment:</strong> {activeAnalysis.significanceAssessment}
                </div>
              </div>

              {/* Station Geometry Lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Downwind Stations */}
                <div className="space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    <span>Downwind Receptor Stations:</span>
                  </div>
                  {activeAnalysis.downwindStations.length === 0 ? (
                    <div className="text-slate-400 italic p-2 bg-slate-50 rounded">No station within 55° downwind cone.</div>
                  ) : (
                    activeAnalysis.downwindStations.map(ds => (
                      <div key={ds.station.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                        <span className="font-medium text-slate-800 truncate">{ds.station.name}</span>
                        <span className="font-mono font-bold text-amber-700 shrink-0">{ds.pm2_5} µg/m³</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Upwind Stations */}
                <div className="space-y-2">
                  <div className="font-bold text-teal-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Upwind Baseline Stations:</span>
                  </div>
                  {activeAnalysis.upwindStations.length === 0 ? (
                    <div className="text-slate-400 italic p-2 bg-slate-50 rounded">No station within 55° upwind cone.</div>
                  ) : (
                    activeAnalysis.upwindStations.map(us => (
                      <div key={us.station.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                        <span className="font-medium text-slate-800 truncate">{us.station.name}</span>
                        <span className="font-mono font-bold text-teal-700 shrink-0">{us.pm2_5} µg/m³</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mitigation Requirements */}
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Mandatory Statutory Mitigation Protocols for {activeAnalysis.hotspot.name}:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 list-disc list-inside">
                  {activeAnalysis.hotspot.knownMitigationRequirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
