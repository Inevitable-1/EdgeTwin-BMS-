import { Activity, Thermometer, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsBarProps {
  voltage: {
    min: number;
    max: number;
    avg: number;
    current: number;
    change: number;
  };
  current: {
    min: number;
    max: number;
    avg: number;
    current: number;
  };
  temperature: {
    min: number;
    max: number;
    avg: number;
    current: number;
  };
  power: {
    avg: number;
    current: number;
  };
}

function formatNum(v: number, decimals = 1): string {
  return v.toFixed(decimals);
}

function ChangeIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.01) {
    return <span className="text-dark-400 flex items-center gap-0.5"><Minus className="w-3 h-3" />0.00</span>;
  }
  if (value > 0) {
    return (
      <span className="text-green-400 flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3" />+{formatNum(value, 2)}
      </span>
    );
  }
  return (
    <span className="text-red-400 flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3" />{formatNum(value, 2)}
    </span>
  );
}

function StatItem({ label, value, unit, color }: { label: string; value: number; unit: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-dark-500 font-medium">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: color || '#fff' }}>
        {formatNum(value, 2)}{unit}
      </span>
    </div>
  );
}

export default function StatsBar({ voltage, current: curr, temperature, power }: StatsBarProps) {
  const getVoltageColor = () => {
    if (voltage.current < 335 || voltage.current > 390) return '#ef4444';
    if (voltage.current < 345 || voltage.current > 380) return '#eab308';
    return '#22c55e';
  };

  const getTempColor = () => {
    if (temperature.current > 52) return '#ef4444';
    if (temperature.current > 42) return '#eab308';
    return '#22c55e';
  };

  const getCurrColor = () => {
    if (Math.abs(curr.current) > 100) return '#ef4444';
    if (Math.abs(curr.current) > 80) return '#eab308';
    return '#3b82f6';
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-3">
      {/* Voltage Stats */}
      <div className="bg-dark-800/80 border border-dark-700/50 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[11px] font-semibold text-dark-300 uppercase tracking-wider">Voltage</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-black font-mono" style={{ color: getVoltageColor() }}>
            {formatNum(voltage.current, 2)}
          </span>
          <span className="text-xs text-dark-400">V</span>
          <ChangeIndicator value={voltage.change} />
        </div>
        <div className="flex gap-3">
          <StatItem label="Min" value={voltage.min} unit="V" color="#ef4444" />
          <StatItem label="Max" value={voltage.max} unit="V" color="#22c55e" />
          <StatItem label="Avg" value={voltage.avg} unit="V" color="#94a3b8" />
        </div>
      </div>

      {/* Current Stats */}
      <div className="bg-dark-800/80 border border-dark-700/50 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-dark-300 uppercase tracking-wider">Current</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-black font-mono" style={{ color: getCurrColor() }}>
            {curr.current > 0 ? '+' : ''}{formatNum(curr.current, 2)}
          </span>
          <span className="text-xs text-dark-400">A</span>
        </div>
        <div className="flex gap-3">
          <StatItem label="Min" value={curr.min} unit="A" color="#ef4444" />
          <StatItem label="Max" value={curr.max} unit="A" color="#22c55e" />
          <StatItem label="Avg" value={curr.avg} unit="A" color="#94a3b8" />
        </div>
      </div>

      {/* Temperature Stats */}
      <div className="bg-dark-800/80 border border-dark-700/50 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[11px] font-semibold text-dark-300 uppercase tracking-wider">Temperature</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-black font-mono" style={{ color: getTempColor() }}>
            {formatNum(temperature.current, 1)}
          </span>
          <span className="text-xs text-dark-400">°C</span>
        </div>
        <div className="flex gap-3">
          <StatItem label="Min" value={temperature.min} unit="°C" color="#ef4444" />
          <StatItem label="Max" value={temperature.max} unit="°C" color="#22c55e" />
          <StatItem label="Avg" value={temperature.avg} unit="°C" color="#94a3b8" />
        </div>
      </div>

      {/* Power Stats */}
      <div className="bg-dark-800/80 border border-dark-700/50 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-semibold text-dark-300 uppercase tracking-wider">Power (V×I)</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-black font-mono text-purple-400">
            {Math.abs(power.current) >= 1000
              ? (power.current / 1000).toFixed(2)
              : formatNum(power.current, 1)
            }
          </span>
          <span className="text-xs text-dark-400">
            {Math.abs(power.current) >= 1000 ? 'kW' : 'W'}
          </span>
        </div>
        <div className="flex gap-3">
          <StatItem label="Avg" value={power.avg} unit="W" color="#94a3b8" />
          <StatItem label="Peak" value={power.avg * 1.2} unit="W" color="#a855f7" />
        </div>
      </div>
    </div>
  );
}
