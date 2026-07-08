import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  MapContainer, TileLayer, WMSTileLayer, Marker, Popup, Tooltip,
  Circle, Polyline, useMap, useMapEvents,
} from 'react-leaflet';
import {
  MapPin, Search, X, AlertTriangle, Battery, Zap,
  Navigation, Star, Phone, Clock, Eye, EyeOff, Maximize2,
  Minimize2, Gauge, Wrench, ChevronLeft, ChevronRight, Car, List,
  Compass, Filter,
} from 'lucide-react';
import {
  vehicles as defaultVehicles, chargingStations as defaultStations,
  serviceCenters as defaultServiceCenters, roadRoutes, highTempAreas,
  highChargingActivity, alertDensity,
  type MapVehicle, type ChargingStation, type ServiceCenter,
} from '../../data/fleetMapData';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FleetMapProps {
  vehicles?: MapVehicle[];
  stations?: ChargingStation[];
  serviceCenters?: ServiceCenter[];
  height?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

const STATUS_COLORS: Record<string, string> = {
  healthy: '#22c55e', charging: '#eab308', maintenance: '#f97316', critical: '#ef4444',
};

const FLEET_OPTIONS = [
  { value: 'all', label: 'All Fleets' },
  { value: 'fleet-tata-ev', label: 'Tata EV Fleet' },
  { value: 'fleet-mahindra-ev', label: 'Mahindra EV Fleet' },
  { value: 'fleet-ola-ev', label: 'Ola Electric Fleet' },
  { value: 'fleet-ather-ev', label: 'Ather Energy Fleet' },
  { value: 'fleet-tvs-ev', label: 'TVS Electric Fleet' },
  { value: 'fleet-byd-ev', label: 'BYD EV Fleet' },
  { value: 'fleet-mg-ev', label: 'MG EV Fleet' },
];

const STATUS_OPTIONS = ['all', 'healthy', 'charging', 'maintenance', 'critical'];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePos(from: { lat: number; lng: number }, to: { lat: number; lng: number }, t: number) {
  return { lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t };
}

function createVehicleIcon(status: string, isSelected: boolean, isCritical: boolean) {
  const size = isSelected ? 18 : 14;
  const color = STATUS_COLORS[status] || '#94a3b8';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      border:${isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.5)'};
      box-shadow:0 0 ${isSelected ? 12 : 6}px ${status === 'critical' ? 'rgba(239,68,68,0.6)' : 'rgba(0,0,0,0.3)'};
      transition:all 0.3s ease;
      ${isCritical ? 'animation:blink-critical 1s ease-in-out infinite;' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createStationIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:24px;height:24px;border-radius:4px;
      background:#3b82f6;
      border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 0 10px rgba(59,130,246,0.4);
      display:flex;align-items:center;justify-content:center;
      animation:pulse-station 2s ease-in-out infinite;
    "><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createServiceIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:24px;height:24px;border-radius:4px;
      background:#a855f7;
      border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 0 10px rgba(168,85,247,0.4);
      display:flex;align-items:center;justify-content:center;
    "><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// ─── CSS Animations ──────────────────────────────────────────────────────────

const ANIMATION_STYLES = `
@keyframes pulse-station {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes blink-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.leaflet-popup-content-wrapper {
  background: #0f172a !important;
  color: #e2e8f0 !important;
  border: 1px solid #334155 !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important;
}
.leaflet-popup-tip {
  background: #0f172a !important;
  border: 1px solid #334155 !important;
}
.leaflet-popup-close-button {
  color: #94a3b8 !important;
  font-size: 18px !important;
  top: 8px !important;
  right: 8px !important;
}
.leaflet-tooltip {
  background: #1e293b !important;
  color: #f1f5f9 !important;
  border: 1px solid #334155 !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 4px 10px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
}
.leaflet-tooltip-top:before {
  border-top-color: #334155 !important;
}
`;

// ─── Internal Map Components ─────────────────────────────────────────────────

function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => { mapRef.current = null; };
  }, [map]);
  return null;
}

