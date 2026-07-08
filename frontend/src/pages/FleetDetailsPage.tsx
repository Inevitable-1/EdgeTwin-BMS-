import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Battery,
  Zap,
  Activity,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Target,
  Thermometer,
  Leaf,
  Heart,
  ArrowLeft,
  Download,
  FileText,
  Brain,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_FLEET_VEHICLES = [
  { id: 'v-nexon-ev', name: 'Tata Nexon EV', vehicleNumber: 'MH-01-EX-1234', batteryId: 'BAT-NEXON-001', driverName: 'Rajesh Kumar', location: 'Mumbai, MH', lat: 19.076, lng: 72.877, speed: 0, charging: true, batteryPct: 87, soh: 94.2, soc: 87.3, voltage: 376.5, current: 45.2, power: 17.0, temp: 31.2, estRange: 312, rul: 1850, health: 'Excellent', alerts: 0, lastSync: 'Just now', image: null, manufacturer: 'Tata Motors', model: 'Nexon EV Max', year: '2024', vin: 'TATAEVNEXON2024XXXXX', owner: 'Tata Motors Fleet', gps: '19.076°N, 72.877°E', route: 'Mumbai-Pune Highway', odometer: 15420 },
  { id: 'v-punch-ev', name: 'Tata Punch EV', vehicleNumber: 'MH-02-PU-5678', batteryId: 'BAT-PUNCH-001', driverName: 'Sunil Patel', location: 'Pune, MH', lat: 18.520, lng: 73.856, speed: 65, charging: false, batteryPct: 62, soh: 96.8, soc: 62.1, voltage: 368.2, current: -35.8, power: -13.2, temp: 28.5, estRange: 198, rul: 1920, health: 'Excellent', alerts: 0, lastSync: '2s ago', image: null, manufacturer: 'Tata Motors', model: 'Punch EV LR', year: '2024', vin: 'TATAEVPUNCH2024XXXXX', owner: 'Tata Motors Fleet', gps: '18.520°N, 73.856°E', route: 'Pune-Nashik Road', odometer: 8930 },
  { id: 'v-xuv400', name: 'Mahindra XUV400', vehicleNumber: 'GJ-01-XU-9012', batteryId: 'BAT-XUV-001', driverName: 'Amit Shah', location: 'Ahmedabad, GJ', lat: 23.022, lng: 72.571, speed: 0, charging: true, batteryPct: 45, soh: 91.5, soc: 45.0, voltage: 358.1, current: 52.0, power: 18.6, temp: 33.8, estRange: 142, rul: 1720, health: 'Excellent', alerts: 0, lastSync: '5s ago', image: null, manufacturer: 'Mahindra', model: 'XUV400 EL Pro', year: '2023', vin: 'MAHXUV4002023XXXXX', owner: 'Mahindra EV Fleet', gps: '23.022°N, 72.571°E', route: 'Ahmedabad-Vadodara Expressway', odometer: 22100 },
  { id: 'v-mg-zsev', name: 'MG ZS EV', vehicleNumber: 'KA-01-MG-3456', batteryId: 'BAT-MGZS-001', driverName: 'Priya Sharma', location: 'Bangalore, KA', lat: 12.971, lng: 77.594, speed: 45, charging: false, batteryPct: 78, soh: 93.0, soc: 78.2, voltage: 372.8, current: -28.4, power: -10.6, temp: 29.1, estRange: 268, rul: 1790, health: 'Excellent', alerts: 1, lastSync: '1s ago', image: null, manufacturer: 'MG Motors', model: 'ZS EV Essence', year: '2024', vin: 'MGZSBEV2024XXXXXX', owner: 'MG Fleet India', gps: '12.971°N, 77.594°E', route: 'Bangalore-Mysore Road', odometer: 12500 },
  { id: 'v-byd-atto3', name: 'BYD Atto 3', vehicleNumber: 'DL-01-BY-7890', batteryId: 'BAT-BYD-001', driverName: 'Vikram Singh', location: 'Delhi, DL', lat: 28.704, lng: 77.102, speed: 0, charging: false, batteryPct: 23, soh: 97.2, soc: 23.0, voltage: 345.6, current: 0, power: 0, temp: 26.4, estRange: 72, rul: 1950, health: 'Excellent', alerts: 0, lastSync: '30s ago', image: null, manufacturer: 'BYD', model: 'Atto 3 Advanced', year: '2024', vin: 'BYDATTO32024XXXXX', owner: 'BYD Fleet Services', gps: '28.704°N, 77.102°E', route: 'Delhi-Noida-Delhi', odometer: 6800 },
  { id: 'v-ola-s1', name: 'Ola Electric S1', vehicleNumber: 'KA-03-OL-1122', batteryId: 'BAT-OLA-001', driverName: 'Karthik Nair', location: 'Kochi, KL', lat: 9.931, lng: 76.267, speed: 38, charging: false, batteryPct: 56, soh: 88.4, soc: 56.0, voltage: 112.5, current: -18.2, power: -2.0, temp: 34.2, estRange: 84, rul: 1450, health: 'Good', alerts: 2, lastSync: '3s ago', image: null, manufacturer: 'Ola Electric', model: 'S1 Pro', year: '2023', vin: 'OLAELECTRIC2023XXXX', owner: 'Ola Fleet', gps: '9.931°N, 76.267°E', route: 'Kochi City Route', odometer: 18500 },
  { id: 'v-ather-450x', name: 'Ather 450X', vehicleNumber: 'TN-01-AT-3344', batteryId: 'BAT-ATHER-001', driverName: 'Divya R', location: 'Chennai, TN', lat: 13.082, lng: 80.270, speed: 52, charging: false, batteryPct: 41, soh: 90.6, soc: 41.0, voltage: 108.8, current: -22.5, power: -2.4, temp: 30.8, estRange: 62, rul: 1620, health: 'Excellent', alerts: 0, lastSync: '1s ago', image: null, manufacturer: 'Ather Energy', model: '450X Pro', year: '2024', vin: 'ATHER450X2024XXXXX', owner: 'Ather Fleet', gps: '13.082°N, 80.270°E', route: 'Chennai-Bangalore Highway', odometer: 11200 },
  { id: 'v-tvs-iqube', name: 'TVS iQube', vehicleNumber: 'KA-05-TV-5566', batteryId: 'BAT-TVSIQ-001', driverName: 'Ravi K', location: 'Hyderabad, TS', lat: 17.385, lng: 78.486, speed: 0, charging: true, batteryPct: 35, soh: 87.1, soc: 35.0, voltage: 106.2, current: 8.5, power: 0.9, temp: 32.5, estRange: 48, rul: 1380, health: 'Good', alerts: 1, lastSync: '10s ago', image: null, manufacturer: 'TVS Motors', model: 'iQube S', year: '2023', vin: 'TVSIQUBE2023XXXXX', owner: 'TVS Fleet', gps: '17.385°N, 78.486°E', route: 'Hyderabad City', odometer: 20100 },
];

