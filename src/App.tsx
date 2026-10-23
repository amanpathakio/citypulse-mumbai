/**
 * CityPulse Mumbai — Fixable or Not?
 * Municipal Air Intelligence & Inspection Allocation Platform
 * Built for BMC Ward Health Officers and Environmental Pollution Control Squads.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { LiveAirQualityView } from './components/LiveAirQualityView';
import { MumbaiMapView } from './components/MumbaiMapView';
import { FixabilityView } from './components/FixabilityView';
import { ForecastsView } from './components/ForecastsView';
import { InspectionPlannerView } from './components/InspectionPlannerView';
import { PlumeInvestigationView } from './components/PlumeInvestigationView';
import { DataQualityView } from './components/DataQualityView';
import { SettingsView } from './components/SettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  MonitoringStation, 
  WardInfo, 
  KnownPollutionHotspot, 
  FixabilityResult, 
  StationForecast, 
  InspectionCandidate, 
  AppSettings 
} from './types';
import { MUMBAI_STATIONS, MUMBAI_WARDS, KNOWN_HOTSPOTS } from './data/mumbaiWardsAndStations';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedStationId, setSelectedStationId] = useState<string>('station-bkc');
  
  // Data State
  const [stations] = useState<MonitoringStation[]>(MUMBAI_STATIONS);
  const [wards] = useState<WardInfo[]>(MUMBAI_WARDS);
  const [hotspots] = useState<KnownPollutionHotspot[]>(KNOWN_HOTSPOTS);
  
  const [liveSnapshot, setLiveSnapshot] = useState<any[]>([]);
  const [fixabilityResults, setFixabilityResults] = useState<FixabilityResult[]>([]);
  const [forecasts, setForecasts] = useState<StationForecast[]>([]);
  const [inspectionPlan, setInspectionPlan] = useState<InspectionCandidate[]>([]);
  
  // Telemetry Mode State: Real-Time Instantaneous Stream vs 1-Hour CAAQMS Regulatory Benchmark
  const [telemetryMode, setTelemetryMode] = useState<'realtime' | 'hourly'>('realtime');

  // Status State
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncIST, setLastSyncIST] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    uncertaintyThresholdPercent: 80,
    availableSquadCapacity: 3,
    naaqsPM25Standard: 60,
    currentUserRole: 'BMC_WARD_HEALTH_OFFICER',
    openAqApiKey: '',
    autoRefreshIntervalSeconds: 600
  });

  // Fetch all live data from backend APIs
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsSyncing(true);
      else setLoading(true);

      const [liveRes, fixRes, foreRes, inspRes] = await Promise.all([
        fetch(`/api/air-quality/live${forceRefresh ? '?refresh=true' : ''}`).then(r => r.json()),
        fetch(`/api/fixability?uncertainty=${settings.uncertaintyThresholdPercent}`).then(r => r.json()),
        fetch('/api/forecasts').then(r => r.json()),
        fetch(`/api/inspections?capacity=${settings.availableSquadCapacity}&uncertainty=${settings.uncertaintyThresholdPercent}`).then(r => r.json())
      ]);

      if (liveRes.success) {
        setLiveSnapshot(liveRes.snapshot);
      }
      if (fixRes.success) {
        setFixabilityResults(fixRes.results);
      }
      if (foreRes.success) {
        setForecasts(foreRes.forecasts);
      }
      if (inspRes.success) {
        setInspectionPlan(inspRes.plan);
      }

      setLastSyncIST(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to load municipal telemetry:', err);
      setErrorMessage('Could not connect to Mumbai telemetry backend. Ingestion retry scheduled.');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [settings.uncertaintyThresholdPercent, settings.availableSquadCapacity]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time continuous background streaming poll (every 15 seconds)
  useEffect(() => {
    if (telemetryMode !== 'realtime') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/air-quality/live').then(r => r.json());
        if (res.success && res.snapshot) {
          setLiveSnapshot(res.snapshot);
          setLastSyncIST(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
        }
      } catch {
        // silent retry on next tick
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [telemetryMode]);

  // Handle Candidate Update (Squad, Status, Notes)
  const handleUpdateCandidate = async (
    candidateId: string, 
    updates: Partial<Pick<InspectionCandidate, 'assignedSquad' | 'status' | 'targetShift' | 'officerNotes' | 'outcomeReport'>>
  ) => {
    try {
      const res = await fetch(`/api/inspections/${candidateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setInspectionPlan(prev => prev.map(item => item.id === candidateId ? data.item : item));
      }
    } catch (err) {
      console.error('Failed to update candidate:', err);
    }
  };

  // Handle Uncertainty Threshold Change
  const handleUncertaintyChange = async (band: 70 | 80 | 90) => {
    setSettings(prev => ({ ...prev, uncertaintyThresholdPercent: band }));
    try {
      const fixRes = await fetch(`/api/fixability?uncertainty=${band}`).then(r => r.json());
      if (fixRes.success) {
        setFixabilityResults(fixRes.results);
      }
      const inspRes = await fetch(`/api/inspections?capacity=${settings.availableSquadCapacity}&uncertainty=${band}`).then(r => r.json());
      if (inspRes.success) {
        setInspectionPlan(inspRes.plan);
      }
    } catch (err) {
      console.error('Failed to recalculate uncertainty:', err);
    }
  };

  // Handle Squad Capacity Change
  const handleCapacityChange = async (cap: number) => {
    setSettings(prev => ({ ...prev, availableSquadCapacity: cap }));
    try {
      const res = await fetch('/api/inspections/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: cap, uncertainty: settings.uncertaintyThresholdPercent })
      });
      const data = await res.json();
      if (data.success) {
        setInspectionPlan(data.plan);
      }
    } catch (err) {
      console.error('Failed to reallocate squads:', err);
    }
  };

  // Add station directly to inspection plan from fixability or map
  const handleAddToInspectionPlan = (stationId: string) => {
    setSelectedStationId(stationId);
    setActiveTab('inspections');
  };

  // Select station for fixability deep-dive
  const handleSelectStationForAnalysis = (stationId: string) => {
    setSelectedStationId(stationId);
    setActiveTab('fixability');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSyncing={isSyncing}
        onSync={() => loadAllData(true)}
        lastSyncIST={lastSyncIST}
        activeSquadCount={settings.availableSquadCapacity}
        userRole={settings.currentUserRole}
        telemetryMode={telemetryMode}
        onToggleTelemetryMode={setTelemetryMode}
      />

      {/* Main Viewport Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center justify-between shadow-xs">
            <span>{errorMessage}</span>
            <button
              onClick={() => loadAllData(true)}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded font-bold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {loading && liveSnapshot.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-slate-800">
              Synchronizing Mumbai CAAQMS telemetry & atmospheric dispersion grids...
            </div>
            <div className="text-xs text-slate-500">
              Ingesting verified CPCB / MPCB stations across 24 BMC administrative wards
            </div>
          </div>
        ) : (
          <ErrorBoundary fallbackTitle="Municipal Air Quality Viewport">
            {activeTab === 'overview' && (
              <OverviewView
                stations={stations}
                liveSnapshot={liveSnapshot}
                fixabilityResults={fixabilityResults}
                forecasts={forecasts}
                inspectionPlan={inspectionPlan}
                squadCapacity={settings.availableSquadCapacity}
                uncertaintyPercent={settings.uncertaintyThresholdPercent}
                telemetryMode={telemetryMode}
                onNavigate={setActiveTab}
                onSelectStation={setSelectedStationId}
              />
            )}

            {activeTab === 'live' && (
              <LiveAirQualityView
                stations={stations}
                liveSnapshot={liveSnapshot}
                telemetryMode={telemetryMode}
                onToggleTelemetryMode={setTelemetryMode}
                onSelectStationForAnalysis={handleSelectStationForAnalysis}
              />
            )}

            {activeTab === 'map' && (
              <MumbaiMapView
                stations={stations}
                wards={wards}
                hotspots={hotspots}
                liveSnapshot={liveSnapshot}
                fixabilityResults={fixabilityResults}
                telemetryMode={telemetryMode}
                onSelectStationForAnalysis={handleSelectStationForAnalysis}
              />
            )}

            {activeTab === 'fixability' && (
              <FixabilityView
                results={fixabilityResults}
                stations={stations}
                uncertaintyPercent={settings.uncertaintyThresholdPercent}
                onUncertaintyChange={handleUncertaintyChange}
                onAddToInspectionPlan={handleAddToInspectionPlan}
                initialSelectedStationId={selectedStationId}
              />
            )}

            {activeTab === 'forecasts' && (
              <ForecastsView
                forecasts={forecasts}
                stations={stations}
                onNavigateToInspections={() => setActiveTab('inspections')}
              />
            )}

            {activeTab === 'inspections' && (
              <InspectionPlannerView
                inspectionPlan={inspectionPlan}
                squadCapacity={settings.availableSquadCapacity}
                onCapacityChange={handleCapacityChange}
                onUpdateCandidate={handleUpdateCandidate}
                onRegeneratePlan={() => handleCapacityChange(settings.availableSquadCapacity)}
              />
            )}

            {activeTab === 'plume' && (
              <PlumeInvestigationView />
            )}

            {activeTab === 'quality' && (
              <DataQualityView
                onTriggerSync={() => loadAllData(true)}
                isSyncing={isSyncing}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
              />
            )}
          </ErrorBoundary>
        )}
      </main>

      {/* Official Civic Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">CityPulse Mumbai</span>
            <span aria-hidden="true">·</span>
            <span>Municipal Air Intelligence & Decision Support</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>CPCB / MPCB Continuous Monitoring</span>
            <span aria-hidden="true">·</span>
            <span>Open-Meteo Atmospheric Physics</span>
            <span aria-hidden="true">·</span>
            <span>24 BMC Administrative Wards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
