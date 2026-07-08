export interface MapVehicle {
  id: string;
  fleetId: string;
  fleetName: string;
  name: string;
  number: string;
  driver: string;
  status: 'healthy' | 'charging' | 'maintenance' | 'critical';
  batteryId: string;
  batteryLevel: number;
  soh: number;
  soc: number;
  temperature: number;
  speed: number;
  range: number;
  alerts: number;
  lat: number;
  lng: number;
  route: { lat: number; lng: number }[];
}

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  lat: number;
  lng: number;
  available: number;
  busy: number;
  offline: number;
  speeds: string[];
  hours: string;
}

export interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  phone: string;
  services: string[];
  rating: number;
  lat: number;
  lng: number;
}

function createRNG(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = createRNG(42);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randAlphanum(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(rng() * chars.length)];
  }
  return result;
}

function jitter(base: number, amount: number): number {
  return base + randFloat(-amount, amount);
}

function generateNumberPlate(stateCode: string): string {
  const letters1 = String.fromCharCode(65 + randInt(0, 25));
  const letters2 = String.fromCharCode(65 + randInt(0, 25));
  const digits = randInt(1000, 9999);
  return `${stateCode}-${letters1}${letters2}-${digits}`;
}

function generateAddress(cityName: string): string {
  const plotNos = ['Plot 12', 'Survey No. 45', 'H.No. 8-2-293', 'Shop No. 7', 'Ground Floor', 'Plot 56/B', 'Unit 3', 'Sector 14', 'Block C', 'House No. 1-2-3'];
  const areas: Record<string, string[]> = {
    Hyderabad: ['Hitech City', 'Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills', 'Jubilee Hills', 'Ameerpet', 'Secunderabad', 'Kukatpally', 'Miyapur', 'LB Nagar', 'Nagole', 'Uppal', 'Kompally'],
    Bangalore: ['Whitefield', 'MG Road', 'Indiranagar', 'Koramangala', 'Electronic City', 'Hebbal', 'JP Nagar', 'HSR Layout'],
    Chennai: ['OMR', 'Velachery', 'Adyar', 'T Nagar', 'Anna Nagar', 'Guindy', 'Thoraipakkam'],
    Mumbai: ['Andheri West', 'Bandra East', 'Powai', 'Worli', 'Lower Parel', 'Vikhroli', 'Goregaon'],
    Pune: ['Hinjewadi', 'Kharadi', 'Baner', 'Viman Nagar', 'Shivajinagar', 'Koregaon Park'],
    Delhi: ['Connaught Place', 'Dwarka', 'Rohini', 'Saket', 'Nehru Place', 'Okhla', 'Karol Bagh'],
    Noida: ['Sector 62', 'Sector 18', 'Sector 16', 'Sector 44', 'Sector 33'],
    Ahmedabad: ['SG Highway', 'Satellite', 'Navrangpura', 'Vastrapur', 'Bodakdev'],
    Surat: ['City Light', 'Adajan', 'Vesu', 'Piplod', 'Varachha'],
    Kolkata: ['Salt Lake', 'New Town', 'Rajarhat', 'Park Street', 'Howrah'],
    Jaipur: ['Tonk Road', 'Malviya Nagar', 'Mansarovar', 'Vaishali Nagar', 'C Scheme'],
    Lucknow: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Vibhuti Khand'],
    Nagpur: ['Dhantoli', 'Sadar', 'Ram Nagar', 'Civil Lines', 'Itwari'],
    Coimbatore: ['Peelamedu', 'RS Puram', 'Saibaba Colony', 'Gandhipuram', 'Singanallur'],
    Indore: ['Vijay Nagar', 'Scheme 140', 'Palasia', 'Bhawarkua', 'MR 9'],
    Bhopal: ['MP Nagar', 'Hoshangabad Road', 'Arera Colony', 'Shahpura', 'New Market'],
    Vijayawada: ['Besant Road', 'MG Road', 'Labbipet', 'Benz Circle', 'Governorpet'],
    Visakhapatnam: ['Dwaraka Nagar', 'MVP Colony', 'Madhurawada', 'Gajuwaka', 'Waltair'],
    Warangal: ['Hanamkonda', 'Kazipet', 'Subedari', 'Naimnagar'],
    Gachibowli: ['Gachibowli', 'Financial District', 'Nanakramguda'],
    Secunderabad: ['Parade Grounds', 'Tarnaka', 'Trimulgherry'],
  };
  const stateMap: Record<string, string> = {
    Hyderabad: 'Telangana', Bangalore: 'Karnataka', Chennai: 'Tamil Nadu',
    Mumbai: 'Maharashtra', Pune: 'Maharashtra', Delhi: 'Delhi',
    Noida: 'Uttar Pradesh', Ahmedabad: 'Gujarat', Surat: 'Gujarat',
    Kolkata: 'West Bengal', Jaipur: 'Rajasthan', Lucknow: 'Uttar Pradesh',
    Nagpur: 'Maharashtra', Coimbatore: 'Tamil Nadu', Indore: 'Madhya Pradesh',
    Bhopal: 'Madhya Pradesh', Vijayawada: 'Andhra Pradesh',
    Visakhapatnam: 'Andhra Pradesh', Warangal: 'Telangana',
    Gachibowli: 'Telangana', Secunderabad: 'Telangana',
  };
  const pinCode = String(randInt(500001, 800000));
  const area = pick(areas[cityName] || ['Main Road']);
  const plot = pick(plotNos);
  const state = stateMap[cityName] || 'Telangana';
  return `${plot}, ${area}, ${cityName}, ${state} - ${pinCode}`;
}