const FLEET_META: Record<string, { name: string; manager: string; location: string; since: string; logo: string; color: string }> = {
  'fleet-tata-ev': { name: 'Tata EV Fleet', manager: 'Rajesh Kumar', location: 'Mumbai, India', since: 'January 2024', logo: 'T', color: '#3b82f6' },
  'fleet-mahindra-ev': { name: 'Mahindra EV Fleet', manager: 'Amit Shah', location: 'Ahmedabad, India', since: 'March 2024', logo: 'M', color: '#ef4444' },
  'fleet-ola-ev': { name: 'Ola Electric Fleet', manager: 'Karthik Nair', location: 'Kochi, India', since: 'June 2024', logo: 'O', color: '#22c55e' },
};

const VEHICLE_MANUFACTURER_COLORS: Record<string, string> = {
  'Tata Motors': '#3b82f6',
  'Mahindra': '#ef4444',
  'MG Motors': '#a855f7',
  'BYD': '#22c55e',
  'Ola Electric': '#22c55e',
  'Ather Energy': '#f59e0b',
  'TVS Motors': '#a855f7',
};

function getManufacturerColor(manufacturer: string): string {
  return VEHICLE_MANUFACTURER_COLORS[manufacturer] || '#64748b';
}

function getSpeedColor(speed: number): string {
  if (speed === 0) return '#64748b';
  if (speed <= 30) return '#22c55e';
  if (speed <= 60) return '#eab308';
  return '#ef4444';
}

function getSpeedLabel(speed: number): string {
  if (speed === 0) return 'Idle';
  if (speed <= 30) return 'Slow';
  if (speed <= 60) return 'Moderate';
  return 'Fast';
}

function getTempColor(temp: number): string {
  if (temp <= 30) return '#22c55e';
  if (temp <= 35) return '#eab308';
  return '#ef4444';
}

function getSoHColor(soh: number): string {
  if (soh > 90) return '#22c55e';
  if (soh >= 80) return '#eab308';
  if (soh >= 70) return '#f97316';
  return '#ef4444';
}