function MapEvents({ onCenterChange, onContextMenu }: {
  onCenterChange: (c: [number, number]) => void;
  onContextMenu: (latlng: L.LatLng, point: L.Point) => void;
}) {
  useMapEvents({
    moveend: () => { /* handled via ref */ },
    contextmenu: (e) => onContextMenu(e.latlng, e.containerPoint),
  });
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    };
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, onCenterChange]);

  return null;
}

function FullscreenControl({ mapRef, isFullscreen, onToggle }: {
  mapRef: React.MutableRefObject<L.Map | null>;
  isFullscreen: boolean;
  onToggle: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => {
          const el = mapRef.current?.getContainer();
          if (!document.fullscreenElement) {
            el?.requestFullscreen?.();
            onToggle();
          } else {
            document.exitFullscreen();
            onToggle();
          }
        }}
        className="w-9 h-9 bg-dark-900/85 backdrop-blur-md border border-dark-600 rounded-lg flex items-center justify-center hover:bg-dark-800 transition-all group"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-dark-300 group-hover:text-white transition-colors" />
        ) : (
          <Maximize2 className="w-4 h-4 text-dark-300 group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
}

function ZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-dark-900/85 backdrop-blur-md border border-dark-600 rounded-t-lg flex items-center justify-center hover:bg-dark-800 transition-all group"
      >
        <span className="text-lg text-dark-300 group-hover:text-white leading-none transition-colors">+</span>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-dark-900/85 backdrop-blur-md border-x border-b border-dark-600 rounded-b-lg flex items-center justify-center hover:bg-dark-800 transition-all group"
      >
        <span className="text-lg text-dark-300 group-hover:text-white leading-none transition-colors">−</span>
      </button>
    </div>
  );
}

// ─── Popup Content ───────────────────────────────────────────────────────────

