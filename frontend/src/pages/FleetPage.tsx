import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Map,
  Battery,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import FleetMap from '../components/Fleet/FleetMap';
import { api } from '../services/api';

interface BatteryHealthItem {
  id?: string;
  battery_id: string;
  vehicle_name: string;
  manufacturer: string;
  status: string;
  current_soh: number;
  location?: string;
  lat?: number;
  lng?: number;
  fleet_id: string;
}

interface FleetInfo {
  id: string;
  name: string;
  description: string;
  battery_count: number;
  avg_soh: number;
  active_alerts: number;
}

const MANUFACTURER_COLORS: Record<string, string> = {
  'Tata Motors': '#3b82f6',
  Mahindra: '#ef4444',
  'Ola Electric': '#22c55e',
  'Ather Energy': '#f59e0b',
  TVS: '#a855f7',
  Bajaj: '#ec4899',
  'Hero Electric': '#14b8a6',
  AMO: '#f97316',
  Revolt: '#6366f1',
  Ultraviolette: '#06b6d4',
  BYD: '#06b6d4',
  'MG Motors': '#ec4899',
};

function getSoHColor(soh: number): string {
  if (soh > 85) return '#22c55e';
  if (soh >= 70) return '#eab308';
  return '#ef4444';
}

function getSoHBarColor(soh: number): string {
  if (soh > 85) return 'bg-green-500';
  if (soh >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}



function SkeletonFleetCard() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-dark-700 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-dark-700 rounded animate-pulse mb-2" />
          <div className="h-3 w-48 bg-dark-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-3 w-14 bg-dark-700 rounded animate-pulse mx-auto mb-2" />
            <div className="h-6 w-10 bg-dark-700 rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>
      <div className="h-2 w-full bg-dark-700 rounded animate-pulse mb-4" />
      <div className="flex justify-between pt-4 border-t border-dark-700">
        <div className="h-5 w-16 bg-dark-700 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-dark-700 rounded animate-pulse" />
      </div>
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

function SkeletonMap() {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="h-5 w-36 bg-dark-700 rounded animate-pulse mb-4" />
      <div className="h-96 bg-dark-800 rounded-lg animate-pulse" />
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

export default function FleetPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');

  const { data: fleetsData } = useQuery({
    queryKey: ['fleets'],
    queryFn: () => api.getFleets(),
  });

  const { data: batteryHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['batteryHealth'],
    queryFn: () => api.getBatteryHealth(),
  });

  const batteries: BatteryHealthItem[] = useMemo(() => batteryHealth || [], [batteryHealth]);
  const isLoading = healthLoading;

  const fleetStats = useMemo(() => {
    const apiFleets = fleetsData?.items || [];
    const fleetMap: Record<string, FleetInfo> = {
      'fleet-tata-ev': {
        id: 'fleet-tata-ev',
        name: 'Tata EV Fleet',
        description: 'Tata Motors electric vehicle fleet across India',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-mahindra-ev': {
        id: 'fleet-mahindra-ev',
        name: 'Mahindra EV Fleet',
        description: 'Mahindra electric vehicle fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-ola-ev': {
        id: 'fleet-ola-ev',
        name: 'Ola Electric Fleet',
        description: 'Ola Electric two-wheeler fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-ather-ev': {
        id: 'fleet-ather-ev',
        name: 'Ather Energy Fleet',
        description: 'Ather Energy electric two-wheeler fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-tvs-ev': {
        id: 'fleet-tvs-ev',
        name: 'TVS Electric Fleet',
        description: 'TVS Motors electric vehicle fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-byd-ev': {
        id: 'fleet-byd-ev',
        name: 'BYD EV Fleet',
        description: 'BYD electric vehicle fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
      'fleet-mg-ev': {
        id: 'fleet-mg-ev',
        name: 'MG EV Fleet',
        description: 'MG Motors electric vehicle fleet',
        battery_count: 0,
        avg_soh: 0,
        active_alerts: 0,
      },
    };

    apiFleets.forEach((af: { id: string; name?: string; description?: string }) => {
      if (fleetMap[af.id]) {
        if (af.name) fleetMap[af.id].name = af.name;
        if (af.description) fleetMap[af.id].description = af.description;
      }
    });

    batteries.forEach((b) => {
      const fleet = fleetMap[b.fleet_id];
      if (fleet) {
        fleet.battery_count++;
        fleet.avg_soh += typeof b.current_soh === 'number' ? b.current_soh : 0;
      }
    });

    Object.values(fleetMap).forEach((f) => {
      if (f.battery_count > 0) {
        f.avg_soh = Math.round((f.avg_soh / f.battery_count) * 10) / 10;
      }
    });

    return Object.values(fleetMap).filter((f) => f.battery_count > 0);
  }, [batteries, fleetsData]);

  const locationDistribution = useMemo(() => {
    const cityCounts: Record<string, number> = {};
    batteries.forEach((b) => {
      const loc = b.location || 'Unknown';
      cityCounts[loc] = (cityCounts[loc] || 0) + 1;
    });
    return Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [batteries]);

  const manufacturerDistribution = useMemo(() => {
    const mfrCounts: Record<string, number> = {};
    batteries.forEach((b) => {
      const mfr = b.manufacturer || 'Unknown';
      mfrCounts[mfr] = (mfrCounts[mfr] || 0) + 1;
    });
    return Object.entries(mfrCounts).map(([name, value]) => ({ name, value }));
  }, [batteries]);

  const filteredFleets = useMemo(() => {
    return fleetStats.filter((f) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!f.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterManufacturer !== 'all') {
        const mfrFleetMap: Record<string, string> = {
          'fleet-tata-ev': 'Tata Motors',
          'fleet-mahindra-ev': 'Mahindra',
          'fleet-ola-ev': 'Ola Electric',
          'fleet-ather-ev': 'Ather Energy',
          'fleet-tvs-ev': 'TVS',
          'fleet-byd-ev': 'BYD',
          'fleet-mg-ev': 'MG Motors',
        };
        if (mfrFleetMap[f.id] !== filterManufacturer) return false;
      }
      return true;
    });
  }, [fleetStats, searchQuery, filterManufacturer]);

  const allManufacturers = useMemo(() => {
    return [...new Set(batteries.map((b) => b.manufacturer))].sort();
  }, [batteries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 space-y-6">
        <div>
          <div className="h-8 w-56 bg-dark-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-dark-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonFleetCard key={i} />
          ))}
        </div>
        <SkeletonMap />
        <SkeletonTable />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Map className="w-7 h-7 text-primary-500" />
          Fleet Management
        </h1>
        <p className="text-dark-400 mt-1">
          Monitor and manage your EV battery fleets
        </p>
      </div>

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFleets.map((fleet) => (
          <div
            key={fleet.id}
            className="bg-dark-900 border border-dark-700 rounded-xl p-6 hover:border-primary-500 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{fleet.name}</h3>
                <p className="text-dark-400 text-sm">{fleet.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-dark-400 text-sm mb-1">
                  <Battery className="w-4 h-4" />
                  <span>Batteries</span>
                </div>
                <div className="text-white font-semibold">{fleet.battery_count}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-dark-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Avg SOH</span>
                </div>
                <div className="text-white font-semibold">{fleet.avg_soh}%</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-dark-400 text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Alerts</span>
                </div>
                <div className="text-white font-semibold">{fleet.active_alerts}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                <span>SOH Level</span>
                <span>{fleet.avg_soh}%</span>
              </div>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getSoHBarColor(fleet.avg_soh)}`}
                  style={{ width: `${Math.min(fleet.avg_soh, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dark-700">
              <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">
                Active
              </span>
              <button
                onClick={() => navigate(`/fleet/${fleet.id}`)}
                className="text-primary-500 hover:text-primary-400 text-sm flex items-center gap-1"
              >
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Fleet Map */}
      <FleetMap />

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search fleets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <select
            value={filterManufacturer}
            onChange={(e) => setFilterManufacturer(e.target.value)}
            className="bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-8 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            <option value="all">All Manufacturers</option>
            {allManufacturers.map((mfr) => (
              <option key={mfr} value={mfr}>
                {mfr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Battery className="w-4 h-4 text-primary-500" />
            Fleet Overview
          </h3>
          <span className="text-dark-400 text-xs">{filteredFleets.length} fleets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-dark-400 border-b border-dark-700">
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Fleet Name</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Batteries</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Avg SOH</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Active Alerts</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredFleets]
                .sort((a, b) => b.battery_count - a.battery_count)
                .map((fleet) => (
                  <tr
                    key={fleet.id}
                    className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                          <Map className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{fleet.name}</div>
                          <div className="text-dark-400 text-xs">{fleet.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-white font-semibold">{fleet.battery_count}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getSoHBarColor(fleet.avg_soh)}`}
                            style={{ width: `${Math.min(fleet.avg_soh, 100)}%` }}
                          />
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: getSoHColor(fleet.avg_soh) }}
                        >
                          {fleet.avg_soh}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      {fleet.active_alerts > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {fleet.active_alerts}
                        </span>
                      ) : (
                        <span className="text-green-500 text-xs">0</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        Active
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => navigate(`/fleet/${fleet.id}`)}
                        className="bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 font-medium py-1.5 px-3 rounded-lg transition-colors text-sm inline-flex items-center gap-1"
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              {filteredFleets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-dark-400">
                    No fleets found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Distribution */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Location Distribution
            </h3>
            <span className="text-dark-400 text-xs">Top 10 cities</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationDistribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [value, 'Batteries']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manufacturer Distribution */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Battery className="w-4 h-4 text-purple-500" />
              Manufacturer Distribution
            </h3>
            <span className="text-dark-400 text-xs">{manufacturerDistribution.length} manufacturers</span>
          </div>
          <div className="h-72 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={manufacturerDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {manufacturerDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={MANUFACTURER_COLORS[entry.name] || '#64748b'}
                      />
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
            <div className="w-1/2 space-y-2.5 pl-4">
              {manufacturerDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: MANUFACTURER_COLORS[entry.name] || '#64748b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-dark-400 truncate">{entry.name}</div>
                    <div className="text-sm font-semibold text-white">{entry.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
