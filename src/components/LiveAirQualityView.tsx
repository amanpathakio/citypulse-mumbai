/**
 * Live Air Quality & Telemetry Explorer
 * Full multi-pollutant telemetry across 16 CAAQMS Mumbai stations.
 * Includes official NAAQS thresholds, quality status filters, and hourly station drilldown drawer.
 */

import React, { useState } from 'react';
import { 
  Filter, 
  Search, 
  ChevronRight, 
  X, 
  Wind, 
  Thermometer, 
  Droplets, 
  ArrowUpRight, 
  Gauge, 
  Info,
  Clock
} from 'lucide-react';
import { MonitoringStation } from '../types';
import { getPM25Category, formatNumber, formatISTTime, formatISTDateTime } from '../utils/colors';

interface LiveAirQualityViewProps {
  stations: MonitoringStation[];
  liveSnapshot: any[];
  telemetryMode?: 'realtime' | 'hourly';
  onToggleTelemetryMode?: (m: 'realtime' | 'hourly') => void;
  onSelectStationForAnalysis: (stationId: string) => void;
}

export const LiveAirQualityView: React.FC<LiveAirQualityViewProps> = ({
  stations,
  liveSnapshot,
  telemetryMode = 'realtime',
  onToggleTelemetryMode,
  onSelectStationForAnalysis
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState('ALL');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Filter stations based on search, ward, environment
  const filteredSnapshot = liveSnapshot.filter(item => {
    const st = item.station as MonitoringStation;
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = wardFilter === 'ALL' || st.ward === wardFilter;
    const matchesEnv = environmentFilter === 'ALL' || st.environment === environmentFilter;
    return matchesSearch && matchesWard && matchesEnv;
  });

  const selectedItem = liveSnapshot.find(s => s.station.id === selectedStationId);

  // Unique wards for filter dropdown
  const uniqueWards = Array.from(new Set(stations.map(s => s.ward))).sort();

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Continuous Ambient Air Quality Monitoring (CAAQMS)</span>
              <span aria-hidden="true">·</span>
              <span>CPCB & MPCB Telemetry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Live Air Quality Observations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Verified ground-level particulate and gaseous telemetry from Mumbai monitoring stations. Calibrated against Indian NAAQS standards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            {liveSnapshot[0]?.realtime?.instantTimestampIST ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>Stream: <strong className="font-mono">{liveSnapshot[0].realtime.instantTimestampIST}</strong></span>
              </span>
            ) : liveSnapshot[0]?.latestAQ?.timestampIST ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>Current: <strong className="font-mono">{liveSnapshot[0].latestAQ.timestampIST}</strong></span>
              </span>
            ) : null}
            <span className="text-slate-500 font-medium">NAAQS 24h:</span>
            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              PM2.5: 60 µg/m³
            </span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              PM10: 100 µg/m³
            </span>
          </div>
        </div>

        {/* Real-time vs Regulatory Mode Explanation Callout */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Display Mode:</span>
            <div className="inline-flex bg-white p-0.5 rounded border border-slate-200 shadow-2xs">
              <button
                onClick={() => onToggleTelemetryMode?.('realtime')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  telemetryMode === 'realtime'
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${telemetryMode === 'realtime' ? 'bg-teal-200 animate-pulse' : 'bg-slate-400'}`} />
                <span>⚡ Real-Time Continuous (1-min stream)</span>
              </button>
              <button
                onClick={() => onToggleTelemetryMode?.('hourly')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  telemetryMode === 'hourly'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⏱️ Statutory 1-Hr CAAQMS Avg</span>
              </button>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              {telemetryMode === 'realtime' 
                ? 'Showing continuous 1-min live telemetry (auto-polls every 15s) to detect immediate plumes.'
                : 'Showing official 1-hour CPCB filter accumulation cycles used for statutory legal compliance.'}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search station, ward, road..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-teal-600"
            />
          </div>

          <div>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-teal-600"
            >
              <option value="ALL">All BMC Wards</option>
              {uniqueWards.map(w => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-teal-600"
            >
              <option value="ALL">All Environments</option>
              <option value="TRAFFIC_CORRIDOR">Traffic Corridor</option>
              <option value="INDUSTRIAL">Industrial Node</option>
              <option value="RESIDENTIAL">Residential Area</option>
              <option value="COASTAL">Coastal Front</option>
              <option value="ECOLOGICAL_BUFFER">Ecological Buffer / Forest</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900">{filteredSnapshot.length}</strong> of {liveSnapshot.length} stations</span>
          </div>
        </div>
      </div>

      {/* Main Telemetry Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Station Name</th>
                <th className="py-3 px-3">Ward</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3 text-right">PM2.5 (µg/m³)</th>
                <th className="py-3 px-3 text-right">PM10 (µg/m³)</th>
                <th className="py-3 px-3 text-right">NO2 (µg/m³)</th>
                <th className="py-3 px-3 text-right">BLH (m)</th>
                <th className="py-3 px-3">Wind</th>
                <th className="py-3 px-3">Observed (IST)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSnapshot.map((item) => {
                const st = item.station as MonitoringStation;
                const aq = item.latestAQ;
                const weather = item.latestWeather;
                const isRealtime = telemetryMode === 'realtime';
                const displayPM25 = isRealtime && item.realtime?.instantPM25 ? item.realtime.instantPM25 : aq?.pm2_5;
                const displayPM10 = isRealtime && item.realtime?.instantPM10 ? item.realtime.instantPM10 : aq?.pm10;
                const displayNO2 = isRealtime && item.realtime?.instantNO2 ? item.realtime.instantNO2 : aq?.no2;
                const displayTime = isRealtime && item.realtime?.instantTimestampIST 
                  ? formatISTTime(item.realtime.instantTimestampIST)
                  : (aq?.timestampIST ? formatISTTime(aq.timestampIST) : '—');
                const cat = getPM25Category(displayPM25);

                return (
                  <tr 
                    key={st.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedStationId(st.id)}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                        {st.environment.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      Ward {st.ward}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {st.operator}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isRealtime && item.realtime && (
                          <span className={`text-[10px] font-mono font-semibold ${
                            item.realtime.oneMinuteDelta > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {item.realtime.oneMinuteDelta > 0 ? `+${item.realtime.oneMinuteDelta}` : item.realtime.oneMinuteDelta}
                          </span>
                        )}
                        <span 
                          className={`inline-block px-2 py-0.5 rounded font-tabular ${cat.textColor} ${cat.bgColor} border ${cat.borderColor}`}
                        >
                          {formatNumber(displayPM25)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-tabular text-slate-700 whitespace-nowrap">
                      {formatNumber(displayPM10)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-tabular text-slate-700 whitespace-nowrap">
                      {formatNumber(displayNO2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-tabular text-slate-600 whitespace-nowrap">
                      {weather?.boundaryLayerHeightM ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {weather ? `${weather.windSpeedKmh} km/h ${weather.windDirectionDeg}°` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {displayTime}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.freshnessStatus === 'ONLINE_HEALTHY' ? (
                        <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          <span>Live</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>{item.ageMinutes}m stale</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStationId(st.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View Station Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Drilldown Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Station Telemetry & Ward Metadata
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedItem.station.name}
                  </h2>
                  <div className="text-xs text-slate-600 mt-1">
                    Ward {selectedItem.station.ward} · {selectedItem.station.operator} · {selectedItem.station.environment}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStationId(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 space-y-5 text-xs">
                {/* Station Location & Address */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1">Station Coordinates & Deployment</div>
                  <div className="text-slate-600 leading-relaxed">
                    {selectedItem.station.address}
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-slate-500 flex gap-4">
                    <span>Lat: {selectedItem.station.lat.toFixed(4)}°N</span>
                    <span>Lng: {selectedItem.station.lng.toFixed(4)}°E</span>
                    <span>Elevation: {selectedItem.station.elevationM}m</span>
                  </div>
                </div>

                {/* Real-Time Continuous 60-Minute Micro-Trend (Sub-hourly Telemetry) */}
                {selectedItem.realtime?.minuteTrend60m && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="font-semibold text-xs text-white">60-Minute Real-Time Continuous Stream</span>
                      </div>
                      <span className="text-[10px] font-mono text-teal-300">
                        Updated: {selectedItem.realtime.instantTimestampIST.split(' ')[3] || 'Live'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <div className="text-[10px] text-slate-400">Instantaneous (1-Min)</div>
                        <div className="text-xl font-bold font-mono text-teal-300 flex items-baseline gap-1.5">
                          <span>{formatNumber(selectedItem.realtime.instantPM25)}</span>
                          <span className="text-[11px] text-slate-400 font-normal">µg/m³</span>
                          <span className={`text-[10px] font-mono font-semibold px-1 py-0.2 rounded ${
                            selectedItem.realtime.oneMinuteDelta > 0 ? 'bg-red-900/60 text-red-300' : 'bg-teal-900/60 text-teal-300'
                          }`}>
                            {selectedItem.realtime.oneMinuteDelta > 0 ? `+${selectedItem.realtime.oneMinuteDelta}` : selectedItem.realtime.oneMinuteDelta}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">CPCB 1-Hr Regulatory Avg</div>
                        <div className="text-sm font-bold font-mono text-slate-200">
                          {formatNumber(selectedItem.latestAQ?.pm2_5)} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
                        </div>
                      </div>
                    </div>

                    {/* 60-Minute Sparkline Bar Grid */}
                    <div className="pt-2">
                      <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                        <span>Past 60 Minutes (Minute-by-Minute Micro-Dispersion)</span>
                        <span>Latest: {selectedItem.realtime.minuteTrend60m[selectedItem.realtime.minuteTrend60m.length - 1]?.minuteIST}</span>
                      </div>
                      <div className="flex items-end gap-0.5 h-12 w-full bg-slate-950/60 p-1 rounded border border-slate-800">
                        {selectedItem.realtime.minuteTrend60m.map((pt: { minuteIST: string; pm2_5: number }, i: number) => {
                          const maxPM = 250;
                          const heightPct = Math.min(100, Math.max(10, Math.round((pt.pm2_5 / maxPM) * 100)));
                          const isLatest = i === selectedItem.realtime!.minuteTrend60m.length - 1;
                          return (
                            <div 
                              key={i} 
                              className={`flex-1 rounded-t-xs transition-all ${
                                isLatest ? 'bg-teal-400' : pt.pm2_5 > 120 ? 'bg-red-500/80' : pt.pm2_5 > 60 ? 'bg-amber-400/80' : 'bg-teal-500/60'
                              }`}
                              style={{ height: `${heightPct}%` }}
                              title={`${pt.minuteIST}: ${pt.pm2_5} µg/m³`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Pollutant Readings Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-800">
                      {telemetryMode === 'realtime' ? 'Instantaneous Real-Time Ambient Pollutants' : 'Official 1-Hour CAAQMS Pollutants'}
                    </div>
                    {selectedItem.latestAQ?.timestampIST && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {selectedItem.latestAQ.timestampIST}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded border border-slate-200 bg-white shadow-2xs">
                      <div className="text-slate-500 text-[11px]">
                        {telemetryMode === 'realtime' ? 'Real-Time PM2.5 (1-min)' : 'PM2.5 (1-Hr CAAQMS)'}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {formatNumber(telemetryMode === 'realtime' ? (selectedItem.realtime?.instantPM25 ?? selectedItem.latestAQ?.pm2_5) : selectedItem.latestAQ?.pm2_5)}
                        </span>
                        <span className="text-slate-500">µg/m³</span>
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-slate-600">
                        {getPM25Category(telemetryMode === 'realtime' ? (selectedItem.realtime?.instantPM25 ?? selectedItem.latestAQ?.pm2_5) : selectedItem.latestAQ?.pm2_5).label}
                      </div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-white shadow-2xs">
                      <div className="text-slate-500 text-[11px]">PM10 Concentration</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {formatNumber(telemetryMode === 'realtime' ? (selectedItem.realtime?.instantPM10 ?? selectedItem.latestAQ?.pm10) : selectedItem.latestAQ?.pm10)}
                        </span>
                        <span className="text-slate-500">µg/m³</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Coarse particulates</div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-white shadow-2xs">
                      <div className="text-slate-500 text-[11px]">Nitrogen Dioxide (NO2)</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-slate-900">
                          {formatNumber(telemetryMode === 'realtime' ? (selectedItem.realtime?.instantNO2 ?? selectedItem.latestAQ?.no2) : selectedItem.latestAQ?.no2)}
                        </span>
                        <span className="text-slate-500">µg/m³</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Vehicular combustion indicator</div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-white shadow-2xs">
                      <div className="text-slate-500 text-[11px]">Surface Ozone (O3)</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-slate-900">
                          {formatNumber(selectedItem.latestAQ?.o3)}
                        </span>
                        <span className="text-slate-500">µg/m³</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Photochemical smog oxidant</div>
                    </div>
                  </div>
                </div>

                {/* Meteorological Dispersion Parameters */}
                <div>
                  <div className="font-semibold text-slate-800 mb-2">Concurrent Atmospheric Parameters</div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-slate-500" />
                        Boundary Layer Height (BLH):
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedItem.latestWeather?.boundaryLayerHeightM ?? '—'} meters
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-slate-500" />
                        Surface Wind:
                      </span>
                      <span className="font-mono text-slate-900">
                        {selectedItem.latestWeather?.windSpeedKmh} km/h @ {selectedItem.latestWeather?.windDirectionDeg}°
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                        Ambient Temperature:
                      </span>
                      <span className="font-mono text-slate-900">
                        {selectedItem.latestWeather?.temperatureC} °C
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-slate-500" />
                        Relative Humidity:
                      </span>
                      <span className="font-mono text-slate-900">
                        {selectedItem.latestWeather?.relativeHumidityPct} %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Site Notes */}
                <div className="p-3 rounded border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                  <strong>Site Environmental Context:</strong> {selectedItem.station.notes}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">
                Feed Age: <strong className="font-mono text-slate-800">{selectedItem.ageMinutes} mins</strong>
              </span>
              <button
                onClick={() => {
                  onSelectStationForAnalysis(selectedItem.station.id);
                  setSelectedStationId(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Analyze Fixability</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
