import {
  USERS,
  batteries,
  alerts,
  maintenanceRecords,
  generateTelemetryHistory,
  generateCellVoltages,
  generateCellTemperatures,
} from '../data/seedData';
import type { User, Battery, Alert, TelemetryPoint } from '../data/seedData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function delay(min: number = 100, max: number = 300): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function paginate<T>(items: T[], params?: { page?: number; page_size?: number }): { items: T[]; total: number; page: number; pageSize: number; pages: number } {
  const page = params?.page ?? 1;
  const pageSize = params?.page_size ?? 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
    pages: Math.ceil(items.length / pageSize),
  };
}

function generateFakeJWT(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 3600000 }));
  const signature = btoa(`mock-signature-${userId}`);
  return `${header}.${payload}.${signature}`;
}

interface Fleet {
  id: string;
  name: string;
  description: string;
  battery_count: number;
  active_count: number;
  avg_soh: number;
  status: 'active' | 'inactive';
}

const fleetData: Fleet[] = [
  { id: 'fleet-tata-ev', name: 'Tata EV Fleet', description: 'Tata Motors electric vehicle fleet across India', battery_count: 0, active_count: 0, avg_soh: 0, status: 'active' },
  { id: 'fleet-mahindra-ev', name: 'Mahindra EV Fleet', description: 'Mahindra electric vehicle fleet', battery_count: 0, active_count: 0, avg_soh: 0, status: 'active' },
  { id: 'fleet-ola-ev', name: 'Ola Electric Fleet', description: 'Ola Electric two-wheeler fleet', battery_count: 0, active_count: 0, avg_soh: 0, status: 'active' },
];

function computeFleetStats(): void {
  fleetData.forEach((fleet) => {
    const bats = batteries.filter((b) => b.fleet_id === fleet.id);
    fleet.battery_count = bats.length;
    fleet.active_count = bats.filter((b) => b.status === 'active').length;
    fleet.avg_soh = bats.length > 0
      ? Math.round(bats.reduce((sum, b) => sum + b.current_soh, 0) / bats.length * 10) / 10
      : 0;
  });
}
computeFleetStats();

interface BatteryWithTelemetry extends Battery {
  latest_telemetry: TelemetryPoint;
  cell_voltages: number[];
  cell_temperatures: number[];
}

interface BatteryHealth {
  battery_id: string;
  vehicle_name: string;
  manufacturer: string;
  chemistry: string;
  capacity_kwh: number;
  current_soh: number;
  current_soc: number;
  status: string;
  cycle_count: number;
  health_score: number;
  fleet_id: string;
}

interface TelemetryStats {
  avg_voltage: number;
  max_voltage: number;
  min_voltage: number;
  avg_current: number;
  max_current: number;
  avg_temperature: number;
  max_temperature: number;
  avg_soc: number;
  data_points: number;
}

interface Predictions {
  soh: { value: number; confidence: number; explanation: Record<string, number> };
  soc: { value: number; confidence: number; explanation: Record<string, number> };
  thermal: { value: number; confidence: number; explanation: Record<string, number> };
  anomaly: { value: number; confidence: number; explanation: Record<string, number> };
  rul: { value: number; confidence: number; explanation: Record<string, number> };
  failure_probability: { value: number; confidence: number; explanation: Record<string, number> };
}

interface AlertStats {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

interface DigitalTwin {
  battery_id: string;
  name: string;
  sync_status: string;
  last_sync: string;
  configuration: Record<string, unknown>;
}

class MockApiService {
  private _alerts = [...alerts];
  private _maintenanceRecords = [...maintenanceRecords];

  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    await delay();
    const user = USERS.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    return { access_token: generateFakeJWT(user.id), user };
  }

  async getCurrentUser(): Promise<User> {
    await delay();
    return USERS[0];
  }

  // ─── Fleets ──────────────────────────────────────────────────────────────

