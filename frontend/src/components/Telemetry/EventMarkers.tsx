import type { TelemetryEvent } from '../../hooks/useRealtimeTelemetry';
import { Zap, Thermometer, AlertTriangle, Wrench, Play, Square } from 'lucide-react';

interface EventMarkersProps {
  events: TelemetryEvent[];
  maxVisible?: number;
}

const EVENT_CONFIG: Record<TelemetryEvent['type'], { icon: typeof Zap; color: string; bgColor: string }> = {
  charging_start: { icon: Play, color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
  charging_stop: { icon: Square, color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)' },
  thermal_event: { icon: Thermometer, color: '#eab308', bgColor: 'rgba(234,179,8,0.1)' },
  alert: { icon: AlertTriangle, color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' },
  maintenance: { icon: Wrench, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)' },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function EventMarkers({ events, maxVisible = 8 }: EventMarkersProps) {
  const recent = events.slice(-maxVisible).reverse();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Recent Events</span>
        <span className="text-[10px] bg-dark-700 text-dark-400 px-1.5 py-0.5 rounded-full">{events.length}</span>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
        {recent.length === 0 && (
          <div className="text-dark-500 text-xs italic py-2">No events yet...</div>
        )}
        {recent.map((event) => {
          const config = EVENT_CONFIG[event.type];
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-dark-700/30 hover:border-dark-600/50 transition-colors"
              style={{ backgroundColor: config.bgColor }}
            >
              <div className="flex-shrink-0">
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-dark-200 truncate">{event.label}</div>
                <div className="text-[10px] text-dark-500">{timeAgo(event.timestamp)}</div>
              </div>
              <div
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
