/**
 * Top Navigation Bar
 * Follows the 3-zone Top Bar Contract:
 * [Brand Wordmark] — [4 Prominent Tabs + More Analysis ▾ Dropdown] — [Live Stream Status + Mode Toggle]
 * Completely eliminates horizontal overflow, tab clipping, and redundant polling buttons.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  SlidersHorizontal, 
  MapPin, 
  Activity, 
  CalendarCheck, 
  Wind, 
  Database,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

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
  telemetryMode,
  onToggleTelemetryMode
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4 Core Operational Tabs (Always Visible on all laptop/desktop screens)
  const primaryNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'map', label: 'Mumbai Map', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'live', label: 'Live Telemetry', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'inspections', label: 'Inspection Planner', icon: <CalendarCheck className="w-3.5 h-3.5" /> }
  ];

  // Secondary Specialized Tools (Grouped inside More Analysis ▾)
  const secondaryNavItems: { 
    id: ActiveTab; 
    label: string; 
    desc: string; 
    icon: React.ReactNode 
  }[] = [
    { 
      id: 'fixability', 
      label: 'Fixability Decomposition', 
      desc: 'Local excess vs regional weather attribution',
      icon: <ShieldAlert className="w-4 h-4 text-amber-600" /> 
    },
    { 
      id: 'forecasts', 
      label: '12-24h Forecasts', 
      desc: 'Predictive particulate trajectory & inversion risk',
      icon: <Sparkles className="w-4 h-4 text-indigo-600" /> 
    },
    { 
      id: 'plume', 
      label: 'Plume Evidence', 
      desc: 'Wind vector tracking from landfills & construction',
      icon: <Wind className="w-4 h-4 text-teal-600" /> 
    },
    { 
      id: 'quality', 
      label: 'Data Sources & QC', 
      desc: 'CPCB sensor health, flatline detection & audit',
      icon: <Database className="w-4 h-4 text-slate-600" /> 
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      desc: 'Squad capacity & uncertainty band calibration',
      icon: <SlidersHorizontal className="w-4 h-4 text-slate-600" /> 
    }
  ];

  const activeSecondaryItem = secondaryNavItems.find(item => item.id === activeTab);
  const isSecondaryActive = Boolean(activeSecondaryItem);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Municipal Wordmark */}
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
                Municipal Air Intelligence & Enforcement
              </p>
            </button>
          </div>

          {/* Zone 2: 4 Primary Tabs + "More Analysis ▾" Dropdown */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* "More Analysis ▾" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isSecondaryActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span>{isSecondaryActive ? activeSecondaryItem?.label : 'More Tools'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 mb-1">
                    Specialized Scientific & Audit Tools
                  </div>
                  {secondaryNavItems.map(item => {
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/70 border-l-2 border-teal-600' : ''
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Live Pulse Stream Indicator + Telemetry Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Continuous Stream Indicator (Replaces redundant manual Poll button) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Stream</span>
              {lastSyncIST && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono text-slate-500 text-[10px]">{lastSyncIST.replace(' IST', '')}</span>
                </>
              )}
            </div>

            {/* Quick manual re-sync icon button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ${
                isSyncing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Force immediate re-fetch from CPCB CAAQMS sensors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            {/* Realtime vs Hourly Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] font-medium">
              <button
                onClick={() => onToggleTelemetryMode('realtime')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                  telemetryMode === 'realtime'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Continuous real-time telemetry stream with micro-dispersion"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${telemetryMode === 'realtime' ? 'bg-teal-600 animate-pulse' : 'bg-slate-400'}`} />
                <span>Real-Time</span>
              </button>
              <button
                onClick={() => onToggleTelemetryMode('hourly')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                  telemetryMode === 'hourly'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Official 1-Hour regulatory average required by CPCB standards"
              >
                <span>1-Hr Avg</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet sub-navigation row (Scrollable) */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {[...primaryNavItems, ...secondaryNavItems].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
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
