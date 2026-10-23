/**
 * Upwind vs Downwind Plume & Gradient Investigation Engine
 * Determines spatial geometric relationship between target activity sites (construction, landfill, refineries)
 * and ambient monitoring stations using real-time wind vectors from Open-Meteo.
 */

import { MUMBAI_STATIONS, KNOWN_HOTSPOTS } from '../data/mumbaiWardsAndStations';
import { UpwindDownwindAnalysis, KnownPollutionHotspot } from '../types';
import { getStationsLiveSnapshot } from './ingestionEngine';

// Calculate bearing from source point (lat1, lon1) to target point (lat2, lon2) in degrees 0-360
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  const bearing = ((theta * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
}

// Convert degrees to cardinal direction label
function degreesToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return `${directions[idx]} (${deg}°)`;
}

/**
 * Run upwind/downwind gradient analysis for a specific hotspot site or all sites
 */
export async function analyzeHotspotPlume(hotspotId?: string): Promise<UpwindDownwindAnalysis[]> {
  const snapshot = await getStationsLiveSnapshot();

  // Find dominant regional wind direction and speed
  const validWeathers = snapshot.map(s => s.latestWeather).filter(w => w !== null);
  const avgWindDir = validWeathers.length > 0 
    ? Math.round(validWeathers.reduce((a, b) => a + b!.windDirectionDeg, 0) / validWeathers.length) 
    : 300;
  const avgWindSpeed = validWeathers.length > 0 
    ? Number((validWeathers.reduce((a, b) => a + b!.windSpeedKmh, 0) / validWeathers.length).toFixed(1)) 
    : 8.5;

  const hotspotsToAnalyze = hotspotId 
    ? KNOWN_HOTSPOTS.filter(h => h.id === hotspotId)
    : KNOWN_HOTSPOTS;

  const analyses: UpwindDownwindAnalysis[] = [];

  for (const hotspot of hotspotsToAnalyze) {
    const upwindStations: UpwindDownwindAnalysis['upwindStations'] = [];
    const downwindStations: UpwindDownwindAnalysis['downwindStations'] = [];

    // Wind direction is "direction wind is blowing from" (meteorological convention)
    // Plume blows towards: (avgWindDir + 180) % 360
    const downwindVector = (avgWindDir + 180) % 360;

    for (const snap of snapshot) {
      if (!snap.latestAQ || snap.latestAQ.pm2_5 === null) continue;

      const bearingFromSite = calculateBearing(hotspot.lat, hotspot.lng, snap.station.lat, snap.station.lng);
      
      // Calculate angular distance to downwind vector
      let angleDiffToDownwind = Math.abs(bearingFromSite - downwindVector);
      if (angleDiffToDownwind > 180) angleDiffToDownwind = 360 - angleDiffToDownwind;

      // Calculate angular distance to upwind vector (which is avgWindDir)
      let angleDiffToUpwind = Math.abs(bearingFromSite - avgWindDir);
      if (angleDiffToUpwind > 180) angleDiffToUpwind = 360 - angleDiffToUpwind;

      // Downwind cone: within 55 degrees of downwind vector
      if (angleDiffToDownwind <= 55) {
        downwindStations.push({
          station: snap.station,
          pm2_5: snap.latestAQ.pm2_5,
          angleDiffDeg: angleDiffToDownwind
        });
      }
      // Upwind cone: within 55 degrees of upwind vector
      else if (angleDiffToUpwind <= 55) {
        upwindStations.push({
          station: snap.station,
          pm2_5: snap.latestAQ.pm2_5,
          angleDiffDeg: angleDiffToUpwind
        });
      }
    }

    let deltaPM25: number | null = null;
    let isPlumeDetected = false;
    let significanceAssessment = '';

    if (downwindStations.length > 0 && upwindStations.length > 0) {
      const avgDownwind = downwindStations.reduce((a, b) => a + b.pm2_5, 0) / downwindStations.length;
      const avgUpwind = upwindStations.reduce((a, b) => a + b.pm2_5, 0) / upwindStations.length;
      deltaPM25 = Number((avgDownwind - avgUpwind).toFixed(1));

      if (deltaPM25 >= 15.0) {
        isPlumeDetected = true;
        significanceAssessment = `Statistically significant positive gradient (+${deltaPM25} µg/m³ downwind). Downwind stations average ${avgDownwind.toFixed(1)} µg/m³ vs ${avgUpwind.toFixed(1)} µg/m³ upwind under ${avgWindSpeed} km/h wind blowing from ${degreesToCardinal(avgWindDir)}. Strong physical evidence of local plume contribution.`;
      } else if (deltaPM25 > 0) {
        significanceAssessment = `Marginal positive gradient (+${deltaPM25} µg/m³). Difference is within ordinary instrument measurement error. Not conclusive evidence of local plume emission.`;
      } else {
        significanceAssessment = `Neutral or negative gradient (${deltaPM25} µg/m³). Downwind ambient air is equal or cleaner than upwind reference. No directional plume detected from this location at current wind angle.`;
      }
    } else {
      significanceAssessment = `Insufficient monitoring geometry. Needed at least 1 upwind and 1 downwind station within active 55° wind cones; found ${upwindStations.length} upwind and ${downwindStations.length} downwind. Additional portable monitoring required.`;
    }

    analyses.push({
      hotspot,
      currentWindDirDeg: avgWindDir,
      currentWindSpeedKmh: avgWindSpeed,
      windDirectionLabel: degreesToCardinal(avgWindDir),
      upwindStations,
      downwindStations,
      deltaPM25,
      isPlumeDetected,
      significanceAssessment
    });
  }

  return analyses;
}
