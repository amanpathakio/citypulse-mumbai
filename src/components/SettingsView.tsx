/**
 * Settings & Municipal Administration Module
 * Configures prediction uncertainty thresholds, municipal squad capacity,
 * user operational roles, Indian NAAQS standard alerts, and optional OpenAQ v3 keys.
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Users, 
  UserCheck, 
  Key, 
  Shield, 
  CheckCircle2, 
  RotateCcw,
  Info
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.openAqApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ openAqApiKey: apiKeyInput });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      uncertaintyThresholdPercent: 80,
      availableSquadCapacity: 3,
      naaqsPM25Standard: 60,
      currentUserRole: 'BMC_WARD_HEALTH_OFFICER',
      openAqApiKey: ''
    });
    setApiKeyInput('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Municipal Administration Console</span>
          <span aria-hidden="true">·</span>
          <span>Role & Algorithm Parameters</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Settings & Algorithm Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage operational roles, calibrated uncertainty thresholds, inspection squad roster constraints, and data provider credentials.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Configuration saved successfully and applied to live analysis engines.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs divide-y divide-slate-100">
        {/* Role Selector */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>Current Operating Persona / Role</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Controls functional permissions, directive issuance, and report signature blocks.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-64">
            <select
              value={settings.currentUserRole}
              onChange={(e) => onUpdateSettings({ currentUserRole: e.target.value as any })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-teal-600"
            >
              <option value="BMC_WARD_HEALTH_OFFICER">BMC Ward Health Officer</option>
              <option value="INSPECTION_LEAD">Pollution Control Inspection Lead</option>
              <option value="MUNICIPAL_ADMIN">Municipal Supervisor & Admin</option>
              <option value="RESEARCH_ANALYST">Environmental Research Analyst</option>
            </select>
          </div>
        </div>

        {/* Prediction Interval Band */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-700" />
              <span>Local Excess Prediction Interval (Uncertainty Band)</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Defines the statistical significance cutoff before a station's excess is classified as actionable local anomaly.
            </p>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Default: 80% (1.282σ) · 70% (1.04σ) · 90% (1.645σ)
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs font-semibold shrink-0">
            <button
              onClick={() => onUpdateSettings({ uncertaintyThresholdPercent: 70 })}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                settings.uncertaintyThresholdPercent === 70 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              70% Band
            </button>
            <button
              onClick={() => onUpdateSettings({ uncertaintyThresholdPercent: 80 })}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                settings.uncertaintyThresholdPercent === 80 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80% (Standard)
            </button>
            <button
              onClick={() => onUpdateSettings({ uncertaintyThresholdPercent: 90 })}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                settings.uncertaintyThresholdPercent === 90 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90% Band
            </button>
          </div>
        </div>

        {/* Squad Capacity Default */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Active Field Inspection Squad Capacity</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Maximum concurrent mobile inspection units available for priority dispatch across Mumbai wards.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {[1, 3, 5, 8, 10].map(c => (
              <button
                key={c}
                onClick={() => onUpdateSettings({ availableSquadCapacity: c })}
                className={`w-9 h-9 text-xs font-mono font-bold rounded-md border transition-colors cursor-pointer ${
                  settings.availableSquadCapacity === c
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* NAAQS PM2.5 24h Threshold */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>National Ambient Air Quality Standard (NAAQS) Baseline</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Central Pollution Control Board (CPCB) statutory 24-hour PM2.5 limit for Indian cities.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              value={settings.naaqsPM25Standard}
              onChange={(e) => onUpdateSettings({ naaqsPM25Standard: Number(e.target.value) || 60 })}
              className="w-24 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-teal-600 text-right"
            />
            <span className="text-xs text-slate-500 font-medium">µg/m³</span>
          </div>
        </div>

        {/* OpenAQ API Key (Optional) */}
        <div className="p-5">
          <div className="space-y-1 mb-3">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-700" />
              <span>Optional OpenAQ v3 API Key</span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              OpenAQ Version 3 endpoints require an API Key. If provided, the system utilizes direct OpenAQ sensor endpoints alongside verified Open-Meteo CAMS/CPCB reanalysis feeds.
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              placeholder="Enter OpenAQ v3 API Key (optional)..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="text-xs flex-1 bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 placeholder-slate-400 focus:outline-teal-600 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Save Credentials
            </button>
          </form>
        </div>
      </div>

      {/* Reset Defaults */}
      <div className="flex justify-end">
        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset System to Factory Baseline Defaults</span>
        </button>
      </div>
    </div>
  );
};
