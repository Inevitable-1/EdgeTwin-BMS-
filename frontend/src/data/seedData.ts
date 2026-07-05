// EdgeTwin-BMS+ Seed Data
// Deterministic mock data for the entire demo application

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'engineer' | 'viewer';
  name: string;
  avatar?: string;
}

export interface Battery {
  id: string;
  battery_id: string;
  vehicle_name: string;
  vehicle_type: string;
  manufacturer: string;
  chemistry: string;
  capacity_kwh: number;
  nominal_voltage: number;
  max_current: number;
  manufacturing_date: string;
  installation_date: string;
  warranty_expiry: string;
  current_soh: number;
  current_soc: number;
  voltage: number;
  current: number;
  temperature: number;
  cycle_count: number;
  fast_charge_count: number;
  rul: number;
  status: 'active' | 'maintenance' | 'critical' | 'inactive';
  location: string;
  lat: number;
  lng: number;
  carbon_footprint_kg: number;
  internal_resistance: number;
  last_maintenance: string;
  health_score: number;
  fleet_id: string;
}

export interface Alert {
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

export interface MaintenanceRecord {
  id: string;
  battery_id: string;
  type: 'preventive' | 'corrective' | 'inspection' | 'replacement';
  description: string;
  date: string;
  cost: number;
  technician: string;
  status: 'completed' | 'scheduled';
}

export interface TelemetryPoint {
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
  soh: number;
}

export interface LocationData {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface VehicleModels {
  [manufacturer: string]: string[];
}

// ─── Seeded RNG (LCG) ────────────────────────────────────────────────────────

function createRNG(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededRandom(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function seededInt(rng: () => number, min: number, max: number): number {
  return Math.floor(seededRandom(rng, min, max + 1));
}

function seededChoice<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededDate(rng: () => number, yearStart: number, yearEnd: number): string {
  const year = seededInt(rng, yearStart, yearEnd);
  const month = seededInt(rng, 1, 12);
  const day = seededInt(rng, 1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function seededTimestamp(rng: () => number, daysAgo: number): string {
  const now = Date.now();
  const offset = rng() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export const USERS: User[] = [
  {
    id: 'USR-001',
    email: 'admin@edgetwin.ai',
    password: 'admin123',
    role: 'admin',
    name: 'Rajesh Kumar',
  },
  {
    id: 'USR-002',
    email: 'engineer@edgetwin.ai',
    password: 'engineer123',
    role: 'engineer',
    name: 'Priya Sharma',
  },
  {
    id: 'USR-003',
    email: 'viewer@edgetwin.ai',
    password: 'viewer123',
    role: 'viewer',
    name: 'Amit Patel',
  },
];

// ─── MANUFACTURERS ───────────────────────────────────────────────────────────

export const MANUFACTURERS: string[] = [
  'Tata Motors',
  'Mahindra',
  'Ola Electric',
  'Ather Energy',
  'TVS',
  'Bajaj',
  'Hero Electric',
  'AMO',
  'Revolt',
  'Ultraviolette',
];

// ─── CHEMISTRIES ─────────────────────────────────────────────────────────────

export const CHEMISTRIES: string[] = ['NMC811', 'NMC622', 'LFP', 'NCA', 'LTO'];

// ─── LOCATIONS ───────────────────────────────────────────────────────────────

export const LOCATIONS: LocationData[] = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { city: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { city: 'Patna', state: 'Bihar', lat: 25.6093, lng: 85.1376 },
];

// ─── VEHICLE NAMES ───────────────────────────────────────────────────────────

export const VEHICLE_NAMES: string[] = [
  'Tata Nexon EV',
  'Tata Nexon EV Max',
  'Tata Nexon EV Prime',
  'Tata Tigor EV',
  'Tata Tiago EV',
  'Tata Punch EV',
  'Tata Harrier EV',
  'Tata Safari EV',
  'Tata Altroz EV',
  'Tata Sierra EV',
  'Mahindra XUV400',
  'Mahindra XUV400 Pro',
  'Mahindra XUV.e8',
  'Mahindra XUV.e9',
  'Mahindra BE 6',
  'Mahindra BE 9',
  'Mahindra Treo Zor',
  'Mahindra eSupro',
  'Mahindra eVerito',
  'Mahindra Bolero EV',
  'Ola S1 Pro',
  'Ola S1 Air',
  'Ola S1X',
  'Ola S1 Pro Gen 2',
  'Ola S1 Air Gen 2',
  'Ola Roadster Pro',
  'Ola Adventure',
  'Ola Cruiser',
  'Ola Diamondhead',
  'Ola Pinky',
  'Ather 450X',
  'Ather 450X Gen 3',
  'Ather 450 Plus',
  'Ather 450S',
  'Ather Rizta',
  'Ather 450 Apex',
  'Ather 450X Pro',
  'TVS iQube',
  'TVS iQube S',
  'TVS iQube ST',
  'TVS X',
  'TVS Creon',
  'TVS Zesto',
  'Bajaj Chetak',
  'Bajaj Chetak Premium',
  'Bajaj Chetak Urban',
  'Bajaj Chetak 3501',
  'Bajaj Qute Electric',
  'Bajaj RE EV',
  'Hero Electric Optima',
  'Hero Electric Optima CX',
  'Hero Electric Photon',
  'Hero Electric NYX',
  'Hero Electric Atria',
  'Hero Electric Flash',
  'Hero Vida V1',
  'Hero Vida V1 Plus',
  'Hero Vida V1 Pro',
  'AMO Jaunty',
  'AMO Jaunty Type II',
  'AMO Legend',
  'AMO Independence',
  'AMO Mindful',
  'AMO Inspire',
  'Revolt RV400',
  'Revolt RV300',
  'Revolt RV1',
  'Revolt RV1+',
  'Revolt RV BlazeX',
  'Ultraviolette F77',
  'Ultraviolette F77 Mach 2',
  'Ultraviolette F9',
  'Tata Ace EV',
  'Tata Winger EV',
  'Tata Starbus EV',
  'Mahindra e-Alfa',
  'Mahindra Treo',
  'Mahindra Jeeto Electric',
  'Euler Motors HiLoad',
  'Logan EV',
  'Kia EV6',
  'MG ZS EV',
  'MG Comet EV',
  'Hyundai Ioniq 5',
  'Hyundai Kona Electric',
  'BYD Atto 3',
  'BYD Seal',
  'Volvo XC40 Recharge',
  'Mercedes EQC',
  'BMW iX3',
  'Audi e-tron',
  'Porsche Taycan',
  'Tesla Model 3',
  'Tesla Model Y',
  'Tata Nexon EV Dark',
  'Tata Nexon EV Race Edition',
  'Mahindra XUV400 EL',
  'Ola S1 Pro Matte Black',
  'Ather 450X Warp',
  'TVS iQube Racing',
  'Bajaj Chetak Blue',
  'Hero Vida V1 Terra',
  'Revolt RV400 Sport',
  'Ultraviolette F77 Shadow',
  'Tata Punch EV Long Range',
  'Mahindra BE 6 Performance',
  'Ola Roadster X',
  'Ather Rizta Z',
  'Tata Harrier EV AWD',
  'Mahindra XUV.e8 AWD',
  'Ola Adventure Pro',
  'TVS Creon GT',
  'Bajaj RE EV Cargo',
  'Hero Vida V1 City',
  'AMO Inspire Plus',
  'Revolt RV BlazeX Pro',
  'Ultraviolette F9 Sport',
  'Tata Tiago EV Long Range',
  'Mahindra eVerito Plus',
  'Ola S1X Plus',
  'Ather 450S Sport',
  'TVS X Plus',
  'Bajaj Chetak Urban 3501',
  'Hero Electric Flash LX',
  'AMO Mindful Pro',
  'Revolt RV1 Sport',
  'Ultraviolette F77 Mach 2 Thunder',
  'Tata Nexon EV Max Dark',
  'Mahindra XUV400 Pro EL',
  'Ola S1 Pro Gen 2 Matte',
  'Ather 450X Gen 3 Pro',
  'Tata Tigor EV Ziptron',
  'Mahindra Treo Zor Plus',
  'Ola Cruiser Pro',
  'TVS Zesto Electric',
  'Bajaj Qute EV Max',
  'Hero Electric NYX Hyper',
  'AMO Legend Type II',
  'Revolt RV300 Sport',
  'Ultraviolette F77 Shadow Noir',
  'Tata Altroz EV Ziptron',
  'Mahindra eSupro Cargo',
  'Ola Roadster Pro X',
  'Ather 450 Apex Race',
  'Tata Safari EV Plus',
];

// ─── VEHICLE MODELS ──────────────────────────────────────────────────────────

export const VEHICLE_MODELS: VehicleModels = {
  'Tata Motors': [
    'Nexon EV',
    'Nexon EV Max',
    'Nexon EV Prime',
    'Tigor EV',
    'Tiago EV',
    'Punch EV',
    'Harrier EV',
    'Safari EV',
    'Altroz EV',
    'Sierra EV',
    'Ace EV',
    'Winger EV',
    'Starbus EV',
  ],
  'Mahindra': [
    'XUV400',
    'XUV400 Pro',
    'XUV.e8',
    'XUV.e9',
    'BE 6',
    'BE 9',
    'Treo Zor',
    'eSupro',
    'eVerito',
    'Bolero EV',
    'e-Alfa',
    'Treo',
    'Jeeto Electric',
  ],
  'Ola Electric': ['S1 Pro', 'S1 Air', 'S1X', 'Roadster Pro', 'Adventure', 'Cruiser', 'Diamondhead'],
  'Ather Energy': ['450X', '450X Gen 3', '450 Plus', '450S', 'Rizta', '450 Apex'],
  'TVS': ['iQube', 'iQube S', 'iQube ST', 'X', 'Creon', 'Zesto'],
  'Bajaj': ['Chetak', 'Chetak Premium', 'Chetak Urban', 'Qute Electric', 'RE EV'],
  'Hero Electric': ['Optima', 'Optima CX', 'Photon', 'NYX', 'Atria', 'Flash'],
  'AMO': ['Jaunty', 'Jaunty Type II', 'Legend', 'Independence', 'Mindful', 'Inspire'],
  'Revolt': ['RV400', 'RV300', 'RV1', 'RV1+', 'BlazeX'],
  'Ultraviolette': ['F77', 'F77 Mach 2', 'F9'],
};

// ─── Fleet IDs ────────────────────────────────────────────────────────────────

const FLEET_IDS = ['fleet-tata-ev', 'fleet-mahindra-ev', 'fleet-ola-ev'];

// ─── VEHICLE TYPE MAPPING ────────────────────────────────────────────────────

const VEHICLE_TYPE_MAP: Record<string, string[]> = {
  'Tata Motors': ['SUV', 'Sedan', 'Hatchback', 'Truck', 'Bus'],
  Mahindra: ['SUV', 'Hatchback', 'Sedan', 'Truck', 'Scooter'],
  'Ola Electric': ['Scooter', 'Motorcycle'],
  'Ather Energy': ['Scooter'],
  TVS: ['Scooter', 'Motorcycle'],
  Bajaj: ['Scooter', 'Motorcycle'],
  'Hero Electric': ['Scooter'],
  AMO: ['Scooter'],
  Revolt: ['Motorcycle'],
  Ultraviolette: ['Motorcycle'],
};

// ─── Battery Spec Helpers ─────────────────────────────────────────────────────

interface BatterySpec {
  vehicle_type: string;
  chemistry: string;
  capacity_kwh: [number, number];
  nominal_voltage: [number, number];
  max_current: [number, number];
}

function getBatterySpec(vehicleType: string, chemistry: string): BatterySpec {
  const isTwoWheeler = vehicleType === 'Scooter' || vehicleType === 'Motorcycle';
  const isThreeWheeler = vehicleType === 'Truck' || vehicleType === 'Bus';

  let capacityRange: [number, number];
  let voltageRange: [number, number];
  let currentRange: [number, number];

  if (isTwoWheeler) {
    capacityRange = [2.4, 5];
    voltageRange = [48, 72];
    currentRange = [30, 80];
  } else if (isThreeWheeler) {
    capacityRange = [15, 60];
    voltageRange = [200, 400];
    currentRange = [100, 300];
  } else {
    capacityRange = [20, 60];
    voltageRange = [300, 400];
    currentRange = [100, 250];
  }

  if (chemistry === 'LFP') {
    return {
      vehicle_type: vehicleType,
      chemistry,
      capacity_kwh: [capacityRange[0] * 1.1, capacityRange[1] * 1.1],
      nominal_voltage: [voltageRange[0] * 0.95, voltageRange[1] * 0.95],
      max_current: [currentRange[0] * 1.2, currentRange[1] * 1.2],
    };
  }
  if (chemistry === 'LTO') {
    return {
      vehicle_type: vehicleType,
      chemistry,
      capacity_kwh: [capacityRange[0] * 0.8, capacityRange[1] * 0.8],
      nominal_voltage: [voltageRange[0] * 0.7, voltageRange[1] * 0.7],
      max_current: [currentRange[0] * 1.5, currentRange[1] * 1.5],
    };
  }

  return {
    vehicle_type: vehicleType,
    chemistry,
    capacity_kwh: capacityRange,
    nominal_voltage: voltageRange,
    max_current: currentRange,
  };
}

// ─── BATTERIES ───────────────────────────────────────────────────────────────

function generateBatteries(): Battery[] {
  const rng = createRNG(42);
  const batteries: Battery[] = [];

  const cityNames = LOCATIONS.map((l) => l.city);
  const cityMap: Record<string, { lat: number; lng: number }> = {};
  LOCATIONS.forEach((l) => {
    cityMap[l.city] = { lat: l.lat, lng: l.lng };
  });

  // Status distribution
  function pickStatus(): Battery['status'] {
    const r = rng();
    if (r < 0.80) return 'active';
    if (r < 0.92) return 'maintenance';
    if (r < 0.97) return 'critical';
    return 'inactive';
  }

  // Weighted SOH toward 85-95
  function pickSOH(cycles: number): number {
    const base = seededRandom(rng, 85, 97);
    const cyclePenalty = Math.max(0, (cycles - 500) * 0.008);
    return Math.round(Math.max(65, Math.min(99.5, base - cyclePenalty)) * 10) / 10;
  }

  // Pick manufacturer index based on weights (Tata and Mahindra are more common)
  function pickManufacturerIdx(): number {
    const weights = [0.22, 0.18, 0.14, 0.1, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03];
    let cumulative = 0;
    const r = rng();
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (r < cumulative) return i;
    }
    return 0;
  }

  // Pick vehicle type from manufacturer
  function pickVehicleType(mfr: string): string {
    const types = VEHICLE_TYPE_MAP[mfr] || ['Sedan'];
    return seededChoice(rng, types);
  }

  // Pick a fleet_id based on manufacturer
  function pickFleetId(mfr: string): string {
    if (mfr === 'Tata Motors') return 'fleet-tata-ev';
    if (mfr === 'Mahindra') return 'fleet-mahindra-ev';
    if (mfr === 'Ola Electric') return 'fleet-ola-ev';
    return FLEET_IDS[Math.floor(rng() * FLEET_IDS.length)];
  }

  // Filter vehicle names by manufacturer
  function pickVehicleName(mfr: string, vehicleType: string): string {
    const names = VEHICLE_NAMES.filter((vn) => {
      if (mfr === 'Tata Motors' && vn.startsWith('Tata')) return true;
      if (mfr === 'Mahindra' && vn.startsWith('Mahindra')) return true;
      if (mfr === 'Ola Electric' && vn.startsWith('Ola')) return true;
      if (mfr === 'Ather Energy' && vn.startsWith('Ather')) return true;
      if (mfr === 'TVS' && vn.startsWith('TVS')) return true;
      if (mfr === 'Bajaj' && vn.startsWith('Bajaj')) return true;
      if (mfr === 'Hero Electric' && vn.startsWith('Hero')) return true;
      if (mfr === 'AMO' && vn.startsWith('AMO')) return true;
      if (mfr === 'Revolt' && vn.startsWith('Revolt')) return true;
      if (mfr === 'Ultraviolette' && vn.startsWith('Ultraviolette')) return true;
      return false;
    });
    // Filter by type heuristic
    const filtered = names.filter((n) => {
      const lower = n.toLowerCase();
      if (vehicleType === 'Scooter') {
        return lower.includes('s1') || lower.includes('450') || lower.includes('iqube') ||
          lower.includes('chetak') || lower.includes('optima') || lower.includes('nyx') ||
          lower.includes('jaunty') || lower.includes('at') || lower.includes('flash') ||
          lower.includes('creon') || lower.includes('rizta') || lower.includes('treo') ||
          lower.includes('supro') || lower.includes('alfa') || lower.includes('legend') ||
          lower.includes('mindful') || lower.includes('inspire') || lower.includes('photon') ||
          lower.includes('vid') || lower.includes('zesto') || lower.includes('re ev') ||
          lower.includes('eva');
      }
      if (vehicleType === 'Motorcycle') {
        return lower.includes('rv') || lower.includes('f77') || lower.includes('f9') ||
          lower.includes('roadster') || lower.includes('adventure') || lower.includes('cruiser') ||
          lower.includes('diamondhead') || lower.includes('blazex');
      }
      if (vehicleType === 'SUV') {
        return lower.includes('suv') || lower.includes('xuv') || lower.includes('be 6') ||
          lower.includes('be 9') || lower.includes('punch') || lower.includes('harrier') ||
          lower.includes('safari') || lower.includes('kona') || lower.includes('ioniq') ||
          lower.includes('at') || lower.includes('ev6') || lower.includes('zs') ||
          lower.includes('comet') || lower.includes('at') || lower.includes('seal') ||
          lower.includes('taycan') || lower.includes('ix3') || lower.includes('eq') ||
          lower.includes('blazex');
      }
      if (vehicleType === 'Hatchback') {
        return lower.includes('tiago') || lower.includes('tigor') || lower.includes('altroz') ||
          lower.includes('xuv400') || lower.includes('verito') || lower.includes('bolo') ||
          lower.includes('nexon');
      }
      return true;
    });
    const pick = filtered.length > 0 ? filtered : names;
    return pick.length > 0 ? seededChoice(rng, pick) : VEHICLE_NAMES[0];
  }

  for (let i = 0; i < 150; i++) {
    const mfrIdx = pickManufacturerIdx();
    const mfr = MANUFACTURERS[mfrIdx];
    const vehicleType = pickVehicleType(mfr);
    const chem = seededChoice(rng, CHEMISTRIES);
    const spec = getBatterySpec(vehicleType, chem);
    const cycles = seededInt(rng, 50, 2500);
    const fastCharges = seededInt(rng, Math.floor(cycles * 0.05), Math.floor(cycles * 0.3));
    const status = pickStatus();
    const soh = status === 'inactive' ? seededRandom(rng, 65, 75) : pickSOH(cycles);
    const soc = status === 'inactive' ? seededRandom(rng, 5, 15) : seededRandom(rng, 15, 98);
    const nomVolt = Math.round(seededRandom(rng, spec.nominal_voltage[0], spec.nominal_voltage[1]));
    const voltage = Math.round(nomVolt * seededRandom(rng, 0.85, 1.05) * 100) / 100;
    const currentDraw =
      status === 'inactive'
        ? seededRandom(rng, -5, 5)
        : seededRandom(rng, -150, 150);
    const tempBase = 22 + Math.abs(currentDraw) * 0.08;
    const temp = Math.round(seededRandom(rng, tempBase, Math.min(52, tempBase + 15)) * 10) / 10;
    const capacity = Math.round(seededRandom(rng, spec.capacity_kwh[0], spec.capacity_kwh[1]) * 10) / 10;
    const maxCurr = Math.round(seededRandom(rng, spec.max_current[0], spec.max_current[1]));
    const rul = seededInt(rng, 200, Math.max(200, 2000 - cycles));
    const intResistance = Math.round(seededRandom(rng, 0.01, 0.15) * 1000) / 1000;
    const carbon = Math.round(seededRandom(rng, 50, 500));
    const healthScore = Math.round(soh * 0.7 + (1 - intResistance / 0.15) * 20 + (1 - temp / 52) * 10);

    const location = seededChoice(rng, cityNames);
    const locData = cityMap[location];

    const mfgDate = seededDate(rng, 2022, 2024);
    const installDate = seededDate(rng, 2022, 2024);
    const warrantyDate = seededDate(rng, 2027, 2030);
    const lastMaint = seededDate(rng, 2024, 2025);

    const vName = pickVehicleName(mfr, vehicleType);
    const fleetId = pickFleetId(mfr);

    batteries.push({
      id: `BAT-${String(i + 1).padStart(3, '0')}`,
      battery_id: `BT-2024-${String(i + 1).padStart(3, '0')}`,
      vehicle_name: vName,
      vehicle_type: vehicleType,
      manufacturer: mfr,
      chemistry: chem,
      capacity_kwh: capacity,
      nominal_voltage: nomVolt,
      max_current: maxCurr,
      manufacturing_date: mfgDate,
      installation_date: installDate,
      warranty_expiry: warrantyDate,
      current_soh: soh,
      current_soc: soc,
      voltage: voltage,
      current: Math.round(currentDraw * 100) / 100,
      temperature: temp,
      cycle_count: cycles,
      fast_charge_count: fastCharges,
      rul: rul,
      status: status,
      location: location,
      lat: Math.round((locData.lat + seededRandom(rng, -0.05, 0.05)) * 10000) / 10000,
      lng: Math.round((locData.lng + seededRandom(rng, -0.05, 0.05)) * 10000) / 10000,
      carbon_footprint_kg: carbon,
      internal_resistance: intResistance,
      last_maintenance: lastMaint,
      health_score: Math.min(100, Math.max(0, healthScore)),
      fleet_id: fleetId,
    });
  }

  return batteries;
}

export const batteries: Battery[] = generateBatteries();

// ─── ALERTS ──────────────────────────────────────────────────────────────────

function generateAlerts(): Alert[] {
  const rng = createRNG(123);
  const alerts: Alert[] = [];

  const alertTemplates = [
    { title: 'High Temperature Warning', source: 'telemetry_monitor' as const, message: 'Battery temperature has exceeded safe operating limits. Immediate attention required.', recommended_action: 'Reduce load and check cooling system. If temperature does not decrease, initiate shutdown.' },
    { title: 'Cell Voltage Imbalance', source: 'bms' as const, message: 'Voltage difference between cells exceeds 100mV threshold.', recommended_action: 'Schedule cell balancing and inspect for damaged cells.' },
    { title: 'Rapid SOC Drop', source: 'ai_prediction' as const, message: 'AI model detected abnormal SOC discharge rate 3x faster than expected.', recommended_action: 'Check for parasitic loads and verify battery management parameters.' },
    { title: 'Thermal Risk Elevated', source: 'ai_prediction' as const, message: 'Machine learning model predicts thermal event within 48 hours based on current trends.', recommended_action: 'Schedule preventive inspection and reduce charging rate.' },
    { title: 'Communication Timeout', source: 'bms' as const, message: 'BMS communication lost for 30 seconds. Data gap detected.', recommended_action: 'Check wiring harness and CAN bus connections.' },
    { title: 'Overcharge Risk', source: 'telemetry_monitor' as const, message: 'Charge current approaching maximum safe limit at current SOC.', recommended_action: 'Reduce charge current and verify charger calibration.' },
    { title: 'Deep Discharge Warning', source: 'telemetry_monitor' as const, message: 'SOC has dropped below 10%. Risk of cell damage if discharge continues.', recommended_action: 'Connect to charger immediately and avoid further discharge.' },
    { title: 'Anomaly Detected', source: 'ai_prediction' as const, message: 'AI anomaly detection flagged unusual voltage pattern in cell cluster.', recommended_action: 'Run diagnostic scan and log findings.' },
    { title: 'Fast Charge Limit Exceeded', source: 'bms' as const, message: 'Number of fast charges today has reached daily recommended limit.', recommended_action: 'Switch to standard charging for remainder of day to preserve cell health.' },
    { title: 'Internal Resistance Increase', source: 'telemetry_monitor' as const, message: 'Internal resistance has increased by 15% compared to baseline measurement.', recommended_action: 'Monitor trend and schedule capacity test if increase continues.' },
    { title: 'Capacity Fade Detected', source: 'ai_prediction' as const, message: 'AI model predicts accelerated capacity fade based on cycle analysis.', recommended_action: 'Review charging patterns and consider adjusting charge limits.' },
    { title: 'Cooling System Fault', source: 'bms' as const, message: 'Cooling pump reported lower than expected flow rate.', recommended_action: 'Inspect coolant levels and check for blockages in cooling channels.' },
    { title: 'Current Sensor Drift', source: 'bms' as const, message: 'Current sensor reading deviating from expected range by 5%.', recommended_action: 'Recalibrate current sensor and verify against reference measurement.' },
    { title: 'Voltage Spike Detected', source: 'telemetry_monitor' as const, message: 'Transient voltage spike detected exceeding nominal voltage by 12%.', recommended_action: 'Investigate source of transient and verify surge protection.' },
    { title: 'Cycle Count Milestone', source: 'bms' as const, message: 'Battery has reached a cycle count milestone requiring scheduled maintenance.', recommended_action: 'Schedule preventive maintenance inspection as per OEM guidelines.' },
    { title: 'Warranty Expiring Soon', source: 'ai_prediction' as const, message: 'Battery warranty expires within 90 days. Review remaining coverage.', recommended_action: 'Document current battery condition and consider extended warranty options.' },
    { title: 'SOH Below Threshold', source: 'telemetry_monitor' as const, message: 'State of health has dropped below 75% threshold.', recommended_action: 'Evaluate battery for potential replacement and adjust fleet allocation.' },
    { title: 'Parallel String Imbalance', source: 'bms' as const, message: 'Current imbalance detected between parallel battery strings exceeding 8%.', recommended_action: 'Inspect connections and perform string-level balancing.' },
    { title: 'Insulation Fault', source: 'bms' as const, message: 'Insulation resistance below safe threshold detected.', recommended_action: 'Halt operations and perform insulation resistance test. Do not resume until cleared.' },
    { title: 'BMS Firmware Update Available', source: 'ai_prediction' as const, message: 'New BMS firmware version available with performance improvements.', recommended_action: 'Schedule firmware update during next maintenance window.' },
  ];

  const severities: Alert['severity'][] = ['critical', 'warning', 'info'];
  const alertStatuses: Alert['status'][] = ['active', 'acknowledged', 'resolved'];

  for (let i = 0; i < 50; i++) {
    const templ = alertTemplates[i % alertTemplates.length];
    const battery = batteries[Math.floor(rng() * batteries.length)];
    const severityIdx = rng() < 0.15 ? 0 : rng() < 0.5 ? 1 : 2;
    const severity = severities[severityIdx];
    const status = seededChoice(rng, alertStatuses);

    alerts.push({
      id: `ALT-${String(i + 1).padStart(3, '0')}`,
      battery_id: battery.battery_id,
      battery_name: battery.vehicle_name,
      severity,
      title: templ.title,
      message: templ.message,
      source: templ.source,
      status,
      created_at: seededTimestamp(rng, 7),
      recommended_action: templ.recommended_action,
    });
  }

  return alerts;
}

export const alerts: Alert[] = generateAlerts();

// ─── MAINTENANCE RECORDS ─────────────────────────────────────────────────────

function generateMaintenanceRecords(): MaintenanceRecord[] {
  const rng = createRNG(456);
  const records: MaintenanceRecord[] = [];

  const techs = [
    'Vikram Singh', 'Ananya Reddy', 'Deepak Nair', 'Kavitha Iyer',
    'Arjun Mehta', 'Sunita Rao', 'Ravi Shankar', 'Neha Gupta',
    'Suresh Babu', 'Lakshmi Menon', 'Prakash Jha', 'Divya Patel',
  ];

  const maintenanceDescs: Record<string, string[]> = {
    preventive: [
      'Scheduled battery health check and cell balancing',
      'Quarterly cooling system inspection and coolant top-up',
      'Annual capacity test and calibration',
      'Preventive BMS firmware update and parameter verification',
      'Scheduled connection tightening and corrosion check',
      'Periodic insulation resistance measurement',
    ],
    corrective: [
      'Replaced faulty cell module due to voltage imbalance',
      'Repaired cooling fan controller',
      'Replaced damaged wiring harness connector',
      'Fixed current sensor calibration error',
      'Replaced degraded coolant and flushed system',
    ],
    inspection: [
      'Routine visual inspection of battery pack',
      'Post-incident diagnostic scan',
      'Pre-warranty expiry condition assessment',
      'Fleet-wide battery audit',
      'Thermal imaging inspection under load',
    ],
    replacement: [
      'Replaced degraded cell module with new unit',
      'Full battery pack replacement',
      'BMS controller board replacement',
      'Cooling system component replacement',
      'Wiring harness replacement',
    ],
  };

  const types: MaintenanceRecord['type'][] = ['preventive', 'corrective', 'inspection', 'replacement'];
  const statuses: MaintenanceRecord['status'][] = ['completed', 'scheduled'];

  for (let i = 0; i < 40; i++) {
    const type = seededChoice(rng, types);
    const desc = seededChoice(rng, maintenanceDescs[type]);
    const battery = batteries[Math.floor(rng() * batteries.length)];
    const tech = seededChoice(rng, techs);
    const status = seededChoice(rng, statuses);

    records.push({
      id: `MNT-${String(i + 1).padStart(3, '0')}`,
      battery_id: battery.battery_id,
      type,
      description: desc,
      date: seededDate(rng, 2023, 2025),
      cost: seededInt(rng, 500, 50000),
      technician: tech,
      status,
    });
  }

  return records;
}

export const maintenanceRecords: MaintenanceRecord[] = generateMaintenanceRecords();

// ─── TELEMETRY GENERATOR ─────────────────────────────────────────────────────

export function generateTelemetryHistory(batteryId: string, hours: number): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const battery = batteries.find((b) => b.battery_id === batteryId);
  if (!battery) return points;

  const seed = batteryId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = createRNG(seed);

  const nominalV = battery.nominal_voltage;
  const baseSOC = battery.current_soc;
  const baseTemp = battery.temperature;
  const baseSOH = battery.current_soh;

  const now = Date.now();
  const intervalMs = (hours * 60 * 60 * 1000) / 200; // 200 data points

  let soc = baseSOC;
  let temp = baseTemp;
  let soh = baseSOH;

  // Simulate charging cycles (charges for ~30% of time, rests, discharges)
  let charging = rng() > 0.5;
  let chargePhaseDuration = seededInt(rng, 20, 60);
  let phaseCounter = 0;

  for (let i = 0; i < 200; i++) {
    const timestamp = new Date(now - (200 - i) * intervalMs).toISOString();

    phaseCounter++;
    if (phaseCounter >= chargePhaseDuration) {
      charging = !charging;
      chargePhaseDuration = seededInt(rng, charging ? 20 : 40, charging ? 60 : 120);
      phaseCounter = 0;
    }

    // SOC dynamics
    if (charging) {
      soc = Math.min(100, soc + seededRandom(rng, 0.05, 0.3));
    } else {
      soc = Math.max(5, soc - seededRandom(rng, 0.05, 0.25));
    }

    // Voltage correlates with SOC
    const socFactor = soc / 100;
    const voltage = Math.round((nominalV * (0.85 + socFactor * 0.2)) * 100) / 100;

    // Current
    const current = charging
      ? Math.round(seededRandom(rng, 20, battery.max_current * 0.8) * 100) / 100
      : Math.round(-seededRandom(rng, 10, battery.max_current * 0.6) * 100) / 100;

    // Temperature correlates with current magnitude and has daily cycle
    const hourOfDay = (i / 200) * 24;
    const diurnalTemp = Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2) * 3;
    const currentHeat = Math.abs(current) * 0.04;
    temp = Math.round(
      (baseTemp + diurnalTemp + currentHeat + seededRandom(rng, -1, 1)) * 10
    ) / 10;
    temp = Math.max(18, Math.min(55, temp));

    // SOH degrades very slowly
    soh = Math.round(Math.max(60, soh - seededRandom(rng, 0, 0.001)) * 10) / 10;

    points.push({
      timestamp,
      voltage,
      current,
      temperature: temp,
      soc: Math.round(soc * 10) / 10,
      soh,
    });
  }

  return points;
}

// ─── CELL VOLTAGE / TEMPERATURE GENERATORS ───────────────────────────────────

export function generateCellVoltages(): number[] {
  const rng = createRNG(789);
  const cells: number[] = [];
  for (let i = 0; i < 40; i++) {
    cells.push(Math.round(seededRandom(rng, 3.2, 4.2) * 1000) / 1000);
  }
  return cells;
}

export function generateCellTemperatures(): number[] {
  const rng = createRNG(321);
  const cells: number[] = [];
  for (let i = 0; i < 40; i++) {
    cells.push(Math.round(seededRandom(rng, 22, 50) * 10) / 10);
  }
  return cells;
}
