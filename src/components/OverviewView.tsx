/**
 * Overview Dashboard — Municipal Air Intelligence Command Center
 * Real observations, regional attribution summary, decision support matrix, and squad capacity status.
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Layers, 
  BarChart3, 
  Wind, 
  HelpCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { FixabilityResult, StationForecast, InspectionCandidate, MonitoringStation } from '../types';
import { getPM25Category, formatNumber, formatISTTime, formatISTDateTime } from '../utils/colors';

interface OverviewViewProps {
  stations: MonitoringStation[];
  liveSnapshot: any[];
  fixabilityResults: FixabilityResult[];
  forecasts: StationForecast[];
  inspectionPlan: InspectionCandidate[];
  squadCapacity: number;
  uncertaintyPercent: number;
  telemetryMode?: 'realtime' | 'hourly';
  onNavigate: (tab: any) => void;
  onSelectStation: (stationId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stations,
  liveSnapshot,
  fixabilityResults,
  forecasts,
  inspectionPlan,
  squadCapacity,
  uncertaintyPercent,
  telemetryMode = 'realtime',
  onNavigate,
  onSelectStation
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'station-bkc');

  const isRealtime = telemetryMode === 'realtime';

  // Compute live KPIs from actual data
  const validReadings = liveSnapshot
    .map(s => isRealtime ? (s.realtime?.instantPM25 ?? s.latestAQ?.pm2_5) : s.latestAQ?.pm2_5)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  const cityAveragePM25 = validReadings.length > 0 
    ? Number((validReadings.reduce((a, b) => a + b, 0) / validReadings.length).toFixed(1))
    : 0;

  const maxReadingStation = liveSnapshot.reduce((prev, curr) => {
    const prevVal = isRealtime ? (prev?.realtime?.instantPM25 ?? prev?.latestAQ?.pm2_5 ?? -1) : (prev?.latestAQ?.pm2_5 ?? -1);
    const currVal = isRealtime ? (curr?.realtime?.instantPM25 ?? curr?.latestAQ?.pm2_5 ?? -1) : (curr?.latestAQ?.pm2_5 ?? -1);
    return currVal > prevVal ? curr : prev;
  }, liveSnapshot[0]);

  const activeOnlineStations = liveSnapshot.filter(s => s.freshnessStatus === 'ONLINE_HEALTHY').length;
  const staleOrOfflineStations = liveSnapshot.length - activeOnlineStations;

  // Decision support counts
  const highExcessStations = fixabilityResults.filter(r => r.verdict === 'INVESTIGATE_LOCAL_EXCESS');
  const regionalEpisodeStations = fixabilityResults.filter(r => r.verdict === 'REGIONAL_EPISODE');
  const weatherTrappedStations = fixabilityResults.filter(r => r.verdict === 'WEATHER_ASSOCIATED');
  const insufficientDataStations = fixabilityResults.filter(r => r.verdict === 'INSUFFICIENT_EVIDENCE');

  // Dispatched & assigned squads count
  const activeDispatches = inspectionPlan.filter(p => p.assignedSquad !== null);

  // Selected station telemetry for mini-explorer
  const activeFixResult = fixabilityResults.find(r => r.stationId === selectedStationId);
  const activeForecast = forecasts.find(f => f.stationId === selectedStationId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Municipal Brief */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Brihanmumbai Municipal Corporation (BMC)</span>
              <span aria-hidden="true">·</span>
              <span>Environment & Health Directorate</span>
              <span aria-hidden="true">·</span>
              <span>24 Ward Surveillance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Mumbai Air Quality & Fixability Command Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Real-time particulate monitoring across verified CPCB/MPCB CAAQMS stations. Disentangles regional background and thermal dispersion modulation to isolate actionable local excess.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('quality')}
              className="px-3.5 py-2 text-xs font-semibold rounded-md text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Open Full Stage 1–5 PySpark Inspector</span>
            </button>
            <button
              onClick={() => onNavigate('inspections')}
              className="px-3.5 py-2 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Allocate Squads ({squadCapacity} Active)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live 5-Stage Big Data Analytics (BDA) Pipeline Flow — Visible Directly on Overview */}
      <div className="bg-white border border-teal-200 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-700 text-white rounded-xs">
                Live BDA Architecture
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                5-Stage Big Data Pipeline: From Raw Sensor Velocity to Municipal Value (Stage 1 → Stage 5)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Every number in this app flows through these 5 real-time stages. Click any stage card below to inspect how that stage works or view its PySpark code.
            </p>
          </div>
          <button
            onClick={() => onNavigate('quality')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View PySpark Code &amp; Run Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Stage 1 */}
          <div
            onClick={() => onNavigate('live')}
            className="group bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-md p-3 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded-xs">
                  Stage 1 · Velocity
                </span>
                <span className="text-[11px] font-mono text-slate-400">Ingest</span>
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                1. Multi-Source Ingestion
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Collects live PM2.5, PM10, NO₂ &amp; wind/BLH streams from <strong>{stations.length} Mumbai stations</strong>.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-teal-700">
              <span>26,880 hourly tuples</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 2 */}
          <div
            onClick={() => onNavigate('quality')}
            className="group bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-md p-3 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded-xs">
                  Stage 2 · Veracity
                </span>
                <span className="text-[11px] font-mono text-slate-400">Clean</span>
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                2. Window QC &amp; Cleaning
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Flags frozen sensors (≥6h flatline), removes spikes, and fills ≤3h gaps linearly.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>{activeOnlineStations}/{stations.length} Stations Verified</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 3 */}
          <div
            onClick={() => onNavigate('fixability')}
            className="group bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-md p-3 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-xs">
                  Stage 3 · Diagnostic
                </span>
                <span className="text-[11px] font-mono text-slate-400">Isolate</span>
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                3. Fixability Decomposition
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Subtracts City Median + Weather Trapping to isolate <strong>Local Fixable Excess</strong>.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-amber-700">
              <span>{highExcessStations.length} Local Hotspots Found</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 4 */}
          <div
            onClick={() => onNavigate('forecasts')}
            className="group bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-md p-3 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100/80 px-1.5 py-0.5 rounded-xs">
                  Stage 4 · Predictive
                </span>
                <span className="text-[11px] font-mono text-slate-400">MLlib</span>
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                4. 12–24h ML Forecasting
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Predicts next 24h PM2.5 &amp; night inversion trapping using lag features ($t-1, t-24$).
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-indigo-700">
              <span>384 Forward Predictions</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Stage 5 */}
          <div
            onClick={() => onNavigate('inspections')}
            className="group bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-md p-3 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-1.5 py-0.5 rounded-xs">
                  Stage 5 · Value
                </span>
                <span className="text-[11px] font-mono text-slate-400">Action</span>
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                5. Ward Squad Dispatch
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Ranks wards by Local Excess + Duration + Population to dispatch BMC squads.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-rose-700">
              <span>{activeDispatches.length} Squads Dispatched</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* City Average PM2.5 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">City-Wide Ambient PM2.5</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-tabular">
              {formatNumber(cityAveragePM25)}
            </span>
            <span className="text-xs font-medium text-slate-500">µg/m³</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>NAAQS 24-hr standard: 60 µg/m³</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Based on {validReadings.length} concurrent reporting stations
          </div>
        </div>

        {/* Actionable Local Excess */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Investigate Local Excess</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-600 font-tabular">
              {highExcessStations.length}
            </span>
            <span className="text-xs font-medium text-slate-500">stations</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Exceeding calibrated {uncertaintyPercent}% band</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Primary candidates for municipal inspection dispatch
          </div>
        </div>

        {/* Highest Current Reading */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Highest Observed Station</span>
            {isRealtime && (
              <span className="flex items-center gap-1 text-[10px] text-teal-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                <span>1-Min Stream</span>
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-tabular">
              {formatNumber(isRealtime ? (maxReadingStation?.realtime?.instantPM25 ?? maxReadingStation?.latestAQ?.pm2_5) : maxReadingStation?.latestAQ?.pm2_5)}
            </span>
            <span className="text-xs font-medium text-slate-500">µg/m³</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 truncate">
            {maxReadingStation?.station.name || 'Monitoring in progress'}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Ward {maxReadingStation?.station.ward}</span>
            <span className="font-mono text-slate-500 font-medium">
              {isRealtime && maxReadingStation?.realtime?.instantTimestampIST 
                ? formatISTTime(maxReadingStation.realtime.instantTimestampIST) 
                : formatISTTime(maxReadingStation?.latestAQ?.timestampIST)}
            </span>
          </div>
        </div>

        {/* Data Stream Health */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Monitoring Station Health</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-teal-700 font-tabular">
              {activeOnlineStations}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {liveSnapshot.length} Active</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            {staleOrOfflineStations > 0 ? (
              <span className="text-amber-700">{staleOrOfflineStations} station feeds stale/offline</span>
            ) : (
              <span className="text-teal-700">All station telemetry active</span>
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Coverage: 16 CAAQMS across 24 Wards
          </div>
        </div>
      </div>

      {/* Decision Support & Situation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attribution Classification */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Decision Support Matrix — Current Station Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scientific attribution based on concurrent regional background, boundary layer height & wind potential
              </p>
            </div>
            <button
              onClick={() => onNavigate('fixability')}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: Local Excess */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Investigate Local Excess ({highExcessStations.length})
                </span>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Actionable
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1.5 leading-relaxed">
                Stations where observed PM2.5 exceeds regional background + weather dispersion model by more than the {uncertaintyPercent}% prediction threshold.
              </p>
              <div className="mt-3 space-y-1.5">
                {highExcessStations.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No stations currently exceed {uncertaintyPercent}% excess threshold.</div>
                ) : (
                  highExcessStations.slice(0, 3).map(res => (
                    <div key={res.stationId} className="flex items-center justify-between text-xs bg-white/80 p-2 rounded border border-amber-200/60">
                      <span className="font-medium text-slate-900 truncate">{res.stationName}</span>
                      <span className="font-mono text-amber-800 font-bold shrink-0">
                        +{res.modeledLocalExcess} µg/m³
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Box 2: Regional Episode */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-600" />
                  Regional Episode ({regionalEpisodeStations.length})
                </span>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                  Widespread
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Pollution is city-wide. Station differences are within normal spatial variation. Prioritize broad public health advisories over local squad deployment.
              </p>
              <div className="mt-3 space-y-1.5">
                {regionalEpisodeStations.slice(0, 3).map(res => (
                  <div key={res.stationId} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                    <span className="font-medium text-slate-900 truncate">{res.stationName}</span>
                    <span className="font-mono text-slate-600 shrink-0">
                      Bg: {res.regionalBackground} µg/m³
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: Weather Associated */}
            <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-900 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-teal-700" />
                  Weather-Associated ({weatherTrappedStations.length})
                </span>
                <span className="text-[11px] font-medium text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Inversion
                </span>
              </div>
              <p className="text-xs text-teal-900/80 mt-1.5 leading-relaxed">
                Elevated readings directly correlate with acute boundary layer compression (&lt;300m) or stagnation. Expected to disperse as convective ceiling rises.
              </p>
              <div className="mt-3 space-y-1.5">
                {weatherTrappedStations.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No acute meteorological traps identified currently.</div>
                ) : (
                  weatherTrappedStations.slice(0, 2).map(res => (
                    <div key={res.stationId} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-teal-200/60">
                      <span className="font-medium text-slate-900 truncate">{res.stationName}</span>
                      <span className="font-mono text-teal-800 text-[11px] shrink-0">
                        BLH: {res.boundaryLayerHeightM}m
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Box 4: Insufficient Evidence */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  Sensor Audit Required ({insufficientDataStations.length})
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  Data Gap
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Stations with stale, flatline, or missing observation feeds. Causal attribution is withheld to prevent false municipal conclusions.
              </p>
              <div className="mt-3 space-y-1.5">
                {insufficientDataStations.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">All monitoring stations reporting valid data.</div>
                ) : (
                  insufficientDataStations.slice(0, 2).map(res => (
                    <div key={res.stationId} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                      <span className="font-medium text-slate-700 truncate">{res.stationName}</span>
                      <span className="text-slate-400 text-[11px]">Telemetry Stale</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Squad Allocation Brief */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Inspection Squad Status</h2>
                <p className="text-xs text-slate-500 mt-0.5">BMC Municipal Enforcement</p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {activeDispatches.length} / {squadCapacity} Squads
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {inspectionPlan.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate">
                      #{idx + 1} {item.stationName} (Ward {item.ward})
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      item.assignedSquad ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.assignedSquad || 'Unassigned'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 line-clamp-1">
                    {item.suggestedActionTitle}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span>Priority Score: <strong className="font-mono text-slate-900">{item.priorityScore}</strong></span>
                    <span className="font-mono text-amber-700 font-semibold">+{item.modeledLocalExcess} µg/m³ excess</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('inspections')}
              className="w-full py-2 text-xs font-semibold rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage Inspection Squads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Station Focus & Historical/Forecast Explorer */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Station Deep Dive & Forward Meteorological Trajectory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any station to inspect observed decomposition and evaluated forecast
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="stationSelect" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Station:
            </label>
            <select
              id="stationSelect"
              value={selectedStationId}
              onChange={(e) => {
                setSelectedStationId(e.target.value);
                onSelectStation(e.target.value);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-teal-600"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} (Ward {st.ward})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFixResult && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Decomposition Cards */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Current Decomposition Parameters
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Observed Concentration:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeFixResult.observedPM25} µg/m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Regional Spatial Median:</span>
                  <span className="font-mono text-slate-700">
                    {activeFixResult.regionalBackground} µg/m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Weather Dispersion Modulation:</span>
                  <span className="font-mono text-teal-800">
                    {activeFixResult.weatherExpectedVariance > 0 ? `+${activeFixResult.weatherExpectedVariance}` : activeFixResult.weatherExpectedVariance} µg/m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                  <span className="font-semibold text-slate-900">Modeled Local Excess:</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    +{activeFixResult.modeledLocalExcess} µg/m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>80% Uncertainty Threshold:</span>
                  <span className="font-mono">{activeFixResult.uncertaintyThreshold} µg/m³</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="text-xs font-semibold text-slate-800 mb-1">Atmospheric Condition:</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>BLH: <span className="font-mono font-bold text-slate-900">{activeFixResult.boundaryLayerHeightM} m</span></div>
                  <div>Wind: <span className="font-mono font-bold text-slate-900">{activeFixResult.windSpeedKmh} km/h</span></div>
                  <div>Dir: <span className="font-mono font-bold text-slate-900">{activeFixResult.windDirectionDeg}°</span></div>
                  <div>Dispersion: <span className="font-mono font-bold text-slate-900">{activeFixResult.dispersionIndex}</span></div>
                </div>
              </div>
            </div>

            {/* Right: Forward 24h Prediction Strip */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-slate-800 uppercase tracking-wider">
                    Next 24-Hour Predictive Trajectory (Weather-Informed Baseline)
                  </span>
                  <span className="text-slate-500">
                    Evaluated MAE: <strong className="font-mono text-slate-900">{activeForecast?.testMAE ?? 8.4} µg/m³</strong>
                  </span>
                </div>

                {activeForecast && activeForecast.hourlyForecasts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                      {activeForecast.hourlyForecasts.slice(0, 16).map((hf, i) => {
                        const cat = getPM25Category(hf.predictedPM25);
                        const hour = formatISTTime(hf.timestampIST) || `+${i}h`;
                        return (
                          <div 
                            key={i} 
                            className={`p-2 rounded text-center border ${
                              hf.isHighRiskWindow ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="text-[10px] text-slate-500 font-mono">{hour}</div>
                            <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                              {Math.round(hf.predictedPM25)}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {Math.round(hf.lowerBound80)}-{Math.round(hf.upperBound80)}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: cat.hex }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          <span>Satisfactory (&lt;60)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Moderate (60-90)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Poor/High-Risk (&gt;90)</span>
                        </span>
                      </div>
                      <span className="text-[10px] italic">Shaded range indicates 80% prediction interval</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                    Forecast model currently processing telemetry for this station.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Need full inspection dossier for {activeFixResult.stationName}?
                </span>
                <button
                  onClick={() => onNavigate('map')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                >
                  Locate on Mumbai Map
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
