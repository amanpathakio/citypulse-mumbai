/**
 * CityPulse Mumbai — Core Data Types & Schemas
 * Standardized for municipal air-quality decision support and inspection planning.
 */

export type PollutantType = 'pm2_5' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';

export type CoverageStatus = 'DIRECT_STATION' | 'NEIGHBORING_PROXY' | 'UNMONITORED_GAP';

export type OperatorType = 'CPCB' | 'MPCB' | 'IITM_SAFAR';

export type SiteEnvironment = 'TRAFFIC_CORRIDOR' | 'INDUSTRIAL' | 'RESIDENTIAL' | 'COASTAL' | 'ECOLOGICAL_BUFFER';

export interface WardInfo {
  code: string; // e.g. "H/E", "M/E", "A"
  name: string; // e.g. "Bandra East, Santacruz East"
  officeLocation: string;
  population: number; // 2021-2024 estimated
  areaKm2: number;
  centroid: [number, number]; // [lat, lng]
  coverageStatus: CoverageStatus;
  primaryStationId?: string;
  keyConcerns: string[];
}

export interface MonitoringStation {
  id: string; // e.g. "mumbai-bkc"
  name: string; // e.g. "Bandra Kurla Complex (BKC)"
  cpcbId?: string;
  ward: string; // e.g. "H/E"
  lat: number;
  lng: number;
  operator: OperatorType;
  environment: SiteEnvironment;
  address: string;
  elevationM: number;
  commissionedDate: string;
  hasActiveFeed: boolean;
  notes: string;
}

export interface RealtimeTelemetry {
  instantPM25: number;
  instantPM10: number;
  instantNO2: number;
  instantTimestampIST: string;
  streamingTickMs: number;
  oneMinuteDelta: number; // instantaneous minute delta in µg/m³ (e.g. +1.4 or -0.8)
  minuteTrend60m: { minuteIST: string; pm2_5: number }[];
}

export interface StationSnapshotItem {
  station: MonitoringStation;
  latestAQ: AirQualityReading | null;
  latestWeather: WeatherReading | null;
  realtime?: RealtimeTelemetry;
  freshnessStatus: 'ONLINE_HEALTHY' | 'STALE' | 'OUTAGE';
  ageMinutes: number;
}

export interface AirQualityReading {
  stationId: string;
  timestampUTC: string;
  timestampIST: string;
  pm2_5: number | null; // in µg/m³
  pm10?: number | null;
  no2?: number | null;
  o3?: number | null;
  so2?: number | null;
  co?: number | null;
  status: 'VALID' | 'SUSPECT_FLATLINE' | 'OUT_OF_RANGE' | 'MISSING' | 'IMPUTED';
  isImputed: boolean;
  imputationMethod?: 'LINEAR_3H_MAX' | 'PERSISTENCE' | 'NONE';
  sourceProvider: string;
  ingestedAt: string;
}

export interface WeatherReading {
  stationId: string;
  timestampUTC: string;
  timestampIST: string;
  temperatureC: number;
  relativeHumidityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number; // 0-360
  boundaryLayerHeightM: number; // key parameter for thermal inversion / dispersion
  surfacePressureHpa: number;
  precipitationMm: number;
  isForecast: boolean;
  sourceProvider: string;
}

export type DecisionVerdict = 
  | 'INVESTIGATE_LOCAL_EXCESS'
  | 'REGIONAL_EPISODE'
  | 'WEATHER_ASSOCIATED'
  | 'WITHIN_NAAQS_STANDARD'
  | 'INSUFFICIENT_EVIDENCE';

export type ConfidenceGrade = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';

export interface InvestigationLead {
  category: 'CONSTRUCTION' | 'ROAD_DUST' | 'INDUSTRIAL_EMISSION' | 'WASTE_BURNING' | 'SENSOR_AUDIT';
  label: string;
  description: string;
  distanceKm?: number;
  recommendedAction: string;
}

