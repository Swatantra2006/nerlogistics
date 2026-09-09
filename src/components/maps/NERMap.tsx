'use client';

import { useEffect, useRef, useState } from 'react';
import { districts, states, logisticsHubs, airports, railwayStations, roads, riskEvents, graphEdges } from '@/data/ner-data';
import { getAccessibilityColor, getRiskColor } from '@/types';

interface NERMapProps {
  height?: string;
  showLayers?: boolean;
  highlightDistrict?: string;
  routeWaypoints?: [number, number][];
  onDistrictClick?: (districtId: string) => void;
  className?: string;
}

interface LayerState {
  cities: boolean;
  roads: boolean;
  hubs: boolean;
  airports: boolean;
  railways: boolean;
  accessibility: boolean;
  risk: boolean;
  riskEvents: boolean;
}

export default function NERMap({
  height = '500px',
  showLayers = true,
  highlightDistrict,
  routeWaypoints,
  onDistrictClick,
  className = '',
}: NERMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<Record<string, any>>({});
  const [layers, setLayers] = useState<LayerState>({
    cities: true,
    roads: true,
    hubs: true,
    airports: false,
    railways: false,
    accessibility: true,
    risk: false,
    riskEvents: true,
  });
  const [layersOpenMobile, setLayersOpenMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (isCancelled || !mapRef.current || mapInstanceRef.current) return;

      const container = mapRef.current as any;
      if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
      }

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstanceRef.current) return;

      let map: any;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      try {
        map = L.map(container, {
          center: [26.2, 92.8],
          zoom: isMobile ? 6 : 7,
          zoomControl: !isMobile,
          attributionControl: false,
        });

        // Add compact zoom control for mobile
        if (isMobile) {
          L.control.zoom({ position: 'bottomright' }).addTo(map);
        }
      } catch (err) {
        console.warn('Leaflet map container already initialized, skipping duplicate init:', err);
        return;
      }

      if (isCancelled) {
        map.remove();
        return;
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Create layer groups
      const layerGroups: Record<string, any> = {
        cities: L.layerGroup(),
        roads: L.layerGroup(),
        hubs: L.layerGroup(),
        airports: L.layerGroup(),
        railways: L.layerGroup(),
        accessibility: L.layerGroup(),
        risk: L.layerGroup(),
        riskEvents: L.layerGroup(),
        route: L.layerGroup(),
      };

      // === Cities / Districts ===
      districts.forEach(d => {
        const color = getAccessibilityColor(d.accessibilityScore);
        const marker = L.circleMarker([d.lat, d.lng], {
          radius: Math.max(4, Math.min(10, d.population / 300000)),
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.6,
        });
        marker.bindPopup(`
          <div style="min-width:200px;font-family:Inter,sans-serif;">
            <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#f1f5f9;">${d.name}</h3>
            <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">${states.find(s => s.id === d.stateId)?.name}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px;">
              <div style="font-size:11px;color:#94a3b8;">Accessibility</div>
              <div style="font-size:11px;font-weight:600;color:${color};">${d.accessibilityScore}/100</div>
              <div style="font-size:11px;color:#94a3b8;">Risk Score</div>
              <div style="font-size:11px;font-weight:600;color:${getRiskColor(d.riskScore)};">${d.riskScore}/100</div>
              <div style="font-size:11px;color:#94a3b8;">Population</div>
              <div style="font-size:11px;font-weight:600;color:#f1f5f9;">${(d.population/1000).toFixed(0)}K</div>
              <div style="font-size:11px;color:#94a3b8;">Nearest Hub</div>
              <div style="font-size:11px;font-weight:600;color:#f1f5f9;">${d.nearestHubDistance}km</div>
            </div>
          </div>
        `);
        if (onDistrictClick) {
          marker.on('click', () => onDistrictClick(d.id));
        }
        layerGroups.cities.addLayer(marker);

        // Highlight
        if (highlightDistrict === d.id) {
          L.circleMarker([d.lat, d.lng], {
            radius: 18,
            fillColor: '#6366f1',
            color: '#6366f1',
            weight: 2,
            opacity: 0.5,
            fillOpacity: 0.15,
          }).addTo(map);
        }
      });

      // === Roads ===
      graphEdges.forEach(edge => {
        const road = roads.find(r => r.id === edge.roadId);
        const color = road?.condition === 'good' ? '#34d399' : road?.condition === 'fair' ? '#fbbf24' : '#f97316';
        const line = L.polyline(edge.waypoints, {
          color,
          weight: road?.type === 'NH' ? 2.5 : 1.5,
          opacity: 0.5,
          dashArray: road?.condition === 'poor' ? '6, 6' : undefined,
        });
        line.bindPopup(`
          <div style="font-family:Inter,sans-serif;">
            <h3 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f1f5f9;">${edge.roadName}</h3>
            <p style="margin:0;font-size:11px;color:#94a3b8;">${edge.from} → ${edge.to}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Distance: ${edge.distance}km | Risk: ${edge.risk}/100</p>
          </div>
        `);
        layerGroups.roads.addLayer(line);
      });

      // === Logistics Hubs ===
      logisticsHubs.forEach(hub => {
        const size = hub.type === 'major' ? 10 : hub.type === 'regional' ? 7 : 5;
        const marker = L.circleMarker([hub.lat, hub.lng], {
          radius: size,
          fillColor: '#6366f1',
          color: '#4f46e5',
          weight: 2,
          fillOpacity: 0.8,
        });
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;">
            <h3 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f1f5f9;">🏭 ${hub.name}</h3>
            <p style="margin:0;font-size:11px;color:#94a3b8;">${hub.city} | ${hub.type} hub</p>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Utilization: ${hub.currentUtilization}% | Capacity: ${hub.capacity}t</p>
          </div>
        `);
        layerGroups.hubs.addLayer(marker);
      });

      // === Airports ===
      airports.forEach(apt => {
        const marker = L.marker([apt.lat, apt.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#1e293b;border:1px solid #6366f1;border-radius:4px;padding:2px 4px;font-size:9px;color:#a5b4fc;white-space:nowrap;font-family:monospace;">✈ ${apt.code}</div>`,
            iconSize: [50, 20],
            iconAnchor: [25, 10],
          }),
        });
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;">
            <h3 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f1f5f9;">✈️ ${apt.name}</h3>
            <p style="margin:0;font-size:11px;color:#94a3b8;">${apt.code} | ${apt.type}</p>
          </div>
        `);
        layerGroups.airports.addLayer(marker);
      });

      // === Railways ===
      railwayStations.forEach(stn => {
        const marker = L.circleMarker([stn.lat, stn.lng], {
          radius: 4,
          fillColor: '#f59e0b',
          color: '#d97706',
          weight: 1,
          fillOpacity: 0.7,
        });
        marker.bindPopup(`<div style="font-family:Inter;"><b style="color:#f1f5f9;">🚂 ${stn.name}</b><br/><span style="color:#94a3b8;font-size:11px;">${stn.type} | Freight: ${stn.hasFreight ? 'Yes' : 'No'}</span></div>`);
        layerGroups.railways.addLayer(marker);
      });

      // === Accessibility heatmap (circles) ===
      districts.forEach(d => {
        const color = getAccessibilityColor(d.accessibilityScore);
        const circle = L.circle([d.lat, d.lng], {
          radius: 20000,
          fillColor: color,
          color: 'transparent',
          fillOpacity: 0.12,
        });
        layerGroups.accessibility.addLayer(circle);
      });

      // === Risk Events ===
      riskEvents.forEach(evt => {
        const color = evt.severity === 'critical' ? '#ef4444' : evt.severity === 'high' ? '#f97316' : evt.severity === 'medium' ? '#fbbf24' : '#34d399';
        const marker = L.circleMarker([evt.lat, evt.lng], {
          radius: 12,
          fillColor: color,
          color,
          weight: 2,
          fillOpacity: 0.25,
        });
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:220px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="color:${color};font-weight:700;font-size:12px;">⚠ ${evt.severity.toUpperCase()}</span>
            </div>
            <h3 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f1f5f9;">${evt.location}</h3>
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;">${evt.description}</p>
            <p style="margin:0;font-size:11px;color:#a5b4fc;font-style:italic;">💡 ${evt.recommendation}</p>
          </div>
        `);
        layerGroups.riskEvents.addLayer(marker);
      });

      // Add default layers
      layerGroups.cities.addTo(map);
      layerGroups.roads.addTo(map);
      layerGroups.hubs.addTo(map);
      layerGroups.accessibility.addTo(map);
      layerGroups.riskEvents.addTo(map);

      layerGroupsRef.current = layerGroups;
      setIsLoaded(true);
    };

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      layerGroupsRef.current = {};
      setIsLoaded(false);
    };
  }, []);

  // Handle route waypoints
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const L = require('leaflet');
    const routeLayer = layerGroupsRef.current.route;
    if (routeLayer) {
      routeLayer.clearLayers();
      if (routeWaypoints && routeWaypoints.length > 1) {
        const line = L.polyline(routeWaypoints, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.9,
        });
        routeLayer.addLayer(line);
        routeLayer.addTo(mapInstanceRef.current);
        mapInstanceRef.current.fitBounds(line.getBounds(), { padding: [30, 30] });
      }
    }
  }, [routeWaypoints, isLoaded]);

  // Handle layer toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;
    Object.entries(layers).forEach(([key, visible]) => {
      const group = layerGroupsRef.current[key];
      if (group) {
        if (visible && !map.hasLayer(group)) {
          group.addTo(map);
        } else if (!visible && map.hasLayer(group)) {
          map.removeLayer(group);
        }
      }
    });
  }, [layers, isLoaded]);

  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const layerLabels: Record<keyof LayerState, string> = {
    cities: 'Districts',
    roads: 'Road Network',
    hubs: 'Logistics Hubs',
    airports: 'Airports',
    railways: 'Rail Stations',
    accessibility: 'Accessibility',
    risk: 'Risk Zones',
    riskEvents: 'Disruption Alerts',
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%' }} className="map-container" />
      
      {showLayers && isLoaded && (
        <div className="absolute top-3 right-3 z-[1000]">
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setLayersOpenMobile(!layersOpenMobile)}
            className="sm:hidden px-2.5 py-1.5 rounded-lg bg-surface-900/90 text-surface-200 text-xs font-semibold border border-primary-500/20 backdrop-blur-md shadow-lg flex items-center gap-1.5"
            aria-label="Toggle map layers"
          >
            <span>Layers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
          </button>

          {/* Layer Panel (collapsible on mobile, always visible on sm+) */}
          <div className={`${layersOpenMobile ? 'block' : 'hidden'} sm:block mt-1.5 sm:mt-0 glass-card p-3 max-w-[180px] shadow-xl`}>
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Map Layers</p>
            <div className="space-y-1.5">
              {Object.entries(layerLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={layers[key as keyof LayerState]}
                    onChange={() => toggleLayer(key as keyof LayerState)}
                    className="w-3.5 h-3.5 rounded accent-primary-500"
                  />
                  <span className="text-xs text-surface-300 group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      {isLoaded && (
        <div className="absolute bottom-3 left-3 z-[1000] glass-card p-2 sm:p-2.5 max-w-[calc(100%-24px)] overflow-x-auto">
          <p className="text-[9px] font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Accessibility</p>
          <div className="flex gap-2">
            {[
              { color: '#10b981', label: 'High' },
              { color: '#34d399', label: 'Good' },
              { color: '#fbbf24', label: 'Mod' },
              { color: '#f97316', label: 'Poor' },
              { color: '#ef4444', label: 'Critical' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-surface-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