const vehicleModels: { name: string; fleetId: string; fleetName: string }[] = [
  { name: 'Tata Nexon EV', fleetId: 'tata-', fleetName: 'Tata EV Fleet' },
  { name: 'Tata Punch EV', fleetId: 'tata-', fleetName: 'Tata EV Fleet' },
  { name: 'Tata Tiago EV', fleetId: 'tata-', fleetName: 'Tata EV Fleet' },
  { name: 'Tata Tigor EV', fleetId: 'tata-', fleetName: 'Tata EV Fleet' },
  { name: 'Mahindra XUV400', fleetId: 'mahindra-', fleetName: 'Mahindra EV Fleet' },
  { name: 'Mahindra eVerito', fleetId: 'mahindra-', fleetName: 'Mahindra EV Fleet' },
  { name: 'MG ZS EV', fleetId: 'mg-', fleetName: 'MG EV Fleet' },
  { name: 'MG Comet EV', fleetId: 'mg-', fleetName: 'MG EV Fleet' },
  { name: 'BYD Atto 3', fleetId: 'byd-', fleetName: 'BYD EV Fleet' },
  { name: 'BYD e6', fleetId: 'byd-', fleetName: 'BYD EV Fleet' },
  { name: 'Hyundai Kona Electric', fleetId: 'hyundai-', fleetName: 'Hyundai EV Fleet' },
  { name: 'Hyundai Ioniq 5', fleetId: 'hyundai-', fleetName: 'Hyundai EV Fleet' },
  { name: 'Kia EV6', fleetId: 'kia-', fleetName: 'Kia EV Fleet' },
  { name: 'Ola S1 Pro', fleetId: 'ola-', fleetName: 'Ola Electric Fleet' },
  { name: 'Ola S1', fleetId: 'ola-', fleetName: 'Ola Electric Fleet' },
  { name: 'Ather 450X', fleetId: 'ather-', fleetName: 'Ather Energy Fleet' },
  { name: 'Ather 450S', fleetId: 'ather-', fleetName: 'Ather Energy Fleet' },
  { name: 'TVS iQube', fleetId: 'tvs-', fleetName: 'TVS Electric Fleet' },
  { name: 'TVS iQube S', fleetId: 'tvs-', fleetName: 'TVS Electric Fleet' },
  { name: 'Bajaj Chetak', fleetId: 'bajaj-', fleetName: 'Bajaj EV Fleet' },
  { name: 'Revolt RV400', fleetId: 'revolt-', fleetName: 'Revolt EV Fleet' },
];

const drivers: string[] = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh', 'Ananya Gupta',
  'Ravi Verma', 'Pooja Mehta', 'Arun Joshi', 'Neha Kapoor', 'Suresh Nair', 'Divya Desai',
  'Manoj Tiwari', 'Kavita Rao', 'Vijay Shekhar', 'Deepa Iyer', 'Rahul Jain', 'Shweta Mishra',
  'Akash Yadav', 'Lakshmi Narayan', 'Sanjay Gupta', 'Nandini Krishnan', 'Karthik Rajan',
  'Anita Deshmukh', 'Gaurav Sharma',
];

interface CityDef {
  name: string;
  lat: number;
  lng: number;
  stateCode: string;
  count: number;
}

