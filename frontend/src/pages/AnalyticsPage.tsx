import { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  Battery, RefreshCw, Zap, TrendingUp, Leaf, Award,
  Activity, Thermometer, Gauge, Cpu, BatteryCharging, BarChart3,
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const batteryHealthData = months.map((m, i) => ({
  month: m,
  avg: +(98.5 - i * 1.05 + Math.random() * 0.4).toFixed(1),
  min: +(96 - i * 1.4 + Math.random() * 0.8).toFixed(1),
  max: +(99.5 - i * 0.7 + Math.random() * 0.3).toFixed(1),
}));

const temperatureData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  avg: +(28 + Math.sin(i * 0.3) * 6 + Math.random() * 3).toFixed(1),
  max: +(32 + Math.sin(i * 0.3) * 7 + Math.random() * 3).toFixed(1),
  min: +(24 + Math.sin(i * 0.3) * 4 + Math.random() * 2).toFixed(1),
}));

const currentVoltageData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i * 5}s`,
  current: +(45 + Math.sin(i * 0.5) * 20 + Math.random() * 5 - 2.5).toFixed(1),
  voltage: +(380 + Math.sin(i * 0.3) * 20 + Math.random() * 3 - 1.5).toFixed(1),
}));

const powerData = Array.from({ length: 15 }, (_, i) => ({
  interval: `T${i + 1}`,
  power: +(12 + Math.sin(i * 0.7) * 8 + Math.random() * 3 - 1.5).toFixed(1),
}));

const efficiencyData = months.map((m, i) => ({
  month: m,
  efficiency: +(89 + Math.sin(i * 0.4) * 4 + Math.random() * 2 - 1).toFixed(1),
  target: 92,
}));

const rangeData = Array.from({ length: 15 }, (_, i) => ({
  trip: `Trip ${i + 1}`,
  estimated: +(250 + Math.sin(i * 0.5) * 40 + Math.random() * 15 - 7.5).toFixed(0),
  actual: +(240 + Math.sin(i * 0.5) * 38 + Math.random() * 20 - 10).toFixed(0),
}));

const chargingData = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  sessions: Math.floor(8 + Math.sin(i * 0.5) * 4 + Math.random() * 3),
  energy: +(45 + Math.sin(i * 0.4) * 15 + Math.random() * 10).toFixed(0),
}));

const fleetData = [
  { name: 'Fleet A', soh: 91.2, count: 24 },
  { name: 'Fleet B', soh: 88.7, count: 18 },
  { name: 'Fleet C', soh: 85.4, count: 30 },
  { name: 'Fleet D', soh: 82.1, count: 15 },
  { name: 'Fleet E', soh: 79.6, count: 22 },
  { name: 'Fleet F', soh: 76.8, count: 20 },
  { name: 'Fleet G', soh: 73.2, count: 16 },
];

const energyUsageData = months.map((m, i) => ({
  month: m,
  consumption: +(180 + Math.sin(i * 0.5) * 60 + Math.random() * 20 - 10).toFixed(0),
  regeneration: +(40 + Math.sin(i * 0.3) * 15 + Math.random() * 8 - 4).toFixed(0),
}));

const cycleCapacityData = Array.from({ length: 20 }, (_, i) => {
  const cycles = 500 + i * 250 + Math.floor(Math.random() * 100);
  return {
    cycles,
    capacity: +(95 - (cycles / 10000) * 8 + Math.random() * 2 - 1).toFixed(1),
  };
});

const fleetColors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#f97316', '#ef4444', '#ec4899'];

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div
      className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all duration-300 hover:shadow-lg"
      style={{ borderColor: `${color}40`, boxShadow: `0 0 0 0 ${color}00` }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 0 transparent'; }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-dark-400 text-sm font-medium">{label}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {sub && <span className="text-dark-500 text-xs">{sub}</span>}
    </div>
  );
}

function ChartCard({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all duration-300 hover:border-dark-600">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`bg-dark-800 rounded-xl animate-pulse ${className ?? ''}`} />;
}

export default function AnalyticsPage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 space-y-6">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary-500" />
          Analytics
        </h1>
        <p className="text-dark-400 mt-1">Fleet-wide battery performance analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Battery} label="Fleet Average SOH" value="87.5%" sub="Across all batteries" color="#22c55e" />
        <StatCard icon={RefreshCw} label="Total Cycles" value="12,450" sub="Lifetime accumulated" color="#3b82f6" />
        <StatCard icon={Zap} label="Energy Throughput" value="845 MWh" sub="Total energy processed" color="#a855f7" />
        <StatCard icon={TrendingUp} label="Avg Efficiency" value="89.2%" sub="&plusmn;2.3% variance" color="#06b6d4" />
        <StatCard icon={Leaf} label="Carbon Saved" value="12.4 t" sub="CO&#8322; emissions avoided" color="#84cc16" />
        <StatCard icon={Award} label="Battery Health Score" value="91.3" sub="Fleet-wide index" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Battery Health Trend" icon={Activity} color="#22c55e">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={batteryHealthData}>
              <defs>
                <linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis domain={[75, 100]} stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="avg" stroke="#22c55e" fill="url(#sohGrad)" strokeWidth={2} name="Avg SOH" dot={false} />
              <Line type="monotone" dataKey="min" stroke="#eab308" strokeWidth={1.5} dot={false} name="Min SOH" />
              <Line type="monotone" dataKey="max" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Max SOH" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Temperature Trend (30 Days)" icon={Thermometer} color="#f97316">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis domain={[20, 45]} stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}°C`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={2.5} dot={false} name="Avg Temp" />
              <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Max Temp" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Min Temp" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Current vs Voltage" icon={Gauge} color="#3b82f6">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={currentVoltageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} tickFormatter={(v) => `${v}A`} />
              <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={12} tickFormatter={(v) => `${v}V`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar yAxisId="left" dataKey="current" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Current (A)" opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#22c55e" strokeWidth={2.5} name="Voltage (V)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Power Distribution" icon={Zap} color="#a855f7">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={powerData}>
              <defs>
                <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="interval" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}kW`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="power" fill="url(#powerGrad)" radius={[4, 4, 0, 0]} name="Power (kW)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Efficiency Over Time" icon={Cpu} color="#06b6d4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={efficiencyData}>
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis domain={[80, 96]} stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" fill="url(#effGrad)" strokeWidth={2} name="Efficiency" dot={false} />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" name="Target" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Range Estimation" icon={BatteryCharging} color="#22c55e">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="trip" stroke="#64748b" fontSize={12} interval={2} />
              <YAxis domain={[150, 350]} stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}km`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="estimated" stroke="#22c55e" strokeWidth={2.5} name="Estimated Range" dot={{ r: 3, fill: '#22c55e' }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} name="Actual Range" dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Charging Sessions" icon={Activity} color="#f59e0b">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chargingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#f59e0b" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar yAxisId="left" dataKey="sessions" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sessions" />
              <Line yAxisId="right" type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} name="Energy (kWh)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet SOH Comparison" icon={BarChart3} color="#a855f7">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fleetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis domain={[70, 95]} stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="soh" radius={[4, 4, 0, 0]} name="SOH %">
                {fleetData.map((_, i) => (
                  <Cell key={i} fill={fleetColors[i % fleetColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Energy Usage" icon={Zap} color="#ef4444">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={energyUsageData}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="regenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="consumption" stroke="#ef4444" fill="url(#energyGrad)" strokeWidth={2} name="Consumption" dot={false} />
              <Area type="monotone" dataKey="regeneration" stroke="#22c55e" fill="url(#regenGrad)" strokeWidth={2} name="Regeneration" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cycle Count vs Capacity" icon={RefreshCw} color="#3b82f6">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cycleCapacityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cycles" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis domain={[80, 100]} stroke="#3b82f6" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="capacity" stroke="#3b82f6" strokeWidth={2.5} name="Capacity Retention" dot={{ r: 4, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
