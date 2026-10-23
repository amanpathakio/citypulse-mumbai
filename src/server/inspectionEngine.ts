/**
 * Municipal Inspection Planner & Squad Allocation Engine
 * Operational decision support for BMC Ward Health Officers and Environmental Inspection Squads.
 * Ranks candidate locations via documented multi-factor formula:
 * Score = 0.35 * Excess + 0.25 * Duration + 0.20 * PopDensityScore + 0.20 * ConfidenceScore - UncertaintyPenalty
 */

import { MUMBAI_WARDS } from '../data/mumbaiWardsAndStations';
import { InspectionCandidate, SquadShift, InspectionStatus } from '../types';
import { runFixabilityAnalysis } from './fixabilityEngine';
import { formatToIST } from './ingestionEngine';

// In-memory persistent store for inspection assignments during session
let activeInspectionPlan: InspectionCandidate[] = [];

/**
 * Generate prioritized inspection candidates based on current fixability analysis and capacity
 */
export async function generatePrioritizedInspectionCandidates(
  squadCapacity: number = 3,
  uncertaintyPercent: 70 | 80 | 90 = 80
): Promise<InspectionCandidate[]> {
  const fixResults = await runFixabilityAnalysis(uncertaintyPercent);

  // Filter candidates that exhibit either significant local excess or high observed PM2.5 in dense wards
  const rawCandidates: {
    stationId: string;
    stationName: string;
    ward: string;
    observedPM25: number;
    modeledLocalExcess: number;
    uncertaintyThreshold: number;
    durationHours: number;
    population: number;
    confidenceGrade: string;
    evidenceLinks: string[];
    suggestedActionTitle: string;
    suggestedActionDetails: string;
    targetShift: SquadShift;
    priorityScore: number;
  }[] = [];

  for (const res of fixResults) {
    if (res.verdict === 'INSUFFICIENT_EVIDENCE') continue;

    const wardInfo = MUMBAI_WARDS.find(w => w.code === res.ward);
    const population = wardInfo?.population ?? 400000;

    // Estimate duration of high readings (simulated from 24h history or current streak)
    const durationHours = res.isExcessSignificant ? 4 : 2;

    // --- DOCUMENTED FORMULA ---
    // Factor 1: Local Excess Magnitude (0 to 100 scaled)
    const excessScore = Math.min(100, (res.modeledLocalExcess / 60) * 100);

    // Factor 2: Duration / Persistence (up to 6h max)
    const durationScore = Math.min(100, (durationHours / 6) * 100);

    // Factor 3: Ward Population Density Exposure (population / 10000)
    const popScore = Math.min(100, (population / 900000) * 100);

    // Factor 4: Evidence Confidence Grade
    const confScore = res.confidenceGrade === 'HIGH' ? 100 : res.confidenceGrade === 'MODERATE' ? 70 : 40;

    // Penalty: High uncertainty threshold dampens priority
    const uncertaintyPenalty = Math.min(30, (res.uncertaintyThreshold / 30) * 30);

    const priorityScore = Number((
      0.35 * excessScore +
      0.25 * durationScore +
      0.20 * popScore +
      0.20 * confScore -
      uncertaintyPenalty * 0.5
    ).toFixed(1));

    // Determine shift & tailored action based on ward and primary lead
    let targetShift: SquadShift = 'MORNING_SHIFT';
    const hourNow = new Date().getHours();
    if (hourNow >= 12 && hourNow < 17) targetShift = 'AFTERNOON_SHIFT';
    else if (hourNow >= 17) targetShift = 'EVENING_SHIFT';

    let suggestedActionTitle = 'General Ambient & Road Dust Inspection';
    let suggestedActionDetails = 'Perform mobile boundary patrol, identify active open burning, and inspect road sweeping compliance.';

    if (res.investigationLeads.length > 0) {
      const topLead = res.investigationLeads[0];
      if (topLead.category === 'CONSTRUCTION') {
        suggestedActionTitle = `Construction Dust Audit: ${topLead.label}`;
        suggestedActionDetails = `Audit construction site boundary screens, high-pressure water misting guns, and wheel washing bays. ${topLead.recommendedAction}`;
      } else if (topLead.category === 'WASTE_BURNING') {
        suggestedActionTitle = `Landfill & Solid Waste Inspection: ${topLead.label}`;
        suggestedActionDetails = `Inspect dump boundary, check for subsurface smoldering, and enforce municipal anti-burning bylaws. ${topLead.recommendedAction}`;
      } else if (topLead.category === 'INDUSTRIAL_EMISSION') {
        suggestedActionTitle = `Industrial Stack Audit: ${topLead.label}`;
        suggestedActionDetails = `Inspect boiler fuel quality, CEMS telemetry, and fugitive VOC emissions. ${topLead.recommendedAction}`;
      } else if (topLead.category === 'ROAD_DUST') {
        suggestedActionTitle = `Arterial Corridor Sweeping: Ward ${res.ward}`;
        suggestedActionDetails = 'Dispatch BMC mechanical sweeping machines and water misting trucks along heavy transit corridors.';
      }
    }

    const evidenceLinks = [
      `Observed PM2.5: ${res.observedPM25} µg/m³`,
      `Regional Background: ${res.regionalBackground} µg/m³`,
      `Local Excess: ${res.modeledLocalExcess} µg/m³ (Threshold: ${res.uncertaintyThreshold} µg/m³)`,
      `Dispersion Index: ${res.dispersionIndex} (BLH: ${res.boundaryLayerHeightM}m, Wind: ${res.windSpeedKmh} km/h)`
    ];

    rawCandidates.push({
      stationId: res.stationId,
      stationName: res.stationName,
      ward: res.ward,
      observedPM25: res.observedPM25,
      modeledLocalExcess: res.modeledLocalExcess,
      uncertaintyThreshold: res.uncertaintyThreshold,
      durationHours,
      population,
      confidenceGrade: res.confidenceGrade,
      evidenceLinks,
      suggestedActionTitle,
      suggestedActionDetails,
      targetShift,
      priorityScore
    });
  }

  // Sort descending by priority score
  rawCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // Preserve existing officer status / edits if plan already has them
  const existingMap = new Map<string, InspectionCandidate>();
  activeInspectionPlan.forEach(p => existingMap.set(p.stationId, p));

  const updatedPlan: InspectionCandidate[] = rawCandidates.map((c, index) => {
    const existing = existingMap.get(c.stationId);
    const assignedSquad = index < squadCapacity ? `Squad ${String.fromCharCode(65 + index)}` : null;

    if (existing) {
      return {
        ...existing,
        priorityRank: index + 1,
        priorityScore: c.priorityScore,
        observedPM25: c.observedPM25,
        modeledLocalExcess: c.modeledLocalExcess,
        uncertaintyThreshold: c.uncertaintyThreshold,
        suggestedActionTitle: c.suggestedActionTitle,
        suggestedActionDetails: c.suggestedActionDetails,
        evidenceLinks: c.evidenceLinks,
        updatedAtIST: formatToIST(new Date())
      };
    }

    return {
      id: `insp-${c.stationId}-${Date.now().toString(36)}`,
      stationId: c.stationId,
      stationName: c.stationName,
      ward: c.ward,
      priorityRank: index + 1,
      priorityScore: c.priorityScore,
      observedPM25: c.observedPM25,
      modeledLocalExcess: c.modeledLocalExcess,
      uncertaintyThreshold: c.uncertaintyThreshold,
      durationHoursAboveThreshold: c.durationHours,
      targetShift: c.targetShift,
      suggestedActionTitle: c.suggestedActionTitle,
      suggestedActionDetails: c.suggestedActionDetails,
      assignedSquad,
      status: 'DRAFT' as InspectionStatus,
      evidenceLinks: c.evidenceLinks,
      dataQualityWarning: c.confidenceGrade === 'LOW' ? 'High statistical variance in sensor baseline.' : undefined,
      officerNotes: '',
      updatedAtIST: formatToIST(new Date())
    };
  });

  activeInspectionPlan = updatedPlan;
  return activeInspectionPlan;
}

/**
 * Update an individual inspection item (assignment, status, notes)
 */
export function updateInspectionItem(
  candidateId: string,
  updates: Partial<Pick<InspectionCandidate, 'assignedSquad' | 'status' | 'targetShift' | 'officerNotes' | 'outcomeReport'>>
): InspectionCandidate | null {
  const item = activeInspectionPlan.find(i => i.id === candidateId);
  if (!item) return null;

  if (updates.assignedSquad !== undefined) item.assignedSquad = updates.assignedSquad;
  if (updates.status !== undefined) item.status = updates.status;
  if (updates.targetShift !== undefined) item.targetShift = updates.targetShift;
  if (updates.officerNotes !== undefined) item.officerNotes = updates.officerNotes;
  if (updates.outcomeReport !== undefined) item.outcomeReport = updates.outcomeReport;
  item.updatedAtIST = formatToIST(new Date());

  return item;
}

/**
 * Get current active plan
 */
export function getActiveInspectionPlan(): InspectionCandidate[] {
  return activeInspectionPlan;
}