function getHealthPill(health: string): { bg: string; text: string; border: string } {
  switch (health) {
    case 'Excellent': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    case 'Good': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    case 'Fair': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'Poor': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    default: return { bg: 'bg-dark-700', text: 'text-dark-400', border: 'border-dark-600' };
  }
}

function useAnimatedCounter(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * target;
      setValue(Math.round(start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function StatCard({ icon: Icon, title, value, suffix, color, decimals = 0 }: {
  icon: React.ElementType; title: string; value: number; suffix?: string; color: string; decimals?: number;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 transition-all hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-dark-400 text-xs font-medium truncate">{title}</span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">
        {animated.toFixed(decimals)}{suffix || ''}
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 bg-dark-700 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 bg-dark-700 rounded animate-pulse" />
          <div className="h-4 w-72 bg-dark-800 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-dark-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-dark-700 rounded animate-pulse" />
            <div className="h-4 w-28 bg-dark-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="h-3 w-16 bg-dark-700 rounded animate-pulse mb-3" />
          <div className="h-7 w-12 bg-dark-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="h-5 w-40 bg-dark-700 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-dark-800 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function FleetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: fleetData, isLoading: fleetLoading } = useQuery({
    queryKey: ['fleet', id],
    queryFn: () => api.getFleet(id!),
    enabled: !!id,
  });

  const { data: _fleetStats } = useQuery({
    queryKey: ['fleetStatistics', id],
    queryFn: () => api.getFleetStatistics(id!),
    enabled: !!id,
  });

  const { data: _batteriesData } = useQuery({
    queryKey: ['batteries', { fleet_id: id }],
    queryFn: () => api.getBatteries({ fleet_id: id }),
    enabled: !!id,
  });

  const { data: _alertsData } = useQuery({
    queryKey: ['alerts', { fleet_id: id }],
    queryFn: () => api.getAlerts({ fleet_id: id }),
    enabled: !!id,
  });

  const meta = id ? FLEET_META[id] || { name: 'Unknown Fleet', manager: 'N/A', location: 'Unknown', since: 'N/A', logo: 'F', color: '#64748b' } : null;
  const fleetName = fleetData?.name || meta?.name || 'Fleet Details';
  const managerName = meta?.manager || 'N/A';
  const location = meta?.location || 'N/A';
  const since = meta?.since || 'N/A';
  const logoLetter = meta?.logo || 'F';
  const logoColor = meta?.color || '#64748b';
  const fleetId = id || 'N/A';
  const vehicles = DEMO_FLEET_VEHICLES;

  const totalVehicles = vehicles.length;
  const healthyBatteries = vehicles.filter(v => v.health === 'Excellent').length;
  const vehiclesCharging = vehicles.filter(v => v.charging).length;
  const vehiclesRunning = vehicles.filter(v => v.speed > 0).length;
  const vehiclesMaintenance = vehicles.filter(v => v.health === 'Fair' || v.health === 'Poor').length;
  const criticalAlerts = vehicles.reduce((sum, v) => sum + v.alerts, 0);
  const avgSoh = vehicles.reduce((sum, v) => sum + v.soh, 0) / totalVehicles;
  const avgSoc = vehicles.reduce((sum, v) => sum + v.soc, 0) / totalVehicles;
  const avgTemp = vehicles.reduce((sum, v) => sum + v.temp, 0) / totalVehicles;

  const isLoading = fleetLoading;

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 space-y-6">
        <SkeletonHeader />
        <SkeletonCards />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-primary-600/30 text-sm font-medium animate-in slide-in-from-right">
          {notification}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="relative bg-dark-900 border border-dark-700 rounded-xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${logoColor} 0%, transparent 70%)` }} />
        <div className="relative flex flex-col md:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ backgroundColor: logoColor }}>
            {logoLetter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white truncate">{fleetName}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 w-fit">
                Active
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-dark-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Since {since}</span>
              <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {totalVehicles} vehicles</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-xs text-dark-500">
              <span>Fleet ID: {fleetId}</span>
              <span>Manager: {managerName}</span>
              <span>Last updated: Just now</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => showNotification('Exporting fleet report...')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
        <button
          onClick={() => showNotification('Downloading battery passport data...')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" /> Download Battery Passport
        </button>
        <button
          onClick={() => showNotification('Generating AI-powered report...')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
        >
          <Brain className="w-4 h-4" /> Generate AI Report
        </button>
        <button
          onClick={() => navigate('/fleet')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors ml-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        <StatCard icon={Truck} title="Total Vehicles" value={totalVehicles} color="#3b82f6" />
        <StatCard icon={Battery} title="Healthy Batteries" value={healthyBatteries} color="#22c55e" />
        <StatCard icon={Zap} title="Vehicles Charging" value={vehiclesCharging} color="#f59e0b" />
        <StatCard icon={Activity} title="Vehicles Running" value={vehiclesRunning} color="#3b82f6" />
        <StatCard icon={Wrench} title="In Maintenance" value={vehiclesMaintenance} color="#f97316" />
        <StatCard icon={AlertTriangle} title="Critical Alerts" value={criticalAlerts} color="#ef4444" />
        <StatCard icon={TrendingUp} title="Avg SOH" value={Math.round(avgSoh * 10) / 10} suffix="%" color="#22c55e" decimals={1} />
        <StatCard icon={Gauge} title="Avg SOC" value={Math.round(avgSoc * 10) / 10} suffix="%" color="#3b82f6" decimals={1} />
        <StatCard icon={Target} title="Fleet Efficiency" value={87.5} suffix="%" color="#a855f7" decimals={1} />
        <StatCard icon={Thermometer} title="Avg Temperature" value={Math.round(avgTemp * 10) / 10} suffix="°C" color="#f59e0b" decimals={1} />
        <StatCard icon={Zap} title="Energy Today" value={847} suffix=" kWh" color="#f97316" />
        <StatCard icon={Leaf} title="Carbon Saved" value={425} suffix=" kg" color="#22c55e" />
        <StatCard icon={Heart} title="Battery Health" value={92.3} suffix="" color="#ef4444" decimals={1} />
      </div>

      {/* VEHICLE TABLE */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary-500" />
            Fleet Vehicles
          </h3>
          <span className="text-dark-400 text-xs">{totalVehicles} vehicles</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2000px]">
            <thead>
              <tr className="text-left text-dark-400 border-b border-dark-700">
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider sticky left-0 bg-dark-900 z-10">Vehicle</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Vehicle No.</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Battery ID</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Driver</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Location</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Speed</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Charging</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Battery %</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">SOH</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">SOC</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Voltage</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Current</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Power</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Temp</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Est. Range</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">RUL</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Health</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Alerts</th>
                <th className="pb-3 pr-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Last Sync</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const hp = getHealthPill(v.health);
                const mfrColor = getManufacturerColor(v.manufacturer);
                return (
                  <tr
                    key={v.id}
                    className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="py-3 pr-3 sticky left-0 bg-dark-900 z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: mfrColor }}>
                          {v.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white text-sm font-medium truncate max-w-[140px]">{v.name}</div>
                          <div className="text-dark-500 text-xs truncate max-w-[140px]">{v.manufacturer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm font-mono">{v.vehicleNumber}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-400 text-xs font-mono">{v.batteryId}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm">{v.driverName}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-400 text-xs">{v.location}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-sm font-medium" style={{ color: getSpeedColor(v.speed) }}>
                        {v.speed} km/h
                      </span>
                      <span className="text-dark-500 text-xs ml-1">({getSpeedLabel(v.speed)})</span>
                    </td>
                    <td className="py-3 pr-3">
                      {v.charging ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Charging
                        </span>
                      ) : v.speed > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Running
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-dark-700 text-dark-400 border border-dark-600">
                          Idle
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${v.batteryPct}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">{v.batteryPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-sm font-semibold" style={{ color: getSoHColor(v.soh) }}>
                        {v.soh}%
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: getSoHColor(v.soc), width: `${v.soc}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">{v.soc}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm">{v.voltage}V</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm" style={{ color: v.current >= 0 ? '#22c55e' : '#3b82f6' }}>
                        {v.current > 0 ? '+' : ''}{v.current}A
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm" style={{ color: v.power >= 0 ? '#f59e0b' : '#3b82f6' }}>
                        {v.power > 0 ? '+' : ''}{v.power}kW
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-sm font-medium" style={{ color: getTempColor(v.temp) }}>
                        {v.temp}°C
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm">{v.estRange} km</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-300 text-sm">{v.rul}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hp.bg} ${hp.text} ${hp.border}`}>
                        {v.health}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {v.alerts > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {v.alerts}
                        </span>
                      ) : (
                        <span className="text-green-500 text-xs">0</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-500 text-xs">{v.lastSync}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate(`/fleet/${id}/vehicle/${v.id}`)}
                        className="bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 font-medium py-1.5 px-3 rounded-lg transition-colors text-sm inline-flex items-center gap-1"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-dark-400">
                    No vehicles found for this fleet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
