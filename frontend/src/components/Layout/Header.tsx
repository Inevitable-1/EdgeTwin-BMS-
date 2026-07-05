import { Bell, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useDemoStore } from '../../stores/demoStore';

export default function Header() {
  const { data: alertStats } = useQuery({
    queryKey: ['alertStatistics'],
    queryFn: () => api.getAlertStatistics(),
    refetchInterval: 10000,
  });
  const { enabled: demoMode } = useDemoStore();

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search batteries, fleets..."
            className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {demoMode && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">DEMO LIVE</span>
          </div>
        )}
        <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {alertStats && alertStats.critical > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {alertStats.critical}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-500 text-sm">Live</span>
        </div>
      </div>
    </header>
  );
}
