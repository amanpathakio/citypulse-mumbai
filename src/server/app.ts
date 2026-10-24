/**
 * CityPulse Mumbai — Express API Application
 * Centralized API router for both local dev/Node server (Render) and serverless deployment (Vercel).
 */

import express, { Request, Response } from 'express';
import { MUMBAI_WARDS, MUMBAI_STATIONS, KNOWN_HOTSPOTS } from '../data/mumbaiWardsAndStations';
import { 
  getStationsLiveSnapshot, 
  fetchStationData, 
  getDataQualityReport, 
  ingestAllStations 
} from './ingestionEngine';
import { runFixabilityAnalysis } from './fixabilityEngine';
import { getAllStationForecasts, generateStationForecast } from './forecastEngine';
import { analyzeHotspotPlume } from './plumeEngine';
import { 
  generatePrioritizedInspectionCandidates, 
  updateInspectionItem, 
  getActiveInspectionPlan 
} from './inspectionEngine';

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // 1. Static Metadata: Wards, Stations, Hotspots
  app.get('/api/stations', (_req: Request, res: Response) => {
    res.json({
      stations: MUMBAI_STATIONS,
      wards: MUMBAI_WARDS,
      hotspots: KNOWN_HOTSPOTS
    });
  });

  // 2. Live Air Quality & Weather Snapshot for all Mumbai Stations
  app.get('/api/air-quality/live', async (req: Request, res: Response) => {
    try {
      const force = req.query.refresh === 'true';
      if (force) {
        await ingestAllStations(true);
      }
      const snapshot = await getStationsLiveSnapshot();
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        snapshot
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Station Detail & Hourly History
  app.get('/api/air-quality/station/:id', async (req: Request, res: Response) => {
    try {
      const stationId = req.params.id;
      const data = await fetchStationData(stationId);
      const station = MUMBAI_STATIONS.find(s => s.id === stationId);
      res.json({
        success: true,
        station,
        airQuality: data.airQuality,
        weather: data.weather
      });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 4. Fixability Analysis & Attribution
  app.get('/api/fixability', async (req: Request, res: Response) => {
    try {
      const uncertainty = Number(req.query.uncertainty) || 80;
      const validBand = (uncertainty === 70 || uncertainty === 90) ? uncertainty : 80;
      const results = await runFixabilityAnalysis(validBand as 70 | 80 | 90);
      res.json({
        success: true,
        uncertaintyBand: validBand,
        results
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Hourly Forecasts (Next 12-24h)
  app.get('/api/forecasts', async (_req: Request, res: Response) => {
    try {
      const forecasts = await getAllStationForecasts();
      res.json({
        success: true,
        forecasts
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/forecasts/station/:id', async (req: Request, res: Response) => {
    try {
      const stationId = req.params.id;
      const forecast = await generateStationForecast(stationId);
      res.json({
        success: true,
        forecast
      });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 6. Upwind vs Downwind Plume Analysis
  app.get('/api/plume/analysis', async (req: Request, res: Response) => {
    try {
      const hotspotId = req.query.hotspotId as string | undefined;
      const plumeResults = await analyzeHotspotPlume(hotspotId);
      res.json({
        success: true,
        analyses: plumeResults
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Inspection Planning & Squad Allocation
  app.get('/api/inspections', async (req: Request, res: Response) => {
    try {
      const capacity = Number(req.query.capacity) || 3;
      const uncertainty = Number(req.query.uncertainty) || 80;
      const validBand = (uncertainty === 70 || uncertainty === 90) ? uncertainty : 80;
      
      const plan = await generatePrioritizedInspectionCandidates(capacity, validBand as 70 | 80 | 90);
      res.json({
        success: true,
        capacity,
        uncertaintyBand: validBand,
        plan
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/inspections/generate', async (req: Request, res: Response) => {
    try {
      const capacity = Number(req.body?.capacity) || 3;
      const uncertainty = Number(req.body?.uncertainty) || 80;
      const validBand = (uncertainty === 70 || uncertainty === 90) ? uncertainty : 80;
      const plan = await generatePrioritizedInspectionCandidates(capacity, validBand as 70 | 80 | 90);
      res.json({
        success: true,
        capacity,
        uncertaintyBand: validBand,
        plan
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/inspections/:id', (req: Request, res: Response) => {
    try {
      const candidateId = req.params.id;
      const updates = req.body;
      const updated = updateInspectionItem(candidateId, updates);
      
      if (!updated) {
        res.status(404).json({ success: false, message: 'Inspection candidate not found' });
        return;
      }

      res.json({
        success: true,
        item: updated,
        plan: getActiveInspectionPlan()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Data Quality & Sensor Health Audit
  // 8. Data Quality & Sensor Health Audit
  const handleQualityReport = async (_req: Request, res: Response) => {
    try {
      const report = await getDataQualityReport();
      res.json({
        success: true,
        report
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  app.get('/api/quality/report', handleQualityReport);
  app.get('/api/data-quality', handleQualityReport);

  // 9. Manual Ingestion Sync Trigger
  app.post('/api/sync', async (_req: Request, res: Response) => {
    try {
      await ingestAllStations(true);
      const report = await getDataQualityReport();
      res.json({
        success: true,
        message: 'Manual synchronization completed successfully across 16 Mumbai stations.',
        report
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}
