import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FileText, Download, Share2, Car, Battery, Zap, Thermometer, Gauge, AlertTriangle,
  Activity, TrendingUp, CheckCircle, XCircle, AlertCircle, Info, CalendarDays,
  Shield, Cpu, Heart, BarChart3, FileSpreadsheet,
} from 'lucide-react';

const DEMO_VEHICLES = [
  { id: 'v-nexon-ev', name: 'Tata Nexon EV', vehicleNumber: 'MH-01-EX-1234', batteryId: 'BAT-NEXON-001', driverName: 'Rajesh Kumar', fleetName: 'Tata EV Fleet', manufacturer: 'Tata Motors', location: 'Mumbai, MH', soh: 94.2, soc: 87.3, voltage: 376.5, temp: 31.2, charging: true, estRange: 312, odometer: 15420, chargingSessions: 185, fastChargeCount: 42, cycleCount: 156, alerts: 0, health: 'Excellent', vin: 'TATAEVNEXON2024XXXXX', model: 'Nexon EV Max', year: 2024, capacity: 40.5, chemistry: 'NMC622', serial: 'SN-NEXON-001', warrantyExpiry: '2032-06-15', manufacturingDate: '2024-01-15', distanceToday: 45, distanceMonth: 1280, energyUsed: 185, avgConsumption: 145, efficiency: 89, avgSpeed: 42, chargingTime: 3.5, idleTime: 2.1, totalDistance: 15420 },
  { id: 'v-punch-ev', name: 'Tata Punch EV', vehicleNumber: 'MH-02-PU-5678', batteryId: 'BAT-PUNCH-001', driverName: 'Sunil Patel', fleetName: 'Tata EV Fleet', manufacturer: 'Tata Motors', location: 'Pune, MH', soh: 96.8, soc: 62.1, voltage: 368.2, temp: 28.5, charging: false, estRange: 198, odometer: 8930, chargingSessions: 98, fastChargeCount: 18, cycleCount: 89, alerts: 0, health: 'Excellent', vin: 'TATAEVPUNCH2024XXXXX', model: 'Punch EV LR', year: 2024, capacity: 35.0, chemistry: 'NMC622', serial: 'SN-PUNCH-001', warrantyExpiry: '2032-08-20', manufacturingDate: '2024-03-10', distanceToday: 62, distanceMonth: 890, energyUsed: 112, avgConsumption: 138, efficiency: 92, avgSpeed: 38, chargingTime: 2.8, idleTime: 3.5, totalDistance: 8930 },
  { id: 'v-xuv400', name: 'Mahindra XUV400', vehicleNumber: 'GJ-01-XU-9012', batteryId: 'BAT-XUV-001', driverName: 'Amit Shah', fleetName: 'Mahindra EV Fleet', manufacturer: 'Mahindra', location: 'Ahmedabad, GJ', soh: 91.5, soc: 45.0, voltage: 358.1, temp: 33.8, charging: true, estRange: 142, odometer: 22100, chargingSessions: 245, fastChargeCount: 78, cycleCount: 210, alerts: 0, health: 'Excellent', vin: 'MAHXUV4002023XXXXX', model: 'XUV400 EL Pro', year: 2023, capacity: 39.4, chemistry: 'NMC622', serial: 'SN-XUV-001', warrantyExpiry: '2031-11-30', manufacturingDate: '2023-09-05', distanceToday: 38, distanceMonth: 1560, energyUsed: 245, avgConsumption: 152, efficiency: 85, avgSpeed: 48, chargingTime: 4.2, idleTime: 1.8, totalDistance: 22100 },
  { id: 'v-mg-zsev', name: 'MG ZS EV', vehicleNumber: 'KA-01-MG-3456', batteryId: 'BAT-MGZS-001', driverName: 'Priya Sharma', fleetName: 'Tata EV Fleet', manufacturer: 'MG Motors', location: 'Bangalore, KA', soh: 93.0, soc: 78.2, voltage: 372.8, temp: 29.1, charging: false, estRange: 268, odometer: 12500, chargingSessions: 142, fastChargeCount: 35, cycleCount: 125, alerts: 1, health: 'Excellent', vin: 'MGZSBEV2024XXXXXX', model: 'ZS EV Essence', year: 2024, capacity: 44.5, chemistry: 'NMC622', serial: 'SN-MGZS-001', warrantyExpiry: '2032-05-18', manufacturingDate: '2024-02-20', distanceToday: 55, distanceMonth: 1100, energyUsed: 168, avgConsumption: 148, efficiency: 87, avgSpeed: 45, chargingTime: 3.0, idleTime: 2.5, totalDistance: 12500 },
  { id: 'v-byd-atto3', name: 'BYD Atto 3', vehicleNumber: 'DL-01-BY-7890', batteryId: 'BAT-BYD-001', driverName: 'Vikram Singh', fleetName: 'Mahindra EV Fleet', manufacturer: 'BYD', location: 'Delhi, DL', soh: 97.2, soc: 23.0, voltage: 345.6, temp: 26.4, charging: false, estRange: 72, odometer: 6800, chargingSessions: 72, fastChargeCount: 12, cycleCount: 62, alerts: 0, health: 'Excellent', vin: 'BYDATTO32024XXXXX', model: 'Atto 3 Advanced', year: 2024, capacity: 49.0, chemistry: 'LFP Blade', serial: 'SN-BYD-001', warrantyExpiry: '2032-10-10', manufacturingDate: '2024-05-01', distanceToday: 28, distanceMonth: 720, energyUsed: 98, avgConsumption: 135, efficiency: 94, avgSpeed: 35, chargingTime: 2.2, idleTime: 4.0, totalDistance: 6800 },
  { id: 'v-ola-s1', name: 'Ola Electric S1', vehicleNumber: 'KA-03-OL-1122', batteryId: 'BAT-OLA-001', driverName: 'Karthik Nair', fleetName: 'Ola Electric Fleet', manufacturer: 'Ola Electric', location: 'Kochi, KL', soh: 88.4, soc: 56.0, voltage: 112.5, temp: 34.2, charging: false, estRange: 84, odometer: 18500, chargingSessions: 320, fastChargeCount: 145, cycleCount: 280, alerts: 2, health: 'Good', vin: 'OLAELECTRIC2023XXXX', model: 'S1 Pro', year: 2023, capacity: 4.0, chemistry: 'LFP', serial: 'SN-OLA-001', warrantyExpiry: '2027-08-15', manufacturingDate: '2023-06-20', distanceToday: 42, distanceMonth: 980, energyUsed: 42, avgConsumption: 42, efficiency: 78, avgSpeed: 32, chargingTime: 1.5, idleTime: 1.2, totalDistance: 18500 },
  { id: 'v-ather-450x', name: 'Ather 450X', vehicleNumber: 'TN-01-AT-3344', batteryId: 'BAT-ATHER-001', driverName: 'Divya R', fleetName: 'Ola Electric Fleet', manufacturer: 'Ather Energy', location: 'Chennai, TN', soh: 90.6, soc: 41.0, voltage: 108.8, temp: 30.8, charging: false, estRange: 62, odometer: 11200, chargingSessions: 185, fastChargeCount: 52, cycleCount: 158, alerts: 0, health: 'Excellent', vin: 'ATHER450X2024XXXXX', model: '450X Pro', year: 2024, capacity: 3.7, chemistry: 'LFP', serial: 'SN-ATHER-001', warrantyExpiry: '2030-12-25', manufacturingDate: '2024-01-05', distanceToday: 35, distanceMonth: 850, energyUsed: 36, avgConsumption: 38, efficiency: 86, avgSpeed: 36, chargingTime: 1.8, idleTime: 0.8, totalDistance: 11200 },
  { id: 'v-tvs-iqube', name: 'TVS iQube', vehicleNumber: 'KA-05-TV-5566', batteryId: 'BAT-TVSIQ-001', driverName: 'Ravi K', fleetName: 'Ola Electric Fleet', manufacturer: 'TVS Motors', location: 'Hyderabad, TS', soh: 87.1, soc: 35.0, voltage: 106.2, temp: 32.5, charging: true, estRange: 48, odometer: 20100, chargingSessions: 290, fastChargeCount: 95, cycleCount: 245, alerts: 1, health: 'Good', vin: 'TVSIQUBE2023XXXXX', model: 'iQube S', year: 2023, capacity: 3.4, chemistry: 'NMC', serial: 'SN-TVSIQ-001', warrantyExpiry: '2027-06-30', manufacturingDate: '2023-04-12', distanceToday: 48, distanceMonth: 1050, energyUsed: 48, avgConsumption: 45, efficiency: 76, avgSpeed: 30, chargingTime: 2.0, idleTime: 1.5, totalDistance: 20100 },
];

