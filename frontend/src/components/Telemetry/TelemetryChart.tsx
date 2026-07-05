import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { Clock, Battery, Zap, Thermometer, Activity } from 'lucide-react';
import { useRealtimeTelemetry, type TimeRange, type TelemetryDataPoint } from '../../hooks/useRealtimeTelemetry';
import StatsBar from './StatsBar';
import EventMarkers from './EventMarkers';

interface TelemetryChartProps {
  batteryId?: string;
  batteryName?: string;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1 Min', value: '1m' },
  { label: '5 Min', value: '5m' },
  { label: '15 Min', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
];

const CHART_CHANNELS = [
  { key: 'voltage', label: 'Voltage', unit: 'V', color: '#22c55e', icon: Zap, yAxisId: 'left' },
  { key: 'current', label: 'Current', unit: 'A', color: '#3b82f6', icon: Activity, yAxisId: 'right' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f97316', icon: Thermometer, yAxisId: 'right2' },
] as const;

function CustomTooltip({ active, payload, label: _label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as TelemetryDataPoint | undefined;
  if (!point) return null;

  const power = point.power;
  const powerDisplay = Math.abs(power) >= 1000
    ? `${(power / 1000).toFixed(2)} kW`
    : `${power.toFixed(1)} W`;

  return (
    <div className="bg-dark-900/95 border border-dark-600/80 rounded-lg px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-dark-700/50">
        <Clock className="w-3 h-3 text-dark-400" />
        <span className="text-[11px] text-dark-400 font-mono">{point.time}</span>
        <span
          className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: point.batteryStatus === 'charging' ? 'rgba(34,197,94,0.2)' :
              point.batteryStatus === 'thermal_warning' ? 'rgba(234,179,8,0.2)' :
              point.batteryStatus === 'critical' ? 'rgba(239,68,68,0.2)' :
              'rgba(59,130,246,0.2)',
            color: point.batteryStatus === 'charging' ? '#22c55e' :
              point.batteryStatus === 'thermal_warning' ? '#eab308' :
              point.batteryStatus === 'critical' ? '#ef4444' :
              '#3b82f6',
          }}
        >
          {point.batteryStatus.replace('_', ' ')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-[10px] text-dark-400">Voltage</span>
          <span className="text-[11px] font-bold font-mono text-green-400 ml-auto">{point.voltage.toFixed(2)} V</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
          <span className="text-[10px] text-dark-400">Current</span>
          <span className="text-[11px] font-bold font-mono text-blue-400 ml-auto">{point.current > 0 ? '+' : ''}{point.current.toFixed(2)} A</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a855f7' }} />
          <span className="text-[10px] text-dark-400">Power</span>
          <span className="text-[11px] font-bold font-mono text-purple-400 ml-auto">{powerDisplay}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
          <span className="text-[10px] text-dark-400">Temp</span>
          <span className="text-[11px] font-bold font-mono text-orange-400 ml-auto">{point.temperature.toFixed(1)} °C</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
          <span className="text-[10px] text-dark-400">SOC</span>
          <span className="text-[11px] font-bold font-mono text-cyan-400 ml-auto">{point.soc.toFixed(1)} %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
          <span className="text-[10px] text-dark-400">SOH</span>
          <span className="text-[11px] font-bold font-mono text-violet-400 ml-auto">{point.soh.toFixed(1)} %</span>
        </div>
      </div>
    </div>
  );
}

export default function TelemetryChart({ batteryId = 'BAT-001', batteryName = 'Battery Pack Alpha' }: TelemetryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [selectedChannels, setSelectedChannels] = useState<Record<string, boolean>>({
    voltage: true,
    current: true,
    temperature: false,
  });
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, events, stats } = useRealtimeTelemetry({
    batteryId,
    timeRange,
    enabled: true,
  });

  const latestPoint = data.length > 0 ? data[data.length - 1] : null;

  const voltageData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      voltageLabel: d.voltage.toFixed(2),
    }));
  }, [data]);

  const handleChannelToggle = useCallback((key: string) => {
    setSelectedChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollLeft = chartRef.current.scrollWidth;
    }
  }, [data.length]);

  const getYDomain = useCallback(() => {
    if (data.length === 0) return [330, 395];
    const volts = data.map((d) => d.voltage);
    const min = Math.min(...volts);
    const max = Math.max(...volts);
    const padding = (max - min) * 0.15 || 5;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data]);

  const getRightYDomain = useCallback(() => {
    if (data.length === 0) return [-100, 120];
    const currs = data.map((d) => d.current);
    const min = Math.min(...currs);
    const max = Math.max(...currs);
    const padding = (max - min) * 0.2 || 10;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data]);

  const getRight2YDomain = useCallback(() => {
    if (data.length === 0) return [15, 55];
    const temps = data.map((d) => d.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const padding = (max - min) * 0.2 || 3;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data]);

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700/50 bg-dark-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <Battery className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Telemetry Monitor</h3>
              <p className="text-[10px] text-dark-400">{batteryName} ({batteryId})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live</span>
            </div>
            {/* Channel toggles */}
            <div className="flex items-center gap-1 ml-2">
              {CHART_CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => handleChannelToggle(ch.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                    selectedChannels[ch.key]
                      ? 'border-opacity-40'
                      : 'border-dark-700 bg-dark-800 text-dark-500'
                  }`}
                  style={
                    selectedChannels[ch.key]
                      ? { borderColor: `${ch.color}60`, backgroundColor: `${ch.color}15`, color: ch.color }
                      : undefined
                  }
                >
                  <ch.icon className="w-3 h-3" />
                  {ch.label}
                </button>
              ))}
            </div>
            {/* Time range */}
            <div className="flex items-center bg-dark-800 rounded-lg border border-dark-700/50 p-0.5 ml-2">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setTimeRange(tr.value)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    timeRange === tr.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-dark-400 hover:text-dark-200'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 pt-3">
        <StatsBar
          voltage={{
            min: stats.minVoltage,
            max: stats.maxVoltage,
            avg: stats.avgVoltage,
            current: stats.currentVoltage,
            change: stats.voltageChange,
          }}
          current={{
            min: stats.minCurrent,
            max: stats.maxCurrent,
            avg: stats.avgCurrent,
            current: stats.currentCurrent,
          }}
          temperature={{
            min: stats.minTemp,
            max: stats.maxTemp,
            avg: stats.avgTemp,
            current: stats.currentTemp,
          }}
          power={{
            avg: stats.avgPower,
            current: stats.currentPower,
          }}
        />
      </div>

      {/* Chart + Events */}
      <div className="flex">
        {/* Main Chart */}
        <div className="flex-1 px-4 pb-3" ref={chartRef}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={voltageData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="voltageGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="currentGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="tempGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="#1e293b"
                  horizontal={true}
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  stroke="#334155"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />

                {/* Left Y-Axis: Voltage */}
                {selectedChannels.voltage && (
                  <YAxis
                    yAxisId="left"
                    stroke="#22c55e"
                    tick={{ fontSize: 10, fill: '#22c55e' }}
                    tickLine={false}
                    axisLine={false}
                    domain={getYDomain()}
                    tickFormatter={(v: number) => `${v}`}
                    width={45}
                  />
                )}

                {/* Right Y-Axis: Current */}
                {selectedChannels.current && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#3b82f6"
                    tick={{ fontSize: 10, fill: '#3b82f6' }}
                    tickLine={false}
                    axisLine={false}
                    domain={getRightYDomain()}
                    tickFormatter={(v: number) => `${v}`}
                    width={40}
                  />
                )}

                {/* Right2 Y-Axis: Temperature */}
                {selectedChannels.temperature && (
                  <YAxis
                    yAxisId="right2"
                    orientation="right"
                    stroke="#f97316"
                    tick={{ fontSize: 10, fill: '#f97316' }}
                    tickLine={false}
                    axisLine={false}
                    domain={getRight2YDomain()}
                    tickFormatter={(v: number) => `${v}°`}
                    width={35}
                  />
                )}

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  isAnimationActive={false}
                />

                {/* Zero line for current */}
                {selectedChannels.current && (
                  <ReferenceLine
                    yAxisId="right"
                    y={0}
                    stroke="#475569"
                    strokeDasharray="6 4"
                    strokeWidth={1}
                  />
                )}

                {/* Voltage line */}
                {selectedChannels.voltage && (
                  <>
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="voltage"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#22c55e', stroke: '#0a0a0a', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    {/* Fill area */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="voltage"
                      stroke="none"
                      fill="url(#voltageGlow)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </>
                )}

                {/* Current line */}
                {selectedChannels.current && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="current"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0a0a0a', strokeWidth: 2 }}
                    strokeDasharray="4 2"
                    isAnimationActive={false}
                  />
                )}

                {/* Temperature line */}
                {selectedChannels.temperature && (
                  <Line
                    yAxisId="right2"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316', stroke: '#0a0a0a', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                )}

                {/* Glowing latest point */}
                {latestPoint && selectedChannels.voltage && (
                  <ReferenceDot
                    yAxisId="left"
                    x={latestPoint.time}
                    r={0}
                    isFront
                  >
                    {/* Glow is rendered via SVG above */}
                  </ReferenceDot>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Time axis label */}
          <div className="flex items-center justify-between mt-1 px-1">
            <span className="text-[9px] text-dark-600 font-mono">
              {data.length > 0 ? data[0].time : '--:--:--'}
            </span>
            <span className="text-[9px] text-dark-600 font-mono">
              {data.length > 0 ? `${data.length} points · 1s interval` : 'Waiting for data...'}
            </span>
            <span className="text-[9px] text-dark-600 font-mono">
              {data.length > 0 ? data[data.length - 1].time : '--:--:--'}
            </span>
          </div>
        </div>

        {/* Event Sidebar */}
        <div className="w-52 border-l border-dark-700/50 px-3 py-3 bg-dark-800/30">
          <EventMarkers events={events} maxVisible={10} />
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 border-t border-dark-700/30 bg-dark-800/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-dark-400">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[9px] text-dark-400">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[9px] text-dark-400">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] text-dark-400">Discharging</span>
          </div>
        </div>
        <div className="text-[9px] text-dark-500 font-mono">
          {latestPoint
            ? `P = ${latestPoint.voltage.toFixed(2)}V × ${latestPoint.current.toFixed(2)}A = ${Math.abs(latestPoint.power) >= 1000 ? (latestPoint.power / 1000).toFixed(2) + 'kW' : latestPoint.power.toFixed(1) + 'W'}`
            : 'Waiting...'
          }
        </div>
      </div>
    </div>
  );
}