function VehiclePopupContent({ vehicle, onOpenDashboard }: {
  vehicle: MapVehicle;
  onOpenDashboard: () => void;
}) {
  const statusColor = STATUS_COLORS[vehicle.status] || '#94a3b8';
  return (
    <div className="min-w-[260px] select-none">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-bold text-sm">{vehicle.name}</div>
          <div className="text-dark-400 text-[10px] font-mono mt-0.5">{vehicle.number}</div>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {vehicle.status}
        </span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-2 text-dark-300">
          <Car className="w-3 h-3 text-dark-400" />
          <span>{vehicle.driver}</span>
        </div>

        {/* Battery bar */}
        <div className="flex items-center gap-2">
          <Battery className="w-3 h-3 text-dark-400" />
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${vehicle.batteryLevel}%`,
                  backgroundColor: vehicle.batteryLevel > 60 ? '#22c55e' : vehicle.batteryLevel > 30 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="font-mono text-white font-semibold w-8 text-right">{vehicle.batteryLevel}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-dark-800 rounded-md p-1.5 text-center">
            <div className="text-dark-500 text-[8px] uppercase tracking-wider">SOH</div>
            <div className="text-white font-mono text-[10px] font-bold">{vehicle.soh.toFixed(1)}%</div>
          </div>
          <div className="bg-dark-800 rounded-md p-1.5 text-center">
            <div className="text-dark-500 text-[8px] uppercase tracking-wider">SOC</div>
            <div className="text-white font-mono text-[10px] font-bold">{vehicle.soc.toFixed(1)}%</div>
          </div>
          <div className="bg-dark-800 rounded-md p-1.5 text-center">
            <div className="text-dark-500 text-[8px] uppercase tracking-wider">Temp</div>
            <div className="font-mono text-[10px] font-bold" style={{ color: vehicle.temperature > 45 ? '#ef4444' : vehicle.temperature > 38 ? '#f97316' : '#22c55e' }}>
              {vehicle.temperature.toFixed(1)}°C
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-dark-400" />
            <span className="text-dark-400">Speed:</span>
            <span className="text-white font-mono font-semibold">{vehicle.speed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-dark-400" />
            <span className="text-dark-400">Range:</span>
            <span className="text-white font-mono font-semibold">{vehicle.range} km</span>
          </div>
        </div>

        {vehicle.alerts > 0 && (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-[10px] font-semibold">{vehicle.alerts} active alert{vehicle.alerts > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onOpenDashboard(); }}
        className="mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-600 hover:bg-primary-500 text-white transition-colors"
      >
        Open Vehicle Dashboard
      </button>
    </div>
  );
}

function StationPopupContent({ station }: { station: ChargingStation }) {
  const operatorColors: Record<string, string> = {
    'Tata Power': '#2563eb', 'ChargeZone': '#059669', 'Ather Energy': '#ea580c',
    'Statiq': '#7c3aed', 'Zeon': '#0891b2', 'EESL': '#65a30d', 'Sunfuel': '#ca8a04',
  };
  const opColor = operatorColors[station.operator] || '#64748b';

  return (
    <div className="min-w-[240px] select-none">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-blue-400" />
        <div>
          <div className="text-white font-bold text-sm">{station.name}</div>
          <span
            className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-0.5"
            style={{ backgroundColor: `${opColor}20`, color: opColor }}
          >
            {station.operator}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-dark-400 mt-0.5 shrink-0" />
          <span className="text-dark-300">{station.address}</span>
        </div>

        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-400 font-mono text-[10px] font-bold">{station.available}</span>
            <span className="text-dark-500 text-[9px]">Free</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-orange-400 font-mono text-[10px] font-bold">{station.busy}</span>
            <span className="text-dark-500 text-[9px]">Busy</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-400 font-mono text-[10px] font-bold">{station.offline}</span>
            <span className="text-dark-500 text-[9px]">Off</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-dark-400" />
          <span className="text-dark-300 text-[10px]">{station.speeds.join(' · ')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-dark-400" />
          <span className="text-dark-300 text-[10px]">{station.hours}</span>
        </div>
      </div>

      <button
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, '_blank')}
        className="mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white transition-colors"
      >
        <Navigation className="w-3 h-3" /> Navigate
      </button>
    </div>
  );
}

function ServicePopupContent({ center }: { center: ServiceCenter }) {
  return (
    <div className="min-w-[230px] select-none">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-4 h-4 text-purple-400" />
        <div>
          <div className="text-white font-bold text-sm">{center.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i < Math.round(center.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'}`}
              />
            ))}
            <span className="text-dark-400 text-[9px] ml-1">{center.rating}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-dark-400 mt-0.5 shrink-0" />
          <span className="text-dark-300">{center.address}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-dark-400" />
          <span className="text-dark-300">{center.phone}</span>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {center.services.map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] text-purple-300 font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`, '_blank')}
        className="mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition-colors"
      >
        <Navigation className="w-3 h-3" /> Navigate
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FleetMap({
  vehicles: propVehicles,
  stations: propStations,
  serviceCenters: propServiceCenters,
  height = '100%',
  className = '',
}: FleetMapProps) {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  // Data
  const vehicles = propVehicles || defaultVehicles;
  const stations = propStations || defaultStations;
  const centers = propServiceCenters || defaultServiceCenters;

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    lat: number; lng: number; x: number; y: number;
  } | null>(null);

  // Filters
  const [fleetFilter, setFleetFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStations, setShowStations] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  // Vehicle motion tracking
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, { lat: number; lng: number }>>(() => {
    const init: Record<string, { lat: number; lng: number }> = {};
    vehicles.forEach((v) => { init[v.id] = { lat: v.lat, lng: v.lng }; });
    return init;
  });
  const motionRef = useRef<Record<string, { segmentIdx: number; progress: number }>>({});

  // Initialize motion tracking
  useEffect(() => {
    vehicles.forEach((v) => {
      if (!motionRef.current[v.id]) {
        motionRef.current[v.id] = { segmentIdx: 0, progress: 0 };
      }
    });
  }, [vehicles]);

  // Vehicle animation loop
  useEffect(() => {
    if (vehicles.length === 0) return;
    const interval = setInterval(() => {
      setVehiclePositions((prev) => {
        const next = { ...prev };
        vehicles.forEach((v) => {
          if (!v.route || v.route.length < 2) return;
          const route = v.route;
          const state = motionRef.current[v.id] || { segmentIdx: 0, progress: 0 };
          const from = route[state.segmentIdx];
          const toIdx = (state.segmentIdx + 1) % route.length;
          const to = route[toIdx];
          const newProgress = Math.min(1, state.progress + 0.12);
          const pos = interpolatePos(from, to, newProgress);
          next[v.id] = pos;
          if (newProgress >= 1) {
            motionRef.current[v.id] = {
              segmentIdx: toIdx,
              progress: 0,
            };
          } else {
            motionRef.current[v.id] = { ...state, progress: newProgress };
          }
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [vehicles]);

  // CSS anim styles
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ANIMATION_STYLES;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  // Listen fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Close context menu on click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  // ─── Filtered Data ───────────────────────────────────────────────────────

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (fleetFilter !== 'all') {
      list = list.filter((v) => v.fleetId === fleetFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((v) => v.status === statusFilter);
    }

    if (showCriticalAlerts) {
      list = list.filter((v) => v.alerts > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.number.toLowerCase().includes(q) ||
          v.batteryId.toLowerCase().includes(q) ||
          v.driver.toLowerCase().includes(q),
      );
    }

    return list;
  }, [vehicles, fleetFilter, statusFilter, showCriticalAlerts, searchQuery]);

  const filteredStations = useMemo(() => {
    if (!showStations) return [];
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.trim().toLowerCase();
    return stations.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.operator.toLowerCase().includes(q));
  }, [stations, showStations, searchQuery]);

  const filteredCenters = useMemo(() => {
    if (!showCenters) return [];
    if (!searchQuery.trim()) return centers;
    const q = searchQuery.trim().toLowerCase();
    return centers.filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
  }, [centers, showCenters, searchQuery]);

  // ─── Side Panel Stats ────────────────────────────────────────────────────

  const sideStats = useMemo<{
    total: number; online: number; charging: number;
    nearbyStations: number; criticalAlerts: number;
    nearestCenter: { name: string; dist: number } | null;
  }>(() => {
    const total = filteredVehicles.length;
    const online = filteredVehicles.filter((v) => v.status !== 'critical' && v.status !== 'maintenance').length;
    const charging = filteredVehicles.filter((v) => v.status === 'charging').length;
    const criticalAlerts = filteredVehicles.filter((v) => v.alerts > 0).length;

    const nearbyStations = stations.filter((s) => {
      const d = haversineKm(mapCenter[0], mapCenter[1], s.lat, s.lng);
      return d <= 50;
    }).length;

    let nearestCenter: { name: string; dist: number } | null = null;
    let minDist = Infinity;
    centers.forEach((c) => {
      const d = haversineKm(mapCenter[0], mapCenter[1], c.lat, c.lng);
      if (d < minDist) {
        minDist = d;
        nearestCenter = { name: c.name, dist: Math.round(d * 10) / 10 };
      }
    });

    return { total, online, charging, nearbyStations, criticalAlerts, nearestCenter };
  }, [filteredVehicles, stations, centers, mapCenter]);

  // Search result selection
  const handleSearchSelect = useCallback((vehicleId: string) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v && mapRef.current) {
      const pos = vehiclePositions[v.id] || { lat: v.lat, lng: v.lng };
      mapRef.current.setView([pos.lat, pos.lng], 12);
      setSelectedVehicleId(v.id);
    }
  }, [vehicles, vehiclePositions]);

  const handleResetView = useCallback(() => {
    mapRef.current?.setView(INDIA_CENTER, INDIA_ZOOM);
    setSelectedVehicleId(null);
  }, []);

  const handleContextCenter = useCallback(() => {
    if (contextMenu) {
      mapRef.current?.setView([contextMenu.lat, contextMenu.lng], mapRef.current.getZoom());
      setContextMenu(null);
    }
  }, [contextMenu]);

  // ─── Icons (memoized per status) ─────────────────────────────────────────

  const vehicleIconsCache = useRef<Record<string, L.DivIcon>>({});
  const getVehicleIcon = useCallback((v: MapVehicle, selected: boolean) => {
    const key = `${v.id}-${selected}`;
    if (vehicleIconsCache.current[key]) return vehicleIconsCache.current[key];
    const icon = createVehicleIcon(v.status, selected, v.status === 'critical');
    vehicleIconsCache.current[key] = icon;
    return icon;
  }, []);

  const stationIcon = useMemo(() => createStationIcon(), []);
  const serviceIcon = useMemo(() => createServiceIcon(), []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ height }}>
      {/* CSS injection */}
      <style>{ANIMATION_STYLES}</style>

      {/* Map */}
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <WMSTileLayer
          url="https://tiles.maps.eox.at/wms?"
          layers="s2cloudless"
          format="image/png"
          transparent={true}
          opacity={0.08}
        />

        <MapRefCapture mapRef={mapRef} />
        <MapEvents
          onCenterChange={(c) => setMapCenter(c)}
          onContextMenu={(latlng, point) => setContextMenu({ lat: latlng.lat, lng: latlng.lng, x: point.x, y: point.y })}
        />
        <FullscreenControl mapRef={mapRef} isFullscreen={isFullscreen} onToggle={() => setIsFullscreen(!isFullscreen)} />
        <ZoomControl />

        {/* Travel Paths */}
        {filteredVehicles.map((v) => {
          if (!v.route || v.route.length < 2) return null;
          const positions: [number, number][] = v.route.map((p) => [p.lat, p.lng]);
          return (
            <Polyline
              key={`route-${v.id}`}
              positions={positions}
              pathOptions={{
                color: STATUS_COLORS[v.status] || '#64748b',
                weight: 1.5,
                opacity: 0.25,
                dashArray: '6 8',
              }}
            />
          );
        })}

        {/* Vehicle Markers */}
        {filteredVehicles.map((v) => {
          const pos = vehiclePositions[v.id] || { lat: v.lat, lng: v.lng };
          const isSelected = selectedVehicleId === v.id;
          return (
            <Marker
              key={v.id}
              position={[pos.lat, pos.lng]}
              icon={getVehicleIcon(v, isSelected)}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {v.name} · {v.number}
              </Tooltip>
              <Popup>
                <VehiclePopupContent vehicle={v} onOpenDashboard={() => navigate(`/fleet/${v.fleetId}/vehicle/${v.id}`)} />
              </Popup>
            </Marker>
          );
        })}

        {/* Charging Station Markers */}
        {filteredStations.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
            <Tooltip direction="top" offset={[0, -10]}>{s.name}</Tooltip>
            <Popup>
              <StationPopupContent station={s} />
            </Popup>
          </Marker>
        ))}

        {/* Service Center Markers */}
        {filteredCenters.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={serviceIcon}>
            <Tooltip direction="top" offset={[0, -10]}>{c.name}</Tooltip>
            <Popup>
              <ServicePopupContent center={c} />
            </Popup>
          </Marker>
        ))}

        {/* Heatmap Overlay */}
        {showHeatmap && (
          <>
            {highTempAreas.map((h, i) => (
              <Circle
                key={`ht-${i}`}
                center={[h.lat, h.lng]}
                radius={15000 + h.intensity * 30000}
                pathOptions={{
                  color: h.intensity > 0.7 ? '#ef4444' : '#f97316',
                  fillColor: h.intensity > 0.7 ? '#ef4444' : '#f97316',
                  fillOpacity: h.intensity * 0.25,
                  weight: 0,
                }}
              />
            ))}
            {highChargingActivity.map((h, i) => (
              <Circle
                key={`hc-${i}`}
                center={[h.lat, h.lng]}
                radius={10000 + h.intensity * 25000}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: h.intensity * 0.2,
                  weight: 0,
                }}
              />
            ))}
            {alertDensity.map((h, i) => (
              <Circle
                key={`ad-${i}`}
                center={[h.lat, h.lng]}
                radius={8000 + h.intensity * 20000}
                pathOptions={{
                  color: '#a855f7',
                  fillColor: '#a855f7',
                  fillOpacity: h.intensity * 0.2,
                  weight: 0,
                }}
              />
            ))}
          </>
        )}

        {/* Road Routes */}
        {roadRoutes.map((route, i) => (
          <Polyline
            key={`road-${i}`}
            positions={route.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: '#334155',
              weight: 1.5,
              opacity: 0.3,
              dashArray: '4 6',
            }}
          />
        ))}
      </MapContainer>

      {/* ─── UI Overlays ──────────────────────────────────────────────────── */}

      {/* Title */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <h2 className="text-white text-lg font-bold tracking-tight">Fleet Distribution & Charging Network</h2>
        <p className="text-dark-400 text-[10px] font-mono mt-0.5">Real-time fleet monitoring · {filteredVehicles.length} vehicles</p>
      </div>

      {/* Search */}
      <div className="absolute top-4 right-4 z-[1000] w-64">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, battery, station..."
            className="w-full pl-8 pr-8 py-2 bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-xl text-white text-[11px] placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mt-1 bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {filteredVehicles.length === 0 && filteredStations.length === 0 && filteredCenters.length === 0 ? (
              <div className="p-3 text-dark-400 text-[11px] text-center">No results found</div>
            ) : (
              <>
                {filteredVehicles.slice(0, 5).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSearchSelect(v.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-dark-800 transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[v.status] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[11px] font-medium truncate">{v.name}</div>
                      <div className="text-dark-400 text-[9px] truncate">{v.number} · {v.driver}</div>
                    </div>
                    <Car className="w-3 h-3 text-dark-500 shrink-0" />
                  </button>
                ))}
                {filteredStations.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      mapRef.current?.setView([s.lat, s.lng], 14);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-dark-800 transition-colors text-left"
                  >
                    <Zap className="w-3 h-3 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[11px] font-medium truncate">{s.name}</div>
                      <div className="text-dark-400 text-[9px] truncate">{s.address}</div>
                    </div>
                  </button>
                ))}
                {filteredCenters.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      mapRef.current?.setView([c.lat, c.lng], 14);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-dark-800 transition-colors text-left"
                  >
                    <Wrench className="w-3 h-3 text-purple-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[11px] font-medium truncate">{c.name}</div>
                      <div className="text-dark-400 text-[9px] truncate">{c.address}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-xl px-4 py-2.5">
        {/* Fleet Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-dark-400" />
          <select
            value={fleetFilter}
            onChange={(e) => setFleetFilter(e.target.value)}
            className="bg-dark-800 border border-dark-600 rounded-lg px-2 py-1 text-[10px] text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
          >
            {FLEET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 bg-dark-700" />

        {/* Status Filter */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? s === 'all' ? 'bg-primary-600 text-white shadow-sm' :
                    `text-white shadow-sm` + (s === 'healthy' ? ' bg-green-600' : s === 'charging' ? ' bg-yellow-600' : s === 'maintenance' ? ' bg-orange-600' : ' bg-red-600')
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-dark-700'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-dark-700" />

        {/* Toggles */}
        <button
          onClick={() => setShowStations(!showStations)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
            showStations ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-dark-800 border-dark-700 text-dark-400'
          }`}
        >
          {showStations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Stations
        </button>

        <button
          onClick={() => setShowCenters(!showCenters)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
            showCenters ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-dark-800 border-dark-700 text-dark-400'
          }`}
        >
          {showCenters ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Service
        </button>

        <button
          onClick={() => setShowCriticalAlerts((p) => !p)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
            showCriticalAlerts ? 'bg-red-600/20 border-red-500/30 text-red-300' : 'bg-dark-800 border-dark-700 text-dark-400'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Alerts
        </button>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
            showHeatmap ? 'bg-orange-600/20 border-orange-500/30 text-orange-300' : 'bg-dark-800 border-dark-700 text-dark-400'
          }`}
        >
          <Compass className="w-3 h-3" />
          Heatmap
        </button>
      </div>

      {/* Side Panel */}
      <div className={`absolute left-4 top-20 z-[1000] transition-all duration-300 ${sidePanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+16px)]'}`}>
        <div className="bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-xl p-4 w-56">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-[11px] font-bold uppercase tracking-wider">Fleet Stats</h3>
            <List className="w-3.5 h-3.5 text-dark-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-[10px]">Total Vehicles</span>
              <span className="text-white text-[11px] font-bold font-mono">{sideStats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-[10px]">Vehicles Online</span>
              <span className="text-green-400 text-[11px] font-bold font-mono">{sideStats.online}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-[10px]">Vehicles Charging</span>
              <span className="text-yellow-400 text-[11px] font-bold font-mono">{sideStats.charging}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-[10px]">Nearby Charging</span>
              <span className="text-blue-400 text-[11px] font-bold font-mono">{sideStats.nearbyStations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-[10px]">Critical Alerts</span>
              <span className={`text-[11px] font-bold font-mono ${sideStats.criticalAlerts > 0 ? 'text-red-400' : 'text-dark-500'}`}>
                {sideStats.criticalAlerts}
                {sideStats.criticalAlerts > 0 && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-dark-700/50">
              <div className="text-dark-400 text-[9px] mb-1">Nearest Service Center</div>
              {sideStats.nearestCenter ? (
                <div className="text-white text-[10px] font-medium truncate">{sideStats.nearestCenter.name}</div>
              ) : (
                <div className="text-dark-500 text-[10px]">—</div>
              )}
              {sideStats.nearestCenter && (
                <div className="text-dark-400 text-[9px] font-mono">{sideStats.nearestCenter.dist} km away</div>
              )}
            </div>
          </div>
        </div>
        {/* Toggle button */}
        <button
          onClick={() => setSidePanelOpen(!sidePanelOpen)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-7 h-14 bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-r-lg flex items-center justify-center hover:bg-dark-800 transition-colors"
        >
          {sidePanelOpen ? <ChevronLeft className="w-3.5 h-3.5 text-dark-300" /> : <ChevronRight className="w-3.5 h-3.5 text-dark-300" />}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-xl p-3">
        <div className="text-white text-[9px] font-bold uppercase tracking-wider mb-2">Legend</div>
        <div className="space-y-1.5">
          {[
            { color: '#22c55e', label: 'Healthy Vehicle', shape: 'rounded-full' },
            { color: '#eab308', label: 'Charging', shape: 'rounded-full' },
            { color: '#f97316', label: 'Maintenance', shape: 'rounded-full' },
            { color: '#ef4444', label: 'Critical', shape: 'rounded-full' },
            { color: '#3b82f6', label: 'Charging Station', shape: 'rounded' },
            { color: '#a855f7', label: 'Service Center', shape: 'rounded' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 shrink-0 ${item.shape === 'rounded-full' ? 'rounded-full' : 'rounded-sm'}`}
                style={{ backgroundColor: item.color }}
              />
              <span className="text-dark-300 text-[10px]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset View */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <button
          onClick={handleResetView}
          className="px-3 py-1.5 bg-dark-900/85 backdrop-blur-md border border-dark-600 rounded-lg text-[10px] text-dark-300 hover:text-white hover:bg-dark-800 transition-all flex items-center gap-1.5 font-medium"
        >
          <Compass className="w-3 h-3" />
          Reset View
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-[10000] bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-lg overflow-hidden shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleContextCenter}
            className="w-full px-3 py-2 text-[11px] text-dark-200 hover:bg-dark-800 transition-colors flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            Center Map Here
          </button>
          <button
            onClick={() => {
              mapRef.current?.setZoom(mapRef.current.getZoom() + 2);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-[11px] text-dark-200 hover:bg-dark-800 transition-colors flex items-center gap-2"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-sm font-bold">+</span>
            Zoom In
          </button>
          <button
            onClick={() => {
              mapRef.current?.setZoom(mapRef.current.getZoom() - 2);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-[11px] text-dark-200 hover:bg-dark-800 transition-colors flex items-center gap-2"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-sm font-bold">−</span>
            Zoom Out
          </button>
        </div>
      )}

      {/* Fullscreen indicator */}
      {isFullscreen && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none">
          <span className="px-2 py-0.5 bg-dark-900/70 backdrop-blur-sm border border-dark-700 rounded text-[9px] text-dark-400 font-mono">
            Press ESC or click fullscreen button to exit
          </span>
        </div>
      )}
    </div>
  );
}
