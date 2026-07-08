import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Car, Battery, Zap, Thermometer, Gauge, AlertTriangle, Clock,
  Activity, TrendingUp, Download, FileText, FileSpreadsheet, Circle,
  Shield, Cpu, RefreshCw, Info, CalendarDays, ClipboardCheck,
  BarChart3, Map, Share2, CheckCircle, XCircle,
  Maximize2, Heart,
} from 'lucide-react';

const DEMO_VEHICLES = [
  { id: 'v-nexon-ev', name: 'Tata Nexon EV', vehicleNumber: 'MH-01-EX-1234', batteryId: 'BAT-NEXON-001', driverName: 'Rajesh Kumar', location: 'Mumbai, MH', lat: 19.076, lng: 72.877, speed: 0, charging: true, batteryPct: 87, soh: 94.2, soc: 87.3, voltage: 376.5, current: 45.2, power: 17.0, temp: 31.2, estRange: 312, rul: 1850, health: 'Excellent', alerts: 0, lastSync: 'Just now', manufacturer: 'Tata Motors', model: 'Nexon EV Max', year: '2024', vin: 'TATAEVNEXON2024XXXXX', owner: 'Tata Motors Fleet', gps: '19.076°N, 72.877°E', route: 'Mumbai-Pune Highway', odometer: 15420, image: null },
  { id: 'v-punch-ev', name: 'Tata Punch EV', vehicleNumber: 'MH-02-PU-5678', batteryId: 'BAT-PUNCH-001', driverName: 'Sunil Patel', location: 'Pune, MH', lat: 18.520, lng: 73.856, speed: 65, charging: false, batteryPct: 62, soh: 96.8, soc: 62.1, voltage: 368.2, current: -35.8, power: -13.2, temp: 28.5, estRange: 198, rul: 1920, health: 'Excellent', alerts: 0, lastSync: '2s ago', manufacturer: 'Tata Motors', model: 'Punch EV LR', year: '2024', vin: 'TATAEVPUNCH2024XXXXX', owner: 'Tata Motors Fleet', gps: '18.520°N, 73.856°E', route: 'Pune-Nashik Road', odometer: 8930, image: null },
  { id: 'v-xuv400', name: 'Mahindra XUV400', vehicleNumber: 'GJ-01-XU-9012', batteryId: 'BAT-XUV-001', driverName: 'Amit Shah', location: 'Ahmedabad, GJ', lat: 23.022, lng: 72.571, speed: 0, charging: true, batteryPct: 45, soh: 91.5, soc: 45.0, voltage: 358.1, current: 52.0, power: 18.6, temp: 33.8, estRange: 142, rul: 1720, health: 'Excellent', alerts: 0, lastSync: '5s ago', manufacturer: 'Mahindra', model: 'XUV400 EL Pro', year: '2023', vin: 'MAHXUV4002023XXXXX', owner: 'Mahindra EV Fleet', gps: '23.022°N, 72.571°E', route: 'Ahmedabad-Vadodara Expressway', odometer: 22100, image: null },
  { id: 'v-mg-zsev', name: 'MG ZS EV', vehicleNumber: 'KA-01-MG-3456', batteryId: 'BAT-MGZS-001', driverName: 'Priya Sharma', location: 'Bangalore, KA', lat: 12.971, lng: 77.594, speed: 45, charging: false, batteryPct: 78, soh: 93.0, soc: 78.2, voltage: 372.8, current: -28.4, power: -10.6, temp: 29.1, estRange: 268, rul: 1790, health: 'Excellent', alerts: 1, lastSync: '1s ago', manufacturer: 'MG Motors', model: 'ZS EV Essence', year: '2024', vin: 'MGZSBEV2024XXXXXX', owner: 'MG Fleet India', gps: '12.971°N, 77.594°E', route: 'Bangalore-Mysore Road', odometer: 12500, image: null },
  { id: 'v-byd-atto3', name: 'BYD Atto 3', vehicleNumber: 'DL-01-BY-7890', batteryId: 'BAT-BYD-001', driverName: 'Vikram Singh', location: 'Delhi, DL', lat: 28.704, lng: 77.102, speed: 0, charging: false, batteryPct: 23, soh: 97.2, soc: 23.0, voltage: 345.6, current: 0, power: 0, temp: 26.4, estRange: 72, rul: 1950, health: 'Excellent', alerts: 0, lastSync: '30s ago', manufacturer: 'BYD', model: 'Atto 3 Advanced', year: '2024', vin: 'BYDATTO32024XXXXX', owner: 'BYD Fleet Services', gps: '28.704°N, 77.102°E', route: 'Delhi-Noida-Delhi', odometer: 6800, image: null },
  { id: 'v-ola-s1', name: 'Ola Electric S1', vehicleNumber: 'KA-03-OL-1122', batteryId: 'BAT-OLA-001', driverName: 'Karthik Nair', location: 'Kochi, KL', lat: 9.931, lng: 76.267, speed: 38, charging: false, batteryPct: 56, soh: 88.4, soc: 56.0, voltage: 112.5, current: -18.2, power: -2.0, temp: 34.2, estRange: 84, rul: 1450, health: 'Good', alerts: 2, lastSync: '3s ago', manufacturer: 'Ola Electric', model: 'S1 Pro', year: '2023', vin: 'OLAELECTRIC2023XXXX', owner: 'Ola Fleet', gps: '9.931°N, 76.267°E', route: 'Kochi City Route', odometer: 18500, image: null },
  { id: 'v-ather-450x', name: 'Ather 450X', vehicleNumber: 'TN-01-AT-3344', batteryId: 'BAT-ATHER-001', driverName: 'Divya R', location: 'Chennai, TN', lat: 13.082, lng: 80.270, speed: 52, charging: false, batteryPct: 41, soh: 90.6, soc: 41.0, voltage: 108.8, current: -22.5, power: -2.4, temp: 30.8, estRange: 62, rul: 1620, health: 'Excellent', alerts: 0, lastSync: '1s ago', manufacturer: 'Ather Energy', model: '450X Pro', year: '2024', vin: 'ATHER450X2024XXXXX', owner: 'Ather Fleet', gps: '13.082°N, 80.270°E', route: 'Chennai-Bangalore Highway', odometer: 11200, image: null },
  { id: 'v-tvs-iqube', name: 'TVS iQube', vehicleNumber: 'KA-05-TV-5566', batteryId: 'BAT-TVSIQ-001', driverName: 'Ravi K', location: 'Hyderabad, TS', lat: 17.385, lng: 78.486, speed: 0, charging: true, batteryPct: 35, soh: 87.1, soc: 35.0, voltage: 106.2, current: 8.5, power: 0.9, temp: 32.5, estRange: 48, rul: 1380, health: 'Good', alerts: 1, lastSync: '10s ago', manufacturer: 'TVS Motors', model: 'iQube S', year: '2023', vin: 'TVSIQUBE2023XXXXX', owner: 'TVS Fleet', gps: '17.385°N, 78.486°E', route: 'Hyderabad City', odometer: 20100, image: null },
];