const cities: CityDef[] = [
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, stateCode: 'TS-09', count: 3 },
  { name: 'Hyder Nagar', lat: 17.4658, lng: 78.5647, stateCode: 'TS-09', count: 2 },
  { name: 'Kukatpally', lat: 17.4846, lng: 78.4116, stateCode: 'TS-09', count: 2 },
  { name: 'Miyapur', lat: 17.4973, lng: 78.3538, stateCode: 'TS-09', count: 2 },
  { name: 'Gachibowli', lat: 17.4401, lng: 78.3489, stateCode: 'TS-09', count: 3 },
  { name: 'Hitech City', lat: 17.4499, lng: 78.3806, stateCode: 'TS-09', count: 2 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983, stateCode: 'TS-09', count: 2 },
  { name: 'Ameerpet', lat: 17.4344, lng: 78.4484, stateCode: 'TS-09', count: 2 },
  { name: 'LB Nagar', lat: 17.3474, lng: 78.5518, stateCode: 'TS-09', count: 2 },
  { name: 'Banjara Hills', lat: 17.4140, lng: 78.4370, stateCode: 'TS-09', count: 2 },
  { name: 'Jubilee Hills', lat: 17.4316, lng: 78.4091, stateCode: 'TS-09', count: 2 },
  { name: 'Nagole', lat: 17.3586, lng: 78.5674, stateCode: 'TS-09', count: 1 },
  { name: 'Uppal', lat: 17.4058, lng: 78.5594, stateCode: 'TS-09', count: 1 },
  { name: 'Kompally', lat: 17.5395, lng: 78.4932, stateCode: 'TS-09', count: 1 },
  { name: 'Shamshabad', lat: 17.2539, lng: 78.3899, stateCode: 'TS-09', count: 1 },
  { name: 'Warangal', lat: 17.9689, lng: 79.5941, stateCode: 'TS-22', count: 3 },
  { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, stateCode: 'TS-24', count: 2 },
  { name: 'Nizamabad', lat: 18.6720, lng: 78.0940, stateCode: 'TS-14', count: 2 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, stateCode: 'KA-01', count: 14 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, stateCode: 'TN-01', count: 12 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, stateCode: 'MH-01', count: 12 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, stateCode: 'MH-12', count: 10 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, stateCode: 'DL-01', count: 6 },
  { name: 'Noida', lat: 28.5355, lng: 77.3910, stateCode: 'UP-16', count: 4 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, stateCode: 'GJ-01', count: 6 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, stateCode: 'GJ-05', count: 6 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, stateCode: 'WB-01', count: 6 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, stateCode: 'RJ-01', count: 6 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, stateCode: 'UP-32', count: 5 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, stateCode: 'MH-31', count: 5 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, stateCode: 'TN-37', count: 5 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, stateCode: 'MP-09', count: 5 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, stateCode: 'MP-04', count: 5 },
  { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, stateCode: 'AP-16', count: 4 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, stateCode: 'AP-31', count: 4 },
];

