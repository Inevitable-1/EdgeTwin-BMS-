import React from 'react';
import { Battery, Calendar, Clock, Thermometer, Leaf, Recycle, AlertTriangle, CheckCircle } from 'lucide-react';

interface PassportData {
  battery_id: string;
  manufacturer: string;
  chemistry: string;
  capacity_kwh: number;
  nominal_voltage: number;
  manufacturing_date: string;
  warranty_status: string;
  warranty_expiry: string;
  cycle_count: number;
  soh: number;
  predicted_rul_cycles: number;
  fast_charge_count: number;
  total_energy_throughput: number;
  carbon_footprint_kg: number;
  second_life_eligible: boolean;
  recycling_recommended: boolean;
  end_of_life_status: string;
  charging_history: {
    total_sessions: number;
    fast_charge_percentage: number;
    avg_charge_time_min: number;
    avg_energy_per_session_kwh: number;
  };
  maintenance_history: Array<{
    date: string;
    type: string;
    cost: number;
    status: string;
  }>;
}

const mockPassport: PassportData = {
  battery_id: "BT-2024-001",
  manufacturer: "Tata Autocomp",
  chemistry: "NMC 811",
  capacity_kwh: 75.0,
  nominal_voltage: 355.2,
  manufacturing_date: "2024-01-15",
  warranty_status: "ACTIVE",
  warranty_expiry: "2032-01-15",
  cycle_count: 1247,
  soh: 87.3,
  predicted_rul_cycles: 847,
  fast_charge_count: 234,
  total_energy_throughput: 74820,
  carbon_footprint_kg: 465,
  second_life_eligible: true,
  recycling_recommended: false,
  end_of_life_status: "ACTIVE",
  charging_history: {
    total_sessions: 892,
    fast_charge_percentage: 26.2,
    avg_charge_time_min: 45,
    avg_energy_per_session_kwh: 22.3
  },
  maintenance_history: [
    { date: "2024-06-15", type: "Inspection", cost: 2000, status: "completed" },
    { date: "2024-12-01", type: "Cell Balancing", cost: 500, status: "completed" },
    { date: "2025-03-10", type: "Thermal Service", cost: 5000, status: "completed" }
  ]
};

const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a]">
    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
      {title}
    </h3>
    {children}
  </div>
);

const InfoRow = ({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-[#2a2a3a] last:border-0">
    <span className="text-[#a0a0b0] text-sm">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-[#00ff88]' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

export const BatteryPassport: React.FC = () => {
  const passport = mockPassport;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Battery Passport</h1>
          <p className="text-[#a0a0b0]">Digital identity for {passport.battery_id}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          passport.warranty_status === 'ACTIVE' 
            ? 'bg-[#00ff88]/20 text-[#00ff88]' 
            : 'bg-[#ff0000]/20 text-[#ff0000]'
        }`}>
          {passport.warranty_status}
        </div>
      </div>
      
      {/* Basic Information */}
      <InfoCard title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Battery ID" value={passport.battery_id} />
          <InfoRow label="Manufacturer" value={passport.manufacturer} />
          <InfoRow label="Chemistry" value={passport.chemistry} />
          <InfoRow label="Capacity" value={`${passport.capacity_kwh} kWh`} />
          <InfoRow label="Nominal Voltage" value={`${passport.nominal_voltage}V`} />
          <InfoRow label="Manufacturing Date" value={passport.manufacturing_date} />
          <InfoRow label="Warranty Expiry" value={passport.warranty_expiry} />
          <InfoRow label="End-of-Life Status" value={passport.end_of_life_status} />
        </div>
      </InfoCard>
      
      {/* Health Status */}
      <InfoCard title="Health Status">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[#a0a0b0] text-sm">Battery Health (SOH)</span>
              <span className="text-white font-medium">{passport.soh}%</span>
            </div>
            <div className="h-3 bg-[#2a2a3a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00ff88] to-[#3b82f6] transition-all duration-500"
                style={{ width: `${passport.soh}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Cycle Count" value={`${passport.cycle_count.toLocaleString()} / 5,000`} />
            <InfoRow label="Predicted RUL" value={`${passport.predicted_rul_cycles} cycles (~2.3 years)`} highlight />
          </div>
        </div>
      </InfoCard>
      
      {/* Charging History */}
      <InfoCard title="Charging History">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Total Sessions" value={passport.charging_history.total_sessions} />
          <InfoRow label="Fast Charging" value={`${passport.charging_history.fast_charge_percentage}%`} highlight={passport.charging_history.fast_charge_percentage > 20} />
          <InfoRow label="Avg Charge Time" value={`${passport.charging_history.avg_charge_time_min} min`} />
          <InfoRow label="Avg Energy/Session" value={`${passport.charging_history.avg_energy_per_session_kwh} kWh`} />
        </div>
      </InfoCard>
      
      {/* Sustainability */}
      <InfoCard title="Sustainability">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Carbon Footprint" value={`${passport.carbon_footprint_kg} kg CO2e`} />
            <InfoRow label="Energy Throughput" value={`${passport.total_energy_throughput.toLocaleString()} kWh`} />
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className={`flex-1 p-4 rounded-lg border ${
              passport.second_life_eligible 
                ? 'border-[#00ff88]/50 bg-[#00ff88]/10' 
                : 'border-[#2a2a3a] bg-[#1a1a2e]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Recycle className={`w-5 h-5 ${passport.second_life_eligible ? 'text-[#00ff88]' : 'text-[#606070]'}`} />
                <span className="text-white text-sm font-medium">Second-Life Eligible</span>
              </div>
              <span className={`text-2xl font-bold ${passport.second_life_eligible ? 'text-[#00ff88]' : 'text-[#606070]'}`}>
                {passport.second_life_eligible ? 'YES' : 'NO'}
              </span>
            </div>
            
            <div className={`flex-1 p-4 rounded-lg border ${
              passport.recycling_recommended 
                ? 'border-[#ffd700]/50 bg-[#ffd700]/10' 
                : 'border-[#2a2a3a] bg-[#1a1a2e]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className={`w-5 h-5 ${passport.recycling_recommended ? 'text-[#ffd700]' : 'text-[#606070]'}`} />
                <span className="text-white text-sm font-medium">Recycling Recommended</span>
              </div>
              <span className={`text-2xl font-bold ${passport.recycling_recommended ? 'text-[#ffd700]' : 'text-[#606070]'}`}>
                {passport.recycling_recommended ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </InfoCard>
      
      {/* Maintenance History */}
      <InfoCard title="Maintenance History">
        <div className="space-y-3">
          {passport.maintenance_history.map((record, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-[#1a1a2e] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                {record.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                ) : (
                  <Clock className="w-5 h-5 text-[#ffd700]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{record.type}</p>
                <p className="text-[#a0a0b0] text-xs">{record.date}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">₹{record.cost.toLocaleString()}</p>
                <p className="text-[#a0a0b0] text-xs capitalize">{record.status}</p>
              </div>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
};
