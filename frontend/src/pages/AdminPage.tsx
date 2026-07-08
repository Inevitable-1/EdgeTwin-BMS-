import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Shield,
  Users,
  Map,
  AlertTriangle,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  Battery,
  Zap,
  MapPin,
  ScrollText,
  ClipboardList,
} from 'lucide-react';

type Tab = 'users' | 'fleets' | 'battery-models' | 'charging-stations' | 'system-logs' | 'audit-logs';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

interface DemoFleet {
  id: string;
  name: string;
  vehicles: number;
  status: 'active' | 'maintenance' | 'offline';
  manager: string;
  location: string;
}

interface DemoBatteryModel {
  id: string;
  manufacturer: string;
  chemistry: string;
  capacity: string;
  voltage: string;
  count: number;
}

interface DemoChargingStation {
  id: string;
  name: string;
  location: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  connectors: number;
}

interface DemoLog {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  type: string;
  status: string;
}

const DEMO_USERS: DemoUser[] = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@edgetwin.com', role: 'Administrator', status: 'active', lastLogin: '2026-07-09 08:30 AM' },
  { id: '2', name: 'Priya Sharma', email: 'priya.sharma@edgetwin.com', role: 'Fleet Manager', status: 'active', lastLogin: '2026-07-08 06:15 PM' },
  { id: '3', name: 'Amit Patel', email: 'amit.patel@edgetwin.com', role: 'Operator', status: 'active', lastLogin: '2026-07-09 07:45 AM' },
  { id: '4', name: 'Sneha Reddy', email: 'sneha.reddy@edgetwin.com', role: 'Analyst', status: 'active', lastLogin: '2026-07-07 11:20 AM' },
  { id: '5', name: 'Vikram Singh', email: 'vikram.singh@edgetwin.com', role: 'Technician', status: 'inactive', lastLogin: '2026-06-28 03:10 PM' },
  { id: '6', name: 'Ananya Gupta', email: 'ananya.gupta@edgetwin.com', role: 'Fleet Manager', status: 'active', lastLogin: '2026-07-09 09:00 AM' },
  { id: '7', name: 'Rohit Joshi', email: 'rohit.joshi@edgetwin.com', role: 'Operator', status: 'active', lastLogin: '2026-07-08 10:30 PM' },
  { id: '8', name: 'Deepa Nair', email: 'deepa.nair@edgetwin.com', role: 'Administrator', status: 'active', lastLogin: '2026-07-09 06:50 AM' },
  { id: '9', name: 'Karan Mehta', email: 'karan.mehta@edgetwin.com', role: 'Technician', status: 'inactive', lastLogin: '2026-06-25 02:45 PM' },
  { id: '10', name: 'Isha Desai', email: 'isha.desai@edgetwin.com', role: 'Analyst', status: 'active', lastLogin: '2026-07-08 04:00 PM' },
  { id: '11', name: 'Suresh Verma', email: 'suresh.verma@edgetwin.com', role: 'Operator', status: 'active', lastLogin: '2026-07-09 05:30 AM' },
  { id: '12', name: 'Neha Kapoor', email: 'neha.kapoor@edgetwin.com', role: 'Fleet Manager', status: 'inactive', lastLogin: '2026-06-30 12:15 PM' },
];

const DEMO_FLEETS: DemoFleet[] = [
  { id: 'fleet-tata-1', name: 'Tata Nexon EV Fleet', vehicles: 28, status: 'active', manager: 'Priya Sharma', location: 'Mumbai, Maharashtra' },
  { id: 'fleet-tata-2', name: 'Tata Ace EV Fleet', vehicles: 18, status: 'active', manager: 'Ananya Gupta', location: 'Delhi, NCR' },
  { id: 'fleet-mahindra', name: 'Mahindra Treo Fleet', vehicles: 22, status: 'active', manager: 'Neha Kapoor', location: 'Bangalore, Karnataka' },
  { id: 'fleet-ola', name: 'Ola S1 Pro Fleet', vehicles: 35, status: 'maintenance', manager: 'Rajesh Kumar', location: 'Chennai, Tamil Nadu' },
  { id: 'fleet-ather', name: 'Ather 450X Fleet', vehicles: 15, status: 'active', manager: 'Amit Patel', location: 'Pune, Maharashtra' },
  { id: 'fleet-tvs', name: 'TVS iQube Fleet', vehicles: 12, status: 'offline', manager: 'Rohit Joshi', location: 'Hyderabad, Telangana' },
  { id: 'fleet-bajaj', name: 'Bajaj Chetak Fleet', vehicles: 20, status: 'active', manager: 'Suresh Verma', location: 'Jaipur, Rajasthan' },
];