function createVehicles(): MapVehicle[] {
  const vehicles: MapVehicle[] = [];
  let vehicleIndex = 0;

  for (const city of cities) {
    for (let i = 0; i < city.count; i++) {
      const model = pick(vehicleModels);
      const driver = pick(drivers);

      const rand = rng();
      let status: MapVehicle['status'];
      if (rand < 0.6) status = 'healthy';
      else if (rand < 0.8) status = 'charging';
      else if (rand < 0.92) status = 'maintenance';
      else status = 'critical';

      let batteryLevel: number;
      let soh: number;
      let soc: number;
      let temperature: number;
      let speed: number;
      let range: number;
      let alerts: number;

      switch (status) {
        case 'healthy':
          batteryLevel = randInt(50, 95);
          soh = randInt(85, 98);
          soc = batteryLevel - randInt(0, 5);
          temperature = randInt(28, 38);
          speed = randInt(10, 80);
          range = Math.round(batteryLevel * randFloat(0.8, 1.2));
          alerts = randInt(0, 2);
          break;
        case 'charging':
          batteryLevel = randInt(30, 85);
          soh = randInt(82, 95);
          soc = batteryLevel - randInt(0, 3);
          temperature = randInt(28, 35);
          speed = 0;
          range = Math.round(batteryLevel * randFloat(0.8, 1.2));
          alerts = randInt(0, 2);
          break;
        case 'maintenance':
          batteryLevel = randInt(20, 60);
          soh = randInt(70, 85);
          soc = batteryLevel - randInt(0, 5);
          temperature = randInt(30, 42);
          speed = 0;
          range = Math.round(batteryLevel * randFloat(0.8, 1.2));
          alerts = randInt(1, 4);
          break;
        case 'critical':
          batteryLevel = randInt(10, 40);
          soh = randInt(50, 70);
          soc = batteryLevel - randInt(0, 5);
          temperature = randInt(40, 55);
          speed = randInt(10, 80);
          range = Math.round(batteryLevel * randFloat(0.8, 1.2));
          alerts = randInt(3, 8);
          break;
      }

      if (soc < 0) soc = 0;
      if (range < 0) range = 0;

      const lat = Math.round(jitter(city.lat, 0.05) * 10000) / 10000;
      const lng = Math.round(jitter(city.lng, 0.05) * 10000) / 10000;

      const numWaypoints = randInt(3, 5);
      const route: { lat: number; lng: number }[] = [];
      let prevLat = lat;
      let prevLng = lng;
      for (let w = 0; w < numWaypoints; w++) {
        route.push({
          lat: Math.round(jitter(prevLat, 0.015) * 10000) / 10000,
          lng: Math.round(jitter(prevLng, 0.015) * 10000) / 10000,
        });
        prevLat += randFloat(-0.008, 0.008);
        prevLng += randFloat(-0.008, 0.008);
      }

      vehicles.push({
        id: `V${String(vehicleIndex + 1).padStart(3, '0')}`,
        fleetId: model.fleetId,
        fleetName: model.fleetName,
        name: model.name,
        number: generateNumberPlate(city.stateCode),
        driver,
        status,
        batteryId: `BAT-${randAlphanum(6)}`,
        batteryLevel,
        soh,
        soc,
        temperature,
        speed,
        range,
        alerts,
        lat,
        lng,
        route,
      });
      vehicleIndex++;
    }
  }
  return vehicles;
}

function createStations(): ChargingStation[] {
  const operators = ['Tata Power EZ Charge', 'Ather Grid', 'Statiq', 'ChargeZone', 'Jio-bp Pulse', 'Zeon Charging', 'Shell Recharge', 'Fortum'];
  const speeds = ['30kW', '60kW', '120kW'];
  const hoursOpts = ['6:00 AM - 10:00 PM', '7:00 AM - 11:00 PM', '24 hours', '5:00 AM - 12:00 AM'];

  const stationAreas: { name: string; lat: number; lng: number; count: number }[] = [
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, count: 9 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, count: 5 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, count: 4 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, count: 4 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567, count: 3 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025, count: 3 },
    { name: 'Noida', lat: 28.5355, lng: 77.3910, count: 1 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, count: 2 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311, count: 2 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639, count: 2 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, count: 2 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462, count: 2 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882, count: 2 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, count: 2 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577, count: 2 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126, count: 2 },
    { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, count: 1 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, count: 1 },
    { name: 'Warangal', lat: 17.9689, lng: 79.5941, count: 1 },
  ];

  const stations: ChargingStation[] = [];
  let idx = 0;

  for (const area of stationAreas) {
    for (let i = 0; i < area.count; i++) {
      const operator = pick(operators);
      const totalPorts = randInt(2, 8);
      const available = randInt(0, totalPorts);
      const remaining = totalPorts - available;
      const busy = remaining > 0 ? randInt(0, remaining) : 0;
      const offline = totalPorts - available - busy;

      const numSpeeds = randInt(1, 3);
      const stationSpeeds: string[] = [];
      const speedUsed = new Set<number>();
      for (let s = 0; s < numSpeeds; s++) {
        let si = randInt(0, speeds.length - 1);
        while (speedUsed.has(si)) si = randInt(0, speeds.length - 1);
        speedUsed.add(si);
        stationSpeeds.push(speeds[si]);
      }
      stationSpeeds.sort();

      stations.push({
        id: `CS${String(idx + 1).padStart(2, '0')}`,
        name: `${operator} - ${area.name} ${idx + 1}`,
        operator,
        address: generateAddress(area.name),
        lat: Math.round(jitter(area.lat, 0.04) * 10000) / 10000,
        lng: Math.round(jitter(area.lng, 0.04) * 10000) / 10000,
        available,
        busy,
        offline,
        speeds: stationSpeeds,
        hours: pick(hoursOpts),
      });
      idx++;
    }
  }
  return stations;
}