  async getFleets(params?: { page?: number; page_size?: number; search?: string }): Promise<{ items: Fleet[]; total: number }> {
    await delay();
    let result = [...fleetData];
    if (params?.search) {
      const s = params.search.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(s) || f.description.toLowerCase().includes(s));
    }
    const paginated = paginate(result, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getFleet(id: string): Promise<Fleet> {
    await delay();
    const fleet = fleetData.find((f) => f.id === id);
    if (!fleet) throw new Error(`Fleet ${id} not found`);
    return { ...fleet };
  }

  async getFleetStatistics(id: string): Promise<Fleet & { soh_distribution: Record<string, number>; status_breakdown: Record<string, number> }> {
    await delay();
    const fleet = fleetData.find((f) => f.id === id);
    if (!fleet) throw new Error(`Fleet ${id} not found`);
    const bats = batteries.filter((b) => b.fleet_id === id);
    const sohDist: Record<string, number> = { 'excellent': 0, 'good': 0, 'fair': 0, 'poor': 0 };
    const statusBreak: Record<string, number> = {};
    bats.forEach((b) => {
      if (b.current_soh >= 90) sohDist['excellent']++;
      else if (b.current_soh >= 80) sohDist['good']++;
      else if (b.current_soh >= 70) sohDist['fair']++;
      else sohDist['poor']++;
      statusBreak[b.status] = (statusBreak[b.status] || 0) + 1;
    });
    return { ...fleet, soh_distribution: sohDist, status_breakdown: statusBreak };
  }

  async createFleet(data: { name: string; description?: string }): Promise<Fleet> {
    await delay();
    const newFleet: Fleet = {
      id: `fleet-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      battery_count: 0,
      active_count: 0,
      avg_soh: 0,
      status: 'active',
    };
    fleetData.push(newFleet);
    return newFleet;
  }

  async updateFleet(id: string, data: { name?: string; description?: string }): Promise<Fleet> {
    await delay();
    const idx = fleetData.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error(`Fleet ${id} not found`);
    if (data.name) fleetData[idx].name = data.name;
    if (data.description) fleetData[idx].description = data.description;
    return { ...fleetData[idx] };
  }

  async deleteFleet(id: string): Promise<void> {
    await delay();
    const idx = fleetData.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error(`Fleet ${id} not found`);
    fleetData.splice(idx, 1);
  }

  // ─── Batteries ───────────────────────────────────────────────────────────

  async getBatteries(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    fleet_id?: string;
    status?: string;
  }): Promise<{ items: Battery[]; total: number }> {
    await delay();
    let result = [...batteries];
    if (params?.search) {
      const s = params.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.battery_id.toLowerCase().includes(s) ||
          b.vehicle_name.toLowerCase().includes(s) ||
          b.manufacturer.toLowerCase().includes(s)
      );
    }
    if (params?.fleet_id) {
      result = result.filter((b) => b.fleet_id === params.fleet_id);
    }
    if (params?.status) {
      result = result.filter((b) => b.status === params.status);
    }
    const paginated = paginate(result, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getBattery(id: string): Promise<Battery> {
    await delay();
    const battery = batteries.find((b) => b.id === id || b.battery_id === id);
    if (!battery) throw new Error(`Battery ${id} not found`);
    return { ...battery };
  }

  async getBatteryHealth(fleetId?: string): Promise<BatteryHealth[]> {
    await delay();
    let result = [...batteries];
    if (fleetId) {
      result = result.filter((b) => b.fleet_id === fleetId);
    }
    return result.map((b) => ({
      battery_id: b.battery_id,
      vehicle_name: b.vehicle_name,
      manufacturer: b.manufacturer,
      chemistry: b.chemistry,
      capacity_kwh: b.capacity_kwh,
      current_soh: b.current_soh,
      current_soc: b.current_soc,
      status: b.status,
      cycle_count: b.cycle_count,
      health_score: b.health_score,
      fleet_id: b.fleet_id,
    }));
  }

  async getBatteryWithTelemetry(id: string): Promise<BatteryWithTelemetry> {
    await delay();
    const battery = batteries.find((b) => b.id === id || b.battery_id === id);
    if (!battery) throw new Error(`Battery ${id} not found`);
    return {
      ...battery,
      latest_telemetry: {
        timestamp: new Date().toISOString(),
        voltage: battery.voltage,
        current: battery.current,
        temperature: battery.temperature,
        soc: battery.current_soc,
        soh: battery.current_soh,
      },
      cell_voltages: generateCellVoltages(),
      cell_temperatures: generateCellTemperatures(),
    };
  }

  async createBattery(data: {
    battery_id: string;
    vehicle_name: string;
    vehicle_type: string;
    manufacturer: string;
    chemistry: string;
    capacity_kwh: number;
    nominal_voltage: number;
    max_current: number;
    fleet_id: string;
  }): Promise<Battery> {
    await delay();
    const newBattery: Battery = {
      id: `BAT-${String(batteries.length + 1).padStart(3, '0')}`,
      battery_id: data.battery_id,
      vehicle_name: data.vehicle_name,
      vehicle_type: data.vehicle_type,
      manufacturer: data.manufacturer,
      chemistry: data.chemistry,
      capacity_kwh: data.capacity_kwh,
      nominal_voltage: data.nominal_voltage,
      max_current: data.max_current,
      manufacturing_date: new Date().toISOString().split('T')[0],
      installation_date: new Date().toISOString().split('T')[0],
      warranty_expiry: new Date(Date.now() + 8 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_soh: 100,
      current_soc: 100,
      voltage: data.nominal_voltage,
      current: 0,
      temperature: 25,
      cycle_count: 0,
      fast_charge_count: 0,
      rul: 2000,
      status: 'active',
      location: 'Mumbai',
      lat: 19.076,
      lng: 72.8777,
      carbon_footprint_kg: 0,
      internal_resistance: 0.01,
      last_maintenance: new Date().toISOString().split('T')[0],
      health_score: 100,
      fleet_id: data.fleet_id,
    };
    batteries.push(newBattery);
    return newBattery;
  }

  async updateBattery(id: string, data: { manufacturer?: string; vehicle_name?: string; status?: string }): Promise<Battery> {
    await delay();
    const idx = batteries.findIndex((b) => b.id === id || b.battery_id === id);
    if (idx === -1) throw new Error(`Battery ${id} not found`);
    if (data.manufacturer) batteries[idx].manufacturer = data.manufacturer;
    if (data.vehicle_name) batteries[idx].vehicle_name = data.vehicle_name;
    if (data.status) batteries[idx].status = data.status as Battery['status'];
    return { ...batteries[idx] };
  }

  async deleteBattery(id: string): Promise<void> {
    await delay();
    const idx = batteries.findIndex((b) => b.id === id || b.battery_id === id);
    if (idx === -1) throw new Error(`Battery ${id} not found`);
    batteries.splice(idx, 1);
  }

  // ─── Telemetry ───────────────────────────────────────────────────────────

  async getTelemetry(
    batteryId: string,
    params?: { page?: number; page_size?: number; start_time?: string; end_time?: string }
  ): Promise<{ items: TelemetryPoint[]; total: number }> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`Battery ${batteryId} not found`);
    let history = generateTelemetryHistory(battery.battery_id, 24);
    if (params?.start_time) {
      history = history.filter((t) => t.timestamp >= params.start_time!);
    }
    if (params?.end_time) {
      history = history.filter((t) => t.timestamp <= params.end_time!);
    }
    const paginated = paginate(history, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getTelemetryStats(batteryId: string, hours?: number): Promise<TelemetryStats> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`Battery ${batteryId} not found`);
    const history = generateTelemetryHistory(battery.battery_id, hours ?? 24);
    if (history.length === 0) {
      return { avg_voltage: 0, max_voltage: 0, min_voltage: 0, avg_current: 0, max_current: 0, avg_temperature: 0, max_temperature: 0, avg_soc: 0, data_points: 0 };
    }
    const voltages = history.map((h) => h.voltage);
    const currents = history.map((h) => h.current);
    const temps = history.map((h) => h.temperature);
    const socs = history.map((h) => h.soc);
    return {
      avg_voltage: Math.round(voltages.reduce((a, b) => a + b, 0) / voltages.length * 100) / 100,
      max_voltage: Math.max(...voltages),
      min_voltage: Math.min(...voltages),
      avg_current: Math.round(currents.reduce((a, b) => a + b, 0) / currents.length * 100) / 100,
      max_current: Math.max(...currents),
      avg_temperature: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
      max_temperature: Math.max(...temps),
      avg_soc: Math.round(socs.reduce((a, b) => a + b, 0) / socs.length * 10) / 10,
      data_points: history.length,
    };
  }

  async getLatestTelemetry(batteryId: string): Promise<TelemetryPoint & { cell_voltages: number[]; cell_temperatures: number[] }> {
    await delay(50, 150);
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`Battery ${batteryId} not found`);
    return {
      timestamp: new Date().toISOString(),
      voltage: battery.voltage,
      current: battery.current,
      temperature: battery.temperature,
      soc: battery.current_soc,
      soh: battery.current_soh,
      cell_voltages: generateCellVoltages(),
      cell_temperatures: generateCellTemperatures(),
    };
  }

  // ─── Predictions ─────────────────────────────────────────────────────────

  async getLatestPredictions(batteryId: string): Promise<Predictions> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`Battery ${batteryId} not found`);
    const soh = battery.current_soh;
    const thermalRisk = soh < 70 ? 65 + Math.random() * 20 : soh < 85 ? 25 + Math.random() * 20 : 5 + Math.random() * 15;
    const anomalyScore = soh < 70 ? 0.5 + Math.random() * 0.4 : soh < 85 ? 0.2 + Math.random() * 0.3 : Math.random() * 0.2;
    const rul = Math.max(50, Math.floor(soh * 15 + (Math.random() - 0.5) * 200));
    const failureProb = soh < 70 ? 0.25 + Math.random() * 0.3 : soh < 85 ? 0.08 + Math.random() * 0.12 : Math.random() * 0.05;
    return {
      soh: { value: Math.round(soh * 10) / 10, confidence: 0.92 + Math.random() * 0.06, explanation: { cycle_count: 0.35, temperature_history: 0.25, charge_discharge_rate: 0.20, calendar_age: 0.15, impedance: 0.05 } },
      soc: { value: Math.round(battery.current_soc * 10) / 10, confidence: 0.95 + Math.random() * 0.04, explanation: { voltage_reading: 0.40, coulomb_counting: 0.35, temperature_compensation: 0.15, open_circuit_voltage: 0.10 } },
      thermal: { value: Math.round(thermalRisk * 10) / 10, confidence: 0.85 + Math.random() * 0.1, explanation: { ambient_temperature: 0.30, discharge_rate: 0.25, cooling_efficiency: 0.20, cell_internal_resistance: 0.15, pack_geometry: 0.10 } },
      anomaly: { value: Math.round(anomalyScore * 1000) / 1000, confidence: 0.88 + Math.random() * 0.1, explanation: { voltage_deviation: 0.30, temperature_pattern: 0.25, current_signature: 0.20, impedance_spectrum: 0.15, usage_pattern: 0.10 } },
      rul: { value: rul, confidence: 0.80 + Math.random() * 0.15, explanation: { cycle_degradation: 0.35, calendar_aging: 0.25, usage_intensity: 0.20, environmental_stress: 0.12, maintenance_quality: 0.08 } },
      failure_probability: { value: Math.round(failureProb * 1000) / 1000, confidence: 0.87 + Math.random() * 0.1, explanation: { soh_trend: 0.30, thermal_history: 0.25, mechanical_stress: 0.20, electrical_stress: 0.15, manufacturing_quality: 0.10 } },
    };
  }

  async getPredictions(
    batteryId: string,
    params?: { page?: number; page_size?: number; model_type?: string }
  ): Promise<{ items: { id: string; battery_id: string; timestamp: string; model_type: string; prediction_value: number; confidence: number }[]; total: number }> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`Battery ${batteryId} not found`);
    const modelTypes = ['soh', 'soc', 'thermal_risk', 'anomaly', 'rul', 'failure_probability'];
    const count = 30;
    const now = Date.now();
    let items = [];
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 3600000).toISOString();
      const modelType = params?.model_type ?? modelTypes[i % modelTypes.length];
      let value: number;
      switch (modelType) {
        case 'soh': value = battery.current_soh + (Math.random() - 0.5) * 4; break;
        case 'soc': value = battery.current_soc + (Math.random() - 0.5) * 10; break;
        case 'thermal_risk': value = battery.current_soh < 70 ? 40 + Math.random() * 30 : 10 + Math.random() * 20; break;
        case 'anomaly': value = Math.random() * 0.5; break;
        case 'rul': value = Math.max(50, battery.current_soh * 15 + (Math.random() - 0.5) * 200); break;
        case 'failure_probability': value = Math.random() * 0.3; break;
        default: value = Math.random() * 100;
      }
      items.push({
        id: `pred-${batteryId}-${i}`,
        battery_id: battery.battery_id,
        timestamp,
        model_type: modelType,
        prediction_value: Math.round(value * 100) / 100,
        confidence: 0.8 + Math.random() * 0.18,
      });
    }
    if (params?.model_type) {
      items = items.filter((p) => p.model_type === params.model_type);
    }
    const paginated = paginate(items, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getPredictionExplanation(_batteryId: string, predictionId: string): Promise<{
    prediction_id: string;
    model_type: string;
    feature_importance: Record<string, number>;
    shap_values: Record<string, number>;
    lime_explanation: string;
    counterfactual: { feature: string; current_value: number; suggested_value: number; impact: string }[];
  }> {
    await delay();
    return {
      prediction_id: predictionId,
      model_type: 'soh',
      feature_importance: { cycle_count: 0.35, temperature_history: 0.25, charge_discharge_rate: 0.20, calendar_age: 0.15, internal_resistance: 0.05 },
      shap_values: { cycle_count: -2.3, temperature_history: -1.1, charge_discharge_rate: -0.8, calendar_age: -0.5, internal_resistance: -0.2 },
      lime_explanation: 'The SOH prediction is primarily driven by cycle count and temperature history. High cycle count indicates significant usage, while occasional temperature excursions accelerate degradation.',
      counterfactual: [
        { feature: 'cycle_count', current_value: 1500, suggested_value: 1000, impact: 'SOH would increase by ~3.5%' },
        { feature: 'avg_temperature', current_value: 32.5, suggested_value: 28.0, impact: 'SOH would increase by ~1.8%' },
        { feature: 'fast_charge_ratio', current_value: 0.35, suggested_value: 0.15, impact: 'SOH would increase by ~2.1%' },
      ],
    };
  }

  // ─── Alerts ──────────────────────────────────────────────────────────────

  async getAlerts(params?: {
    page?: number;
    page_size?: number;
    battery_id?: string;
    severity?: string;
    status?: string;
  }): Promise<{ items: Alert[]; total: number }> {
    await delay();
    let result = [...this._alerts];
    if (params?.battery_id) {
      result = result.filter((a) => a.battery_id === params.battery_id);
    }
    if (params?.severity) {
      result = result.filter((a) => a.severity === params.severity);
    }
    if (params?.status) {
      result = result.filter((a) => a.status === params.status);
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const paginated = paginate(result, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getAlertStatistics(): Promise<AlertStats> {
    await delay();
    const active = this._alerts.filter((a) => a.status === 'active' || a.status === 'acknowledged');
    return {
      critical: active.filter((a) => a.severity === 'critical').length,
      warning: active.filter((a) => a.severity === 'warning').length,
      info: active.filter((a) => a.severity === 'info').length,
      total: active.length,
    };
  }

  async acknowledgeAlert(id: string): Promise<void> {
    await delay();
    const alert = this._alerts.find((a) => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.status = 'acknowledged';
  }

  async resolveAlert(id: string): Promise<void> {
    await delay();
    const alert = this._alerts.find((a) => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.status = 'resolved';
  }

  // ─── Passports ───────────────────────────────────────────────────────────

  async getPassports(params?: { page?: number; page_size?: number; status?: string }): Promise<{ items: { battery_id: string; passport_number: string; status: string; manufacturing_date: string; total_cycles: number; carbon_footprint_kg: number }[]; total: number }> {
    await delay();
    const items = batteries.map((b) => ({
      battery_id: b.battery_id,
      passport_number: `EU-BP-${b.battery_id}`,
      status: b.status === 'active' ? 'active' : b.status === 'inactive' ? 'expired' : 'pending',
      manufacturing_date: b.manufacturing_date,
      total_cycles: b.cycle_count,
      carbon_footprint_kg: b.carbon_footprint_kg,
    }));
    const paginated = paginate(items, params);
    return { items: paginated.items, total: paginated.total };
  }

  async getPassport(id: string): Promise<{ battery_id: string; passport_number: string; status: string; manufacturing_date: string; total_cycles: number; carbon_footprint_kg: number }> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === id || b.id === id);
    if (!battery) throw new Error(`Passport ${id} not found`);
    return {
      battery_id: battery.battery_id,
      passport_number: `EU-BP-${battery.battery_id}`,
      status: battery.status === 'active' ? 'active' : battery.status === 'inactive' ? 'expired' : 'pending',
      manufacturing_date: battery.manufacturing_date,
      total_cycles: battery.cycle_count,
      carbon_footprint_kg: battery.carbon_footprint_kg,
    };
  }

  async getFullPassport(id: string): Promise<{
    passport: { battery_id: string; passport_number: string; status: string; manufacturing_date: string; total_cycles: number; carbon_footprint_kg: number };
    battery: Battery;
    statistics: { total_cycles: number; fast_charge_count: number; total_energy_throughput: number; carbon_footprint_kg: number };
    second_life: { eligible: boolean; status: string; recycling_date?: string; recycling_facility?: string };
    maintenance_history: { type: string; description: string; date: string; cost: number }[];
    current_status: { voltage: number; temperature: number; soc: number; soh: number };
    qr_code: string;
  }> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === id || b.id === id);
    if (!battery) throw new Error(`Passport ${id} not found`);
    const batteryMaintenance = this._maintenanceRecords.filter((m) => m.battery_id === battery.battery_id);
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><rect x="20" y="20" width="40" height="40" fill="black"/><rect x="140" y="20" width="40" height="40" fill="black"/><rect x="20" y="140" width="40" height="40" fill="black"/><rect x="30" y="30" width="20" height="20" fill="white"/><rect x="150" y="30" width="20" height="20" fill="white"/><rect x="30" y="150" width="20" height="20" fill="white"/><text x="100" y="110" text-anchor="middle" font-size="10" fill="black">EU-BP-${battery.battery_id}</text></svg>`;
    return {
      passport: {
        battery_id: battery.battery_id,
        passport_number: `EU-BP-${battery.battery_id}`,
        status: battery.status === 'active' ? 'active' : battery.status === 'inactive' ? 'expired' : 'pending',
        manufacturing_date: battery.manufacturing_date,
        total_cycles: battery.cycle_count,
        carbon_footprint_kg: battery.carbon_footprint_kg,
      },
      battery,
      statistics: {
        total_cycles: battery.cycle_count,
        fast_charge_count: battery.fast_charge_count,
        total_energy_throughput: Math.round(battery.capacity_kwh * battery.cycle_count * 0.8),
        carbon_footprint_kg: battery.carbon_footprint_kg,
      },
      second_life: {
        eligible: battery.current_soh > 60,
        status: battery.current_soh > 80 ? 'eligible' : battery.current_soh > 60 ? 'in_process' : 'not_eligible',
      },
      maintenance_history: batteryMaintenance.map((m) => ({
        type: m.type,
        description: m.description,
        date: m.date,
        cost: m.cost,
      })),
      current_status: {
        voltage: battery.voltage,
        temperature: battery.temperature,
        soc: battery.current_soc,
        soh: battery.current_soh,
      },
      qr_code: btoa(qrSvg),
    };
  }

  async getPassportByBattery(batteryId: string): Promise<{ battery_id: string; passport_number: string; status: string; manufacturing_date: string; total_cycles: number; carbon_footprint_kg: number }> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId);
    if (!battery) throw new Error(`No passport found for battery ${batteryId}`);
    return {
      battery_id: battery.battery_id,
      passport_number: `EU-BP-${battery.battery_id}`,
      status: battery.status === 'active' ? 'active' : battery.status === 'inactive' ? 'expired' : 'pending',
      manufacturing_date: battery.manufacturing_date,
      total_cycles: battery.cycle_count,
      carbon_footprint_kg: battery.carbon_footprint_kg,
    };
  }