const MANUFACTURER_GRADIENTS: Record<string, string> = {
  'Tata Motors': 'from-blue-600 to-blue-800',
  'Mahindra': 'from-red-600 to-red-800',
  'MG Motors': 'from-orange-600 to-orange-800',
  'BYD': 'from-green-600 to-green-800',
  'Ola Electric': 'from-purple-600 to-purple-800',
  'Ather Energy': 'from-amber-600 to-amber-800',
  'TVS Motors': 'from-violet-600 to-violet-800',
};

function latLngToMapXY(lat: number, lng: number): { x: number; y: number } {
  const minLat = 6.5;
  const maxLat = 37.5;
  const minLng = 66.0;
  const maxLng = 98.0;
  const mapWidth = 500;
  const mapHeight = 550;
  const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
  const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
  return { x, y };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const chartTooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={chartTooltipStyle} className="p-3 shadow-xl">
        <p className="text-dark-400 text-xs mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function CountUp({ value, suffix = '', decimals = 1, duration = 800 }: { value: number; suffix?: string; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = performance.now();
    const from = 0;
    const to = value;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(from + (to - from) * progress);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

function LiveIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      LIVE
    </span>
  );
}

function TrendArrow({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

const alertTypes = [
  { severity: 'critical', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical' },
  { severity: 'warning', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Warning' },
  { severity: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Info' },
];

const sampleAlerts = [
  { id: 'a1', type: 'Overheat', severity: 'critical', title: 'Cell Temperature Spike', description: 'Cell #4 temperature exceeded 45°C threshold', timestamp: Date.now() - 30000, resolved: false },
  { id: 'a2', type: 'Voltage Spike', severity: 'critical', title: 'Voltage Anomaly Detected', description: 'Pack voltage exceeded 4.25V/cell', timestamp: Date.now() - 120000, resolved: false },
  { id: 'a3', type: 'Current Spike', severity: 'warning', title: 'High Discharge Current', description: 'Discharge current peaked at 180A', timestamp: Date.now() - 300000, resolved: false },
  { id: 'a4', type: 'Low Battery', severity: 'warning', title: 'Low State of Charge', description: 'SOC dropped below 25%', timestamp: Date.now() - 600000, resolved: true },
  { id: 'a5', type: 'Communication Loss', severity: 'info', title: 'BMS Communication Interrupted', description: 'Brief connectivity loss with BMS module', timestamp: Date.now() - 1800000, resolved: true },
  { id: 'a6', type: 'Charging Fault', severity: 'critical', title: 'Charging Session Aborted', description: 'Charging stopped due to ground fault', timestamp: Date.now() - 3600000, resolved: true },
  { id: 'a7', type: 'Cell Imbalance', severity: 'warning', title: 'Cell Voltage Mismatch', description: 'Cells #2, #7 voltage difference > 50mV', timestamp: Date.now() - 7200000, resolved: false },
  { id: 'a8', type: 'Insulation Fault', severity: 'critical', title: 'Low Insulation Resistance', description: 'Insulation resistance below 500Ω/V', timestamp: Date.now() - 14400000, resolved: true },
];

function generateCellData(baseVoltage: number, baseTemp: number, count: number = 12) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    voltage: baseVoltage / (count / 3) + (Math.random() - 0.5) * 0.3,
    temperature: baseTemp + (Math.random() - 0.5) * 8,
    resistance: 0.8 + Math.random() * 1.2,
    health: 85 + Math.random() * 15,
    age: Math.floor(Math.random() * 18) + 3,
  }));
}

function getCellColor(temp: number, voltage: number): string {
  if (temp > 45 || voltage > 4.25 || voltage < 2.8) return 'bg-red-500';
  if (temp > 40 || voltage > 4.15 || voltage < 3.0) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getCellBorderColor(temp: number, voltage: number): string {
  if (temp > 45 || voltage > 4.25 || voltage < 2.8) return 'border-red-400';
  if (temp > 40 || voltage > 4.15 || voltage < 3.0) return 'border-yellow-400';
  return 'border-green-400';
}

export default function VehicleDetailsPage() {
  const { fleetId, vehicleId } = useParams<{ fleetId: string; vehicleId: string }>();
  const navigate = useNavigate();

  const vehicle = DEMO_VEHICLES.find(v => v.id === vehicleId);

  const [liveVoltage, setLiveVoltage] = useState(vehicle?.voltage ?? 0);
  const [liveCurrent, setLiveCurrent] = useState(vehicle?.current ?? 0);
  const [livePower, setLivePower] = useState(vehicle?.power ?? 0);
  const [liveTemp, setLiveTemp] = useState(vehicle?.temp ?? 0);
  const [liveSoc, setLiveSoc] = useState(vehicle?.soc ?? 0);
  const [liveSoh, setLiveSoh] = useState(vehicle?.soh ?? 0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [chartRange, setChartRange] = useState<'1m' | '5m' | '30m' | '1h' | '24h'>('5m');

  const rangeSeconds = useMemo(() => {
    const map: Record<string, number> = { '1m': 60, '5m': 300, '30m': 1800, '1h': 3600, '24h': 86400 };
    return map[chartRange] || 300;
  }, [chartRange]);

  const initialPoints = useMemo(() => {
    const points: any[] = [];
    const now = Date.now();
    const baseV = vehicle?.voltage ?? 350;
    const baseC = vehicle?.current ?? 0;
    const baseP = vehicle?.power ?? 0;
    const baseT = vehicle?.temp ?? 30;
    const baseSoc = vehicle?.soc ?? 50;
    const baseSoh = vehicle?.soh ?? 90;
    for (let i = 60; i >= 0; i--) {
      const ts = now - i * 1000;
      points.push({
        time: formatTime(ts),
        ts,
        voltage: baseV + (Math.random() - 0.5) * 4,
        current: baseC + (Math.random() - 0.5) * 3,
        power: baseP + (Math.random() - 0.5) * 1.5,
        temperature: baseT + (Math.random() - 0.5) * 1.5,
        soc: Math.max(0, Math.min(100, baseSoc + (Math.random() - 0.5) * 1)),
        soh: Math.max(0, Math.min(100, baseSoh + (Math.random() - 0.5) * 0.2)),
      });
    }
    return points;
  }, []);

  const [chartData, setChartData] = useState<any[]>(initialPoints);

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cells] = useState(() => generateCellData(vehicle?.voltage ?? 350, vehicle?.temp ?? 30, 12));

  const [showMapTooltip, setShowMapTooltip] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLiveVoltage(prev => prev + (Math.random() - 0.5) * 1.5);
      setLiveCurrent(prev => {
        const delta = (Math.random() - 0.5) * 2;
        if (vehicle.charging) return Math.max(0, prev + delta);
        return prev + delta;
      });
      setLivePower(prev => prev + (Math.random() - 0.5) * 0.8);
      setLiveTemp(prev => prev + (Math.random() - 0.5) * 0.3);
      setLiveSoc(prev => {
        const delta = vehicle.charging ? Math.random() * 0.05 : -Math.random() * 0.08;
        return Math.max(0, Math.min(100, prev + delta));
      });
      setLiveSoh(prev => Math.max(0, Math.min(100, prev - Math.random() * 0.002)));
      setLastUpdate(now);
      setChartData(prev => {
        const newPoint = {
          time: formatTime(now),
          ts: now,
          voltage: (vehicle.voltage || 350) + (Math.random() - 0.5) * 4,
          current: (vehicle.current || 0) + (Math.random() - 0.5) * 3,
          power: (vehicle.power || 0) + (Math.random() - 0.5) * 1.5,
          temperature: (vehicle.temp || 30) + (Math.random() - 0.5) * 1.5,
          soc: Math.max(0, Math.min(100, (vehicle.soc || 50) + (Math.random() - 0.5) * 1)),
          soh: Math.max(0, Math.min(100, (vehicle.soh || 90) + (Math.random() - 0.5) * 0.2)),
        };
        const cutoff = now - rangeSeconds * 1000;
        const filtered = [...prev, newPoint].filter(p => p.ts >= cutoff);
        return filtered.slice(-300);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [vehicle, rangeSeconds]);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Vehicle Not Found</h2>
          <p className="text-dark-400">No vehicle with ID "{vehicleId}" exists in fleet "{fleetId}".</p>
          <button
            onClick={() => navigate('/fleet')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fleet
          </button>
        </div>
      </div>
    );
  }

  const predictedRange = liveSoc * 3.5;
  const avgConsumption = vehicle.odometer > 0 ? (vehicle.odometer * 0.15) / (vehicle.odometer / 100) : 0;
  const energyToday = (vehicle.odometer * 0.15) / 100 * 0.4;
  const energyWeek = energyToday * 7;
  const energyMonth = energyToday * 30;
  const driveEfficiency = Math.min(100, (liveSoc / 100) * 95 + 5);
  const chargeEfficiency = Math.min(100, 92 + Math.random() * 5);

  const batteryHealthScore = liveSoh * 1.0;
  const thermalRisk = Math.min(100, Math.max(0, (liveTemp - 20) * 3.5));
  const failureProb = Math.min(100, Math.max(0, 100 - liveSoh * 0.8 + Math.random() * 5));
  const anomalyScore = Math.min(1, Math.max(0, (Math.random() * 0.2 + 0.05)));
  const fastChargeImpact = Math.min(100, Math.max(0, 100 - liveSoh * 0.6 + Math.random() * 10));
  const recommendedSpeed = vehicle.charging ? 0 : Math.min(80, Math.max(30, liveSoc * 0.6 + 20));
  const recommendedChargeMin = vehicle.charging ? Math.max(15, Math.round((100 - liveSoc) / 15 * 60)) : 0;
  const maintenanceRec = liveTemp > 38
    ? 'Schedule cooling system inspection urgently'
    : liveSoh < 85
      ? 'Consider battery replacement planning'
      : 'Routine maintenance in good standing';

  const chargerLocations = useMemo(() => {
    const baseLat = vehicle.lat;
    const baseLng = vehicle.lng;
    return Array.from({ length: 4 }, (_, i) => ({
      id: `ch-${i}`,
      name: ['Tata Power EZ', 'ChargeZone', 'Zeon', 'Fortum'][i],
      lat: baseLat + (Math.random() - 0.5) * 0.08,
      lng: baseLng + (Math.random() - 0.5) * 0.08,
      available: Math.random() > 0.3,
    }));
  }, []);

  const serviceCenters = useMemo(() => {
    const baseLat = vehicle.lat;
    const baseLng = vehicle.lng;
    return Array.from({ length: 3 }, (_, i) => ({
      id: `sc-${i}`,
      name: ['Service Center A', 'Service Center B', 'Service Center C'][i],
      lat: baseLat + (Math.random() - 0.5) * 0.12,
      lng: baseLng + (Math.random() - 0.5) * 0.12,
    }));
  }, []);

  const travelHistory = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      lat: vehicle.lat + (Math.random() - 0.5) * 0.05 * (i / 20),
      lng: vehicle.lng + (Math.random() - 0.5) * 0.05 * (i / 20),
      ts: Date.now() - (20 - i) * 60000,
    }));
  }, []);

  const alerts = useMemo(() => {
    return [...sampleAlerts].sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const vehiclePos = latLngToMapXY(vehicle.lat, vehicle.lng);

  const manufacturer = vehicle.manufacturer || 'Tata Motors';
  const gradientClass = MANUFACTURER_GRADIENTS[manufacturer] || 'from-blue-600 to-blue-800';

  const chartZoomOptions: { label: string; value: '1m' | '5m' | '30m' | '1h' | '24h' }[] = [
    { label: '1 Min', value: '1m' },
    { label: '5 Min', value: '5m' },
    { label: '30 Min', value: '30m' },
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
  ];

  interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend?: number;
    color?: string;
    subtitle?: string;
  }

  function StatCard({ icon, label, value, trend, color = 'text-primary-500', subtitle }: StatCardProps) {
    return (
      <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-all hover:shadow-lg hover:shadow-primary-500/5 group">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-lg bg-dark-800 ${color}`}>{icon}</div>
          {trend !== undefined && <TrendArrow value={trend} />}
        </div>
        <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-lg font-bold font-mono">{value}</p>
        {subtitle && <p className="text-dark-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    );
  }

  function MiniChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
    const sliced = data.slice(-20);
    return (
      <div className="h-12 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sliced}>
            <defs>
              <linearGradient id={`minigrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#minigrad-${dataKey})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  function CircularGauge({ value, max, color, label, suffix = '%' }: { value: number; max: number; color: string; label: string; suffix?: string }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, (value / max) * 100);
    const offset = circumference - (pct / 100) * circumference;
    return (
      <div className="flex flex-col items-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text x="50" y="48" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
            {value.toFixed(0)}{suffix}
          </text>
          <text x="50" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">{label}</text>
        </svg>
      </div>
    );
  }

  const selectedCellData = selectedCell !== null ? cells[selectedCell - 1] : null;

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* TOAST */}
      {toastVisible && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className="bg-dark-800 border border-dark-600 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className={`w-full lg:w-64 h-48 lg:h-auto bg-gradient-to-br ${gradientClass} flex items-center justify-center relative`}>
            <Car className="w-20 h-20 text-white/30" />
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                {vehicle.charging ? '⚡ Charging' : vehicle.speed > 0 ? '🚗 Moving' : '🅿️ Parked'}
              </span>
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <button
                    onClick={() => navigate('/fleet')}
                    className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl font-bold text-white">{vehicle.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.health === 'Excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    vehicle.health === 'Good' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {vehicle.health}
                  </span>
                  <LiveIndicator />
                </div>
                <p className="text-dark-400 text-sm flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white">{vehicle.vehicleNumber}</span>
                  <span className="text-dark-600">|</span>
                  <span>VIN: {vehicle.vin}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Downloading vehicle report...')}
                  className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('Sharing vehicle details...')}
                  className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('Opening full screen...')}
                  className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Manufacturer</p>
                <p className="text-white font-medium">{vehicle.manufacturer}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Model</p>
                <p className="text-white font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Year</p>
                <p className="text-white font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Owner</p>
                <p className="text-white font-medium">{vehicle.owner}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Driver</p>
                <p className="text-white font-medium">{vehicle.driverName}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">GPS</p>
                <p className="text-white font-medium font-mono text-xs">{vehicle.gps}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Route</p>
                <p className="text-white font-medium">{vehicle.route}</p>
              </div>
              <div>
                <p className="text-dark-500 text-xs uppercase tracking-wider">Odometer</p>
                <p className="text-white font-medium font-mono">{vehicle.odometer.toLocaleString()} km</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE BATTERY MONITOR */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Battery className="w-5 h-5 text-primary-500" />
            Live Battery Monitor
            <LiveIndicator />
          </h2>
          <div className="flex items-center gap-3 text-xs text-dark-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago</span>
            <span className="w-1 h-1 rounded-full bg-dark-600" />
            <span>Battery ID: {vehicle.batteryId}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          <StatCard icon={<Zap className="w-4 h-4" />} label="Voltage" value={`${liveVoltage.toFixed(1)} V`} trend={(Math.random() - 0.5) * 2} color="text-green-400" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Current" value={`${liveCurrent.toFixed(1)} A`} trend={(Math.random() - 0.5) * 2} color="text-blue-400" />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Power" value={`${livePower.toFixed(1)} kW`} trend={(Math.random() - 0.5) * 1.5} color="text-purple-400" />
          <StatCard icon={<Thermometer className="w-4 h-4" />} label="Temperature" value={`${liveTemp.toFixed(1)} °C`} trend={(Math.random() - 0.5) * 1} color="text-orange-400" />
          <StatCard icon={<Battery className="w-4 h-4" />} label="SOC" value={`${liveSoc.toFixed(1)}%`} trend={vehicle.charging ? 0.05 : -0.08} color="text-cyan-400" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="SOH" value={`${liveSoh.toFixed(1)}%`} trend={-0.002} color="text-violet-400" />
          <StatCard icon={<Gauge className="w-4 h-4" />} label="Cycle Count" value={`${vehicle.rul > 1000 ? '1.2k' : vehicle.rul}`} color="text-pink-400" />
          <StatCard icon={<Battery className="w-4 h-4" />} label="State" value={vehicle.charging ? 'Charging' : vehicle.speed > 0 ? 'Discharging' : 'Idle'} color={vehicle.charging ? 'text-green-400' : 'text-yellow-400'} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Charge Speed" value={vehicle.charging ? `${(Math.random() * 5 + 12).toFixed(1)} kW` : '0 kW'} color="text-green-400" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Battery Age" value={`${Math.floor(Math.random() * 12 + 6)} months`} color="text-dark-300" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Remaining Life" value={`${vehicle.rul} cycles`} trend={-0.5} color="text-emerald-400" />
          <StatCard icon={<Gauge className="w-4 h-4" />} label="Est. Range" value={`${(vehicle.estRange * (liveSoc / 100)).toFixed(0)} km`} trend={(Math.random() - 0.5) * 2} color="text-sky-400" />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Health Score" value={`${(liveSoh * 0.98 + 2).toFixed(1)}%`} color="text-green-400" />
          <StatCard icon={<Battery className="w-4 h-4" />} label="Cell Balance" value={`${(92 + Math.random() * 6).toFixed(1)}%`} color="text-teal-400" />
        </div>
      </div>

      {/* LIVE CHARTS - 6 CHARTS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Live Charts
            <LiveIndicator />
          </h2>
          <div className="flex items-center gap-1.5 bg-dark-900 border border-dark-700 rounded-lg p-1">
            {chartZoomOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setChartRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartRange === opt.value
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Voltage Chart */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" /> Voltage
              </h3>
              <span className="text-green-400 text-xs font-mono">{liveVoltage.toFixed(1)}V</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="voltGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="voltage" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 2, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Chart */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Current
              </h3>
              <span className="text-blue-400 text-xs font-mono">{liveCurrent.toFixed(1)}A</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="current" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#60a5fa', strokeWidth: 2, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Power Chart */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> Power
              </h3>
              <span className="text-purple-400 text-xs font-mono">{livePower.toFixed(1)}kW</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="powGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="power" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#a855f7', strokeWidth: 2, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature Chart */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" /> Temperature
              </h3>
              <span className="text-orange-400 text-xs font-mono">{liveTemp.toFixed(1)}°C</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#f97316', strokeWidth: 2, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SOC Chart */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Battery className="w-4 h-4 text-cyan-400" /> SOC
              </h3>
              <span className="text-cyan-400 text-xs font-mono">{liveSoc.toFixed(1)}%</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="soc" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2, fill: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SOH History */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" /> SOH History
              </h3>
              <span className="text-violet-400 text-xs font-mono">{liveSoh.toFixed(1)}%</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="soh" stroke="#8b5cf6" strokeWidth={2} fill="url(#sohGrad)" dot={false} activeDot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2, fill: '#0f172a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* RANGE ANALYSIS */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary-500" />
            Range Analysis
          </h2>
          <span className="text-dark-400 text-xs">Real-time calculation</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Current Range</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={vehicle.estRange * (liveSoc / 100)} suffix=" km" decimals={0} />
            </p>
            <MiniChart data={chartData} dataKey="soc" color="#22c55e" />
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Predicted Range</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={predictedRange} suffix=" km" decimals={0} />
            </p>
            <div className="mt-3 w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (predictedRange / 400) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Avg Consumption</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={avgConsumption || 150} suffix=" Wh/km" decimals={0} />
            </p>
            <div className="mt-3 w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, ((avgConsumption || 150) / 250) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Energy Today</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={energyToday} suffix=" kWh" decimals={1} />
            </p>
            <MiniChart data={chartData} dataKey="power" color="#a855f7" />
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Energy This Week</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={energyWeek} suffix=" kWh" decimals={1} />
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
              </div>
              <span className="text-dark-400 text-xs">45%</span>
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Energy This Month</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={energyMonth} suffix=" kWh" decimals={1} />
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '62%' }} />
              </div>
              <span className="text-dark-400 text-xs">62%</span>
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Driving Efficiency</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={driveEfficiency} suffix="%" decimals={0} />
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${driveEfficiency}%` }} />
              </div>
              <span className="text-emerald-400 text-xs">{driveEfficiency.toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Charging Efficiency</p>
            <p className="text-3xl font-bold text-white font-mono">
              <CountUp value={chargeEfficiency} suffix="%" decimals={0} />
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${chargeEfficiency}%` }} />
              </div>
              <span className="text-teal-400 text-xs">{chargeEfficiency.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary-500" />
            AI Insights
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">AI Powered</span>
          </h2>
          <span className="text-dark-400 text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Updated in real-time
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="flex flex-col items-center">
            <CircularGauge value={batteryHealthScore} max={100} color={batteryHealthScore > 80 ? '#22c55e' : batteryHealthScore > 60 ? '#eab308' : '#ef4444'} label="Battery Health" />
            <p className="text-dark-400 text-xs mt-2">Confidence: 96%</p>
          </div>
          <div className="flex flex-col items-center">
            <CircularGauge value={thermalRisk} max={100} color={thermalRisk < 40 ? '#22c55e' : thermalRisk < 70 ? '#eab308' : '#ef4444'} label="Thermal Risk" suffix="%" />
            <p className="text-dark-400 text-xs mt-2">Confidence: 88%</p>
          </div>
          <div className="flex flex-col items-center">
            <CircularGauge value={failureProb} max={100} color={failureProb < 20 ? '#22c55e' : failureProb < 50 ? '#eab308' : '#ef4444'} label="Failure Prob." suffix="%" />
            <p className="text-dark-400 text-xs mt-2">Confidence: 82%</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={anomalyScore > 0.5 ? '#ef4444' : anomalyScore > 0.2 ? '#eab308' : '#22c55e'} strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - anomalyScore)}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text x="50" y="48" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                  {anomalyScore.toFixed(2)}
                </text>
                <text x="50" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Anomaly</text>
              </svg>
            </div>
            <p className="text-dark-400 text-xs mt-2">Confidence: 91%</p>
          </div>
          <div className="flex flex-col items-center">
            <CircularGauge value={Math.min(100, (vehicle.rul / 2000) * 100)} max={100} color={vehicle.rul > 1500 ? '#22c55e' : vehicle.rul > 800 ? '#eab308' : '#ef4444'} label="RUL" suffix="%" />
            <p className="text-dark-400 text-xs mt-2">{vehicle.rul} cycles remaining</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-dark-400 text-xs">Fast Charging Impact</span>
              <span className="text-xs font-medium text-orange-400">{fastChargeImpact.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${fastChargeImpact}%` }} />
            </div>
            <p className="text-dark-500 text-xs mt-1">Impact on battery degradation</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-dark-400 text-xs">Recommended Speed</span>
              <span className="text-xs font-medium text-green-400">{recommendedSpeed.toFixed(0)} km/h</span>
            </div>
            <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${(recommendedSpeed / 80) * 100}%` }} />
            </div>
            <p className="text-dark-500 text-xs mt-1">Optimal for battery life</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-dark-400 text-xs">Recommended Charging</span>
              <span className="text-xs font-medium text-cyan-400">{recommendedChargeMin} min</span>
            </div>
            <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (recommendedChargeMin / 120) * 100)}%` }} />
            </div>
            <p className="text-dark-500 text-xs mt-1">Optimal charging duration</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 col-span-1">
            <div className="flex items-start gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-dark-400 text-xs mb-1">Recommended Maintenance</p>
                <p className="text-white text-sm">{maintenanceRec}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
              Priority Suggestion
            </span>
          </div>
        </div>
      </div>

      {/* DIGITAL TWIN - INTERACTIVE BATTERY PACK */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-primary-500" />
            Digital Twin - Battery Pack
            <LiveIndicator />
          </h2>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-3">
              {cells.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => setSelectedCell(selectedCell === cell.id ? null : cell.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedCell === cell.id
                      ? 'border-primary-500 bg-dark-800 shadow-lg shadow-primary-500/20 scale-105'
                      : `${getCellBorderColor(cell.temperature, cell.voltage)} bg-dark-800/80 hover:bg-dark-800 hover:scale-102`
                  }`}
                >
                  <p className="text-xs text-dark-400 font-medium mb-1">Cell #{cell.id}</p>
                  <p className="text-white font-mono text-sm font-bold">{cell.voltage.toFixed(3)}V</p>
                  <p className="text-dark-400 font-mono text-xs">{cell.temperature.toFixed(1)}°C</p>
                  <div className={`w-full h-1.5 rounded-full mt-2 ${getCellColor(cell.temperature, cell.voltage)}`} />
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-dark-400">
              <span>4 columns x 3 rows — 12 cells</span>
              <span className="text-green-400">All cells operational</span>
            </div>
          </div>
          {selectedCellData && (
            <div className="w-full lg:w-80 bg-dark-800/80 border border-dark-600 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Cell #{selectedCellData.id} Detail</h3>
                <button onClick={() => setSelectedCell(null)} className="text-dark-400 hover:text-white transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <span className="text-dark-400 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" /> Cell Voltage
                  </span>
                  <span className="text-white font-mono font-medium">{selectedCellData.voltage.toFixed(3)} V</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <span className="text-dark-400 text-sm flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-400" /> Temperature
                  </span>
                  <span className="text-white font-mono font-medium">{selectedCellData.temperature.toFixed(1)} °C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <span className="text-dark-400 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" /> Internal Resistance
                  </span>
                  <span className="text-white font-mono font-medium">{selectedCellData.resistance.toFixed(2)} mΩ</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <span className="text-dark-400 text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-400" /> Cell Health
                  </span>
                  <span className="text-white font-mono font-medium">{selectedCellData.health.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <span className="text-dark-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Cell Age
                  </span>
                  <span className="text-white font-mono font-medium">{selectedCellData.age} months</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCellData.health > 85 ? 'bg-green-500' : selectedCellData.health > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${selectedCellData.health}%` }}
                  />
                </div>
                <p className="text-dark-400 text-xs mt-1 text-center">Overall Cell Health</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BATTERY PASSPORT */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            Battery Passport
          </h2>
          <button
            onClick={() => showToast('Downloading Battery Passport PDF...')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download Passport PDF
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Manufacturing Date</p>
            <p className="text-white font-medium">15 Jan 2024</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Manufacturer</p>
            <p className="text-white font-medium">{vehicle.manufacturer}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Chemistry</p>
            <p className="text-white font-medium">NMC622</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Capacity</p>
            <p className="text-white font-medium">{vehicle.model.includes('Nexon') ? '40.5' : vehicle.model.includes('Punch') ? '35.2' : vehicle.model.includes('XUV') ? '39.4' : '30.2'} kWh</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Serial Number</p>
            <p className="text-white font-mono text-sm">{vehicle.batteryId}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Warranty Expiry</p>
            <p className="text-white font-medium">14 Jan 2028</p>
            <p className="text-green-400 text-xs">Active</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Total Charges</p>
            <p className="text-white font-medium">{Math.floor(Math.random() * 200 + 50)}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Fast Charges</p>
            <p className="text-white font-medium">{Math.floor(Math.random() * 60 + 10)}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Deep Discharges</p>
            <p className="text-white font-medium">{Math.floor(Math.random() * 20 + 2)}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Carbon Footprint</p>
            <p className="text-white font-medium">{(Math.random() * 2000 + 3000).toFixed(0)} kg CO₂</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Recycling Score</p>
            <p className="text-white font-medium"><CountUp value={78 + Math.random() * 15} decimals={0} suffix="/100" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${78 + Math.random() * 15}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Second Life</p>
            <p className="text-white font-medium text-green-400">Eligible</p>
            <p className="text-dark-500 text-xs mt-0.5">Estimated 3-5 years remaining</p>
          </div>
        </div>
        <div className="mt-4 bg-dark-800/50 rounded-xl p-4 border border-dark-700">
          <p className="text-dark-500 text-xs uppercase tracking-wider mb-3">Maintenance History</p>
          <div className="space-y-2">
            {[
              { date: '12 Jun 2025', type: 'BMS Firmware Update', desc: 'Updated to v2.4.1' },
              { date: '28 Feb 2025', type: 'Cell Balancing', desc: 'Passive balancing performed' },
              { date: '05 Nov 2024', type: 'Coolant Replacement', desc: 'Battery coolant replaced' },
              { date: '20 Aug 2024', type: 'Connector Inspection', desc: 'High-voltage connectors inspected' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                <div>
                  <p className="text-white text-sm">{m.type}</p>
                  <p className="text-dark-500 text-xs">{m.desc}</p>
                </div>
                <span className="text-dark-400 text-xs">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PERFORMANCE ANALYTICS */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Performance Analytics
          </h2>
          <span className="text-dark-400 text-xs">This period</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Daily Distance</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={45 + Math.random() * 30} decimals={0} suffix=" km" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${40 + Math.random() * 40}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Weekly Distance</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={280 + Math.random() * 150} decimals={0} suffix=" km" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${50 + Math.random() * 30}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Monthly Distance</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={1200 + Math.random() * 500} decimals={0} suffix=" km" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${45 + Math.random() * 25}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Harsh Braking</p>
            <p className="text-2xl font-bold text-white font-mono">{Math.floor(Math.random() * 8 + 1)}</p>
            <p className="text-dark-500 text-xs">This week</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Rapid Accel.</p>
            <p className="text-2xl font-bold text-white font-mono">{Math.floor(Math.random() * 12 + 2)}</p>
            <p className="text-dark-500 text-xs">This week</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Idle Time</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={2 + Math.random() * 6} decimals={1} suffix=" hrs" /></p>
            <p className="text-dark-500 text-xs">Today</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Charging Time</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={1.5 + Math.random() * 3} decimals={1} suffix=" hrs" /></p>
            <p className="text-dark-500 text-xs">Today</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Avg Speed</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={25 + Math.random() * 20} decimals={0} suffix=" km/h" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${30 + Math.random() * 40}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Energy Efficiency</p>
            <p className="text-2xl font-bold text-white font-mono"><CountUp value={5 + Math.random() * 3} decimals={1} suffix=" km/kWh" /></p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${60 + Math.random() * 30}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* PREDICTIVE MAINTENANCE */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-500" />
            Predictive Maintenance
          </h2>
          <span className="text-dark-400 text-xs">AI-predicted schedule</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-dark-400 text-xs uppercase tracking-wider">Upcoming Service</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Medium</span>
            </div>
            <p className="text-white font-medium">Routine Maintenance</p>
            <p className="text-dark-400 text-sm font-mono">15 Aug 2025</p>
            <p className="text-dark-500 text-xs mt-1">In 37 days</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-dark-400 text-xs uppercase tracking-wider">Battery Replacement</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">Low</span>
            </div>
            <p className="text-white font-medium">Predicted: Mar 2028</p>
            <p className="text-dark-400 text-sm">~{Math.floor(vehicle.rul / 20)} months</p>
            <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(vehicle.rul / 2000) * 100}%` }} />
            </div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-dark-400 text-xs uppercase tracking-wider">Cooling Inspection</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Low</span>
            </div>
            <p className="text-white font-medium">22 Sep 2025</p>
            <p className="text-dark-400 text-sm">Every 6 months</p>
            <p className="text-dark-500 text-xs mt-1">Coolant level: OK</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-dark-400 text-xs uppercase tracking-wider">Connector Inspection</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Low</span>
            </div>
            <p className="text-white font-medium">10 Oct 2025</p>
            <p className="text-dark-400 text-sm">Every 3 months</p>
            <p className="text-dark-500 text-xs mt-1">Last: 10 Jul 2025</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-3">Recommended Maintenance Items</p>
            <ul className="space-y-2">
              {[
                'HV battery coolant replacement',
                'Cell balancing calibration',
                'BMS firmware update check',
                'High voltage connector torque check',
                'Insulation resistance test',
                'Thermal management system check',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-dark-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-3">Cost Estimation</p>
            <div className="space-y-3">
              {[
                { label: 'Routine Service', cost: 2500 },
                { label: 'Coolant Replacement', cost: 4500 },
                { label: 'Connector Service', cost: 1800 },
                { label: 'BMS Update', cost: 1200 },
                { label: 'Full Inspection', cost: 3500 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-dark-700 last:border-0">
                  <span className="text-dark-300 text-sm">{item.label}</span>
                  <span className="text-white font-mono text-sm">₹{item.cost.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-white font-semibold">Total Estimated</span>
                <span className="text-primary-400 font-mono font-semibold">₹13,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOCATION MAP */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-primary-500" />
            Live Location
            <LiveIndicator />
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-400">
              <Circle className="w-2.5 h-2.5 fill-green-400" /> Vehicle
            </span>
            <span className="flex items-center gap-1 text-green-500/70">
              <Circle className="w-2 h-2 fill-green-500/70" /> Charger
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <Circle className="w-2 h-2 fill-blue-400" /> Service
            </span>
            <span className="flex items-center gap-1 text-dark-400">
              <Circle className="w-2 h-2 fill-dark-400" /> Route
            </span>
          </div>
        </div>
        <div className="bg-dark-950 rounded-xl p-4 overflow-x-auto">
          <svg viewBox="0 0 500 550" className="w-full max-w-2xl mx-auto" style={{ minHeight: '320px' }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowStrong">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 170 20 C 160 30, 155 50, 160 70 C 165 85, 150 95, 145 110 C 138 128, 140 140, 135 155 C 128 175, 120 185, 115 200 C 108 218, 100 235, 105 250 C 108 262, 115 270, 120 280 C 128 295, 125 310, 130 325 C 135 340, 145 350, 155 365 C 162 378, 158 390, 165 405 C 172 420, 185 435, 200 445 C 215 455, 235 460, 250 458 C 268 455, 285 445, 295 435 C 308 422, 325 415, 338 405 C 350 395, 358 380, 370 365 C 380 352, 388 340, 395 325 C 402 310, 410 295, 405 280 C 400 265, 395 255, 390 240 C 385 225, 378 215, 372 200 C 365 185, 358 175, 355 160 C 350 140, 355 125, 360 110 C 365 95, 370 85, 365 70 C 360 55, 345 40, 330 30 C 315 22, 300 18, 285 15 C 270 12, 255 15, 240 18 C 225 22, 210 20, 195 22 C 185 24, 178 18, 170 20 Z"
              fill="none" stroke="#334155" strokeWidth="2" opacity="0.6"
            />
            <path
              d="M 285 15 C 288 35, 290 55, 282 75 C 275 92, 270 100, 265 118 C 258 140, 260 158, 255 178 C 250 195, 248 210, 245 228 C 242 245, 238 258, 235 275 C 230 295, 228 312, 225 330 C 222 348, 218 365, 215 382 C 212 400, 210 418, 208 435 C 206 450, 210 460, 200 445 C 185 435, 172 420, 165 405 C 158 390, 162 378, 155 365 C 145 350, 135 340, 130 325 C 125 310, 128 295, 120 280 C 115 270, 108 262, 105 250 C 100 235, 108 218, 115 200 C 120 185, 128 175, 135 155 C 140 140, 138 128, 145 110 C 150 95, 165 85, 160 70 C 155 50, 160 30, 170 20 C 178 18, 185 24, 195 22 C 210 20, 225 22, 240 18 C 255 15, 270 12, 285 15 Z"
              fill="#1e293b" opacity="0.3"
            />
            {travelHistory.map((point, i) => {
              const { x, y } = latLngToMapXY(point.lat, point.lng);
              return (
                <circle key={i} cx={x} cy={y} r={i === travelHistory.length - 1 ? 1 : 1.5}
                  fill={i === travelHistory.length - 1 ? '#3b82f6' : '#334155'}
                  opacity={i === travelHistory.length - 1 ? 0.8 : 0.3 + (i / travelHistory.length) * 0.4}
                />
              );
            })}
            {travelHistory.length > 1 && (
              <polyline
                points={travelHistory.map(p => {
                  const { x, y } = latLngToMapXY(p.lat, p.lng);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" strokeDasharray="3,3"
              />
            )}
            <circle cx={vehiclePos.x} cy={vehiclePos.y} r={8} fill="#3b82f6" opacity={0.2} filter="url(#glowStrong)" />
            <circle cx={vehiclePos.x} cy={vehiclePos.y} r={5} fill="#3b82f6" filter="url(#glow)">
              <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={vehiclePos.x} cy={vehiclePos.y} r={2.5} fill="#fff" />
            <text x={vehiclePos.x + 10} y={vehiclePos.y - 5} fill="#60a5fa" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
              {vehicle.vehicleNumber}
            </text>
            {chargerLocations.map((ch) => {
              const { x, y } = latLngToMapXY(ch.lat, ch.lng);
              return (
                <g key={ch.id} onMouseEnter={() => setShowMapTooltip(ch.id)} onMouseLeave={() => setShowMapTooltip(null)}>
                  <circle cx={x} cy={y} r={4} fill={ch.available ? '#22c55e' : '#64748b'} opacity={0.8} filter="url(#glow)" />
                  <text x={x + 6} y={y + 2} fill="#94a3b8" fontSize="7" fontFamily="sans-serif">{ch.name}</text>
                  {showMapTooltip === ch.id && (
                    <g>
                      <rect x={x - 30} y={y - 28} width="60" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x={x} y={y - 16} textAnchor="middle" fill={ch.available ? '#22c55e' : '#ef4444'} fontSize="8" fontFamily="sans-serif">
                        {ch.available ? 'Available' : 'In Use'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {serviceCenters.map((sc) => {
              const { x, y } = latLngToMapXY(sc.lat, sc.lng);
              return (
                <g key={sc.id}>
                  <circle cx={x} cy={y} r={3} fill="#60a5fa" opacity={0.8} filter="url(#glow)" />
                  <text x={x + 5} y={y + 2} fill="#94a3b8" fontSize="7" fontFamily="sans-serif">{sc.name}</text>
                </g>
              );
            })}
            {[
              { city: 'Mumbai', lat: 19.076, lng: 72.877 },
              { city: 'Pune', lat: 18.520, lng: 73.856 },
              { city: 'Delhi', lat: 28.704, lng: 77.102 },
              { city: 'Bangalore', lat: 12.971, lng: 77.594 },
              { city: 'Chennai', lat: 13.082, lng: 80.270 },
              { city: 'Hyderabad', lat: 17.385, lng: 78.486 },
              { city: 'Ahmedabad', lat: 23.022, lng: 72.571 },
              { city: 'Kochi', lat: 9.931, lng: 76.267 },
            ].map((city) => {
              const { x, y } = latLngToMapXY(city.lat, city.lng);
              return (
                <g key={city.city}>
                  <circle cx={x} cy={y} r={1.5} fill="#64748b" opacity={0.5} />
                  <text x={x + 5} y={y + 3} fill="#64748b" fontSize="7" fontFamily="sans-serif">{city.city}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ALERTS TIMELINE */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary-500" />
            Alerts Timeline
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
            <span className="flex items-center gap-1 text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Warning</span>
            <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500" /> Info</span>
            <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> Resolved</span>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto space-y-0.5 pr-2 scrollbar-thin">
          {alerts.map((alert) => {
            const typeInfo = alertTypes.find(t => t.severity === alert.severity) || alertTypes[2];
            const AlertIcon = typeInfo.icon;
            const timeAgo = Date.now() - alert.timestamp;
            const minsAgo = Math.floor(timeAgo / 60000);
            const hoursAgo = Math.floor(timeAgo / 3600000);
            const timeStr = minsAgo < 1 ? 'Just now' : minsAgo < 60 ? `${minsAgo}m ago` : `${hoursAgo}h ago`;
            return (
              <div key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                  alert.resolved ? 'bg-dark-800/30 opacity-60' : `${typeInfo.bg} ${typeInfo.border} border`
                } hover:opacity-100`}
              >
                <div className={`p-1.5 rounded-full ${alert.resolved ? 'bg-green-500/20' : typeInfo.bg} flex-shrink-0 mt-0.5`}>
                  {alert.resolved
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    : <AlertIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium">{alert.title}</p>
                    <span className="text-dark-500 text-xs flex-shrink-0 ml-2">{timeStr}</span>
                  </div>
                  <p className="text-dark-400 text-xs mt-0.5">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-dark-500">{alert.type}</span>
                    {alert.resolved && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Resolved</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REPORTS */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Reports & Downloads
          </h2>
          <span className="text-dark-400 text-xs">Generate on-demand reports</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => showToast('Generating PDF Report...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-white text-sm font-medium">PDF Report</span>
            <span className="text-dark-500 text-xs">Full vehicle report</span>
          </button>
          <button
            onClick={() => showToast('Generating Excel Report...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <FileSpreadsheet className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-white text-sm font-medium">Excel Report</span>
            <span className="text-dark-500 text-xs">Data export</span>
          </button>
          <button
            onClick={() => showToast('Downloading Battery Passport...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-white text-sm font-medium">Battery Passport</span>
            <span className="text-dark-500 text-xs">PDF download</span>
          </button>
          <button
            onClick={() => showToast('Downloading Health Report...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Heart className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-white text-sm font-medium">Health Report</span>
            <span className="text-dark-500 text-xs">SOH analysis</span>
          </button>
          <button
            onClick={() => showToast('Downloading Maintenance Report...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <ClipboardCheck className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-white text-sm font-medium">Maintenance</span>
            <span className="text-dark-500 text-xs">Service history</span>
          </button>
          <button
            onClick={() => showToast('Downloading AI Prediction Report...')}
            className="flex flex-col items-center gap-3 p-5 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
          >
            <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-white text-sm font-medium">AI Prediction</span>
            <span className="text-dark-500 text-xs">ML insights</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #475569; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}

// Need Grid icon for Digital Twin section
function Grid(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