const FLEETS = ['All Fleets', 'Tata EV Fleet', 'Mahindra EV Fleet', 'Ola Electric Fleet'];

const REPORT_TYPES = [
  'Battery Health Report', 'Vehicle Performance Report', 'Charging History Report',
  'Maintenance Report', 'Fault Analysis Report', 'AI Diagnostic Report', 'Complete Vehicle Report',
];

const detectedProblems = [
  { severity: 'warning', detectedAt: '2026-07-08 14:23', cause: 'Ambient temperature 38°C with sustained discharge', impact: 'Reduced battery life by ~2%', issue: 'High battery temperature detected (34.2°C)' },
  { severity: 'critical', detectedAt: '2026-07-07 09:15', cause: 'Cell manufacturing tolerance ±5mV', impact: 'Accelerated degradation of cell 12', issue: 'Voltage imbalance detected (42mV difference)' },
  { severity: 'warning', detectedAt: '2026-07-06 22:00', cause: 'Repeated fast charging cycles', impact: 'Capacity loss rate increased by 0.3%/month', issue: 'Fast charging frequency too high (78 times)' },
  { severity: 'info', detectedAt: '2026-07-05 16:45', cause: 'Normal calendar aging', impact: 'Efficiency dropped from 91% to 87%', issue: 'Battery efficiency reduced by 4%' },
  { severity: 'warning', detectedAt: '2026-07-04 11:30', cause: 'Coolant pump operating at 60% capacity', impact: 'Temperature during fast charge reaches 41°C', issue: 'Cooling system operating below efficiency' },
];

