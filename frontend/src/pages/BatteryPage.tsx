import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Battery,
  Thermometer,
  Activity,
  Zap,
  ArrowLeft,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';
import DigitalTwinView from '../components/DigitalTwin/DigitalTwinView';
import XAIExplanation from '../components/XAI/XAIExplanation';

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-dark-800 rounded-xl ${className}`}
    />
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-yellow-500'
        : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PredictionCard({
  label,
  value,
  unit,
  confidence,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  confidence: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-dark-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">
        {unit === '%' ? `${value.toFixed(1)}%` : unit === 'days' ? `${Math.round(value)} days` : value.toFixed(2)}
      </div>
      <div className="text-xs text-dark-500 mt-1">
        {(confidence * 100).toFixed(0)}% confidence
      </div>
      <ConfidenceBar confidence={confidence} />
    </div>
  );
}

function AlertRow({
  alert,
}: {
  alert: {
    id: string;
    type: string;
    severity: string;
    message: string;
    created_at: string;
  };
}) {
  const severityColor =
    alert.severity === 'critical'
      ? 'text-red-500 bg-red-500/20'
      : alert.severity === 'warning'
        ? 'text-yellow-500 bg-yellow-500/20'
        : 'text-blue-500 bg-blue-500/20';

  return (
    <div className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-dark-700">
      <div className={`p-2 rounded-lg ${severityColor}`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">
          {alert.message}
        </div>
        <div className="text-dark-500 text-xs mt-1">
          {alert.type} &middot;{' '}
          {new Date(alert.created_at).toLocaleString()}
        </div>
      </div>
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${severityColor}`}
      >
        {alert.severity}
      </span>
    </div>
  );
}