export interface FixabilityResult {
  stationId: string;
  stationName: string;
  ward: string;
  timestampIST: string;
  observedPM25: number;
  regionalBackground: number; // spatial median across other stations
  weatherExpectedVariance: number; // dispersion-calibrated expected elevation
  dispersionIndex: number; // boundary layer & wind combined score (0.1 to 2.0)
  boundaryLayerHeightM: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  rawLocalResidual: number; // observed - (background + weather)
  modeledLocalExcess: number; // non-negative local excess estimate
  uncertaintyThreshold: number; // 80% (or configured) prediction threshold
  isExcessSignificant: boolean;
  verdict: DecisionVerdict;
  verdictLabel: string;
  confidenceGrade: ConfidenceGrade;
  evidenceNarrative: string;
  scientificNotes: string[];
  investigationLeads: InvestigationLead[];
  historicalStdDev: number;
}

export interface HourlyForecastItem {
  timestampIST: string;
  predictedPM25: number;
  lowerBound80: number;
  upperBound80: number;
  persistenceBaseline: number;
  weatherInformedBaseline: number;
  boundaryLayerHeightM: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  isHighRiskWindow: boolean;
  dispersionCategory: 'TRAPPED_INVERSION' | 'MODERATE_DISPERSION' | 'GOOD_VENTILATION';
}

export interface StationForecast {
  stationId: string;
  stationName: string;
  ward: string;
  generatedAtIST: string;
  modelVersion: string;
  trainingWindow: string;
  testMAE: number; // in µg/m³
  testRMSE: number; // in µg/m³
  hourlyForecasts: HourlyForecastItem[];
}

export type SquadShift = 'MORNING_SHIFT' | 'AFTERNOON_SHIFT' | 'EVENING_SHIFT';

export type InspectionStatus = 'DRAFT' | 'APPROVED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface InspectionCandidate {
  id: string;
  stationId: string;
  stationName: string;
  ward: string;
  priorityRank: number;
  priorityScore: number;
  observedPM25: number;
  modeledLocalExcess: number;
  uncertaintyThreshold: number;
  durationHoursAboveThreshold: number;
  targetShift: SquadShift;
  suggestedActionTitle: string;
  suggestedActionDetails: string;
  assignedSquad: string | null; // e.g. "Squad Alpha", "Squad Beta", null
  status: InspectionStatus;
  evidenceLinks: string[];
  dataQualityWarning?: string;
  officerNotes?: string;
  outcomeReport?: string;
  updatedAtIST: string;
}

export interface KnownPollutionHotspot {
  id: string;
  name: string;
  category: 'INFRASTRUCTURE_CONSTRUCTION' | 'WASTE_DUMPING_GROUND' | 'INDUSTRIAL_CLUSTER' | 'TRAFFIC_HUB';
  ward: string;
  lat: number;
  lng: number;
  description: string;
  knownMitigationRequirements: string[];
}

export interface UpwindDownwindAnalysis {
  hotspot: KnownPollutionHotspot;
  currentWindDirDeg: number;
  currentWindSpeedKmh: number;
  windDirectionLabel: string; // e.g. "North-Northwest (NNW)"
  upwindStations: { station: MonitoringStation; pm2_5: number; angleDiffDeg: number }[];
  downwindStations: { station: MonitoringStation; pm2_5: number; angleDiffDeg: number }[];
  deltaPM25: number | null; // downwind PM2.5 - upwind PM2.5
  isPlumeDetected: boolean;
  significanceAssessment: string;
}

export interface DataQualitySummary {
  freshnessIST: string;
  totalStations: number;
  activeStations: number;
  staleStations: number;
  missingReadingsPct24h: number;
  imputedReadingsCount24h: number;
  rejectedFlatlineCount24h: number;
  stationFreshnessList: {
    stationId: string;
    stationName: string;
    ward: string;
    lastObservationIST: string;
    latencyMinutes: number;
    missingPct7d: number;
    status: 'ONLINE_HEALTHY' | 'STALE' | 'OUTAGE';
  }[];
  recentPipelineLogs: {
    timestampIST: string;
    source: string;
    recordsProcessed: number;
    recordsImputed: number;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    durationMs: number;
    message: string;
  }[];
}

export interface AppSettings {
  uncertaintyThresholdPercent: 70 | 80 | 90;
  availableSquadCapacity: number; // default 3, options 1, 3, 5, etc.
  naaqsPM25Standard: number; // default 60 µg/m³
  currentUserRole: 'BMC_WARD_HEALTH_OFFICER' | 'INSPECTION_LEAD' | 'MUNICIPAL_ADMIN' | 'RESEARCH_ANALYST';
  openAqApiKey: string;
  autoRefreshIntervalSeconds: number;
}