const DEMO_BATTERY_MODELS: DemoBatteryModel[] = [
  { id: 'bm-1', manufacturer: 'Tata Motors', chemistry: 'LFP', capacity: '30.2 kWh', voltage: '320V', count: 28 },
  { id: 'bm-2', manufacturer: 'Tata Motors', chemistry: 'NMC', capacity: '40.5 kWh', voltage: '350V', count: 18 },
  { id: 'bm-3', manufacturer: 'Mahindra', chemistry: 'LFP', capacity: '15.8 kWh', voltage: '240V', count: 22 },
  { id: 'bm-4', manufacturer: 'Ola Electric', chemistry: 'NMC', capacity: '3.97 kWh', voltage: '48V', count: 35 },
  { id: 'bm-5', manufacturer: 'Ather Energy', chemistry: 'LFP', capacity: '3.85 kWh', voltage: '48V', count: 15 },
  { id: 'bm-6', manufacturer: 'TVS Motor', chemistry: 'NMC', capacity: '4.3 kWh', voltage: '51.2V', count: 12 },
  { id: 'bm-7', manufacturer: 'Bajaj Auto', chemistry: 'LFP', capacity: '4.0 kWh', voltage: '48V', count: 20 },
  { id: 'bm-8', manufacturer: 'BYD', chemistry: 'Blade LFP', capacity: '50.1 kWh', voltage: '400V', count: 8 },
  { id: 'bm-9', manufacturer: 'MG Motors', chemistry: 'NMC', capacity: '44.5 kWh', voltage: '380V', count: 6 },
  { id: 'bm-10', manufacturer: 'Hyundai', chemistry: 'NCM', capacity: '39.2 kWh', voltage: '360V', count: 5 },
];

const DEMO_CHARGING_STATIONS: DemoChargingStation[] = [
  { id: 'cs-1', name: 'Mumbai Central Hub', location: 'Mumbai, Maharashtra', type: 'DC Fast Charger', status: 'online', connectors: 6 },
  { id: 'cs-2', name: 'Delhi Noida Depot', location: 'Noida, Uttar Pradesh', type: 'DC Fast Charger', status: 'online', connectors: 8 },
  { id: 'cs-3', name: 'Bangalore Tech Park', location: 'Bangalore, Karnataka', type: 'AC Level 2', status: 'online', connectors: 10 },
  { id: 'cs-4', name: 'Pune Station', location: 'Pune, Maharashtra', type: 'DC Fast Charger', status: 'maintenance', connectors: 4 },
  { id: 'cs-5', name: 'Chennai Port', location: 'Chennai, Tamil Nadu', type: 'AC Level 2', status: 'offline', connectors: 5 },
  { id: 'cs-6', name: 'Hyderabad Hitech City', location: 'Hyderabad, Telangana', type: 'DC Fast Charger', status: 'online', connectors: 7 },
  { id: 'cs-7', name: 'Jaipur Transport Nagar', location: 'Jaipur, Rajasthan', type: 'AC Level 2', status: 'online', connectors: 4 },
  { id: 'cs-8', name: 'Kolkata EV Plaza', location: 'Kolkata, West Bengal', type: 'DC Fast Charger', status: 'maintenance', connectors: 3 },
  { id: 'cs-9', name: 'Ahmedabad Sabarmati', location: 'Ahmedabad, Gujarat', type: 'AC Level 2', status: 'online', connectors: 6 },
  { id: 'cs-10', name: 'Chandigarh Sector 8', location: 'Chandigarh', type: 'DC Fast Charger', status: 'online', connectors: 5 },
];

