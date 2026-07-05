import { useState, useEffect, useRef, useCallback } from 'react';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  type: 'charging_start' | 'charging_stop' | 'thermal_event' | 'alert' | 'maintenance';
  label: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TelemetryDataPoint {
  timestamp: number;
  time: string;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  soc: number;
  soh: number;
  batteryStatus: 'charging' | 'discharging' | 'idle' | 'thermal_warning' | 'critical';
}

const STATUS_COLORS: Record<TelemetryDataPoint['batteryStatus'], string> = {
  charging: '#22c55e',
  discharging: '#3b82f6',
  idle: '#94a3b8',
  thermal_warning: '#eab308',
  critical: '#ef4444',
};

export function getStatusColor(status: TelemetryDataPoint['batteryStatus']): string {
  return STATUS_COLORS[status];
}

function getLineSegmentColor(voltage: number, soc: number): string {
  if (soc < 10 || voltage < 335) return '#ef4444';
  if (soc < 20 || voltage < 340 || voltage > 390) return '#eab308';
  return '#22c55e';
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTimeFull(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as Intl.DateTimeFormatOptions)
    + '.' + String(ts % 1000).padStart(3, '0');
}

// Deterministic LCG for consistent demo data
function createSimRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export type TimeRange = '1m' | '5m' | '15m' | '1h' | '24h';

const TIME_RANGE_SECONDS: Record<TimeRange, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '24h': 86400,
};

const MAX_VISIBLE_POINTS = 120;

interface UseRealtimeTelemetryOptions {
  batteryId?: string;
  timeRange?: TimeRange;
  enabled?: boolean;
}

