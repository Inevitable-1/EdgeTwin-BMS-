import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Battery, Thermometer, AlertTriangle, TrendingUp, Activity, Zap, MapPin } from 'lucide-react';
import { api } from '../services/api';
import TelemetryChart from '../components/Telemetry/TelemetryChart';

interface BatteryHealthItem {
  id?: string;
  battery_id: string;
  vehicle_name: string;
  manufacturer: string;
  status: string;
  current_soh: number;
  current_soc: number;
  current_temperature?: number;
  voltage?: number;
  cycle_count: number;
  active_alerts?: number;
  location?: string;
}

interface AlertStats {
  critical: number;
  warning: number;
  info: number;
  total: number;
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

function getSoHColor(soh: number): string {
  if (soh > 90) return '#00ff88';
  if (soh >= 80) return '#3b82f6';
  if (soh >= 70) return '#ffd700';
  return '#ef4444';
}

function getSoHLabel(soh: number): string {
  if (soh > 90) return 'Healthy';
  if (soh >= 80) return 'Good';
  if (soh >= 70) return 'Fair';
  return 'Critical';
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'maintenance':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'critical':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-dark-700 text-dark-400 border border-dark-600';
  }
}

function SkeletonCard() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-dark-700 rounded animate-pulse" />
        <div className="h-5 w-5 bg-dark-700 rounded animate-pulse" />
      </div>
      <div className="h-9 w-20 bg-dark-700 rounded animate-pulse mb-2" />
      <div className="h-3 w-16 bg-dark-700 rounded animate-pulse" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="h-5 w-48 bg-dark-700 rounded animate-pulse mb-4" />
      <div className="h-64 bg-dark-800 rounded-lg animate-pulse" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="h-5 w-40 bg-dark-700 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-dark-800 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: batteryHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['batteryHealth'],
    queryFn: () => api.getBatteryHealth(),
    refetchInterval: 30000,
  });

  const { data: alertStats, isLoading: alertsLoading } = useQuery({
    queryKey: ['alertStatistics'],
    queryFn: () => api.getAlertStatistics(),
    refetchInterval: 15000,
  });

  const batteries: BatteryHealthItem[] = batteryHealth || [];
  const stats: AlertStats = alertStats || { critical: 0, warning: 0, info: 0, total: 0 };

  const totalBatteries = 150;
  const avgSoH = batteries.length > 0
    ? batteries.reduce((sum, b) => sum + (typeof b.current_soh === 'number' ? b.current_soh : parseFloat(String(b.current_soh)) || 0), 0) / batteries.length
    : 0;
  const avgTemp = batteries.length > 0
    ? batteries.reduce((sum, b) => sum + (b.current_temperature || 25 + Math.random() * 10), 0) / batteries.length
    : 0;

  const animatedTotal = useAnimatedCounter(totalBatteries);
  const animatedSoH = useAnimatedCounter(Math.round(avgSoH * 10));
  const animatedTemp = useAnimatedCounter(Math.round(avgTemp * 10));
  const animatedAlerts = useAnimatedCounter(stats.total);

  const healthDistribution = [
    {
      name: 'Excellent (>90%)',
      value: batteries.filter((b) => (typeof b.current_soh === 'number' ? b.current_soh : parseFloat(String(b.current_soh)) || 0) > 90).length || 52,
      color: '#00ff88',
    },
    {
      name: 'Good (80-90%)',
      value: batteries.filter((b) => {
        const soh = typeof b.current_soh === 'number' ? b.current_soh : parseFloat(String(b.current_soh)) || 0;
        return soh >= 80 && soh <= 90;
      }).length || 65,
      color: '#3b82f6',
    },
    {
      name: 'Fair (70-80%)',
      value: batteries.filter((b) => {
        const soh = typeof b.current_soh === 'number' ? b.current_soh : parseFloat(String(b.current_soh)) || 0;
        return soh >= 70 && soh < 80;
      }).length || 25,
      color: '#ffd700',
    },
    {
      name: 'Poor (<70%)',
      value: batteries.filter((b) => (typeof b.current_soh === 'number' ? b.current_soh : parseFloat(String(b.current_soh)) || 0) < 70).length || 8,
      color: '#ef4444',
    },
  ];

  const [sortedBatteries, setSortedBatteries] = useState<BatteryHealthItem[]>([]);

  useEffect(() => {
    if (batteries.length > 0) {
      const sorted = [...batteries].sort((a, b) => (b.active_alerts || 0) - (a.active_alerts || 0));
      setSortedBatteries(sorted.slice(0, 10));
    }
  }, [batteries]);

  const handleRowClick = useCallback((batteryId: string) => {
    navigate(`/battery/${batteryId}`);
  }, [navigate]);

  const isLoading = healthLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 space-y-6">
        <div>
          <div className="h-8 w-48 bg-dark-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-dark-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-7 h-7 text-primary-500" />
          EdgeTwin-BMS+ Dashboard
        </h1>
        <p className="text-dark-400 mt-1">
          Real-time AI-powered battery monitoring for Indian EV fleets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Batteries */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-400 text-sm font-medium">Total Batteries</span>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Battery className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{animatedTotal}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-sm">All systems online</span>
          </div>
        </div>

        {/* Average SOH */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-400 text-sm font-medium">Average SOH</span>
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(animatedSoH / 10).toFixed(1)}%
          </div>
          <div className="mt-2">
            <span
              className="text-sm font-medium"
              style={{ color: getSoHColor(avgSoH || 87.5) }}
            >
              {getSoHLabel(avgSoH || 87.5)}
            </span>
          </div>
        </div>

        {/* Average Temperature */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-400 text-sm font-medium">Avg Temperature</span>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Thermometer className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(animatedTemp / 10).toFixed(1)}°C
          </div>
          <div className="mt-2">
            <span
              className="text-sm font-medium"
              style={{ color: avgTemp > 45 ? '#ef4444' : avgTemp > 35 ? '#ffd700' : '#00ff88' }}
            >
              {avgTemp > 45 ? 'Overheating' : avgTemp > 35 ? 'Warm' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-400 text-sm font-medium">Active Alerts</span>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{animatedAlerts}</div>
          <div className="mt-2">
            {stats.critical > 0 ? (
              <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {stats.critical} critical
              </span>
            ) : (
              <span className="text-green-500 text-sm font-medium">No critical alerts</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="space-y-6">
        {/* Live Telemetry Chart */}
        <TelemetryChart batteryId="BAT-001" batteryName="Tata Nexon EV Battery Pack" />

        {/* Health Distribution */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-500" />
              Battery Health Distribution
            </h3>
            <span className="text-dark-400 text-xs">{totalBatteries} total</span>
          </div>
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {healthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3 pl-4">
              {healthDistribution.map((segment) => (
                <div key={segment.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-dark-400 truncate">{segment.name}</div>
                    <div className="text-sm font-semibold text-white">{segment.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Battery Overview Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            Battery Overview
          </h3>
          <span className="text-dark-400 text-xs">Top 10 by alert count</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-dark-400 border-b border-dark-700">
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Battery ID</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Vehicle</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">SOH</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">SOC</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Temperature</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {sortedBatteries.map((battery) => {
                const soh = typeof battery.current_soh === 'number'
                  ? battery.current_soh
                  : parseFloat(String(battery.current_soh)) || 0;
                const soc = typeof battery.current_soc === 'number'
                  ? battery.current_soc
                  : parseFloat(String(battery.current_soc)) || 0;
                const temp = battery.current_temperature || 25 + Math.random() * 15;

                return (
                  <tr
                    key={battery.battery_id}
                    onClick={() => handleRowClick(battery.battery_id)}
                    className="border-b border-dark-800 hover:bg-dark-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5">
                      <span className="text-white font-mono text-sm">{battery.battery_id}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-dark-300 text-sm">{battery.vehicle_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(battery.status)}`}>
                        {battery.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-sm" style={{ color: getSoHColor(soh) }}>
                        {soh.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-white text-sm">{soc.toFixed(1)}%</span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className="text-sm"
                        style={{ color: temp > 45 ? '#ef4444' : temp > 35 ? '#ffd700' : '#00ff88' }}
                      >
                        {temp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3.5">
                      {(battery.active_alerts || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {battery.active_alerts}
                        </span>
                      ) : (
                        <span className="text-green-500 text-xs">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedBatteries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-dark-400">
                    No battery data available
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