const DEMO_SYSTEM_LOGS: DemoLog[] = [
  { id: 'sl-1', timestamp: '2026-07-09 10:23:45', event: 'User authentication successful', user: 'rajesh.kumar@edgetwin.com', type: 'Authentication', status: 'Success' },
  { id: 'sl-2', timestamp: '2026-07-09 10:18:12', event: 'Battery data sync completed', user: 'system', type: 'Data Sync', status: 'Success' },
  { id: 'sl-3', timestamp: '2026-07-09 10:15:30', event: 'AI model inference triggered', user: 'system', type: 'AI Engine', status: 'Running' },
  { id: 'sl-4', timestamp: '2026-07-09 10:12:00', event: 'Fleet route optimization request', user: 'priya.sharma@edgetwin.com', type: 'Fleet', status: 'Completed' },
  { id: 'sl-5', timestamp: '2026-07-09 10:05:22', event: 'Alert resolution batch processed', user: 'system', type: 'Alerting', status: 'Completed' },
  { id: 'sl-6', timestamp: '2026-07-09 09:55:44', event: 'Database backup initiated', user: 'system', type: 'Maintenance', status: 'Running' },
  { id: 'sl-7', timestamp: '2026-07-09 09:48:15', event: 'New battery registered: BAT-045', user: 'amit.patel@edgetwin.com', type: 'Inventory', status: 'Success' },
  { id: 'sl-8', timestamp: '2026-07-09 09:40:33', event: 'Telemetry stream reconnected', user: 'system', type: 'Telemetry', status: 'Success' },
  { id: 'sl-9', timestamp: '2026-07-09 09:32:18', event: 'MQTT broker connection lost', user: 'system', type: 'Network', status: 'Warning' },
  { id: 'sl-10', timestamp: '2026-07-09 09:25:07', event: 'User password change request', user: 'sneha.reddy@edgetwin.com', type: 'Authentication', status: 'Success' },
  { id: 'sl-11', timestamp: '2026-07-09 09:20:50', event: 'Fleet report generated: Q2 2026', user: 'ananya.gupta@edgetwin.com', type: 'Reports', status: 'Completed' },
  { id: 'sl-12', timestamp: '2026-07-09 09:12:35', event: 'API rate limit threshold warning', user: 'system', type: 'Performance', status: 'Warning' },
  { id: 'sl-13', timestamp: '2026-07-09 09:05:00', event: 'Scheduled maintenance window started', user: 'admin', type: 'Maintenance', status: 'Success' },
  { id: 'sl-14', timestamp: '2026-07-09 08:55:20', event: 'Charging session initiated: CS-001', user: 'rohit.joshi@edgetwin.com', type: 'Charging', status: 'Success' },
  { id: 'sl-15', timestamp: '2026-07-09 08:45:10', event: 'Firmware update available for 3 batteries', user: 'system', type: 'Update', status: 'Info' },
];

const DEMO_AUDIT_LOGS: DemoLog[] = [
  { id: 'al-1', timestamp: '2026-07-09 10:20:00', event: 'Admin role assigned to user', user: 'rajesh.kumar@edgetwin.com', type: 'Role Change', status: 'Success' },
  { id: 'al-2', timestamp: '2026-07-09 10:10:15', event: 'API key generated for external integration', user: 'deepa.nair@edgetwin.com', type: 'API Key', status: 'Success' },
  { id: 'al-3', timestamp: '2026-07-09 09:58:30', event: 'Failed login attempt detected', user: 'unknown', type: 'Security', status: 'Failed' },
  { id: 'al-4', timestamp: '2026-07-09 09:45:22', event: 'User account deactivated', user: 'admin', type: 'Account', status: 'Success' },
  { id: 'al-5', timestamp: '2026-07-09 09:35:18', event: 'Data export initiated: Battery Health Report', user: 'vikram.singh@edgetwin.com', type: 'Data Export', status: 'Success' },
  { id: 'al-6', timestamp: '2026-07-09 09:22:45', event: 'Two-factor authentication enabled', user: 'isha.desai@edgetwin.com', type: 'Security', status: 'Success' },
  { id: 'al-7', timestamp: '2026-07-09 09:15:10', event: 'Suspicious IP address blocked', user: 'system', type: 'Security', status: 'Success' },
  { id: 'al-8', timestamp: '2026-07-09 09:05:55', event: 'User permission modified', user: 'deepa.nair@edgetwin.com', type: 'Permission', status: 'Success' },
  { id: 'al-9', timestamp: '2026-07-09 08:50:30', event: 'Password reset requested', user: 'suresh.verma@edgetwin.com', type: 'Authentication', status: 'Pending' },
  { id: 'al-10', timestamp: '2026-07-09 08:40:12', event: 'Session timeout - forced logout', user: 'rohit.joshi@edgetwin.com', type: 'Session', status: 'Warning' },
  { id: 'al-11', timestamp: '2026-07-09 08:30:00', event: 'New user account created', user: 'admin', type: 'Account', status: 'Success' },
  { id: 'al-12', timestamp: '2026-07-09 08:20:45', event: 'Database schema migration executed', user: 'system', type: 'Database', status: 'Success' },
  { id: 'al-13', timestamp: '2026-07-09 08:10:30', event: 'Audit log retention policy applied', user: 'system', type: 'Compliance', status: 'Success' },
  { id: 'al-14', timestamp: '2026-07-09 08:00:15', event: 'Third-party integration token revoked', user: 'rajesh.kumar@edgetwin.com', type: 'Integration', status: 'Success' },
  { id: 'al-15', timestamp: '2026-07-09 07:50:00', event: 'Security certificate renewed', user: 'system', type: 'Security', status: 'Success' },
];

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'fleets', label: 'Fleets', icon: Map },
  { id: 'battery-models', label: 'Battery Models', icon: Battery },
  { id: 'charging-stations', label: 'Charging Stations', icon: Zap },
  { id: 'system-logs', label: 'System Logs', icon: ScrollText },
  { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList },
];

