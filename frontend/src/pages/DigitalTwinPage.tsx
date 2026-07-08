import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import Battery3D from '../components/DigitalTwin/Battery3D';
import {
  Thermometer, Battery, Zap, Cpu, Activity,
  AlertTriangle, Gauge, Clock, Flame, X, Radio,
  BarChart3, Waves, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

interface CellData {
  number: number;
  temperature: number;
  voltage: number;
  resistance: number;
  health: number;
  age: number;
  capacityRetention: number;
  predictedFailure: number;
  chargeBalance: number;
}

interface HealthStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

function initCells(): CellData[] {
  const baseTemps = [27.2, 28.5, 26.8, 29.1, 30.3, 27.9, 31.2, 28.8, 29.5, 26.3, 30.1, 27.7, 28.9, 31.5, 27.1, 29.8];
  const baseVolts = [3.82, 3.79, 3.85, 3.81, 3.77, 3.84, 3.80, 3.83, 3.78, 3.86, 3.81, 3.79, 3.84, 3.76, 3.83, 3.80];
  return Array.from({ length: 16 }, (_, i) => ({
    number: i + 1,
    temperature: baseTemps[i],
    voltage: baseVolts[i],
    resistance: +(1.0 + i * 0.04 + Math.random() * 0.3).toFixed(2),
    health: +(94 - i * 0.5 + Math.random() * 2).toFixed(1),
    age: 8 + Math.floor(i / 2) * 2 + Math.floor(Math.random() * 4),
    capacityRetention: +(96 - i * 0.4 + Math.random() * 1.5).toFixed(1),
    predictedFailure: 24 - Math.floor(i * 1.2) + Math.floor(Math.random() * 6),
    chargeBalance: +(50 + (i % 4) * 7 + Math.random() * 8).toFixed(1),
  }));
}

function getHealth(cell: CellData): HealthStyle {
  if (cell.temperature > 52) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.5)', glow: '0 0 24px rgba(239,68,68,0.4)' };
  if (cell.temperature > 45) return { label: 'High Risk', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.5)', glow: '0 0 24px rgba(249,115,22,0.4)' };
  if (cell.temperature > 38) return { label: 'Warning', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.5)', glow: '0 0 24px rgba(234,179,8,0.4)' };
  if (cell.voltage < 3.2 || cell.voltage > 4.25) return { label: 'Warning', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.5)', glow: '0 0 24px rgba(234,179,8,0.4)' };
  return { label: 'Healthy', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.5)', glow: '0 0 24px rgba(34,197,94,0.4)' };
}

function thermalColor(temp: number): string {
  if (temp > 52) return '#ef4444';
  if (temp > 45) return '#f97316';
  if (temp > 38) return '#eab308';
  const ratio = Math.min(1, Math.max(0, (temp - 22) / 16));
  const r = Math.round(34 + ratio * 200);
  const g = Math.round(197 - ratio * 130);
  const b = Math.round(94 - ratio * 60);
  return `rgb(${r},${g},${b})`;
}