  // ─── Digital Twins ───────────────────────────────────────────────────────

  async getDigitalTwin(batteryId: string): Promise<DigitalTwin> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId || b.id === batteryId);
    if (!battery) throw new Error(`No digital twin found for battery ${batteryId}`);
    return {
      battery_id: battery.battery_id,
      name: `Digital Twin - ${battery.vehicle_name}`,
      sync_status: 'synced',
      last_sync: new Date().toISOString(),
      configuration: { model_type: 'electrochemical', update_interval: 1000, sensors: ['voltage', 'current', 'temperature', 'soc', 'soh'] },
    };
  }

  async createDigitalTwin(data: { battery_id: string; name: string; configuration?: Record<string, unknown> }): Promise<DigitalTwin> {
    await delay();
    return {
      battery_id: data.battery_id,
      name: data.name,
      sync_status: 'pending',
      last_sync: new Date().toISOString(),
      configuration: data.configuration ?? {},
    };
  }

  async updateDigitalTwin(batteryId: string, data: { name?: string; configuration?: Record<string, unknown> }): Promise<DigitalTwin> {
    await delay();
    const battery = batteries.find((b) => b.battery_id === batteryId);
    if (!battery) throw new Error(`No digital twin found for battery ${batteryId}`);
    return {
      battery_id: battery.battery_id,
      name: data.name ?? `Digital Twin - ${battery.vehicle_name}`,
      sync_status: 'synced',
      last_sync: new Date().toISOString(),
      configuration: data.configuration ?? { model_type: 'electrochemical', update_interval: 1000, sensors: ['voltage', 'current', 'temperature', 'soc', 'soh'] },
    };
  }
}

export const mockApi = new MockApiService();

export async function shouldUseMockApi(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return !response.ok;
  } catch {
    return true;
  }
}