function StatusPill({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border border-green-500/30',
    inactive: 'bg-red-500/20 text-red-400 border border-red-500/30',
    maintenance: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    offline: 'bg-dark-600 text-dark-400 border border-dark-500',
    online: 'bg-green-500/20 text-green-400 border border-green-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${classes[status.toLowerCase()] || classes.info}`}>
      {status}
    </span>
  );
}

function Table<T>({ columns, data, renderRow }: {
  columns: { key: string; label: string }[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-dark-400 border-b border-dark-700">
            {columns.map((col) => (
              <th key={col.key} className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
              {renderRow(item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogRow({ log }: { log: DemoLog }) {
  return (
    <>
      <td className="py-3 pr-4">
        <span className="text-dark-300 text-xs font-mono whitespace-nowrap">{log.timestamp}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-white text-sm">{log.event}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-dark-400 text-sm">{log.user}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-dark-300 text-sm">{log.type}</span>
      </td>
      <td className="py-3">
        <StatusPill status={log.status} />
      </td>
    </>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const { data: alertStats } = useQuery({
    queryKey: ['alertStatistics'],
    queryFn: () => api.getAlertStatistics(),
  });

  const statsCards = [
    { label: 'Total Users', value: '12', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Fleets', value: '7', icon: Map, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'System Uptime', value: '99.8%', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Critical Alerts', value: String(alertStats?.critical ?? 0), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                User Management
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-colors">
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
            <Table
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
                { key: 'status', label: 'Status' },
                { key: 'lastLogin', label: 'Last Login' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={DEMO_USERS}
              renderRow={(user) => (
                <>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
                        <span className="text-primary-400 text-xs font-bold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-white text-sm font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{user.email}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{user.role}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={user.status} />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-400 text-sm">{user.lastLogin}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            />
          </div>
        );

      case 'fleets':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Map className="w-4 h-4 text-primary-500" />
                Fleet Management
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Fleet
              </button>
            </div>
            <Table
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'vehicles', label: 'Vehicles' },
                { key: 'status', label: 'Status' },
                { key: 'manager', label: 'Manager' },
                { key: 'location', label: 'Location' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={DEMO_FLEETS}
              renderRow={(fleet) => (
                <>
                  <td className="py-3.5 pr-4">
                    <span className="text-white text-sm font-medium">{fleet.name}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-white font-semibold text-sm">{fleet.vehicles}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={fleet.status} />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{fleet.manager}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-dark-400" />
                      <span className="text-dark-300 text-sm">{fleet.location}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            />
          </div>
        );

      case 'battery-models':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Battery className="w-4 h-4 text-primary-500" />
              Battery Models
            </h3>
            <Table
              columns={[
                { key: 'manufacturer', label: 'Manufacturer' },
                { key: 'chemistry', label: 'Chemistry' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'voltage', label: 'Voltage' },
                { key: 'count', label: 'Count' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={DEMO_BATTERY_MODELS}
              renderRow={(model) => (
                <>
                  <td className="py-3.5 pr-4">
                    <span className="text-white text-sm font-medium">{model.manufacturer}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-dark-700 text-dark-200">{model.chemistry}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{model.capacity}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{model.voltage}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-white font-semibold text-sm">{model.count}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            />
          </div>
        );

      case 'charging-stations':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary-500" />
              Charging Stations
            </h3>
            <Table
              columns={[
                { key: 'name', label: 'Station Name' },
                { key: 'location', label: 'Location' },
                { key: 'type', label: 'Type' },
                { key: 'status', label: 'Status' },
                { key: 'connectors', label: 'Connectors' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={DEMO_CHARGING_STATIONS}
              renderRow={(station) => (
                <>
                  <td className="py-3.5 pr-4">
                    <span className="text-white text-sm font-medium">{station.name}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-dark-400" />
                      <span className="text-dark-300 text-sm">{station.location}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-dark-300 text-sm">{station.type}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={station.status} />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-white font-semibold text-sm">{station.connectors}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            />
          </div>
        );

      case 'system-logs':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <ScrollText className="w-4 h-4 text-primary-500" />
              System Event Logs
            </h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-dark-900 z-10">
                  <tr className="text-left text-dark-400 border-b border-dark-700">
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Event</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">User</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_SYSTEM_LOGS.map((log) => (
                    <tr key={log.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <LogRow log={log} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'audit-logs':
        return (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-primary-500" />
              Audit Trail
            </h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-dark-900 z-10">
                  <tr className="text-left text-dark-400 border-b border-dark-700">
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Event</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">User</th>
                    <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_AUDIT_LOGS.map((log) => (
                    <tr key={log.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <LogRow log={log} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary-500" />
          Admin Portal
        </h1>
        <p className="text-dark-400 mt-1">System administration and monitoring</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-dark-700 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                  isActive
                    ? 'bg-dark-900 text-white border border-b-0 border-dark-700'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
