/**
 * Top Navigation Bar
 * Follows the strict 3-zone Top Bar Contract:
 * [Brand Wordmark] — [Concise Navigation Tabs] — [Primary Action]
 */

import React from 'react';
import { RefreshCw, ShieldAlert, Sparkles, SlidersHorizontal, MapPin, Activity, CalendarCheck, Wind, Database } from 'lucide-react';

export type ActiveTab = 
  | 'overview' 
  | 'live' 
  | 'map' 
  | 'fixability' 
  | 'forecasts' 
  | 'inspections' 
  | 'plume' 
  | 'quality' 
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSyncing: boolean;
  onSync: () => void;
  lastSyncIST?: string;
  activeSquadCount: number;
  userRole: string;
  telemetryMode: 'realtime' | 'hourly';
  onToggleTelemetryMode: (mode: 'realtime' | 'hourly') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isSyncing,
  onSync,
  lastSyncIST,
  userRole,
  telemetryMode,
  onToggleTelemetryMode
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'live', label: 'Live Telemetry', icon: <Wind className="w-4 h-4" /> },
    { id: 'map', label: 'Mumbai Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'fixability', label: 'Fixability Analysis', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'forecasts', label: '12-24h Forecasts', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'inspections', label: 'Inspection Planner', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'plume', label: 'Plume Evidence', icon: <Wind className="w-4 h-4" /> },
    { id: 'quality', label: 'Data Sources & QC', icon: <Database className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SlidersHorizontal className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onTabChange('overview')}
              className="text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors whitespace-nowrap">
                  CityPulse Mumbai
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-teal-800 bg-teal-50 border border-teal-200">
                  BMC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
                Municipal Air Intelligence & Inspection Allocation
              </p>
            </button>
          </div>

          {/* Zone 2: Navigation links / tabs */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action button + role info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Realtime vs Hourly Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] font-medium">
              <button
                onClick={() => onToggleTelemetryMode('realtime')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                  telemetryMode === 'realtime'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Continuous 1-minute real-time telemetry stream with micro-dispersion"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${telemetryMode === 'realtime' ? 'bg-teal-600 animate-pulse' : 'bg-slate-400'}`} />
                <span>Real-Time Stream</span>
              </button>
              <button
                onClick={() => onToggleTelemetryMode('hourly')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                  telemetryMode === 'hourly'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Official 1-Hour regulatory average required by CPCB/NAAQS standards"
              >
                <span>1-Hr CAAQMS Avg</span>
              </button>
            </div>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer ${
                isSyncing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Synchronize live CPCB/MPCB CAAQMS & Open-Meteo feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Poll Stream'}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet sub-navigation row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