export default function BatteryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: battery, isLoading: batteryLoading } = useQuery({
    queryKey: ['battery', id],
    queryFn: () => api.getBatteryWithTelemetry(id!),
    enabled: !!id,
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictions', id],
    queryFn: () => api.getLatestPredictions(id!),
    enabled: !!id,
  });

  useQuery({
    queryKey: ['telemetryStats', id],
    queryFn: () => api.getTelemetryStats(id!, 24),
    enabled: !!id,
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', id],
    queryFn: () => api.getAlerts({ battery_id: id, page_size: 5 }),
    enabled: !!id,
  });

  const voltageHistory = useMemo(() => {
    const baseVoltage = battery?.nominal_voltage || 350;
    const soc = battery?.current_soc || 75;
    const points: { time: string; voltage: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const noise = (Math.random() - 0.5) * 4;
      const socFactor = (soc / 100) * 10;
      points.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        voltage: parseFloat((baseVoltage + socFactor + noise).toFixed(1)),
      });
    }
    return points;
  }, [battery?.nominal_voltage, battery?.current_soc]);

  const temperatureHistory = useMemo(() => {
    const baseTemp = battery?.temperature || 32;
    const points: { time: string; temp: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const noise = (Math.random() - 0.5) * 3;
      const cycleEffect = Math.sin((24 - i) / 24 * Math.PI * 2) * 1.5;
      points.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: parseFloat((baseTemp + noise + cycleEffect).toFixed(1)),
      });
    }
    return points;
  }, [battery?.temperature]);

  if (batteryLoading) {
    return (
      <div className="space-y-6">
        <SkeletonPulse className="h-16 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonPulse className="h-28" />
          <SkeletonPulse className="h-28" />
          <SkeletonPulse className="h-28" />
          <SkeletonPulse className="h-28" />
        </div>
        <SkeletonPulse className="h-64 w-full" />
        <SkeletonPulse className="h-80 w-full" />
      </div>
    );
  }

  if (!battery) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Battery className="w-12 h-12 text-dark-600" />
        <p className="text-dark-400 text-lg">Battery not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary-500 hover:text-primary-400 text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const telemetry = battery.latest_telemetry;
  const statusColor =
    battery.status === 'active'
      ? 'bg-green-500/20 text-green-500 border-green-500/30'
      : battery.status === 'maintenance'
        ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
        : battery.status === 'idle'
          ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
          : 'bg-red-500/20 text-red-500 border-red-500/30';

  const alerts = alertsData?.items || [];

  const pred = predictions as
    | {
        soh: { value: number; confidence: number; explanation?: string };
        soc: { value: number; confidence: number };
        rul: { value: number; confidence: number };
        thermal: { value: number; confidence: number };
        anomaly: { value: number; confidence: number };
        failure: { value: number; confidence: number };
      }
    | undefined;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-lg bg-dark-900 border border-dark-700 text-dark-400 hover:text-white hover:border-dark-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {battery.battery_id}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}
            >
              {battery.status}
            </span>
          </div>
          <p className="text-dark-400 mt-1">
            {battery.vehicle_name} &middot; {battery.manufacturer}{' '}
            {battery.model}
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Battery className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-dark-400 text-sm">SOC</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {telemetry?.soc ?? battery.current_soc ?? '--'}
            <span className="text-lg text-dark-400">%</span>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-dark-400 text-sm">SOH</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {telemetry?.soh ?? battery.current_soh ?? '--'}
            <span className="text-lg text-dark-400">%</span>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Thermometer className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-dark-400 text-sm">Temperature</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {telemetry?.temperature ?? battery.temperature ?? '--'}
            <span className="text-lg text-dark-400">°C</span>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-dark-400 text-sm">Power</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {telemetry?.power ?? '--'}
            <span className="text-lg text-dark-400">kW</span>
          </div>
        </div>
      </div>

      {/* Specs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Info */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Battery className="w-4 h-4 text-primary-500" />
            Battery Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-dark-500 text-xs mb-1">Chemistry</div>
              <div className="text-white text-sm font-medium">
                {battery.chemistry}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">Capacity</div>
              <div className="text-white text-sm font-medium">
                {battery.capacity_kwh} kWh
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Nominal Voltage
              </div>
              <div className="text-white text-sm font-medium">
                {battery.nominal_voltage}V
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">Max Current</div>
              <div className="text-white text-sm font-medium">
                {battery.max_current}A
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">Cycle Count</div>
              <div className="text-white text-sm font-medium">
                {battery.cycle_count ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Fast Charge Count
              </div>
              <div className="text-white text-sm font-medium">
                {battery.fast_charge_count ?? '--'}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-dark-500 text-xs mb-1">
                Remaining Useful Life
              </div>
              <div className="text-white text-sm font-medium">
                {battery.rul != null ? `${battery.rul} days` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Status */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            Location & Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="text-dark-500 text-xs mb-1">Location</div>
              <div className="text-white text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-dark-400" />
                {battery.location ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Manufacturing Date
              </div>
              <div className="text-white text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-dark-400" />
                {battery.manufacturing_date
                  ? new Date(battery.manufacturing_date).toLocaleDateString()
                  : '--'}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Installation Date
              </div>
              <div className="text-white text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-dark-400" />
                {battery.installation_date
                  ? new Date(battery.installation_date).toLocaleDateString()
                  : '--'}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Carbon Footprint
              </div>
              <div className="text-white text-sm font-medium">
                {battery.carbon_footprint_kg != null
                  ? `${battery.carbon_footprint_kg} kg CO₂`
                  : '--'}
              </div>
            </div>
            <div>
              <div className="text-dark-500 text-xs mb-1">
                Internal Resistance
              </div>
              <div className="text-white text-sm font-medium">
                {battery.internal_resistance != null
                  ? `${battery.internal_resistance} mΩ`
                  : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Digital Twin */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-500" />
          3D Digital Twin
        </h3>
        <DigitalTwinView batteryId={battery.battery_id} />
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voltage History */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Voltage History
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={voltageHistory}>
                <defs>
                  <linearGradient id="voltageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="voltage"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="url(#voltageGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature History */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-500" />
            Temperature History
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Predictions Panel */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          AI Predictions
        </h3>
        {predictionsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonPulse key={i} className="h-32" />
            ))}
          </div>
        ) : pred ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <PredictionCard
              label="SOH"
              value={pred.soh?.value ?? 0}
              unit="%"
              confidence={pred.soh?.confidence ?? 0}
              icon={Activity}
              color="bg-green-500/20"
            />
            <PredictionCard
              label="SOC"
              value={pred.soc?.value ?? 0}
              unit="%"
              confidence={pred.soc?.confidence ?? 0}
              icon={Battery}
              color="bg-blue-500/20"
            />
            <PredictionCard
              label="RUL"
              value={pred.rul?.value ?? 0}
              unit="days"
              confidence={pred.rul?.confidence ?? 0}
              icon={Clock}
              color="bg-purple-500/20"
            />
            <PredictionCard
              label="Thermal Risk"
              value={pred.thermal?.value ?? 0}
              unit="%"
              confidence={pred.thermal?.confidence ?? 0}
              icon={Thermometer}
              color="bg-yellow-500/20"
            />
            <PredictionCard
              label="Anomaly Score"
              value={pred.anomaly?.value ?? 0}
              unit=""
              confidence={pred.anomaly?.confidence ?? 0}
              icon={AlertTriangle}
              color="bg-red-500/20"
            />
            <PredictionCard
              label="Failure Prob"
              value={pred.failure?.value ?? 0}
              unit="%"
              confidence={pred.failure?.confidence ?? 0}
              icon={TrendingUp}
              color="bg-orange-500/20"
            />
          </div>
        ) : (
          <p className="text-dark-500 text-sm">No predictions available</p>
        )}
      </div>

      {/* XAI Explanation */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          XAI Explanation
        </h3>
        <XAIExplanation batteryId={battery.battery_id} />
      </div>

      {/* Recent Alerts */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Recent Alerts
        </h3>
        {alertsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonPulse key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-green-500/40 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">No recent alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
