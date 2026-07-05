import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  AlertTriangle,
  Bell,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';

interface Alert {
  id: string;
  battery_id: string;
  battery_name: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: 'ai_prediction' | 'telemetry_monitor' | 'bms';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  recommended_action: string;
}

interface AlertStatistics {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

interface AlertsResponse {
  items: Alert[];
  total: number;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data: alertStats } = useQuery<AlertStatistics>({
    queryKey: ['alertStatistics'],
    queryFn: () => api.getAlertStatistics(),
    refetchInterval: 30000,
  });

  const { data: alertsData, isLoading } = useQuery<AlertsResponse>({
    queryKey: ['alerts', page, severityFilter, statusFilter],
    queryFn: () =>
      api.getAlerts({
        page,
        page_size: 20,
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      }),
    refetchInterval: 30000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => api.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertStatistics'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertStatistics'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-dark-600 text-dark-400 border border-dark-500';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-dark-500';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_prediction':
        return { label: 'AI Prediction', className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
      case 'telemetry_monitor':
        return { label: 'Telemetry', className: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' };
      case 'bms':
        return { label: 'BMS', className: 'bg-green-500/20 text-green-400 border border-green-500/30' };
      default:
        return { label: source, className: 'bg-dark-600 text-dark-400 border border-dark-500' };
    }
  };

  const filteredAlerts = alertsData?.items?.filter((alert) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      alert.battery_id.toLowerCase().includes(query) ||
      alert.title.toLowerCase().includes(query)
    );
  });

  const totalPages = alertsData ? Math.ceil(alertsData.total / 20) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Alert Management</h1>
        <p className="text-dark-400">Real-time monitoring and incident response</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 bg-dark-900 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-red-400 text-sm">Critical</span>
          </div>
          <div className="text-3xl font-bold text-red-500">{alertStats?.critical || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 bg-dark-900 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-yellow-400 text-sm">Warning</span>
          </div>
          <div className="text-3xl font-bold text-yellow-500">{alertStats?.warning || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 bg-dark-900 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-blue-400 text-sm">Info</span>
          </div>
          <div className="text-3xl font-bold text-blue-500">{alertStats?.info || 0}</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-dark-700 rounded-lg">
              <Shield className="w-5 h-5 text-dark-300" />
            </div>
            <span className="text-dark-400 text-sm">Total</span>
          </div>
          <div className="text-3xl font-bold text-white">{alertStats?.total || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search by battery ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setShowSeverityDropdown(!showSeverityDropdown);
              setShowStatusDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white hover:bg-dark-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Severity</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showSeverityDropdown && (
            <div className="absolute z-10 mt-2 w-40 bg-dark-800 border border-dark-700 rounded-lg shadow-lg">
              {['all', 'critical', 'warning', 'info'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSeverityFilter(s as typeof severityFilter);
                    setShowSeverityDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-700 first:rounded-t-lg last:rounded-b-lg ${
                    severityFilter === s ? 'text-primary-400 bg-dark-700' : 'text-white'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowSeverityDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white hover:bg-dark-700 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Status</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusDropdown && (
            <div className="absolute z-10 mt-2 w-44 bg-dark-800 border border-dark-700 rounded-lg shadow-lg">
              {['all', 'active', 'acknowledged', 'resolved'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s as typeof statusFilter);
                    setShowStatusDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-700 first:rounded-t-lg last:rounded-b-lg ${
                    statusFilter === s ? 'text-primary-400 bg-dark-700' : 'text-white'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-white font-semibold">Alerts</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredAlerts?.length === 0 ? (
          <div className="p-8 text-center text-dark-400">
            No alerts found
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {filteredAlerts?.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${getSeverityBorderColor(alert.severity)} hover:bg-dark-800 transition-colors`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadge(alert.source).className}`}>
                        {getSourceBadge(alert.source).label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'active'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : alert.status === 'acknowledged'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold mb-1">{alert.title}</h4>
                    <p className="text-dark-300 text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-dark-400 mb-3">
                      <a
                        href={`/battery/${alert.battery_id}`}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {alert.battery_name || alert.battery_id}
                      </a>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(alert.created_at)}
                      </span>
                    </div>
                    {alert.recommended_action && (
                      <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-xs font-medium text-dark-300">Recommended Action</span>
                        </div>
                        <p className="text-sm text-dark-400">{alert.recommended_action}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 lg:flex-shrink-0">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                        className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 border border-dark-700 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