export function useRealtimeTelemetry(options: UseRealtimeTelemetryOptions = {}) {
  const { batteryId = 'BAT-001', timeRange = '1m', enabled = true } = options;

  const [data, setData] = useState<TelemetryDataPoint[]>([]);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [stats, setStats] = useState({
    minVoltage: 0,
    maxVoltage: 0,
    avgVoltage: 0,
    currentVoltage: 0,
    voltageChange: 0,
    minCurrent: 0,
    maxCurrent: 0,
    avgCurrent: 0,
    currentCurrent: 0,
    minTemp: 0,
    maxTemp: 0,
    avgTemp: 0,
    currentTemp: 0,
    avgPower: 0,
    currentPower: 0,
  });

  const dataRef = useRef<TelemetryDataPoint[]>([]);
  const eventsRef = useRef<TelemetryEvent[]>([]);
  const tickRef = useRef(0);
  const rngRef = useRef(createSimRng(batteryId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)));
  const baselineRef = useRef({
    voltage: 360 + (rngRef.current() - 0.5) * 20,
    soc: 45 + rngRef.current() * 40,
    soh: 82 + rngRef.current() * 15,
    temp: 28 + rngRef.current() * 8,
    charging: true,
    chargeTicks: 0,
    dischargeTicks: 0,
  });

  const computeStats = useCallback((points: TelemetryDataPoint[]) => {
    if (points.length === 0) return;
    const volts = points.map((p) => p.voltage);
    const currs = points.map((p) => p.current);
    const temps = points.map((p) => p.temperature);
    const powers = points.map((p) => p.power);
    const latest = points[points.length - 1];
    const prev = points.length > 1 ? points[points.length - 2] : latest;

    setStats({
      minVoltage: Math.min(...volts),
      maxVoltage: Math.max(...volts),
      avgVoltage: volts.reduce((a, b) => a + b, 0) / volts.length,
      currentVoltage: latest.voltage,
      voltageChange: latest.voltage - prev.voltage,
      minCurrent: Math.min(...currs),
      maxCurrent: Math.max(...currs),
      avgCurrent: currs.reduce((a, b) => a + b, 0) / currs.length,
      currentCurrent: latest.current,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      currentTemp: latest.temperature,
      avgPower: powers.reduce((a, b) => a + b, 0) / powers.length,
      currentPower: latest.power,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const rng = rngRef.current;
      const bl = baselineRef.current;
      tickRef.current++;
      const tick = tickRef.current;

      // Charging/discharging cycle management
      bl.chargeTicks++;
      const cycleDuration = bl.charging ? 30 + Math.floor(rng() * 50) : 40 + Math.floor(rng() * 80);
      if (bl.chargeTicks >= cycleDuration) {
        bl.charging = !bl.charging;
        bl.chargeTicks = 0;

        // Generate event
        const eventType = bl.charging ? 'charging_start' : 'charging_stop';
        const newEvent: TelemetryEvent = {
          id: `EVT-${Date.now()}`,
          timestamp: Date.now(),
          type: eventType,
          label: bl.charging ? 'Charging Started' : 'Charging Stopped',
          severity: 'info',
        };
        eventsRef.current = [...eventsRef.current.slice(-50), newEvent];
      }

      // Temperature daily cycle (24h sine)
      const hourOfDay = (tick % 1440) / 60;
      const diurnal = Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2) * 4;

      // SOC dynamics
      if (bl.charging) {
        bl.soc = Math.min(98, bl.soc + 0.08 + rng() * 0.12);
      } else {
        bl.dischargeTicks++;
        bl.soc = Math.max(5, bl.soc - 0.06 - rng() * 0.1);
      }

      // Voltage: correlates with SOC + noise
      const socFactor = bl.soc / 100;
      bl.voltage = bl.voltage * 0.92 + (bl.voltage * (0.85 + socFactor * 0.2) * 0.08) + (rng() - 0.5) * 0.8;
      bl.voltage = Math.max(310, Math.min(400, bl.voltage));

      // Current: positive = charging, negative = discharging
      let current: number;
      if (bl.charging) {
        current = 30 + rng() * 80; // 30-110A charging
      } else {
        current = -(20 + rng() * 60); // -20 to -80A discharging
      }

      // Temperature: base + diurnal + Joule heating + noise
      const jouleHeat = Math.abs(current) * 0.03;
      bl.temp = bl.temp * 0.95 + (bl.temp + diurnal + jouleHeat + (rng() - 0.5) * 2) * 0.05;
      bl.temp = Math.max(15, Math.min(58, bl.temp));

      // SOH: very slow degradation
      bl.soh = Math.max(60, bl.soh - rng() * 0.0005);

      // Determine battery status
      let status: TelemetryDataPoint['batteryStatus'] = bl.charging ? 'charging' : 'discharging';
      if (bl.temp > 52) status = 'thermal_warning';
      if (bl.temp > 56 || bl.soc < 5 || bl.voltage < 320) status = 'critical';

      // Sporadic thermal event
      if (tick % 120 === 0 && rng() > 0.7) {
        const thermalEvent: TelemetryEvent = {
          id: `EVT-${Date.now()}`,
          timestamp: Date.now(),
          type: 'thermal_event',
          label: 'Temperature Spike Detected',
          severity: 'warning',
        };
        eventsRef.current = [...eventsRef.current.slice(-50), thermalEvent];
        bl.temp = Math.min(58, bl.temp + 5);
      }

      // Sporadic alert
      if (tick % 200 === 0 && rng() > 0.8) {
        const alertEvent: TelemetryEvent = {
          id: `EVT-${Date.now()}`,
          timestamp: Date.now(),
          type: 'alert',
          label: 'Cell Voltage Imbalance',
          severity: 'critical',
        };
        eventsRef.current = [...eventsRef.current.slice(-50), alertEvent];
      }

      const point: TelemetryDataPoint = {
        timestamp: Date.now(),
        time: formatTime(Date.now()),
        voltage: Math.round(bl.voltage * 100) / 100,
        current: Math.round(current * 100) / 100,
        power: Math.round(bl.voltage * current * 100) / 100,
        temperature: Math.round(bl.temp * 10) / 10,
        soc: Math.round(bl.soc * 10) / 10,
        soh: Math.round(bl.soh * 10) / 10,
        batteryStatus: status,
      };

      const maxPoints = TIME_RANGE_SECONDS[timeRange];
      const newSlice = [...dataRef.current, point].slice(-maxPoints);
      dataRef.current = newSlice;

      setData(newSlice.slice(-MAX_VISIBLE_POINTS));
      setEvents([...eventsRef.current]);
      computeStats(newSlice);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, timeRange, batteryId, computeStats]);

  const getPointColor = useCallback((point: TelemetryDataPoint) => {
    return getLineSegmentColor(point.voltage, point.soc);
  }, []);

  return { data, events, stats, getPointColor, formatTimeFull };
}