const solvedIssues = [
  { issue: 'Battery overheating', resolvedOn: '2026-06-14', fix: 'Cooling fan replaced' },
  { issue: 'Cell 8 voltage deviation', resolvedOn: '2026-06-10', fix: 'Cell balancing completed' },
  { issue: 'BMS communication error', resolvedOn: '2026-06-05', fix: 'Software updated' },
  { issue: 'Connector corrosion', resolvedOn: '2026-05-28', fix: 'Connector cleaned' },
  { issue: 'Charging profile mismatch', resolvedOn: '2026-05-20', fix: 'Charging profile optimized' },
];

const activeIssues = [
  { issue: 'Battery temperature slightly high (34.2°C)', recommendation: 'Reduce ambient temperature or limit discharge rate' },
  { issue: 'Fast charging degradation risk', recommendation: 'Reduce DC Fast Charging sessions' },
  { issue: 'Cooling system inspection required', recommendation: 'Schedule cooling system check within 7 days' },
  { issue: 'Cell voltage mismatch', recommendation: 'Perform cell balancing procedure' },
  { issue: 'Maintenance overdue by 9 days', recommendation: 'Schedule maintenance immediately' },
];

const aiRecommendations = [
  { recommendation: 'Avoid charging above 90% to extend battery life', priority: 'High', impact: '+15% cycle life' },
  { recommendation: 'Reduce DC Fast Charging to max 2 times per week', priority: 'High', impact: '+8% SOH retention' },
  { recommendation: 'Replace cooling fan within 30 days', priority: 'Medium', impact: 'Prevents thermal runaway risk' },
  { recommendation: 'Perform battery cell balancing', priority: 'Medium', impact: 'Improves voltage consistency' },
  { recommendation: 'Inspect Cell wiring harness', priority: 'Low', impact: 'Prevents future voltage faults' },
  { recommendation: 'Update BMS firmware to v3.2.1', priority: 'Low', impact: 'Improved SOC accuracy' },
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

function generateTrendData(days: number, base: number, variance: number, downward = false): { day: string; value: number }[] {
  const data: { day: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const trend = downward ? -i * 0.03 : 0;
    data.push({ day: label, value: +(base + (Math.random() - 0.5) * variance + trend).toFixed(1) });
  }
  return data;
}

function generateChargingHistory(count: number) {
  const types = ['DC Fast', 'AC Level 2', 'AC Level 1', 'DC Fast', 'AC Level 2'];
  const data: { date: string; startSoc: number; endSoc: number; type: string; duration: string; energyAdded: number; cost: number; temp: number }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const start = +(Math.random() * 60 + 10).toFixed(0);
    const end = +Math.min(100, start + Math.random() * 70 + 5).toFixed(0);
    const type = types[Math.floor(Math.random() * types.length)];
    const hrs = +(Math.random() * 4 + 0.5).toFixed(1);
    const energy = +((end - start) * 0.4 * (0.8 + Math.random() * 0.4)).toFixed(1);
    const cost = +(energy * (6 + Math.random() * 4)).toFixed(0);
    const temp = +(30 + Math.random() * 10).toFixed(1);
    data.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), startSoc: start, endSoc: end, type, duration: `${hrs}h`, energyAdded: energy, cost, temp });
  }
  return data;
}