function createServiceCenters(): ServiceCenter[] {
  const serviceNames = [
    'AutoCare EV Service', 'Green Garage', 'EV Pro Care', 'Eco Drive Service',
    'VoltCare Auto', 'Spark Service Center', 'EV Hub', 'DriveGreen Service',
    'PowerWheel Garage', 'E-Car Care', 'Electra Service', 'Watt Automotive',
  ];
  const phonePrefixes = ['+91-98765', '+91-87654', '+91-76543', '+91-99887', '+91-88776', '+91-77665'];
  const allServices = [
    'Battery Check', 'Motor Service', 'Software Update', 'Tire Replacement',
    'Brake Inspection', 'AC Service', 'Coolant Flush', 'Controller Diagnostics',
    'Charging Port Repair', 'Full System Scan', 'Gearbox Service', 'Suspension Check',
    'Cell Balancing', 'Thermal Management', 'BMS Calibration',
  ];

  const serviceCenterDefs: { name: string; lat: number; lng: number }[] = [
    { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
    { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  ];

  return serviceCenterDefs.map((def, idx) => {
    const numServices = randInt(3, 5);
    const services: string[] = [];
    const usedIndices = new Set<number>();
    for (let s = 0; s < numServices; s++) {
      let si = randInt(0, allServices.length - 1);
      while (usedIndices.has(si)) si = randInt(0, allServices.length - 1);
      usedIndices.add(si);
      services.push(allServices[si]);
    }

    return {
      id: `SC${String(idx + 1).padStart(2, '0')}`,
      name: pick(serviceNames) + ' - ' + def.name,
      address: generateAddress(def.name),
      phone: pick(phonePrefixes) + String(randInt(100000, 999999)),
      services,
      rating: Math.round(randFloat(3.5, 5.0) * 10) / 10,
      lat: Math.round(jitter(def.lat, 0.03) * 10000) / 10000,
      lng: Math.round(jitter(def.lng, 0.03) * 10000) / 10000,
    };
  });
}

export const roadRoutes: { lat: number; lng: number }[][] = [
  [
    { lat: 19.076, lng: 72.8777 },
    { lat: 18.6514, lng: 73.7507 },
    { lat: 18.5204, lng: 73.8567 },
    { lat: 17.385, lng: 74.015 },
    { lat: 16.5, lng: 74.5 },
    { lat: 15.5, lng: 75.5 },
    { lat: 14.5, lng: 76.5 },
    { lat: 13.5, lng: 77.2 },
    { lat: 12.9716, lng: 77.5946 },
    { lat: 13.0827, lng: 80.2707 },
  ],
  [
    { lat: 28.7041, lng: 77.1025 },
    { lat: 27.5, lng: 76.5 },
    { lat: 26.9124, lng: 75.7873 },
    { lat: 25.5, lng: 74.5 },
    { lat: 24.0, lng: 73.5 },
    { lat: 23.0225, lng: 72.5714 },
    { lat: 22.0, lng: 72.0 },
    { lat: 20.5, lng: 72.5 },
    { lat: 19.5, lng: 72.9 },
    { lat: 19.076, lng: 72.8777 },
  ],
  [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 13.5, lng: 77.8 },
    { lat: 14.5, lng: 78.0 },
    { lat: 15.5, lng: 78.2 },
    { lat: 16.5, lng: 78.5 },
    { lat: 17.385, lng: 78.4867 },
  ],
  [
    { lat: 28.7041, lng: 77.1025 },
    { lat: 28.0, lng: 78.5 },
    { lat: 27.5, lng: 79.5 },
    { lat: 26.8467, lng: 80.9462 },
    { lat: 26.0, lng: 82.0 },
    { lat: 25.6093, lng: 85.1376 },
    { lat: 24.0, lng: 86.5 },
    { lat: 23.0, lng: 87.5 },
    { lat: 22.5726, lng: 88.3639 },
  ],
  [
    { lat: 13.0827, lng: 80.2707 },
    { lat: 13.8, lng: 79.8 },
    { lat: 14.5, lng: 79.2 },
    { lat: 15.5, lng: 79.0 },
    { lat: 16.5, lng: 78.8 },
    { lat: 17.385, lng: 78.4867 },
  ],
  [
    { lat: 19.076, lng: 72.8777 },
    { lat: 19.5, lng: 73.5 },
    { lat: 20.0, lng: 74.5 },
    { lat: 20.5, lng: 75.5 },
    { lat: 21.1458, lng: 79.0882 },
  ],
  [
    { lat: 9.9312, lng: 76.2673 },
    { lat: 10.5, lng: 76.5 },
    { lat: 11.0168, lng: 76.9558 },
    { lat: 11.5, lng: 77.3 },
    { lat: 12.0, lng: 77.5 },
    { lat: 12.9716, lng: 77.5946 },
  ],
];

export const highTempAreas: { lat: number; lng: number; intensity: number }[] = [
  { lat: 23.0, lng: 72.5, intensity: 0.9 },
  { lat: 21.0, lng: 75.0, intensity: 0.85 },
  { lat: 22.5, lng: 75.5, intensity: 0.8 },
  { lat: 19.0, lng: 74.0, intensity: 0.75 },
  { lat: 26.0, lng: 73.0, intensity: 0.9 },
  { lat: 28.5, lng: 76.0, intensity: 0.7 },
  { lat: 25.0, lng: 78.0, intensity: 0.65 },
  { lat: 20.5, lng: 79.0, intensity: 0.8 },
  { lat: 17.5, lng: 78.5, intensity: 0.7 },
  { lat: 18.5, lng: 75.5, intensity: 0.75 },
  { lat: 22.0, lng: 72.0, intensity: 0.85 },
  { lat: 24.5, lng: 74.0, intensity: 0.8 },
  { lat: 27.0, lng: 75.0, intensity: 0.7 },
  { lat: 21.5, lng: 77.0, intensity: 0.65 },
  { lat: 19.5, lng: 78.0, intensity: 0.6 },
  { lat: 15.5, lng: 75.0, intensity: 0.55 },
  { lat: 13.5, lng: 77.5, intensity: 0.5 },
  { lat: 26.5, lng: 80.0, intensity: 0.6 },
  { lat: 23.5, lng: 86.0, intensity: 0.55 },
  { lat: 20.0, lng: 72.5, intensity: 0.5 },
];

export const highChargingActivity: { lat: number; lng: number; intensity: number }[] = [
  { lat: 19.076, lng: 72.8777, intensity: 0.95 },
  { lat: 28.7041, lng: 77.1025, intensity: 0.9 },
  { lat: 12.9716, lng: 77.5946, intensity: 0.85 },
  { lat: 13.0827, lng: 80.2707, intensity: 0.8 },
  { lat: 17.385, lng: 78.4867, intensity: 0.75 },
  { lat: 18.5204, lng: 73.8567, intensity: 0.7 },
  { lat: 22.5726, lng: 88.3639, intensity: 0.65 },
  { lat: 23.0225, lng: 72.5714, intensity: 0.6 },
  { lat: 26.9124, lng: 75.7873, intensity: 0.55 },
  { lat: 9.9312, lng: 76.2673, intensity: 0.5 },
  { lat: 11.0168, lng: 76.9558, intensity: 0.45 },
  { lat: 30.7333, lng: 76.7794, intensity: 0.4 },
  { lat: 21.1458, lng: 79.0882, intensity: 0.35 },
  { lat: 25.6093, lng: 85.1376, intensity: 0.3 },
  { lat: 22.7196, lng: 75.8577, intensity: 0.35 },
];

export const alertDensity: { lat: number; lng: number; intensity: number }[] = [
  { lat: 19.076, lng: 72.8777, intensity: 0.8 },
  { lat: 28.7041, lng: 77.1025, intensity: 0.7 },
  { lat: 12.9716, lng: 77.5946, intensity: 0.6 },
  { lat: 13.0827, lng: 80.2707, intensity: 0.5 },
  { lat: 18.5204, lng: 73.8567, intensity: 0.4 },
  { lat: 17.385, lng: 78.4867, intensity: 0.45 },
  { lat: 22.5726, lng: 88.3639, intensity: 0.35 },
  { lat: 9.9312, lng: 76.2673, intensity: 0.3 },
  { lat: 23.0225, lng: 72.5714, intensity: 0.25 },
  { lat: 26.9124, lng: 75.7873, intensity: 0.2 },
  { lat: 11.0168, lng: 76.9558, intensity: 0.25 },
  { lat: 21.1458, lng: 79.0882, intensity: 0.2 },
  { lat: 25.6093, lng: 85.1376, intensity: 0.15 },
  { lat: 30.7333, lng: 76.7794, intensity: 0.2 },
  { lat: 22.7196, lng: 75.8577, intensity: 0.15 },
];

export const vehicles: MapVehicle[] = createVehicles();
export const chargingStations: ChargingStation[] = createStations();
export const serviceCenters: ServiceCenter[] = createServiceCenters();
