/**
 * Municipal Inspection Planner & Squad Allocation Module
 * Operational planning tool for BMC Ward Health Officers.
 * Features squad capacity selection (1, 3, 5, or custom), ranked candidate prioritization,
 * shift scheduling, manual reassignments, workflow dispatching, field notes modal, and CSV / Print exports.
 */

import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  FileSpreadsheet, 
  Printer, 
  Edit3, 
  ShieldAlert, 
  Filter, 
  HelpCircle,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { InspectionCandidate, SquadShift, InspectionStatus } from '../types';

interface InspectionPlannerViewProps {
  inspectionPlan: InspectionCandidate[];
  squadCapacity: number;
  onCapacityChange: (cap: number) => void;
  onUpdateCandidate: (
    candidateId: string, 
    updates: Partial<Pick<InspectionCandidate, 'assignedSquad' | 'status' | 'targetShift' | 'officerNotes' | 'outcomeReport'>>
  ) => void;
  onRegeneratePlan: () => void;
}

export const InspectionPlannerView: React.FC<InspectionPlannerViewProps> = ({
  inspectionPlan,
  squadCapacity,
  onCapacityChange,
  onUpdateCandidate,
  onRegeneratePlan
}) => {
  const [selectedCandidateForNotes, setSelectedCandidateForNotes] = useState<InspectionCandidate | null>(null);
  const [officerNotesInput, setOfficerNotesInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter candidates
  const filteredCandidates = inspectionPlan.filter(c => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ASSIGNED') return c.assignedSquad !== null;
    if (statusFilter === 'UNASSIGNED') return c.assignedSquad === null;
    return c.status === statusFilter;
  });

  // Calculate dispatched squads
  const assignedSquads = Array.from(new Set(inspectionPlan.map(c => c.assignedSquad).filter(Boolean)));

  // Handle Export CSV
  const exportToCSV = () => {
    const headers = ['Priority Rank', 'Score', 'Station Name', 'Ward', 'Observed PM2.5', 'Local Excess', '80% Threshold', 'Assigned Squad', 'Shift', 'Status', 'Suggested Action', 'Officer Notes'];
    const rows = inspectionPlan.map(c => [
      c.priorityRank,
      c.priorityScore,
      `"${c.stationName}"`,
      c.ward,
      c.observedPM25,
      c.modeledLocalExcess,
      c.uncertaintyThreshold,
      c.assignedSquad || 'Unassigned',
      c.targetShift,
      c.status,
      `"${c.suggestedActionTitle}"`,
      `"${c.officerNotes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BMC_Inspection_Plan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Print Dossier
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Municipal Enforcement Directorate</span>
              <span aria-hidden="true">·</span>
              <span>BMC Air Pollution Control Squads</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Inspection Planner & Squad Allocation
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Ranks actionable local-excess anomalies using multi-factor objective scoring. Allocates field squads with shift scheduling and duplicate prevention.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Squad Capacity Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 pl-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                <span>Squad Capacity:</span>
              </span>
              <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 font-mono font-bold">
                {[1, 3, 5, 8].map(cap => (
                  <button
                    key={cap}
                    onClick={() => onCapacityChange(cap)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                      squadCapacity === cap ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Export inspection plan as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Print official municipal dispatch sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Priority Formula Explanation Banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="font-mono text-[11px] text-slate-500">
            <strong>Scoring Formula:</strong> 0.35 × LocalExcess + 0.25 × Duration + 0.20 × WardPopulation + 0.20 × Confidence - UncertaintyPenalty
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="ALL">All Candidates ({inspectionPlan.length})</option>
              <option value="ASSIGNED">Assigned Squads ({assignedSquads.length})</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="DRAFT">Status: Draft</option>
              <option value="APPROVED">Status: Approved</option>
              <option value="DISPATCHED">Status: Dispatched</option>
              <option value="COMPLETED">Status: Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Inspection Candidates List */}
      <div className="space-y-3">
        {filteredCandidates.map((candidate) => {
          const isTopTier = candidate.priorityRank <= squadCapacity;

          return (
            <div
              key={candidate.id}
              className={`bg-white border rounded-lg p-5 shadow-xs transition-all ${
                isTopTier ? 'border-teal-300 ring-1 ring-teal-300/40' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Rank & Station Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                    isTopTier ? 'bg-teal-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{candidate.priorityRank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {candidate.stationName}
                      </h3>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Ward {candidate.ward}
                      </span>
                      {candidate.dataQualityWarning && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Variance Warning</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-600 font-medium">
                      {candidate.suggestedActionTitle}
                    </div>

                    <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {candidate.suggestedActionDetails}
                    </p>

                    {/* Evidence Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      {candidate.evidenceLinks.map((ev, i) => (
                        <span key={i} className="font-mono bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Operational Controls (Squad, Shift, Status) */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  {/* Squad Assignment Selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Assigned Squad
                    </label>
                    <select
                      value={candidate.assignedSquad || 'NONE'}
                      onChange={(e) => {
                        const val = e.target.value === 'NONE' ? null : e.target.value;
                        onUpdateCandidate(candidate.id, { assignedSquad: val });
                      }}
                      className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-teal-600"
                    >
                      <option value="NONE">Unassigned</option>
                      {Array.from({ length: squadCapacity }).map((_, i) => {
                        const squadName = `Squad ${String.fromCharCode(65 + i)}`;
                        return (
                          <option key={squadName} value={squadName}>
                            {squadName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Shift Selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Shift
                    </label>
                    <select
                      value={candidate.targetShift}
                      onChange={(e) => {
                        onUpdateCandidate(candidate.id, { targetShift: e.target.value as SquadShift });
                      }}
                      className="text-xs font-medium bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-teal-600"
                    >
                      <option value="MORNING_SHIFT">Morning (07:00–12:00)</option>
                      <option value="AFTERNOON_SHIFT">Afternoon (12:00–17:00)</option>
                      <option value="EVENING_SHIFT">Evening (17:00–22:00)</option>
                    </select>
                  </div>

                  {/* Status Workflow Selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Dispatch Status
                    </label>
                    <select
                      value={candidate.status}
                      onChange={(e) => {
                        onUpdateCandidate(candidate.id, { status: e.target.value as InspectionStatus });
                      }}
                      className={`text-xs font-bold rounded px-2.5 py-1.5 border ${
                        candidate.status === 'DISPATCHED'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : candidate.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                          : candidate.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-slate-50 text-slate-800 border-slate-300'
                      }`}
                    >
                      <option value="DRAFT">Draft Plan</option>
                      <option value="APPROVED">Approved by Officer</option>
                      <option value="DISPATCHED">Dispatched Squad</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed & Mitigated</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {/* Notes / Action Button */}
                  <div className="pt-4 lg:pt-0">
                    <button
                      onClick={() => {
                        setSelectedCandidateForNotes(candidate);
                        setOfficerNotesInput(candidate.officerNotes || '');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Add Officer Field Notes & Outcome"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{candidate.officerNotes ? 'Notes Logged' : 'Add Note'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Officer Field Note if present */}
              {candidate.officerNotes && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Officer Field Log: </span>
                  {candidate.officerNotes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Officer Notes Modal */}
      {selectedCandidateForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Officer Field Notes: {selectedCandidateForNotes.stationName}
                </h3>
                <div className="text-xs text-slate-500">
                  Ward {selectedCandidateForNotes.ward} · Priority #{selectedCandidateForNotes.priorityRank}
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidateForNotes(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">
                Inspection Squad Directives & Enforcement Notes:
              </label>
              <textarea
                rows={4}
                value={officerNotesInput}
                onChange={(e) => setOfficerNotesInput(e.target.value)}
                placeholder="e.g. Inspect contractor water sprinkling logs at Western Express Highway flyover worksite. Issue notice under BMC Act section 381 if screens missing."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-teal-600"
              />
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedCandidateForNotes(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateCandidate(selectedCandidateForNotes.id, { officerNotes: officerNotesInput });
                  setSelectedCandidateForNotes(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
              >
                Save Field Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