function generateMaintenanceHistory(count: number) {
  const issues = ['Battery coolant replacement', 'BMS firmware update', 'Cell balancing', 'HV connector inspection', 'Thermal system check', 'Insulation test', 'SOH calibration', 'Charging port inspection', 'Battery pack cleaning', 'HV contactor replacement'];
  const repairs = ['Coolant flushed, replaced with new', 'Updated to v3.2.1', 'Balanced cells 2-8', 'Cleaned and retorqued', 'Fan assembly replaced', 'Passed at 2.2MΩ', 'Recalibrated BMS', 'Port pins cleaned', 'Debris removed, sealed', 'Contactor replaced'];
  const engineers = ['A. Sharma', 'R. Patel', 'S. Verma', 'P. Singh', 'M. Kumar', 'D. Nair', 'K. Rajan', 'V. Iyer', 'L. Das', 'N. Joshi'];
  const parts = ['Coolant 5L', 'Firmware chip', 'None', 'Connector gasket', 'Cooling fan', 'None', 'Calibration tool', 'Contact cleaner', 'Seal kit', 'HV contactor'];
  const costs = [4500, 0, 1200, 800, 3500, 2000, 1500, 500, 1000, 6500];
  const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed'];
  const data: { date: string; issue: string; repair: string; engineer: string; partsReplaced: string; status: string; cost: number }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 180 + 10));
    data.push({
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      issue: issues[i],
      repair: repairs[i],
      engineer: engineers[i],
      partsReplaced: parts[i],
      status: statuses[i],
      cost: costs[i],
    });
  }
  return data;
}

const alertHistoryData = [
  { date: '2026-07-08', severity: 'critical', icon: 'thermometer', description: 'Cell #4 temperature exceeded 48°C threshold', resolved: false },
  { date: '2026-07-07', severity: 'critical', icon: 'zap', description: 'Discharge current peaked at 185A', resolved: false },
  { date: '2026-07-06', severity: 'warning', icon: 'zap', description: 'Voltage spike > 4.25V on cell #7', resolved: false },
  { date: '2026-07-05', severity: 'warning', icon: 'battery', description: 'Cell #12 voltage dropped below 3.0V', resolved: false },
  { date: '2026-07-04', severity: 'medium', icon: 'cpu', description: 'BMS communication timeout (12s)', resolved: false },
  { date: '2026-07-03', severity: 'critical', icon: 'alert', description: 'Charging session aborted - ground fault', resolved: false },
  { date: '2026-06-28', severity: 'resolved', icon: 'check', description: 'Cell #9 low voltage anomaly', resolved: true },
];

const chartTooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
};

function CustomTooltip({ active, payload, label }: any) {
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
}

function StatCard({ icon, label, value, color = 'text-primary-500', subtitle }: { icon: React.ReactNode; label: string; value: string; color?: string; subtitle?: string }) {
  return (
    <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-all hover:shadow-lg hover:shadow-primary-500/5">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-dark-800 ${color}`}>{icon}</div>
      </div>
      <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-lg font-bold font-mono">{value}</p>
      {subtitle && <p className="text-dark-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[severity] || 'bg-dark-700 text-dark-300'}`}>
      {severity}
    </span>
  );
}

function ProgressBar({ value, color = 'bg-green-500', max = 100 }: { value: number; color?: string; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CircularGauge({ value, max, color, label, suffix = '%' }: { value: number; max: number; color: string; label: string; suffix?: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, (value / max) * 100);
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e293b" strokeWidth="7" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="45" y="44" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
          {value.toFixed(0)}{suffix}
        </text>
        <text x="45" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">{label}</text>
      </svg>
    </div>
  );
}

function AlertIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    thermometer: <Thermometer className="w-4 h-4" />,
    zap: <Zap className="w-4 h-4" />,
    battery: <Battery className="w-4 h-4" />,
    cpu: <Cpu className="w-4 h-4" />,
    alert: <AlertTriangle className="w-4 h-4" />,
    check: <CheckCircle className="w-4 h-4 text-green-400" />,
  };
  return <>{icons[icon] || <AlertTriangle className="w-4 h-4" />}</>;
}

