export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  role: 'admin' | 'operator' | 'viewer' | 'api';
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Fleet {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Battery {
  id: string;
  batteryId: string;
  fleetId?: string;
  manufacturer: string;
  model?: string;
  chemistry: string;
  capacityKwh: number;
  nominalVoltage: number;
  maxVoltage: number;
  minVoltage: number;
  maxCurrent: number;
  cyclesInSeries: number;
  cyclesInParallel: number;
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'recycled';
  manufacturingDate?: string;
  installationDate?: string;
  warrantyExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Telemetry {
  id: number;
  batteryId: string;
  timestamp: string;
  voltage?: number;
  current?: number;
  temperature?: number;
  soc?: number;
  soh?: number;
  power?: number;
  cellVoltages?: number[];
  cellTemperatures?: number[];
  charging: boolean;
  driving: boolean;
  createdAt: string;
}

export interface Prediction {
  id: string;
  batteryId: string;
  timestamp: string;
  modelType: string;
  predictionValue: number;
  confidence: number;
  explanation?: Record<string, any>;
  featuresUsed?: Record<string, any>;
  inferenceTimeMs?: number;
  createdAt: string;
}

export interface Alert {
  id: string;
  batteryId: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  title: string;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatteryPassport {
  id: string;
  batteryId: string;
  passportNumber: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  manufacturingDate: string;
  firstUseDate?: string;
  warrantyExpiry?: string;
  totalEnergyThroughput: number;
  fastChargeCount: number;
  totalCycles: number;
  carbonFootprintKg: number;
  secondLifeStatus: 'eligible' | 'not_eligible' | 'in_process' | 'completed';
  recyclingDate?: string;
  recyclingFacility?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  batteryId: string;
  maintenanceType: 'inspection' | 'repair' | 'replacement' | 'balancing' | 'calibration' | 'software_update';
  description: string;
  performedBy?: string;
  cost?: number;
  durationHours?: number;
  partsReplaced?: Record<string, any>[];
  notes?: string;
  nextMaintenanceDate?: string;
  createdAt: string;
}

export interface DigitalTwin {
  id: string;
  batteryId: string;
  name: string;
  configuration: Record<string, any>;
  syncStatus: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface TelemetryStats {
  avgVoltage?: number;
  maxVoltage?: number;
  minVoltage?: number;
  avgCurrent?: number;
  maxCurrent?: number;
  avgTemperature?: number;
  maxTemperature?: number;
  avgSoc?: number;
  dataPoints: number;
}

export interface AlertStatistics {
  totalActive: number;
  critical: number;
  warning: number;
  info: number;
  acknowledged: number;
  resolved: number;
}

export interface FleetStatistics {
  id: string;
  name: string;
  totalBatteries: number;
  activeBatteries: number;
  avgSoh?: number;
  minSoh?: number;
  maxSoh?: number;
  criticalAlerts: number;
  warningAlerts: number;
}

export interface BatteryHealth {
  id: string;
  batteryId: string;
  manufacturer: string;
  model?: string;
  chemistry: string;
  capacityKwh: number;
  status: string;
  fleetId?: string;
  fleetName?: string;
  currentSoh?: number;
  currentSoc?: number;
  currentTemperature?: number;
  currentVoltage?: number;
  currentCurrent?: number;
  activeAlerts: number;
  totalCycles?: number;
  totalEnergyThroughput?: number;
  carbonFootprintKg?: number;
  createdAt: string;
  updatedAt: string;
}
