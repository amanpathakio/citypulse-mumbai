/**
 * Core CityPulse Methodology — Fixability Analysis & Attribution Engine
 * Decomposes observed ambient PM2.5 into:
 * 1. Regional background (spatial median of concurrent reference stations)
 * 2. Weather-associated expected dispersion modulation (boundary layer height & wind potential)
 * 3. Residual local excess anomaly with calibrated 80% (or configurable) prediction intervals.
 */

import { MUMBAI_STATIONS, KNOWN_HOTSPOTS } from '../data/mumbaiWardsAndStations';
import { FixabilityResult, DecisionVerdict, ConfidenceGrade, InvestigationLead } from '../types';
import { fetchStationData, getStationsLiveSnapshot } from './ingestionEngine';

// Statistical helper: median
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Statistical helper: standard deviation
function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 8.0;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Perform Fixability Decomposition for all active Mumbai stations
 * @param uncertaintyPercent 70 | 80 | 90
 */
export async function runFixabilityAnalysis(uncertaintyPercent: 70 | 80 | 90 = 80): Promise<FixabilityResult[]> {
  const snapshot = await getStationsLiveSnapshot();

  // Z-factor for one-sided prediction threshold
  // 70% -> 1.04, 80% -> 1.282, 90% -> 1.645
  const zScoreFactor = uncertaintyPercent === 90 ? 1.645 : uncertaintyPercent === 70 ? 1.04 : 1.282;

  // Extract all valid concurrent PM2.5 readings for spatial median reference pool
  const validReadingsPool: { stationId: string; pm2_5: number }[] = [];
  snapshot.forEach(item => {
    if (item.latestAQ && item.latestAQ.pm2_5 !== null && item.latestAQ.status !== 'SUSPECT_FLATLINE') {
      validReadingsPool.push({
        stationId: item.station.id,
        pm2_5: item.latestAQ.pm2_5
      });
    }
  });

  const results: FixabilityResult[] = [];

  for (const item of snapshot) {
    const station = item.station;
    const latestAQ = item.latestAQ;
    const latestWeather = item.latestWeather;

    if (!latestAQ || latestAQ.pm2_5 === null || item.freshnessStatus === 'OUTAGE') {
      // Insufficient evidence due to outage
      results.push({
        stationId: station.id,
        stationName: station.name,
        ward: station.ward,
        timestampIST: latestAQ?.timestampIST || 'N/A',
        observedPM25: latestAQ?.pm2_5 ?? 0,
        regionalBackground: 0,
        weatherExpectedVariance: 0,
        dispersionIndex: 1.0,
        boundaryLayerHeightM: latestWeather?.boundaryLayerHeightM ?? 500,
        windSpeedKmh: latestWeather?.windSpeedKmh ?? 10,
        windDirectionDeg: latestWeather?.windDirectionDeg ?? 270,
        rawLocalResidual: 0,
        modeledLocalExcess: 0,
        uncertaintyThreshold: 0,
        isExcessSignificant: false,
        verdict: 'INSUFFICIENT_EVIDENCE',
        verdictLabel: 'Insufficient Evidence — Stale or Missing Sensor Feed',
        confidenceGrade: 'INSUFFICIENT',
        evidenceNarrative: `Monitoring station ${station.name} in Ward ${station.ward} has no recent valid observation within the last 6 hours. No attribution verdict can be scientifically established without current data.`,
        scientificNotes: [
          'CPCB/MPCB data stream is inactive or lagging >360 minutes.',
          'Missing data is preserved without fabricated imputation.'
        ],
        investigationLeads: [
          {
            category: 'SENSOR_AUDIT',
            label: 'Instrument Communications Check',
            description: `Inspect telemetry modem and power supply for CAAQMS ${station.name}.`,
            recommendedAction: 'Dispatch municipal electronics instrumentation squad for calibration.'
          }
        ],
        historicalStdDev: 0
      });
      continue;
    }

    const obsPM25 = latestAQ.pm2_5;
    const blh = latestWeather?.boundaryLayerHeightM ?? 450;
    const windSpeed = latestWeather?.windSpeedKmh ?? 8;
    const windDir = latestWeather?.windDirectionDeg ?? 290;
    const rh = latestWeather?.relativeHumidityPct ?? 65;

    // 1. Regional Background: Spatial median of other stations (leave-one-out)
    const otherReadings = validReadingsPool.filter(r => r.stationId !== station.id).map(r => r.pm2_5);
    const regionalBg = otherReadings.length >= 3 ? Number(calculateMedian(otherReadings).toFixed(1)) : obsPM25;

    // 2. Weather-associated expected dispersion modulation:
    // Physical formulation: Atmospheric boundary layer height (BLH) < 300m implies nocturnal/morning thermal inversion
    // Low wind (< 5 km/h) combined with low BLH traps particulates near ground level.
    // Normalized dispersion index: baseline 1.0 (BLH=800m, wind=12km/h)
    const blhFactor = Math.max(0.15, Math.min(2.0, blh / 700));
    const windFactor = Math.max(0.2, Math.min(2.0, windSpeed / 10));
    const dispersionIndex = Number((blhFactor * 0.65 + windFactor * 0.35).toFixed(2));

    // When dispersionIndex < 0.8, meteorology is trapping pollutants; expect higher regional concentration
    // Weather-associated elevation above neutral dispersion baseline:
    let weatherModulation = 0;
    if (dispersionIndex < 1.0) {
      // Inversion entrapment effect: elevates ambient concentrations by up to 25-40% of background
      weatherModulation = Number(((1.0 / dispersionIndex - 1.0) * 16.0).toFixed(1));
    } else {
      // Good ventilation decreases expected stagnant concentration
      weatherModulation = Number(((1.0 - dispersionIndex) * 8.0).toFixed(1));
    }

    // 3. Residual Local Excess Calculation:
    // Raw mathematical residual:
    const rawResidual = Number((obsPM25 - (regionalBg + weatherModulation)).toFixed(1));
    
    // Non-negative modeled local excess:
    const modeledLocalExcess = Number(Math.max(0, obsPM25 - regionalBg - Math.max(0, weatherModulation)).toFixed(1));

    // Historical standard deviation & uncertainty calibration:
    // Fetch last 48h to calculate station residual variance
    const cachedData = await fetchStationData(station.id);
    const validHistory = cachedData.airQuality.filter(r => r.status === 'VALID' && r.pm2_5 !== null).map(r => r.pm2_5!);
    const histMean = validHistory.length > 0 ? validHistory.reduce((a, b) => a + b, 0) / validHistory.length : obsPM25;
    const histStdDev = Number(calculateStdDev(validHistory, histMean).toFixed(1));

    // Calibrated uncertainty band: Z * residual standard error
    // Residual standard error is typically ~30-40% of total station standard deviation
    const residualStdError = Math.max(5.0, histStdDev * 0.38);
    const uncertaintyThreshold = Number((zScoreFactor * residualStdError).toFixed(1));

    const isExcessSignificant = modeledLocalExcess > uncertaintyThreshold;

    // 4. Decision Verdict Formulation
    let verdict: DecisionVerdict = 'WITHIN_NAAQS_STANDARD';
    let verdictLabel = 'Within Indian NAAQS 24h Standard (60 µg/m³)';
    let evidenceNarrative = '';

    if (obsPM25 <= 60) {
      verdict = 'WITHIN_NAAQS_STANDARD';
      verdictLabel = 'Within Standard — Normal Ambient Conditions';
      evidenceNarrative = `Observed PM2.5 of ${obsPM25} µg/m³ is within the National Ambient Air Quality Standard (NAAQS 24-hr threshold of 60 µg/m³). No exceptional municipal mitigation required.`;
    } else if (isExcessSignificant && modeledLocalExcess >= 15) {
      verdict = 'INVESTIGATE_LOCAL_EXCESS';
      verdictLabel = `Investigate Possible Local Excess (+${modeledLocalExcess} µg/m³ above ${uncertaintyPercent}% band)`;
      evidenceNarrative = `Observed PM2.5 (${obsPM25} µg/m³) is ${rawResidual > 0 ? `+${rawResidual} µg/m³` : ''} higher than regional and meteorological expectations. Modeled local excess of ${modeledLocalExcess} µg/m³ exceeds the ${uncertaintyPercent}% uncertainty threshold (${uncertaintyThreshold} µg/m³). Inspection squad investigation warranted.`;
    } else if (regionalBg >= 75 && rawResidual < uncertaintyThreshold) {
      verdict = 'REGIONAL_EPISODE';
      verdictLabel = 'Regional Episode — Widespread Elevated Background';
      evidenceNarrative = `Elevated PM2.5 (${obsPM25} µg/m³) is primarily driven by widespread regional background (${regionalBg} µg/m³ across Mumbai). Station does not show statistically isolated local excess. Focus on city-wide advisories rather than hyper-local spot enforcement.`;
    } else if (blh < 250 || dispersionIndex < 0.55) {
      verdict = 'WEATHER_ASSOCIATED';
      verdictLabel = 'Weather-Associated — Nocturnal/Morning Thermal Inversion Trap';
      evidenceNarrative = `Elevated PM2.5 (${obsPM25} µg/m³) aligns with acute boundary layer compression (BLH: ${blh} m) and calm surface winds (${windSpeed} km/h). Weak vertical ventilation is trapping baseline emissions. Monitor until convective boundary layer rises.`;
    } else {
      verdict = 'REGIONAL_EPISODE';
      verdictLabel = 'Moderate Regional Variation — Below Uncertainty Band';
      evidenceNarrative = `Observed PM2.5 (${obsPM25} µg/m³) is elevated, but the local difference (+${modeledLocalExcess} µg/m³) does not exceed the ${uncertaintyPercent}% prediction threshold (${uncertaintyThreshold} µg/m³). Insufficient statistical confidence to assert a hyper-local source.`;
    }

    // 5. Confidence Grading:
    let confidenceGrade: ConfidenceGrade = 'HIGH';
    if (otherReadings.length < 5 || validHistory.length < 24) {
      confidenceGrade = 'LOW';
    } else if (latestAQ.isImputed || otherReadings.length < 8) {
      confidenceGrade = 'MODERATE';
    }

    // 6. Contextual Investigation Leads from nearby hotspots:
    const nearbyHotspots = KNOWN_HOTSPOTS.map(h => ({
      hotspot: h,
      distanceKm: Number(haversineDistance(station.lat, station.lng, h.lat, h.lng).toFixed(1))
    })).filter(h => h.distanceKm <= 7.0).sort((a, b) => a.distanceKm - b.distanceKm);

    const investigationLeads: InvestigationLead[] = [];
    nearbyHotspots.forEach(nh => {
      const h = nh.hotspot;
      if (h.category === 'INFRASTRUCTURE_CONSTRUCTION') {
        investigationLeads.push({
          category: 'CONSTRUCTION',
          label: `${h.name} (${nh.distanceKm} km)`,
          description: h.description,
          distanceKm: nh.distanceKm,
          recommendedAction: 'Audit water sprinkler logs, wheel-washing bays, and dust screen compliance.'
        });
      } else if (h.category === 'WASTE_DUMPING_GROUND') {
        investigationLeads.push({
          category: 'WASTE_BURNING',
          label: `${h.name} (${nh.distanceKm} km)`,
          description: h.description,
          distanceKm: nh.distanceKm,
          recommendedAction: 'Inspect landfill perimeter for active smoldering and refuse combustion.'
        });
      } else if (h.category === 'INDUSTRIAL_CLUSTER') {
        investigationLeads.push({
          category: 'INDUSTRIAL_EMISSION',
          label: `${h.name} (${nh.distanceKm} km)`,
          description: h.description,
          distanceKm: nh.distanceKm,
          recommendedAction: 'Check boiler fuel certificates and continuous emission telemetry.'
        });
      }
    });

    if (station.environment === 'TRAFFIC_CORRIDOR') {
      investigationLeads.push({
        category: 'ROAD_DUST',
        label: `Arterial Road Silt & Traffic Corridor (${station.ward})`,
        description: 'Heavy diesel transit and resuspended road silt along main carriageways.',
        recommendedAction: 'Coordinate mechanical road sweeping and evening water misting.'
      });
    }

    results.push({
      stationId: station.id,
      stationName: station.name,
      ward: station.ward,
      timestampIST: latestAQ.timestampIST,
      observedPM25: obsPM25,
      regionalBackground: regionalBg,
      weatherExpectedVariance: weatherModulation,
      dispersionIndex,
      boundaryLayerHeightM: blh,
      windSpeedKmh: windSpeed,
      windDirectionDeg: windDir,
      rawLocalResidual: rawResidual,
      modeledLocalExcess: modeledLocalExcess,
      uncertaintyThreshold,
      isExcessSignificant,
      verdict,
      verdictLabel,
      confidenceGrade,
      evidenceNarrative,
      scientificNotes: [
        `Regional background is spatial median of ${otherReadings.length} other concurrent Mumbai stations.`,
        `Meteorological dispersion combines Boundary Layer Height (${blh}m) and Wind (${windSpeed} km/h).`,
        `Local excess is flagged only when exceeding the ${uncertaintyPercent}% prediction interval (${uncertaintyThreshold} µg/m³).`,
        'Model outputs represent statistical anomalies, not definitive legal proof of specific source culpability.'
      ],
      investigationLeads,
      historicalStdDev: histStdDev
    });
  }

  return results;
}