export default function ReportsPage() {
  const [selectedFleet, setSelectedFleet] = useState('All Fleets');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-07-08');
  const [reportType, setReportType] = useState('Battery Health Report');
  const [generated, setGenerated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [chartRanges, setChartRanges] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const filteredVehicles = useMemo(() => {
    if (selectedFleet === 'All Fleets') return DEMO_VEHICLES;
    return DEMO_VEHICLES.filter(v => v.fleetName === selectedFleet);
  }, [selectedFleet]);

  const vehicle = useMemo(() => {
    return DEMO_VEHICLES.find(v => v.id === selectedVehicleId) || null;
  }, [selectedVehicleId]);

  const batteryId = vehicle?.batteryId || '';

  const chargingHistory = useMemo(() => generateChargingHistory(15), [generated]);
  const maintenanceHistory = useMemo(() => generateMaintenanceHistory(10), [generated]);

  const sohTrend = useMemo(() => generateTrendData(30, vehicle?.soh || 90, 2, true), [vehicle, generated]);
  const tempTrend = useMemo(() => generateTrendData(30, vehicle?.temp || 30, 3), [vehicle, generated]);
  const voltageTrend = useMemo(() => generateTrendData(30, vehicle?.voltage || 350, 10), [vehicle, generated]);
  const currentTrend = useMemo(() => generateTrendData(30, 25, 15), [generated]);
  const powerTrend = useMemo(() => generateTrendData(30, 12, 6), [generated]);
  const rangeTrend = useMemo(() => generateTrendData(30, vehicle?.estRange || 200, 30, true), [vehicle, generated]);
  const chargingBarData = useMemo(() => generateTrendData(14, 35, 20), [generated]);
  const consumptionAreaData = useMemo(() => generateTrendData(14, 28, 12), [generated]);

  const getRangeFiltered = (data: { day: string; value: number }[], range: string) => {
    const map: Record<string, number> = { '1m': 1, '5m': 2, '1h': 6, '24h': 10, '7d': 14, '30d': 30 };
    const count = map[range] || 30;
    return data.slice(-count);
  };

  const handleChartRange = (chartId: string, range: string) => {
    setChartRanges(prev => ({ ...prev, [chartId]: range }));
  };

  const getChartRange = (chartId: string) => chartRanges[chartId] || '30d';

  const timeRangeOptions = ['1m', '5m', '1h', '24h', '7d', '30d'];

  function TimeRangeToggle({ chartId }: { chartId: string }) {
    const current = getChartRange(chartId);
    return (
      <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-0.5">
        {timeRangeOptions.map(r => (
          <button
            key={r}
            onClick={() => handleChartRange(chartId, r)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              current === r ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    );
  }

  const renderChart = (id: string, title: string, icon: React.ReactNode, color: string, data: { day: string; value: number }[], type: 'line' | 'area' = 'line') => {
    const filtered = getRangeFiltered(data, getChartRange(id));
    return (
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">{icon} {title}</h3>
          <TimeRangeToggle chartId={id} />
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={filtered}>
                <defs>
                  <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${id})`} dot={{ r: 2, fill: color }} activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#0f172a' }} />
              </AreaChart>
            ) : (
              <LineChart data={filtered}>
                <defs>
                  <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#0f172a' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBarChart = (id: string, title: string, icon: React.ReactNode, color: string, data: { day: string; value: number }[]) => {
    const filtered = getRangeFiltered(data, getChartRange(id));
    return (
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">{icon} {title}</h3>
          <TimeRangeToggle chartId={id} />
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered}>
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={`url(#grad-${id})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAreaChart = (id: string, title: string, icon: React.ReactNode, color: string, data: { day: string; value: number }[]) => {
    const filtered = getRangeFiltered(data, getChartRange(id));
    return (
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">{icon} {title}</h3>
          <TimeRangeToggle chartId={id} />
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered}>
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${id})`} dot={{ r: 2, fill: color }} activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#0f172a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {toastVisible && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className="bg-dark-800 border border-dark-600 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm">{toast}</span>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Vehicle Reports</h1>
        <p className="text-dark-400 mt-1">Generate comprehensive vehicle and battery health reports</p>
      </div>

      {/* TOP FILTERS */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">Fleet</label>
            <select
              value={selectedFleet}
              onChange={(e) => { setSelectedFleet(e.target.value); setSelectedVehicleId(''); }}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
            >
              {FLEETS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">Vehicle</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
            >
              <option value="">Select Vehicle</option>
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} — {v.vehicleNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">Battery ID</label>
            <input
              type="text"
              value={batteryId}
              readOnly
              placeholder="Select a vehicle"
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white/70 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-medium uppercase tracking-wider mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
            >
              {REPORT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => { if (vehicle) { setGenerated(true); showToast('Report generated successfully'); } else { showToast('Please select a vehicle first'); } }}
              disabled={!vehicle}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Generate
            </button>
            <button
              onClick={() => showToast('Exporting PDF...')}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm transition-colors"
              title="Export PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Exporting Excel...')}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm transition-colors"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Report link copied to clipboard')}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm transition-colors"
              title="Share Report"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VEHICLE INFO HEADER */}
      {vehicle && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className={`w-full lg:w-64 h-48 lg:h-auto bg-gradient-to-br ${MANUFACTURER_GRADIENTS[vehicle.manufacturer] || 'from-blue-600 to-blue-800'} flex items-center justify-center relative`}>
              <Car className="w-20 h-20 text-white/30" />
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  {vehicle.charging ? '⚡ Charging' : '🅿️ Idle'}
                </span>
              </div>
            </div>
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-white">{vehicle.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.health === 'Excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>{vehicle.health}</span>
                  </div>
                  <p className="text-dark-400 text-sm">
                    <span className="font-mono font-bold text-white">{vehicle.vehicleNumber}</span>
                    <span className="mx-2 text-dark-600">|</span>
                    VIN: {vehicle.vin}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Manufacturer</p><p className="text-white font-medium">{vehicle.manufacturer}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Model</p><p className="text-white font-medium">{vehicle.model}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Year</p><p className="text-white font-medium">{vehicle.year}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Driver</p><p className="text-white font-medium">{vehicle.driverName}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Location</p><p className="text-white font-medium">{vehicle.location}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Chemistry</p><p className="text-white font-medium">{vehicle.chemistry}</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Capacity</p><p className="text-white font-medium">{vehicle.capacity} kWh</p></div>
                <div><p className="text-dark-500 text-xs uppercase tracking-wider">Odometer</p><p className="text-white font-medium font-mono">{vehicle.odometer.toLocaleString()} km</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT */}
      {generated && vehicle && (
        <>
          {/* 1. REPORT SUMMARY CARDS */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-primary-500" /> Report Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-5">
              <CircularGauge value={vehicle.health === 'Excellent' ? 95 : 82} max={100} color="#22c55e" label="Health Score" />
              <CircularGauge value={vehicle.soh} max={100} color="#8b5cf6" label="Battery Health" />
              <CircularGauge value={vehicle.soc} max={100} color="#06b6d4" label="Current SOC" />
              <CircularGauge value={vehicle.soh} max={100} color="#22c55e" label="Current SOH" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <StatCard icon={<Gauge className="w-4 h-4" />} label="Est. Range" value={`${vehicle.estRange} km`} color="text-sky-400" />
              <StatCard icon={<Thermometer className="w-4 h-4" />} label="Battery Temp" value={`${vehicle.temp}°C`} color="text-orange-400" />
              <StatCard icon={<Zap className="w-4 h-4" />} label="Charging" value={vehicle.charging ? 'Charging' : 'Idle'} color={vehicle.charging ? 'text-green-400' : 'text-yellow-400'} />
              <StatCard icon={<Gauge className="w-4 h-4" />} label="Total Distance" value={`${vehicle.totalDistance.toLocaleString()} km`} color="text-blue-400" />
              <StatCard icon={<Battery className="w-4 h-4" />} label="Charging Sessions" value={`${vehicle.chargingSessions}`} color="text-purple-400" />
              <StatCard icon={<Zap className="w-4 h-4" />} label="Fast Charges" value={`${vehicle.fastChargeCount}`} color="text-pink-400" />
              <StatCard icon={<Heart className="w-4 h-4" />} label="Cycle Count" value={`${vehicle.cycleCount}`} color="text-emerald-400" />
              <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" value={`${vehicle.alerts}`} color={vehicle.alerts > 0 ? 'text-red-400' : 'text-green-400'} />
            </div>
          </div>

          {/* 2. BATTERY HEALTH SECTION */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Battery className="w-5 h-5 text-primary-500" /> Battery Health
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">SOH</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{vehicle.soh}%</p>
                <ProgressBar value={vehicle.soh} color="bg-green-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Capacity Loss</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{(100 - vehicle.soh).toFixed(1)}%</p>
                <ProgressBar value={100 - vehicle.soh} color="bg-red-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Internal Resistance</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{(0.8 + Math.random() * 0.6).toFixed(2)} mΩ</p>
                <ProgressBar value={1.4} max={2.0} color="bg-yellow-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Voltage Balance</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{(15 + Math.random() * 30).toFixed(0)} mV</p>
                <ProgressBar value={25 + Math.random() * 20} max={80} color="bg-purple-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Temp Stability</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{(2 + Math.random() * 3).toFixed(1)}°C</p>
                <ProgressBar value={4} max={10} color="bg-orange-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Remaining Life</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{vehicle.cycleCount + Math.floor(Math.random() * 500 + 1000)} cycles</p>
                <ProgressBar value={vehicle.cycleCount} max={vehicle.cycleCount + 1500} color="bg-cyan-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Battery Age</p>
                <p className="text-2xl font-bold text-white font-mono mb-2">{Math.floor((Date.now() - new Date(vehicle.manufacturingDate).getTime()) / (30 * 24 * 60 * 60 * 1000))} months</p>
                <ProgressBar value={Math.floor((Date.now() - new Date(vehicle.manufacturingDate).getTime()) / (30 * 24 * 60 * 60 * 1000))} max={120} color="bg-blue-500" />
              </div>
            </div>
          </div>

          {/* 3. PERFORMANCE SECTION */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Gauge className="w-5 h-5 text-primary-500" /> Performance Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Distance Today</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.distanceToday} km</p>
                <ProgressBar value={vehicle.distanceToday} max={120} color="bg-green-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Distance This Month</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.distanceMonth} km</p>
                <ProgressBar value={vehicle.distanceMonth} max={3000} color="bg-blue-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Energy Used</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.energyUsed} kWh</p>
                <ProgressBar value={vehicle.energyUsed} max={400} color="bg-purple-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Avg Consumption</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.avgConsumption} Wh/km</p>
                <ProgressBar value={vehicle.avgConsumption} max={250} color="bg-yellow-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Efficiency</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.efficiency}%</p>
                <ProgressBar value={vehicle.efficiency} color="bg-emerald-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Avg Speed</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.avgSpeed} km/h</p>
                <ProgressBar value={vehicle.avgSpeed} max={80} color="bg-cyan-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Charging Time</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.chargingTime} hrs</p>
                <ProgressBar value={vehicle.chargingTime} max={8} color="bg-orange-500" />
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Idle Time</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.idleTime} hrs</p>
                <ProgressBar value={vehicle.idleTime} max={8} color="bg-slate-500" />
              </div>
            </div>
          </div>

          {/* 4. AI DIAGNOSTIC - PROBLEMS DETECTED */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Cpu className="w-5 h-5 text-primary-500" /> AI Diagnostic — Problems Detected
            </h2>
            <div className="space-y-3">
              {detectedProblems.map((p, i) => (
                <div key={i} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {p.severity === 'critical' ? <XCircle className="w-4 h-4 text-red-400" /> : p.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> : <Info className="w-4 h-4 text-blue-400" />}
                      <span className="text-white font-medium text-sm">{p.issue}</span>
                    </div>
                    <SeverityBadge severity={p.severity} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2">
                    <div><span className="text-dark-500 text-xs">Detected:</span> <span className="text-dark-300">{p.detectedAt}</span></div>
                    <div><span className="text-dark-500 text-xs">Cause:</span> <span className="text-dark-300">{p.cause}</span></div>
                    <div><span className="text-dark-500 text-xs">Impact:</span> <span className="text-dark-300">{p.impact}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. SOLVED ISSUES TIMELINE */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <CheckCircle className="w-5 h-5 text-green-400" /> Solved Issues Timeline
            </h2>
            <div className="space-y-0">
              {solvedIssues.map((s, i) => (
                <div key={i} className="flex gap-4 pb-4 relative">
                  {i < solvedIssues.length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-dark-700" />}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-0.5">
                      <span className="text-white font-medium text-sm">{s.issue}</span>
                      <span className="text-dark-500 text-xs">{s.resolvedOn}</span>
                    </div>
                    <p className="text-dark-400 text-xs">Fix: {s.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. CURRENT ACTIVE ISSUES */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-yellow-400" /> Current Active Issues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeIssues.map((a, i) => (
                <div key={i} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium mb-1">{a.issue}</p>
                      <p className="text-dark-400 text-xs">Recommendation: {a.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. AI RECOMMENDATIONS */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary-500" /> AI Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiRecommendations.map((r, i) => (
                <div key={i} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 hover:border-primary-500/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white text-sm font-medium flex-1">{r.recommendation}</span>
                    <SeverityBadge severity={r.priority} />
                  </div>
                  <p className="text-dark-400 text-xs">Impact: {r.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 8. PREDICTIONS SECTION */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary-500" /> Predictions & Forecast
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Remaining Life</p>
                <p className="text-2xl font-bold text-white font-mono">{vehicle.cycleCount + 1200} cycles</p>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Expected Replacement</p>
                <p className="text-lg font-bold text-white font-mono">2031-04-15</p>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Failure Probability</p>
                <p className="text-2xl font-bold text-white font-mono">{(100 - vehicle.soh * 0.8).toFixed(1)}%</p>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Thermal Risk</p>
                <p className="text-2xl font-bold text-white font-mono">{(vehicle.temp * 2.5 - 30).toFixed(0)}%</p>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">SOH in 30 Days</p>
                <p className="text-2xl font-bold text-white font-mono">{(vehicle.soh - 0.3).toFixed(1)}%</p>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 text-center">
                <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">SOH in 180 Days</p>
                <p className="text-2xl font-bold text-white font-mono">{(vehicle.soh - 1.8).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* 9. CHARGING HISTORY TABLE */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5 text-primary-500" /> Charging History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Date</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Start SOC</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">End SOC</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Type</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Duration</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Energy Added</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Cost</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {chargingHistory.map((row, i) => (
                    <tr key={i} className="border-b border-dark-800 hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 text-white">{row.date}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.startSoc}%</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.endSoc}%</td>
                      <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${row.type === 'DC Fast' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{row.type}</span></td>
                      <td className="py-2.5 px-3 text-dark-300">{row.duration}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.energyAdded} kWh</td>
                      <td className="py-2.5 px-3 text-dark-300">₹{row.cost}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.temp}°C</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 10. MAINTENANCE HISTORY TABLE */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <CalendarDays className="w-5 h-5 text-primary-500" /> Maintenance History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Date</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Issue</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Repair</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Engineer</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Parts</th>
                    <th className="text-left text-dark-400 font-medium py-2 px-3">Status</th>
                    <th className="text-right text-dark-400 font-medium py-2 px-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceHistory.map((row, i) => (
                    <tr key={i} className="border-b border-dark-800 hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 text-white">{row.date}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.issue}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.repair}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.engineer}</td>
                      <td className="py-2.5 px-3 text-dark-300">{row.partsReplaced}</td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">{row.status}</span></td>
                      <td className="py-2.5 px-3 text-dark-300 text-right">₹{row.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 11. ALERT HISTORY TIMELINE */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-primary-500" /> Alert History Timeline
            </h2>
            <div className="space-y-0">
              {alertHistoryData.map((a, i) => {
                const severityColor = a.severity === 'critical' ? 'text-red-400 border-red-500/30 bg-red-500/20' :
                  a.severity === 'warning' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/20' :
                  a.severity === 'medium' ? 'text-orange-400 border-orange-500/30 bg-orange-500/20' :
                  'text-green-400 border-green-500/30 bg-green-500/20';
                return (
                  <div key={i} className="flex gap-4 pb-4 relative">
                    {i < alertHistoryData.length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-dark-700" />}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center ${severityColor}`}>
                      <AlertIcon icon={a.icon} />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-3 mb-0.5 flex-wrap">
                        <span className="text-white font-medium text-sm">{a.description}</span>
                        <span className="text-dark-500 text-xs">{a.date}</span>
                        {a.resolved && <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Resolved</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12. CHARTS SECTION */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-primary-500" /> Charts & Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderChart('soh', 'Battery Health Trend', <Heart className="w-4 h-4 text-green-400" />, '#22c55e', sohTrend)}
              {renderChart('temp', 'Temperature Trend', <Thermometer className="w-4 h-4 text-orange-400" />, '#f97316', tempTrend)}
              {renderChart('voltage', 'Voltage Trend', <Zap className="w-4 h-4 text-blue-400" />, '#3b82f6', voltageTrend)}
              {renderChart('current', 'Current Trend', <Activity className="w-4 h-4 text-cyan-400" />, '#06b6d4', currentTrend)}
              {renderChart('power', 'Power Trend', <Zap className="w-4 h-4 text-purple-400" />, '#a855f7', powerTrend)}
              {renderChart('range', 'Range Trend', <Gauge className="w-4 h-4 text-green-400" />, '#22c55e', rangeTrend)}
              {renderBarChart('charging-bar', 'Charging Sessions', <Zap className="w-4 h-4 text-yellow-400" />, '#eab308', chargingBarData)}
              {renderAreaChart('consumption', 'Energy Consumption', <Activity className="w-4 h-4 text-red-400" />, '#ef4444', consumptionAreaData)}
            </div>
          </div>

          {/* 13. EXPORT SECTION */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Export Report</h2>
                <p className="text-dark-400 text-sm">Download or share this report</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast('PDF Report generated successfully')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> PDF Report
                </button>
                <button
                  onClick={() => showToast('Excel file exported successfully')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors border border-dark-600"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={() => showToast('Report shared via email')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors border border-dark-600"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!vehicle && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Car className="w-16 h-16 text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Select a Vehicle</h2>
          <p className="text-dark-400 max-w-md">Choose a fleet and vehicle from the filters above, then click "Generate Report" to view the complete vehicle report.</p>
        </div>
      )}
    </div>
  );
}
