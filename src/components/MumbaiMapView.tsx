/**
 * Interactive Mumbai Map — Civic Geospatial Air Quality & Fixability Map
 * Uses Leaflet with CartoDB Positron basemap.
 * Displays verified CPCB/MPCB stations, 24 BMC ward centroids, wind vectors, and key hotspot activity nodes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  RotateCcw, 
  MapPin, 
  Wind, 
  ShieldAlert, 
  Flame, 
  Construction, 
  Factory, 
  X, 
  ArrowUpRight,
  List,
  Crosshair,
  Compass,
  Info,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MonitoringStation, WardInfo, KnownPollutionHotspot, FixabilityResult } from '../types';
import { getPM25Category, formatNumber, formatISTTime } from '../utils/colors';

interface MumbaiMapViewProps {
  stations: MonitoringStation[];
  wards: WardInfo[];
  hotspots: KnownPollutionHotspot[];
  liveSnapshot: any[];
  fixabilityResults: FixabilityResult[];
  telemetryMode?: 'realtime' | 'hourly';
  onSelectStationForAnalysis: (stationId: string) => void;
}

export type BasemapStyle = 'osm' | 'light' | 'streets' | 'satellite' | 'dark';

export interface ClickedPointData {
  lat: number;
  lng: number;
  localityName: string;
  ward: WardInfo;
  estimatedPM25: number;
  estimatedPM10: number;
  estimatedNO2: number;
  coverageType: 'DIRECT_PROXIMITY' | 'INTERPOLATED_PROXY' | 'SURVEILLANCE_GAP';
  nearestStations: {
    station: MonitoringStation;
    distanceKm: number;
    pm25: number;
  }[];
  closestHotspot?: {
    hotspot: KnownPollutionHotspot;
    distanceKm: number;
  };
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const BASEMAP_CONFIGS: Record<BasemapStyle, { name: string; url: string; attribution: string; subdomains: string; maxZoom: number }> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19
  },
  light: {
    name: 'Municipal Clean Light',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: 'abc',
    maxZoom: 16
  },
  streets: {
    name: 'Urban Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ',
    subdomains: 'abc',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    subdomains: 'abc',
    maxZoom: 18
  },
  dark: {
    name: 'Night Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: 'abc',
    maxZoom: 16
  }
};

export const MumbaiMapView: React.FC<MumbaiMapViewProps> = ({
  stations,
  wards,
  hotspots,
  liveSnapshot,
  fixabilityResults,
  telemetryMode = 'realtime',
  onSelectStationForAnalysis
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const wardsLayerRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>('osm');
  const [mapMode, setMapMode] = useState<'PM25' | 'EXCESS' | 'WARD_COVERAGE'>('PM25');
  const [showHotspots, setShowHotspots] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [clickedPoint, setClickedPoint] = useState<ClickedPointData | null>(null);
  const [showAccessibleList, setShowAccessibleList] = useState(false);

  // Default Mumbai Center [19.0760, 72.8777], Zoom 11
  const MUMBAI_CENTER: [number, number] = [19.0850, 72.8750];
  const MUMBAI_ZOOM = 11;

  // Hyper-Local Point Inspection Handler (Calculates air quality at ANY point in Mumbai)
  const handlePointInspection = useCallback((lat: number, lng: number) => {
    // 1. Find closest ward by centroid
    let closestWard = wards[0];
    let minWardDist = 9999;
    wards.forEach(w => {
      const dist = haversineDistanceKm(lat, lng, w.centroid[0], w.centroid[1]);
      if (dist < minWardDist) {
        minWardDist = dist;
        closestWard = w;
      }
    });

    // 2. Compute distance to all monitoring stations
    const isRealtime = telemetryMode === 'realtime';
    const stationDistances = liveSnapshot
      .map(item => {
        const st = item.station as MonitoringStation;
        const dist = haversineDistanceKm(lat, lng, st.lat, st.lng);
        const pm25 = isRealtime ? (item.realtime?.instantPM25 ?? item.latestAQ?.pm2_5) : item.latestAQ?.pm2_5;
        const pm10 = isRealtime ? (item.realtime?.instantPM10 ?? item.latestAQ?.pm10) : item.latestAQ?.pm10;
        const no2 = isRealtime ? (item.realtime?.instantNO2 ?? item.latestAQ?.no2) : item.latestAQ?.no2;
        return {
          station: st,
          distanceKm: dist,
          pm25: pm25 ?? 75,
          pm10: pm10 ?? 110,
          no2: no2 ?? 28
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // 3. Inverse Distance Weighting (IDW) interpolation
    let totalWeight = 0;
    let weightedPM25 = 0;
    let weightedPM10 = 0;
    let weightedNO2 = 0;

    stationDistances.slice(0, 5).forEach(s => {
      const weight = 1 / Math.max(0.3, s.distanceKm) ** 2;
      totalWeight += weight;
      weightedPM25 += s.pm25 * weight;
      weightedPM10 += s.pm10 * weight;
      weightedNO2 += s.no2 * weight;
    });

    const estPM25 = totalWeight > 0 ? Number((weightedPM25 / totalWeight).toFixed(1)) : 75;
    const estPM10 = totalWeight > 0 ? Number((weightedPM10 / totalWeight).toFixed(1)) : 110;
    const estNO2 = totalWeight > 0 ? Number((weightedNO2 / totalWeight).toFixed(1)) : 28;

    // 4. Closest hotspot check
    let closestHotspotInfo: { hotspot: KnownPollutionHotspot; distanceKm: number } | undefined;
    let minHotspotDist = 9999;
    hotspots.forEach(h => {
      const dist = haversineDistanceKm(lat, lng, h.lat, h.lng);
      if (dist < minHotspotDist) {
        minHotspotDist = dist;
        if (dist <= 3.5) {
          closestHotspotInfo = { hotspot: h, distanceKm: dist };
        }
      }
    });

    // 5. Coverage classification
    const nearestDist = stationDistances[0]?.distanceKm ?? 999;
    const coverageType = nearestDist < 1.8 
      ? 'DIRECT_PROXIMITY' 
      : nearestDist <= 4.2 
      ? 'INTERPOLATED_PROXY' 
      : 'SURVEILLANCE_GAP';

    // 6. Locality Label
    let locality = '';
    if (closestHotspotInfo && closestHotspotInfo.distanceKm < 1.2) {
      locality = `Near ${closestHotspotInfo.hotspot.name}`;
    } else {
      const primaryNeighborhood = closestWard.name.split(',')[0].trim();
      locality = `${primaryNeighborhood} (Ward ${closestWard.code})`;
    }

    const pointData: ClickedPointData = {
      lat,
      lng,
      localityName: locality,
      ward: closestWard,
      estimatedPM25: estPM25,
      estimatedPM10: estPM10,
      estimatedNO2: estNO2,
      coverageType,
      nearestStations: stationDistances.slice(0, 3).map(s => ({
        station: s.station,
        distanceKm: s.distanceKm,
        pm25: s.pm25
      })),
      closestHotspot: closestHotspotInfo
    };

    setClickedPoint(pointData);
    setSelectedStationId(null);

    // Place or update Leaflet marker
    const map = mapInstanceRef.current;
    if (map) {
      if (clickMarkerRef.current) {
        map.removeLayer(clickMarkerRef.current);
      }

      const cat = getPM25Category(estPM25);
      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${cat.hex}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background: #0f172a; color: white; border: 2px solid white; border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: 700; font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; z-index: 500;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${cat.hex};"></span>
            <span>📍 ${Math.round(estPM25)}</span>
          </div>
        </div>
      `;

      const clickIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-click-marker',
        iconSize: [80, 30],
        iconAnchor: [40, 15]
      });

      const newMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
      newMarker.bindTooltip(`<strong>${locality}</strong><br/>Estimated PM2.5: ${estPM25} µg/m³ (${cat.label})`, {
        direction: 'top',
        className: 'text-xs'
      }).openTooltip();

      clickMarkerRef.current = newMarker;
    }
  }, [wards, liveSnapshot, hotspots, telemetryMode]);

  const handlePointInspectionRef = useRef(handlePointInspection);
  useEffect(() => {
    handlePointInspectionRef.current = handlePointInspection;
  }, [handlePointInspection]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against double initialization in React StrictMode
    if (mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: MUMBAI_CENTER,
        zoom: MUMBAI_ZOOM,
        zoomControl: false,
        attributionControl: true
      });

      const cfg = BASEMAP_CONFIGS[basemapStyle] || BASEMAP_CONFIGS.osm;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains || 'abc',
        maxZoom: cfg.maxZoom
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      hotspotsLayerRef.current = L.layerGroup().addTo(map);
      wardsLayerRef.current = L.layerGroup().addTo(map);

      // Inspect any clicked point across Mumbai
      map.on('click', (e: L.LeafletMouseEvent) => {
        handlePointInspectionRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    } catch (e) {
      console.error('Leaflet initialization error:', e);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {
        console.error('Leaflet cleanup error:', e);
      }
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      hotspotsLayerRef.current = null;
      wardsLayerRef.current = null;
    };
  }, []);

  // Update Basemap Layer when basemapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const cfg = BASEMAP_CONFIGS[basemapStyle] || BASEMAP_CONFIGS.osm;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains || 'abc',
        maxZoom: cfg.maxZoom
      }).addTo(map);
    } catch (e) {
      console.error('Basemap update error:', e);
    }
  }, [basemapStyle]);

  // Update Markers & Layers when state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    markersLayerRef.current?.clearLayers();
    hotspotsLayerRef.current?.clearLayers();
    wardsLayerRef.current?.clearLayers();

    // 1. Render Wards Layer (Centroids and Coverage status)
    if (showWards && wardsLayerRef.current) {
      wards.forEach(w => {
        const isMonitored = w.coverageStatus === 'DIRECT_STATION';
        const isProxy = w.coverageStatus === 'NEIGHBORING_PROXY';
        const color = isMonitored ? '#0d9488' : isProxy ? '#f59e0b' : '#ef4444';

        // Scale radius realistically based on ward geographic area to cover municipal territory
        const radiusMeters = Math.max(1600, Math.round(Math.sqrt((w.areaKm2 * 1000000) / Math.PI)));

        const wardCircle = L.circle(w.centroid, {
          radius: radiusMeters,
          color: color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.1,
          dashArray: isMonitored ? undefined : '4, 4'
        });

        // Clicking anywhere inside a ward zone triggers hyper-local inspection
        wardCircle.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          handlePointInspectionRef.current(e.latlng.lat, e.latlng.lng);
        });

        wardCircle.bindTooltip(`<strong>Ward ${w.code}: ${w.name}</strong><br/>Status: ${w.coverageStatus.replace('_', ' ')} · Area: ${w.areaKm2} km²<br/><span style="color:#64748b">Click anywhere to inspect hyper-local air quality</span>`, {
          direction: 'top',
          className: 'text-xs'
        });

        wardsLayerRef.current?.addLayer(wardCircle);
      });
    }

    // 2. Render Hotspots Layer (Construction, Landfills, Industrial)
    if (showHotspots && hotspotsLayerRef.current) {
      hotspots.forEach(h => {
        let badgeColor = '#b45309';
        let iconSymbol = '🏗️';
        if (h.category === 'WASTE_DUMPING_GROUND') {
          badgeColor = '#c2410c';
          iconSymbol = '🗑️';
        } else if (h.category === 'INDUSTRIAL_CLUSTER') {
          badgeColor = '#475569';
          iconSymbol = '🏭';
        }

        const iconHtml = `
          <div style="background-color: ${badgeColor}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 2px solid white;">
            ${iconSymbol}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-hotspot-pin',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([h.lat, h.lng], { icon: customIcon });
        marker.bindPopup(`
          <div style="padding: 10px; font-family: sans-serif; font-size: 12px; max-width: 240px;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">${h.name}</div>
            <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">Ward ${h.ward} · ${h.category.replace('_', ' ')}</div>
            <div style="color: #334155; line-height: 1.3;">${h.description}</div>
          </div>
        `);
        hotspotsLayerRef.current?.addLayer(marker);
      });
    }

    // 3. Render Stations Layer
    if (markersLayerRef.current) {
      liveSnapshot.forEach(item => {
        const st = item.station as MonitoringStation;
        const aq = item.latestAQ;
        const isRealtime = telemetryMode === 'realtime';
        const pm25 = isRealtime ? (item.realtime?.instantPM25 ?? aq?.pm2_5) : aq?.pm2_5;
        const fixResult = fixabilityResults.find(r => r.stationId === st.id);

        let displayValue = '';
        let badgeBg = '#94a3b8';
        let badgeBorder = '#64748b';

        if (mapMode === 'PM25') {
          const cat = getPM25Category(pm25);
          displayValue = pm25 !== null && pm25 !== undefined ? Math.round(pm25).toString() : '—';
          badgeBg = cat.hex;
          badgeBorder = cat.hex;
        } else if (mapMode === 'EXCESS') {
          const excess = fixResult?.modeledLocalExcess ?? 0;
          displayValue = `+${Math.round(excess)}`;
          badgeBg = excess > (fixResult?.uncertaintyThreshold ?? 15) ? '#d97706' : '#64748b';
          badgeBorder = excess > 0 ? '#b45309' : '#475569';
        } else {
          // Ward coverage mode
          displayValue = st.ward;
          badgeBg = '#0d9488';
          badgeBorder = '#0f766e';
        }

        const isSelected = selectedStationId === st.id;
        const isStale = item.freshnessStatus !== 'ONLINE_HEALTHY';

        const markerHtml = `
          <div style="
            background: white; 
            border: 2px solid ${isSelected ? '#0f172a' : badgeBorder}; 
            border-radius: 8px; 
            padding: 3px 6px; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.18); 
            display: flex; 
            align-items: center; 
            gap: 4px; 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 11px; 
            font-weight: 700; 
            cursor: pointer;
            white-space: nowrap;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.15s ease;
          ">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${badgeBg};"></span>
            <span style="color: #0f172a;">${displayValue}</span>
            ${isStale ? '<span style="font-size: 9px; color: #d97706;" title="Stale">⚠️</span>' : ''}
          </div>
        `;

        const stationDivIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-station-pin',
          iconSize: [60, 26],
          iconAnchor: [30, 13]
        });

        const marker = L.marker([st.lat, st.lng], { icon: stationDivIcon });
        marker.on('click', () => {
          setSelectedStationId(st.id);
          setClickedPoint(null);
          if (clickMarkerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(clickMarkerRef.current);
            clickMarkerRef.current = null;
          }
        });

        marker.bindTooltip(`<strong>${st.name}</strong><br/>Ward ${st.ward} · PM2.5: ${formatNumber(pm25)} µg/m³`, {
          direction: 'top',
          className: 'text-xs'
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [mapMode, showHotspots, showWards, liveSnapshot, fixabilityResults, selectedStationId, telemetryMode]);

  const resetView = () => {
    mapInstanceRef.current?.setView(MUMBAI_CENTER, MUMBAI_ZOOM);
    setSelectedStationId(null);
    setClickedPoint(null);
    if (clickMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(clickMarkerRef.current);
      clickMarkerRef.current = null;
    }
  };

  const selectedItem = liveSnapshot.find(s => s.station.id === selectedStationId);
  const selectedFixResult = fixabilityResults.find(r => r.stationId === selectedStationId);

  return (
    <div className="space-y-4">
      {/* Top Map Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>Geospatial Decision Support</span>
            <span aria-hidden="true">·</span>
            <span>Basemap: {BASEMAP_CONFIGS[basemapStyle].name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Mumbai Ambient Monitoring & Coverage Map
          </h1>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs font-medium">
            <button
              onClick={() => setMapMode('PM25')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                mapMode === 'PM25' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Observed PM2.5
            </button>
            <button
              onClick={() => setMapMode('EXCESS')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                mapMode === 'EXCESS' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modeled Local Excess
            </button>
            <button
              onClick={() => setMapMode('WARD_COVERAGE')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                mapMode === 'WARD_COVERAGE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ward Coverage
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 ml-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>Hotspots</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={showWards}
                onChange={(e) => setShowWards(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>24 Wards</span>
            </label>
          </div>

          <button
            onClick={resetView}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer ml-1"
            title="Reset Map Center to Mumbai"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAccessibleList(!showAccessibleList)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
            title="Toggle Accessible Table View"
          >
            <List className="w-3.5 h-3.5" />
            <span>{showAccessibleList ? 'Hide List' : 'Station List'}</span>
          </button>
        </div>
      </div>

      {/* Hyper-Local Interaction Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50 border border-teal-200/80 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-900">Hyper-Local Map Intelligence:</span>
          <span>Click anywhere in Mumbai (streets, wards, coastal nodes) to inspect real-time modeled air quality, ward jurisdiction, and sensor proximity.</span>
        </div>
        {clickedPoint && (
          <button
            onClick={() => {
              setClickedPoint(null);
              if (clickMarkerRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(clickMarkerRef.current);
                clickMarkerRef.current = null;
              }
            }}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer shrink-0"
          >
            Clear Dropped Pin
          </button>
        )}
      </div>

      {/* Map & Drawer Split Container */}
      <div className="relative bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shadow-xs h-[640px]">
        {/* Leaflet Container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Basemap Style Switcher (Top Right) */}
        <div className="absolute top-4 right-4 z-400 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-1 shadow-md flex items-center gap-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Theme:</span>
          </span>
          <button
            onClick={() => setBasemapStyle('osm')}
            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              basemapStyle === 'osm' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Official OpenStreetMap cartography (100% free, no API key)"
          >
            🗺️ OpenStreetMap
          </button>
          <button
            onClick={() => setBasemapStyle('light')}
            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              basemapStyle === 'light' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Clean muted municipal light canvas"
          >
            🏛️ Clean Light
          </button>
          <button
            onClick={() => setBasemapStyle('streets')}
            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              basemapStyle === 'streets' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Detailed urban street map"
          >
            🏙️ Streets
          </button>
          <button
            onClick={() => setBasemapStyle('satellite')}
            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              basemapStyle === 'satellite' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="High-resolution aerial satellite imagery"
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setBasemapStyle('dark')}
            className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              basemapStyle === 'dark' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Night dark canvas for plume and thermal inversion inspection"
          >
            🌙 Night
          </button>
        </div>

        {/* Floating Map Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-400 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-3 text-xs shadow-md max-w-xs">
          <div className="font-semibold text-slate-800 mb-1.5">
            {mapMode === 'PM25' ? 'Observed PM2.5 (NAAQS µg/m³)' : mapMode === 'EXCESS' ? 'Local Excess Anomaly' : 'BMC Ward Coverage'}
          </div>

          {mapMode === 'PM25' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Good (0-30)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" />Satisfactory (31-60)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Moderate (61-90)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Poor (91-120)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" />Very Poor (121-250)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-950" />Severe (&gt;250)</span>
              </div>
            </div>
          ) : mapMode === 'EXCESS' ? (
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>Statistically significant excess above uncertainty threshold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Excess within regional/meteorological tolerance</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Direct CAAQMS Station In Ward</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Neighboring Proxy Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Unmonitored Ward Gap</span>
              </div>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            Source: CPCB/MPCB CAAQMS & Open-Meteo
          </div>
        </div>

        {/* Selected Station Slide-Over Panel */}
        {selectedItem && (
          <div className="absolute top-4 right-4 bottom-4 z-400 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Ward {selectedItem.station.ward}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedItem.station.name}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedItem.station.environment} · {selectedItem.station.operator}
                </div>
              </div>
              <button
                onClick={() => setSelectedStationId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Readings Block */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Observed PM2.5</div>
                  <div className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                    {formatNumber(selectedItem.latestAQ?.pm2_5)} <span className="text-xs font-normal">µg/m³</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Modeled Local Excess</div>
                  <div className="font-mono text-lg font-bold text-amber-700 mt-0.5">
                    +{selectedFixResult?.modeledLocalExcess ?? 0} <span className="text-xs font-normal">µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Fixability Attribution Verdict */}
              {selectedFixResult && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="font-semibold text-slate-800 mb-1">Attribution Verdict:</div>
                  <div className="font-medium text-slate-900 text-xs">
                    {selectedFixResult.verdictLabel}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {selectedFixResult.evidenceNarrative}
                  </p>
                </div>
              )}

              {/* Weather & Atmospheric Parameters */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1 text-[11px]">
                <div className="font-semibold text-slate-800 mb-1">Atmospheric Telemetry:</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Boundary Layer Height:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedItem.latestWeather?.boundaryLayerHeightM ?? '—'} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Surface Wind Vector:</span>
                  <span className="font-mono text-slate-800">{selectedItem.latestWeather?.windSpeedKmh} km/h @ {selectedItem.latestWeather?.windDirectionDeg}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispersion Index:</span>
                  <span className="font-mono text-slate-800">{selectedFixResult?.dispersionIndex ?? 1.0}</span>
                </div>
              </div>

              {/* Nearby Hotspots / Construction */}
              {selectedFixResult?.investigationLeads && selectedFixResult.investigationLeads.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Contextual Investigation Leads:</div>
                  <div className="space-y-1.5">
                    {selectedFixResult.investigationLeads.map((lead, i) => (
                      <div key={i} className="p-2 rounded bg-white border border-slate-200 text-[11px]">
                        <strong className="text-slate-900">{lead.label}:</strong> {lead.recommendedAction}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Observed: {formatISTTime(selectedItem.latestAQ?.timestampIST) || 'Live'}
              </span>
              <button
                onClick={() => onSelectStationForAnalysis(selectedItem.station.id)}
                className="px-3 py-1.5 text-xs font-semibold rounded text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Full Evidence</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Hyper-Local Clicked Point Dossier Slide-Over Panel */}
        {clickedPoint && !selectedItem && (
          <div className="absolute top-4 right-4 bottom-4 z-400 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Ward {clickedPoint.ward.code}
                  </span>
                  {clickedPoint.coverageType === 'DIRECT_PROXIMITY' ? (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Direct Proximity
                    </span>
                  ) : clickedPoint.coverageType === 'INTERPOLATED_PROXY' ? (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-600" />
                      IDW Proxy
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Surveillance Gap
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{clickedPoint.localityName}</span>
                </h3>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Coordinates: {clickedPoint.lat.toFixed(4)}°N, {clickedPoint.lng.toFixed(4)}°E
                </div>
              </div>
              <button
                onClick={() => {
                  setClickedPoint(null);
                  if (clickMarkerRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(clickMarkerRef.current);
                    clickMarkerRef.current = null;
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Estimated Readings Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800 text-[11px]">Hyper-Local Modeled Air Quality:</span>
                  <span className="text-[10px] text-slate-500 font-medium">Real-Time Spatial IDW</span>
                </div>
                {(() => {
                  const cat = getPM25Category(clickedPoint.estimatedPM25);
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 col-span-3 sm:col-span-1">
                        <div className="text-slate-500 text-[10px] font-medium">Est. PM2.5</div>
                        <div className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                          {clickedPoint.estimatedPM25}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${cat.bgColor} ${cat.textColor}`}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <div className="text-slate-500 text-[10px] font-medium">Est. PM10</div>
                        <div className="font-mono text-base font-bold text-slate-800 mt-0.5">
                          {clickedPoint.estimatedPM10}
                        </div>
                        <span className="text-[10px] text-slate-400">µg/m³</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <div className="text-slate-500 text-[10px] font-medium">Est. NO2</div>
                        <div className="font-mono text-base font-bold text-slate-800 mt-0.5">
                          {clickedPoint.estimatedNO2}
                        </div>
                        <span className="text-[10px] text-slate-400">µg/m³</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Nearest Physical Sensors */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11px]">Nearest CAAQMS Ground Sensors:</span>
                  <span className="text-[10px] text-slate-500">Distance & Real-time PM2.5</span>
                </div>
                <div className="space-y-1.5">
                  {clickedPoint.nearestStations.map((stObj, idx) => (
                    <div
                      key={stObj.station.id}
                      onClick={() => setSelectedStationId(stObj.station.id)}
                      className="p-2 rounded bg-white border border-slate-200 hover:border-teal-500 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between"
                      title="Click to view sensor's full forensic telemetry"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">#{idx + 1}</span>
                          <span>{stObj.station.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Ward {stObj.station.ward} · {stObj.distanceKm.toFixed(2)} km away
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {Math.round(stObj.pm25)} <span className="text-[9px] font-normal text-slate-500">µg/m³</span>
                        </div>
                        <span className="text-[10px] text-teal-600 hover:underline flex items-center justify-end gap-0.5">
                          Inspect <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Ward Context */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px] space-y-1">
                <div className="font-semibold text-slate-800">BMC Municipal Ward Profile:</div>
                <div className="text-slate-600 leading-relaxed">
                  <strong>Ward {clickedPoint.ward.code} ({clickedPoint.ward.name})</strong> covers approximately {clickedPoint.ward.areaKm2} km² with an estimated population of {(clickedPoint.ward.population / 100000).toFixed(1)} Lakh.
                </div>
                <div className="text-slate-500 pt-1 border-t border-slate-200/60 mt-1">
                  Surveillance classification: <span className="font-medium text-slate-800">{clickedPoint.ward.coverageStatus.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Nearby Hotspot Alert if within radius */}
              {clickedPoint.closestHotspot && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <Flame className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nearby Pollution Source ({clickedPoint.closestHotspot.distanceKm.toFixed(1)} km):</span>
                  </div>
                  <div className="font-bold text-slate-900">{clickedPoint.closestHotspot.hotspot.name}</div>
                  <div className="text-slate-700 text-[10px] leading-relaxed">
                    {clickedPoint.closestHotspot.hotspot.description}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setClickedPoint(null);
                  if (clickMarkerRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(clickMarkerRef.current);
                    clickMarkerRef.current = null;
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors cursor-pointer"
              >
                Clear Pin
              </button>
              {clickedPoint.nearestStations.length > 0 && (
                <button
                  onClick={() => setSelectedStationId(clickedPoint.nearestStations[0].station.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Nearest Sensor</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Station List Alternative (for screen-reader / non-map navigation) */}
      {showAccessibleList && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Accessible Station List & Geographic Registry
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3">Station Name</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Coordinates</th>
                  <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Local Excess</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveSnapshot.map(item => {
                  const st = item.station as MonitoringStation;
                  const aq = item.latestAQ;
                  const fix = fixabilityResults.find(r => r.stationId === st.id);
                  const cat = getPM25Category(aq?.pm2_5);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">Ward {st.ward}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{st.lat.toFixed(4)}, {st.lng.toFixed(4)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatNumber(aq?.pm2_5)}</td>
                      <td className="py-2.5 px-3"><span className={`px-1.5 py-0.5 rounded ${cat.bgColor} ${cat.textColor}`}>{cat.label}</span></td>
                      <td className="py-2.5 px-3 font-mono text-amber-700">+{fix?.modeledLocalExcess ?? 0} µg/m³</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