const SIM_BUTTONS = [
  { type: 'short-circuit', label: 'Short Circuit', icon: AlertTriangle, desc: 'Sets cell 1 to critical — heat surge, voltage collapse', color: 'text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-500' },
  { type: 'thermal-runaway', label: 'Thermal Runaway', icon: Flame, desc: 'Rapid temperature rise across all cells — cascading failure', color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500' },
  { type: 'over-charging', label: 'Over Charging', icon: Zap, desc: 'Voltage exceeds safe limit — electrolyte breakdown risk', color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500' },
  { type: 'deep-discharge', label: 'Deep Discharge', icon: Battery, desc: 'Charge balance drops — irreversible capacity loss', color: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500' },
  { type: 'cooling-failure', label: 'Cooling Failure', icon: Thermometer, desc: 'Thermal management offline — gradual temperature escalation', color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500' },
];

function generateTimeSeries(baseVolt: number, baseTemp: number, steps: number) {
  return Array.from({ length: steps }, (_, i) => ({
    time: `${i * 5}s`,
    voltage: +(baseVolt + Math.sin(i * 0.5) * 0.05 + (Math.random() - 0.5) * 0.03).toFixed(3),
    temperature: +(baseTemp + Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5) * 0.8).toFixed(1),
    current: +(12 + Math.sin(i * 0.4) * 3 + (Math.random() - 0.5) * 1.5).toFixed(1),
  }));
}

export default function DigitalTwinPage() {
  const [selectedId, setSelectedId] = useState('BT-2024-001');
  const [cells, setCells] = useState<CellData[]>(initCells);
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [packCurrent, setPackCurrent] = useState(12.5);
  const [balancing, setBalancing] = useState(true);
  const [lastSync, setLastSync] = useState('Just now');
  const [aiConfidence, setAiConfidence] = useState(93.5);
  const [showCasing, setShowCasing] = useState(false);

  const cellsRef = useRef(cells);
  const simActiveRef = useRef(false);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { cellsRef.current = cells; }, [cells]);

  const { data: batteries } = useQuery({
    queryKey: ['batteries'],
    queryFn: () => api.getBatteries(),
  });

  // Background cell updates
  useEffect(() => {
    const id = setInterval(() => {
      if (simActiveRef.current) return;
      setCells(prev => prev.map(c => ({
        ...c,
        temperature: +(c.temperature + (Math.random() - 0.5) * 0.6).toFixed(1),
        voltage: +(c.voltage + (Math.random() - 0.5) * 0.02).toFixed(3),
        resistance: +(c.resistance + (Math.random() - 0.5) * 0.05).toFixed(2),
        chargeBalance: Math.min(100, Math.max(0, +(c.chargeBalance + (Math.random() - 0.5) * 1.5).toFixed(1))),
        health: Math.min(100, Math.max(0, +(c.health + (Math.random() - 0.5) * 0.3).toFixed(1))),
        capacityRetention: Math.min(100, Math.max(0, +(c.capacityRetention + (Math.random() - 0.5) * 0.2).toFixed(1))),
        predictedFailure: Math.max(1, c.predictedFailure + (Math.random() > 0.7 ? -1 : 0)),
      })));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Live metrics updates
  useEffect(() => {
    const id = setInterval(() => {
      setPackCurrent(prev => +(prev + (Math.random() - 0.5) * 4).toFixed(1));
      setBalancing(prev => Math.random() > 0.3 ? prev : !prev);
      setLastSync('Updated ' + (Math.floor(Math.random() * 5) + 1) + 's ago');
      setAiConfidence(prev => Math.min(98, Math.max(85, +(prev + (Math.random() - 0.5) * 2).toFixed(1))));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const packVoltage = useMemo(() => +(cells.reduce((s, c) => s + c.voltage, 0)).toFixed(2), [cells]);
  const packTemp = useMemo(() => +(cells.reduce((s, c) => s + c.temperature, 0) / cells.length).toFixed(1), [cells]);
  const powerOutput = useMemo(() => +(packVoltage * Math.abs(packCurrent) / 1000).toFixed(2), [packVoltage, packCurrent]);
  const avgHealth = useMemo(() => +(cells.reduce((s, c) => s + c.health, 0) / cells.length).toFixed(1), [cells]);

  const timeSeries = useMemo(() => generateTimeSeries(packVoltage / 16, packTemp, 20), [packVoltage, packTemp]);
  const healthDistribution = useMemo(() => {
    const h = cells.filter(c => c.temperature <= 38 && c.voltage >= 3.2 && c.voltage <= 4.25).length;
    const w = cells.filter(c => (c.temperature > 38 && c.temperature <= 45) || (c.voltage < 3.2 || c.voltage > 4.25)).length;
    const hr = cells.filter(c => c.temperature > 45 && c.temperature <= 52).length;
    const c = cells.filter(c => c.temperature > 52).length;
    return [
      { name: 'Healthy', value: h, color: '#22c55e' },
      { name: 'Warning', value: w, color: '#eab308' },
      { name: 'High Risk', value: hr, color: '#f97316' },
      { name: 'Critical', value: c, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [cells]);

  const cellCounts = useMemo(() => {
    return cells.map(c => ({ name: `C${c.number}`, temperature: c.temperature, voltage: c.voltage }));
  }, [cells]);

  const startSimulation = useCallback((type: string) => {
    if (simActiveRef.current) return;
    simActiveRef.current = true;
    setActiveSim(type);

    const orig = cellsRef.current.map(c => ({ ...c }));
    const targets = orig.map((c, i) => {
      switch (type) {
        case 'short-circuit': {
          if (i === 0) return { temp: 56, volt: 0.1, balance: 5 };
          if (i < 4) return { temp: c.temperature + 8 };
          return { temp: c.temperature + 3 };
        }
        case 'thermal-runaway':
          return { temp: c.temperature + 14 + Math.random() * 6 };
        case 'over-charging':
          return { volt: c.voltage + 0.4 };
        case 'deep-discharge':
          return { balance: 5 + Math.random() * 8 };
        case 'cooling-failure':
          return { temp: c.temperature + 8 + Math.random() * 4 };
        default:
          return {};
      }
    });

    let step = 0;
    const totalSteps = 30;

    simIntervalRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        simActiveRef.current = false;
        setActiveSim(null);
        return;
      }
      const p = step / totalSteps;
      setCells(prev => prev.map((cell, i) => {
        const t = targets[i];
        return {
          ...cell,
          temperature: t.temp !== undefined ? +(orig[i].temperature + (t.temp - orig[i].temperature) * p).toFixed(1) : cell.temperature,
          voltage: t.volt !== undefined ? +(orig[i].voltage + (t.volt - orig[i].voltage) * p).toFixed(3) : cell.voltage,
          chargeBalance: t.balance !== undefined ? Math.min(100, Math.max(0, +(orig[i].chargeBalance + (t.balance - orig[i].chargeBalance) * p).toFixed(1))) : cell.chargeBalance,
        };
      }));
    }, 100);
  }, []);

  const metricCards = useMemo(() => [
    { label: 'Pack Voltage', value: packVoltage + ' V', icon: Battery, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pack Current', value: packCurrent.toFixed(1) + ' A', icon: Zap, color: Math.abs(packCurrent) > 80 ? 'text-red-400' : 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Avg Temperature', value: packTemp + ' °C', icon: Thermometer, color: packTemp > 45 ? 'text-red-400' : packTemp > 38 ? 'text-yellow-400' : 'text-green-400', bg: 'bg-orange-500/10' },
    { label: 'Power Output', value: powerOutput + ' kW', icon: Gauge, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Avg Health', value: avgHealth + ' %', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Cell Balancing', value: balancing ? 'Active' : 'Idle', icon: Cpu, color: balancing ? 'text-purple-400' : 'text-dark-400', bg: 'bg-violet-500/10' },
  ], [packVoltage, packCurrent, packTemp, powerOutput, avgHealth, balancing]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Twin</h1>
          <p className="text-dark-400 mt-1">Real-time 3D battery simulation with AI-powered diagnostics</p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white text-sm"
        >
          {(batteries?.items || []).map((b: any) => (
            <option key={b.id} value={b.battery_id}>{b.battery_id} — {b.manufacturer}</option>
          ))}
        </select>
      </div>

      {/* Hero Section: 3D Battery + Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-primary-500" />
                <h3 className="text-white font-semibold">Battery Pack — {selectedId}</h3>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Healthy</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Warning</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High Risk</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
              </div>
            </div>
            <div className="h-[420px]">
              <Battery3D
                cells={cells}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
                activeSim={activeSim}
                showCasing={showCasing}
                onToggleCasing={() => setShowCasing(v => !v)}
              />
            </div>
          </div>
        </div>

        {/* Live Metrics Sidebar */}
        <div className="space-y-3">
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary-500" /> Live Metrics
            </h3>
            <div className="space-y-2">
              {metricCards.map(m => (
                <div key={m.label} className="flex items-center justify-between p-2.5 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-md ${m.bg} flex items-center justify-center`}>
                      <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                    </div>
                    <span className="text-dark-300 text-xs">{m.label}</span>
                  </div>
                  <span className="text-white font-medium text-sm font-mono">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Live</span>
              </div>
              <span className="text-dark-400 text-xs">{lastSync}</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-300">AI Confidence</span>
                <span className="text-white font-mono font-medium">{aiConfidence.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                  style={{ width: aiConfidence + '%' }}
                />
              </div>
            </div>
            {selectedCell && (
              <div className="mt-3 pt-3 border-t border-dark-700">
                <div className="text-xs text-dark-400 mb-2">Selected: Cell #{selectedCell.number}</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-dark-800 rounded p-1.5">
                    <span className="text-dark-500">Voltage</span>
                    <div className="text-white font-mono font-medium">{selectedCell.voltage.toFixed(3)}V</div>
                  </div>
                  <div className="bg-dark-800 rounded p-1.5">
                    <span className="text-dark-500">Temp</span>
                    <div className="text-white font-mono font-medium">{selectedCell.temperature.toFixed(1)}°C</div>
                  </div>
                  <div className="bg-dark-800 rounded p-1.5">
                    <span className="text-dark-500">Resistance</span>
                    <div className="text-white font-mono font-medium">{selectedCell.resistance.toFixed(2)}mΩ</div>
                  </div>
                  <div className="bg-dark-800 rounded p-1.5">
                    <span className="text-dark-500">Health</span>
                    <div className="text-white font-mono font-medium">{selectedCell.health.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cell Grid + Thermal Grid row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cell Grid */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              Cell Grid — 4×4
            </h3>
            <span className="text-dark-400 text-xs">Click cell for details</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {cells.map(cell => {
              const health = getHealth(cell);
              const isSelected = selectedCell?.number === cell.number;
              return (
                <div
                  key={cell.number}
                  className="relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 hover:scale-[1.05] hover:z-10"
                  style={{
                    backgroundColor: health.bg,
                    borderColor: isSelected ? health.color : health.border,
                    boxShadow: isSelected ? health.glow : 'none',
                  }}
                  onClick={() => setSelectedCell(cell)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white font-bold text-sm">#{cell.number}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: health.color }} />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color: health.color }}>
                    <Thermometer className="w-3 h-3" />
                    {cell.temperature.toFixed(1)}°C
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-dark-300 mt-0.5">
                    <Zap className="w-3 h-3" />
                    {cell.voltage.toFixed(3)}V
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <Activity className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Cell Detail Panel */}
          {selectedCell && (
            <div className="mt-4 rounded-xl border border-dark-600 bg-dark-800/80 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary-500" />
                  Cell #{selectedCell.number} — Detailed Telemetry
                </h4>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Cell Voltage', value: selectedCell.voltage.toFixed(3) + ' V', icon: Zap, color: 'text-green-400' },
                  { label: 'Temperature', value: selectedCell.temperature.toFixed(1) + ' °C', icon: Thermometer, color: selectedCell.temperature > 45 ? 'text-red-400' : selectedCell.temperature > 38 ? 'text-yellow-400' : 'text-green-400' },
                  { label: 'Internal Resistance', value: selectedCell.resistance.toFixed(2) + ' mΩ', icon: Gauge, color: 'text-blue-400' },
                  { label: 'Cell Health (SOH)', value: selectedCell.health.toFixed(1) + ' %', icon: Activity, color: 'text-purple-400' },
                  { label: 'Cell Age', value: selectedCell.age + ' months', icon: Clock, color: 'text-cyan-400' },
                  { label: 'Capacity Retention', value: selectedCell.capacityRetention.toFixed(1) + ' %', icon: Battery, color: 'text-emerald-400' },
                  { label: 'Predicted Failure', value: selectedCell.predictedFailure + ' months', icon: AlertTriangle, color: selectedCell.predictedFailure < 12 ? 'text-red-400' : 'text-yellow-400' },
                  { label: 'Charge Balance', value: selectedCell.chargeBalance.toFixed(1) + ' %', icon: Activity, color: 'text-indigo-400' },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 p-2.5 bg-dark-900/60 rounded-lg border border-dark-700">
                    <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                    <div>
                      <p className="text-dark-400 text-[10px]">{m.label}</p>
                      <p className="text-white font-medium text-xs font-mono">{m.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thermal Grid */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-primary-500" /> Thermal Grid
            </h3>
            <span className="text-dark-400 text-xs">Cell temperature distribution</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cells.map(cell => (
              <div
                key={cell.number}
                className="aspect-square rounded-lg border border-dark-600 transition-all duration-300 cursor-pointer hover:scale-110 relative group"
                style={{ backgroundColor: thermalColor(cell.temperature) }}
                onClick={() => setSelectedCell(cell)}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900/60 rounded-lg">
                  <span className="text-white text-[10px] font-bold">{cell.temperature.toFixed(1)}°</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-dark-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ backgroundColor: '#22c55e' }} /> 22°C</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ backgroundColor: '#eab308' }} /> 38°C</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ backgroundColor: '#f97316' }} /> 45°C</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ backgroundColor: '#ef4444' }} /> 52°C+</span>
          </div>

          {/* Distribution Bar */}
          <div className="mt-4">
            <h4 className="text-dark-400 text-xs mb-2">Health Distribution</h4>
            <div className="flex h-3 rounded-full overflow-hidden">
              {healthDistribution.map(d => (
                <div
                  key={d.name}
                  style={{ backgroundColor: d.color, width: `${(d.value / cells.length) * 100}%` }}
                  className="transition-all duration-500"
                  title={`${d.name}: ${d.value} cells`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-dark-500">
              {healthDistribution.map(d => (
                <span key={d.name}>{d.name}: {d.value}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Waves className="w-4 h-4 text-primary-500" />
            Simulation Controls
          </h3>
          {activeSim && (
            <span className="text-xs font-medium text-red-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              {activeSim.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} in progress...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SIM_BUTTONS.map(btn => {
            const isActive = activeSim === btn.type;
            const Icon = btn.icon;
            return (
              <button
                key={btn.type}
                onClick={() => startSimulation(btn.type)}
                disabled={!!activeSim}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${btn.color} ${isActive ? 'bg-white/10 ring-2 ring-white/20 scale-[1.02]' : 'hover:scale-[1.03]'}`}
                title={btn.desc}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs">{btn.label}</span>
                <span className="text-[10px] text-dark-500 font-normal text-center leading-tight">{btn.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cell Voltage Chart */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Cell Voltage Distribution
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cellCounts} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[3.5, 4.0]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: number) => [value.toFixed(3) + 'V', 'Voltage']}
                />
                <Bar dataKey="voltage" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={14}>
                  {cellCounts.map((_, i) => (
                    <defs key={i}>
                      <linearGradient id={`voltGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
            <Thermometer className="w-4 h-4 text-orange-400" /> Cell Temperature Trend
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cellCounts} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: number) => [value.toFixed(1) + '°C', 'Temperature']}
                />
                <Bar dataKey="temperature" fill="#f97316" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Series */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-purple-400" /> Live Voltage Trend
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="voltGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[3.85, 3.95]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="voltage" stroke="#3b82f6" fill="url(#voltGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Diagnosis Section */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-500" /> AI Diagnosis
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Active</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Battery Health',
              value: avgHealth + '%',
              status: +avgHealth > 85 ? 'Good' : +avgHealth > 70 ? 'Fair' : 'Poor',
              statusColor: +avgHealth > 85 ? 'text-green-400' : +avgHealth > 70 ? 'text-yellow-400' : 'text-red-400',
              detail: 'Overall pack state of health based on capacity fade and impedance growth.',
            },
            {
              title: 'Thermal Status',
              value: packTemp + '°C',
              status: packTemp > 45 ? 'Critical' : packTemp > 38 ? 'Warning' : 'Normal',
              statusColor: packTemp > 45 ? 'text-red-400' : packTemp > 38 ? 'text-yellow-400' : 'text-green-400',
              detail: 'Average cell temperature. Cells above 45°C require immediate attention.',
            },
            {
              title: 'Cell Balance',
              value: balancing ? 'Active' : 'Idle',
              status: balancing ? 'Balancing' : 'Stable',
              statusColor: balancing ? 'text-purple-400' : 'text-green-400',
              detail: 'Cell balancing equalizes charge across all cells to maximize usable capacity.',
            },
            {
              title: 'AI Prediction',
              value: aiConfidence.toFixed(1) + '% confident',
              status: 'Analyzing ' + cells.length + ' cells',
              statusColor: 'text-blue-400',
              detail: 'Predictive model estimates ' + Math.round(cells.reduce((s, c) => s + c.predictedFailure, 0) / cells.length) + ' months until first cell replacement needed.',
            },
          ].map(card => (
            <div key={card.title} className="bg-dark-800/60 rounded-xl border border-dark-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-400 text-xs uppercase tracking-wider">{card.title}</span>
                <span className={`text-xs font-medium ${card.statusColor}`}>{card.status}</span>
              </div>
              <div className="text-white text-xl font-bold mb-1">{card.value}</div>
              <p className="text-dark-500 text-xs">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
