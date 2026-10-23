/**
 * Data Sources, Quality Assurance & Audit Trail View
 * Audits sensor freshness, missing rates, flatline run rejections (≥6h identical),
 * short-gap imputations (≤3h linear), and pipeline sync execution logs.
 */

import React, { useEffect, useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { DataQualitySummary } from '../types';

interface DataQualityViewProps {
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  onTriggerSync,
  isSyncing
}) => {
  const [report, setReport] = useState<DataQualitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data-quality');
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load data quality report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Quality Assurance & Pipeline Provenance</span>
              <span aria-hidden="true">·</span>
              <span>Audit Logging</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Data Quality & Ingestion Pipeline Health
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Strict automated quality control: rejects out-of-range readings (&lt;0 or &gt;1000 µg/m³), flags flatline sensor lockups, limits linear gap interpolation to ≤3 hours, and preserves true data outages.
            </p>
          </div>

          <button
            onClick={() => {
              onTriggerSync();
              setTimeout(fetchReport, 2000);
            }}
            disabled={isSyncing}
            className={`px-4 py-2 text-xs font-semibold rounded-md text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs ${
              isSyncing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Feeds...' : 'Force Ingestion Sync'}</span>
          </button>
        </div>

        {/* Quality Rules Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-semibold text-slate-800">Rule 1: Plausibility Range</div>
            <div className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Accepts only 0 ≤ PM2.5 ≤ 1000 µg/m³. Values outside bounds rejected and logged as OUT_OF_RANGE.
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-semibold text-slate-800">Rule 2: Flatline Detection</div>
            <div className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Detects ≥6 consecutive identical hourly readings. Flagged as SUSPECT_FLATLINE sensor freeze.
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-semibold text-slate-800">Rule 3: Gap Imputation Limit</div>
            <div className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Linear interpolation allowed ONLY for short isolated gaps ≤3 hours. Explicitly tagged as IMPUTED.
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-semibold text-slate-800">Rule 4: Outage Preservation</div>
            <div className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Gaps &gt;3 hours preserved as true MISSING values. Never silently fabricated with synthetic numbers.
            </div>
          </div>
        </div>
      </div>

      {report && (
        <>
          {/* Key Ingestion Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Active Station Telemetry</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-teal-700">
                  {report.activeStations}
                </span>
                <span className="text-xs text-slate-500">/ {report.totalStations} stations</span>
              </div>
              <div className="mt-2 text-xs text-teal-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Reporting within latency tolerance</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">24-Hour Missing Observation Rate</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {report.missingReadingsPct24h}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                True unrecorded hourly gaps preserved
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Validated 3-Hour Imputations</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {report.imputedReadingsCount24h}
                </span>
                <span className="text-xs text-slate-500">records</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Linear bridge across short gaps ≤3h
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Rejected Flatline Lockups</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {report.rejectedFlatlineCount24h}
                </span>
                <span className="text-xs text-slate-500">hours flagged</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Excluded from regression training
              </div>
            </div>
          </div>

          {/* Station Quality & Freshness Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Individual Station Freshness & Completeness Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time telemetry latency and 7-day data completeness per CAAQMS station
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Audit Snapshot: {report.freshnessIST}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-4">Monitoring Station</th>
                    <th className="py-2.5 px-3">Ward</th>
                    <th className="py-2.5 px-3">Last Recorded Observation</th>
                    <th className="py-2.5 px-3 text-right">Telemetry Latency</th>
                    <th className="py-2.5 px-3 text-right">7-Day Missing Rate</th>
                    <th className="py-2.5 px-4 text-center">Quality Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.stationFreshnessList.map(st => (
                    <tr key={st.stationId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{st.stationName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">Ward {st.ward}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{st.lastObservationIST}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-tabular text-slate-800">
                        {st.latencyMinutes} mins
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-tabular text-slate-700">
                        {st.missingPct7d}%
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {st.status === 'ONLINE_HEALTHY' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            <span>Online Healthy</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Stale Feed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pipeline Execution Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ingestion Pipeline Execution Audit Log
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Chronological log of batch requests, duration in milliseconds, and quality checks applied
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {report.recentPipelineLogs.slice(0, 15).map((log, i) => (
                <div key={i} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{log.source}</span>
                      <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        {log.durationMs}ms
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      {log.message}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 shrink-0">
                    {log.timestampIST}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
