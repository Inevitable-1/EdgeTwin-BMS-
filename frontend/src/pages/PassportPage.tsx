import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  FileText,
  Calendar,
  Battery,
  Leaf,
  Clock,
  Shield,
  Recycle,
  Download,
  QrCode,
  MapPin,
  Zap,
} from 'lucide-react';

interface Passport {
  id: string;
  passport_number: string;
  battery_id: string;
  battery_name: string;
  status: string;
  manufacturing_date: string;
  soh?: number;
  cycles?: number;
  energy_throughput?: number;
}

interface MaintenanceRecord {
  type: string;
  description: string;
  date: string;
  cost: number;
}

interface FullPassport {
  passport: {
    id: string;
    passport_number: string;
    status: string;
    manufacturing_date: string;
    first_use_date: string;
    warranty_expiry: string;
  };
  battery: {
    id: string;
    battery_id: string;
    manufacturer: string;
    model: string;
    chemistry: string;
    capacity_kwh: number;
    nominal_voltage: number;
  };
  statistics: {
    total_cycles: number;
    fast_charge_count: number;
    total_energy_throughput: number;
    carbon_footprint_kg: number;
  };
  second_life: {
    status: string;
    eligible: boolean;
    recycling_date: string;
    recycling_facility: string;
  };
  maintenance_history: MaintenanceRecord[];
  current_status: {
    voltage: number;
    current: number;
    temperature: number;
    soc: number;
    soh: number;
    last_updated: string;
  };
  qr_code: string;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'eligible':
      return 'bg-green-500/20 text-green-400';
    case 'pending':
    case 'in_use':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'expired':
    case 'retired':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-dark-600 text-dark-400';
  }
}

function PassportCard({ passport }: { passport: Passport }) {
  const { data } = useQuery({
    queryKey: ['passport', passport.id],
    queryFn: () => api.getFullPassport(passport.id),
    enabled: false,
  });

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 hover:border-primary-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{passport.passport_number}</h3>
        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(passport.status)}`}>
          {passport.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-dark-400 text-sm">
          <Battery className="w-4 h-4" />
          <span>{passport.battery_id} - {passport.battery_name}</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{passport.manufacturing_date}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-dark-700">
        <div className="text-center">
          <div className="text-primary-400 font-semibold">{data?.current_status?.soh ?? '--'}%</div>
          <div className="text-dark-500 text-xs">SOH</div>
        </div>
        <div className="text-center">
          <div className="text-primary-400 font-semibold">{data?.statistics?.total_cycles ?? '--'}</div>
          <div className="text-dark-500 text-xs">Cycles</div>
        </div>
        <div className="text-center">
          <div className="text-primary-400 font-semibold">
            {data?.statistics?.total_energy_throughput
              ? `${(data.statistics.total_energy_throughput / 1000).toFixed(0)}k`
              : '--'} kWh
          </div>
          <div className="text-dark-500 text-xs">Energy</div>
        </div>
      </div>

      <a
        href={`/passport/${passport.id}`}
        className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        View Passport
      </a>
    </div>
  );
}

function PassportList() {
  const { data, isLoading } = useQuery({
    queryKey: ['passports'],
    queryFn: () => api.getPassports(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Battery Passport</h1>
            <p className="text-dark-400">EU Battery Regulation compliant digital passport</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.items?.map((passport: Passport) => (
          <PassportCard key={passport.id} passport={passport} />
        ))}
      </div>

      {data?.items?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-400">No passports found</p>
        </div>
      )}
    </div>
  );
}

function MaintenanceTimeline({ history }: { history: MaintenanceRecord[] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-500" />
        Maintenance History
      </h3>
      <div className="space-y-4">
        {history.map((record, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
                {record.type.toLowerCase().includes('repair') ? (
                  <Shield className="w-5 h-5 text-orange-500" />
                ) : record.type.toLowerCase().includes('replace') ? (
                  <Recycle className="w-5 h-5 text-green-500" />
                ) : (
                  <Zap className="w-5 h-5 text-primary-500" />
                )}
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-full bg-dark-700 mt-2"></div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="bg-dark-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{record.type}</span>
                  <span className="text-dark-400 text-sm">{record.date}</span>
                </div>
                <p className="text-dark-400 text-sm">{record.description}</p>
                {record.cost > 0 && (
                  <div className="text-dark-500 text-xs mt-2">Cost: ₹{record.cost.toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullPassport({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['passport', id],
    queryFn: () => api.getFullPassport(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Passport not found</p>
      </div>
    );
  }

  const { passport, battery, statistics, second_life, maintenance_history, current_status, qr_code } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{passport.passport_number}</h1>
            <p className="text-dark-400">Battery: {battery.battery_id} - {battery.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(passport.status)}`}>
            {passport.status}
          </span>
          <button
            onClick={() => alert('PDF export coming soon')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Manufacturing Info
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">Manufacturing Date</span>
              <span className="text-white">{passport.manufacturing_date || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">First Use Date</span>
              <span className="text-white">{passport.first_use_date || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Warranty Expiry</span>
              <span className="text-white">{passport.warranty_expiry || '--'}</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Battery className="w-5 h-5 text-yellow-500" />
            Usage Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">Total Cycles</span>
              <span className="text-white">{statistics.total_cycles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Fast Charge Count</span>
              <span className="text-white">{statistics.fast_charge_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Energy Throughput</span>
              <span className="text-white">{statistics.total_energy_throughput.toLocaleString()} kWh</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            Environmental Impact
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">Carbon Footprint</span>
              <span className="text-white">{statistics.carbon_footprint_kg.toFixed(1)} kg CO₂</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-400">Second Life Status</span>
              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(second_life.status)}`}>
                {second_life.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Recycling Date</span>
              <span className="text-white">{second_life.recycling_date || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Recycling Facility</span>
              <span className="text-white text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {second_life.recycling_facility || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Battery Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">Manufacturer</span>
              <span className="text-white">{battery.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Model</span>
              <span className="text-white">{battery.model || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Chemistry</span>
              <span className="text-white">{battery.chemistry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Capacity</span>
              <span className="text-white">{battery.capacity_kwh} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Voltage</span>
              <span className="text-white">{battery.nominal_voltage}V</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Current Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-400">Voltage</span>
              <span className="text-white">{current_status.voltage.toFixed(2)} V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Current</span>
              <span className="text-white">{current_status.current.toFixed(2)} A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Temperature</span>
              <span className="text-white">{current_status.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">SOC</span>
              <span className="text-white">{current_status.soc.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">SOH</span>
              <span className="text-white">{current_status.soh.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-dark-700">
              <span className="text-dark-400 text-xs">Last Updated</span>
              <span className="text-dark-500 text-xs">{current_status.last_updated}</span>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-500" />
            QR Code
          </h3>
          {qr_code ? (
            <img
              src={`data:image/svg+xml;base64,${qr_code}`}
              alt="Battery Passport QR Code"
              className="w-40 h-40 rounded-lg bg-white p-2"
            />
          ) : (
            <div className="w-40 h-40 bg-dark-800 rounded-lg flex items-center justify-center">
              <span className="text-dark-500 text-sm">No QR Code</span>
            </div>
          )}
        </div>
      </div>

      <MaintenanceTimeline history={maintenance_history} />
    </div>
  );
}

export default function PassportPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <FullPassport id={id} />;
  }

  return <PassportList />;
}
