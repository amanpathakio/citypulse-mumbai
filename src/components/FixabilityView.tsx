/**
 * Core CityPulse Feature — Fixability Analysis & Attribution Explorer
 * Transparent scientific decomposition of observed PM2.5 into:
 * 1. Regional Background (spatial median of concurrent reference stations)
 * 2. Weather-associated dispersion modulation (BLH & wind)
 * 3. Residual local excess anomaly with calibrated prediction intervals (70% / 80% / 90%)
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  ChevronRight, 
  ArrowRight, 
  FileText,
  Wind,
  Layers,
  MapPin,
  Flame,
  Search
} from 'lucide-react';
import { FixabilityResult, MonitoringStation } from '../types';
import { getPM25Category, formatNumber, formatISTTime } from '../utils/colors';

interface FixabilityViewProps {
  results: FixabilityResult[];
  stations: MonitoringStation[];
  uncertaintyPercent: 70 | 80 | 90;
  onUncertaintyChange: (band: 70 | 80 | 90) => void;
  onAddToInspectionPlan: (stationId: string) => void;
  initialSelectedStationId?: string;
}

export const FixabilityView: React.FC<FixabilityViewProps> = ({
  results,
  stations,
  uncertaintyPercent,
  onUncertaintyChange,
  onAddToInspectionPlan,
  initialSelectedStationId
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialSelectedStationId || results[0]?.stationId || 'station-bkc'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');

  // Sync when parent provides new initial station
  React.useEffect(() => {
    if (initialSelectedStationId) {
      setSelectedStationId(initialSelectedStationId);
    }
  }, [initialSelectedStationId]);

  const filteredResults = results.filter(r => {
    const matchesSearch = r.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.ward.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = verdictFilter === 'ALL' || r.verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  const selectedResult = filteredResults.find(r => r.stationId === selectedStationId) || 
                         filteredResults[0] || 
                         results.find(r => r.stationId === selectedStationId) || 
                         results[0];

  return (
    <div className="space-y-6">
      {/* Header & Methodology Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Decision Support Engine</span>
              <span aria-hidden="true">·</span>
              <span>Regional Background & Meteorological Disentanglement</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Fixability Analysis: "Fixable or Not?"
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Distinguishes regional transboundary background and thermal inversion stagnation from hyper-local municipal excess that BMC inspection squads can investigate and mitigate.
            </p>
          </div>

          {/* Uncertainty Band Configurator */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-3 shrink-0">
            <div className="text-xs">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-teal-700" />
                <span>Prediction Interval:</span>
              </div>
              <div className="text-[10px] text-slate-500">Alert Sensitivity Band</div>
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 text-xs font-semibold">
              <button
                onClick={() => onUncertaintyChange(70)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  uncertaintyPercent === 70 ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="70% Prediction Interval (1.04σ) — Higher alert sensitivity"
              >
                70%
              </button>
              <button
                onClick={() => onUncertaintyChange(80)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  uncertaintyPercent === 80 ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="80% Prediction Interval (1.282σ) — Recommended standard baseline"
              >
                80%
              </button>
              <button
                onClick={() => onUncertaintyChange(90)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  uncertaintyPercent === 90 ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="90% Prediction Interval (1.645σ) — High specificity / fewer false alerts"
              >
                90%
              </button>
            </div>
          </div>
        </div>

        {/* Scientific Transparency Notice */}
        <div className="mt-4 p-3 bg-teal-50/50 border border-teal-200/60 rounded-md text-xs text-teal-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Scientific Governance Notice:</strong> PM2.5 is not a clean physical additive sum. Regional background, atmospheric boundary layer compression, and measurement noise interact non-linearly. A local excess anomaly identifies a statistical outlier warranting on-ground municipal inspection, not definitive legal proof of specific source culpability.
          </div>
        </div>
      </div>

      {/* Main Analysis Layout: Station Selector (Left) + Detailed Evidence Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Station Triage List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by station or ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs"
              >
                <option value="ALL">All Verdicts</option>
                <option value="INVESTIGATE_LOCAL_EXCESS">Investigate Local Excess</option>
                <option value="REGIONAL_EPISODE">Regional Episode</option>
                <option value="WEATHER_ASSOCIATED">Weather Inversion</option>
                <option value="WITHIN_NAAQS_STANDARD">Within NAAQS Standard</option>
                <option value="INSUFFICIENT_EVIDENCE">Insufficient Data</option>
              </select>
              <span>{filteredResults.length} stations</span>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredResults.map(res => {
              const isSelected = res.stationId === selectedStationId;
              let verdictBadge = 'bg-slate-100 text-slate-700 border-slate-200';
              if (res.verdict === 'INVESTIGATE_LOCAL_EXCESS') {
                verdictBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
              } else if (res.verdict === 'REGIONAL_EPISODE') {
                verdictBadge = 'bg-slate-100 text-slate-800 border-slate-300';
              } else if (res.verdict === 'WEATHER_ASSOCIATED') {
                verdictBadge = 'bg-teal-50 text-teal-800 border-teal-200';
              }

              return (
                <div
                  key={res.stationId}
                  onClick={() => setSelectedStationId(res.stationId)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {res.stationName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      Ward {res.ward}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">Observed</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">
                        {res.observedPM25}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">Regional Bg</div>
                      <div className="font-mono text-slate-700 mt-0.5">
                        {res.regionalBackground}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">Local Excess</div>
                      <div className={`font-mono font-bold mt-0.5 ${res.isExcessSignificant ? 'text-amber-700' : 'text-slate-600'}`}>
                        +{res.modeledLocalExcess}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${verdictBadge}`}>
                      {res.verdict === 'INVESTIGATE_LOCAL_EXCESS' ? 'Actionable Excess' : res.verdict === 'REGIONAL_EPISODE' ? 'Regional Background' : res.verdict.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {res.timestampIST ? formatISTTime(res.timestampIST) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Scientific Evidence Panel (7 cols) */}
        {selectedResult && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6">
            {/* Panel Title & Station Kicker */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span>Station Evidence Dossier</span>
                  <span aria-hidden="true">·</span>
                  <span>Observation Time: {selectedResult.timestampIST}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedResult.stationName} (Ward {selectedResult.ward})
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                  selectedResult.verdict === 'INVESTIGATE_LOCAL_EXCESS'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {selectedResult.verdictLabel}
                </span>
              </div>
            </div>

            {/* Decomposition Math Breakdown Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                1. Empirical Decomposition Equation
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Observed */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Observed PM2.5 (y)</div>
                  <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
                    {selectedResult.observedPM25}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Ground sensor reading</div>
                </div>

                {/* 2. Regional Median */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Regional Ref (B)</div>
                  <div className="font-mono text-2xl font-bold text-slate-700 mt-1">
                    {selectedResult.regionalBackground}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Concurrent spatial median</div>
                </div>

                {/* 3. Weather Dispersion */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Weather Effect (W)</div>
                  <div className="font-mono text-2xl font-bold text-teal-800 mt-1">
                    {selectedResult.weatherExpectedVariance > 0 ? `+${selectedResult.weatherExpectedVariance}` : selectedResult.weatherExpectedVariance}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">BLH & wind potential</div>
                </div>

                {/* 4. Local Excess */}
                <div className={`p-3 rounded-lg border ${
                  selectedResult.isExcessSignificant 
                    ? 'bg-amber-50 border-amber-300' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[11px] text-amber-900 font-medium">Local Excess (E)</div>
                  <div className="font-mono text-2xl font-bold text-amber-800 mt-1">
                    +{selectedResult.modeledLocalExcess}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Threshold: {selectedResult.uncertaintyThreshold} µg/m³</div>
                </div>
              </div>

              {/* Mathematical Relationship Bar */}
              <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700 font-mono text-[11px]">
                  <span>Formula: Modeled Excess = max(0, Observed - RegionalBg - max(0, WeatherEffect))</span>
                  <span className="font-bold">Band: {uncertaintyPercent}% Interval</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${Math.min(100, (selectedResult.regionalBackground / Math.max(1, selectedResult.observedPM25)) * 100)}%` }} 
                    className="bg-slate-400" 
                    title="Regional Background" 
                  />
                  <div 
                    style={{ width: `${Math.min(100, (Math.max(0, selectedResult.weatherExpectedVariance) / Math.max(1, selectedResult.observedPM25)) * 100)}%` }} 
                    className="bg-teal-500" 
                    title="Weather Dispersion Modulation" 
                  />
                  <div 
                    style={{ width: `${Math.min(100, (selectedResult.modeledLocalExcess / Math.max(1, selectedResult.observedPM25)) * 100)}%` }} 
                    className="bg-amber-500" 
                    title="Modeled Local Excess" 
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Regional ({selectedResult.regionalBackground} µg/m³)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Weather ({selectedResult.weatherExpectedVariance} µg/m³)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Local Excess (+{selectedResult.modeledLocalExcess} µg/m³)</span>
                </div>
              </div>
            </div>

            {/* Evidence Narrative */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Decision-Support Evidence Narrative
              </h3>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed">
                {selectedResult.evidenceNarrative}
              </div>
            </div>

            {/* Contextual Leads */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                3. High-Probability Investigation Leads (Geospatial Proximity)
              </h3>
              {selectedResult.investigationLeads.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
                  No verified industrial or construction hotspots registered within 7 km buffer of this station.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedResult.investigationLeads.map((lead, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 flex items-start gap-3 text-xs shadow-2xs">
                      <div className="p-2 rounded bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">{lead.label}</div>
                        <div className="text-slate-600 text-[11px] leading-relaxed">{lead.description}</div>
                        <div className="text-teal-800 font-semibold text-[11px] pt-1">
                          Action: {lead.recommendedAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scientific Disclaimers & Audit Notes */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                4. Methodological Audit Trail
              </h3>
              <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                {selectedResult.scientificNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Confidence Grade: <strong className="font-semibold text-slate-900">{selectedResult.confidenceGrade}</strong>
              </span>

              <button
                onClick={() => onAddToInspectionPlan(selectedResult.stationId)}
                className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Add to Municipal Inspection Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
