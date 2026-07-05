import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Box, BookOpen, Map, Play, 
  Lightbulb, Bell, Settings, Battery, Thermometer,
  Zap, TrendingUp, AlertTriangle, Shield
} from 'lucide-react';
import { DigitalTwinView } from './components/DigitalTwin/BatteryPack3D';
import { BatteryPassport } from './components/Passport/BatteryPassport';
import { BatteryLifeSimulator } from './components/Simulator/BatteryLifeSimulator';

// Mock data store
const useBatteryStore = () => {
  const [batteryData, setBatteryData] = useState({
    soh: 87.3,
    soc: 62.4,
    voltage: 355.2,
    current: 45.3,
    temperature: 32.4,
    rul: 847,
    thermalRisk: 12.5,
    anomalyScore: 0.02,
    cycleCount: 1247,
    charging: false,
    driving: false
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setBatteryData(prev => ({
        ...prev,
        soc: Math.max(0, Math.min(100, prev.soc + (Math.random() - 0.5) * 0.5)),
        temperature: Math.max(20, Math.min(50, prev.temperature + (Math.random() - 0.5) * 0.3)),
        voltage: prev.voltage + (Math.random() - 0.5) * 0.5,
        current: prev.current + (Math.random() - 0.5) * 0.3
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return batteryData;
};

// Sidebar Component
const Sidebar = () => (
  <div className="w-64 bg-[#12121e] h-screen fixed left-0 top-0 border-r border-[#2a2a3a]">
    <div className="p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#3b82f6] rounded-lg flex items-center justify-center">
          <Battery className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">EdgeTwin</h1>
          <p className="text-[#606070] text-xs">BMS+ Platform</p>
        </div>
      </div>
      
      <nav className="space-y-2">
        {[
          { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/twin', icon: Box, label: 'Digital Twin' },
          { to: '/passport', icon: BookOpen, label: 'Battery Passport' },
          { to: '/fleet', icon: Map, label: 'Fleet Overview' },
          { to: '/simulator', icon: Play, label: 'Simulator' },
          { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
          { to: '/alerts', icon: Bell, label: 'Alerts' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#3b82f6]/20 text-[#3b82f6]' 
                  : 'text-[#a0a0b0] hover:bg-[#1a1a2e] hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);

// Health Card Component
const HealthCard = ({ title, value, unit, icon: Icon, color, trend }: {
  title: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) => (
  <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a] hover:border-[#3b82f6]/50 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[#a0a0b0] text-sm">{title}</span>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-white">{value.toFixed(1)}</span>
      <span className="text-[#a0a0b0] text-sm">{unit}</span>
    </div>
    {trend && (
      <div className={`text-xs mt-2 ${trend.startsWith('+') ? 'text-[#00ff88]' : 'text-[#ff0000]'}`}>
        {trend}
      </div>
    )}
  </div>
);

// Dashboard Page
const Dashboard = () => {
  const data = useBatteryStore();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Battery Dashboard</h1>
          <p className="text-[#a0a0b0]">Real-time monitoring for BT-2024-001</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] text-sm">Live</span>
        </div>
      </div>
      
      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard 
          title="Battery Health" 
          value={data.soh} 
          unit="%" 
          icon={Shield} 
          color="#00ff88"
          trend="+0.2% from last week"
        />
        <HealthCard 
          title="State of Charge" 
          value={data.soc} 
          unit="%" 
          icon={Battery} 
          color="#3b82f6"
        />
        <HealthCard 
          title="Temperature" 
          value={data.temperature} 
          unit="°C" 
          icon={Thermometer} 
          color={data.temperature > 40 ? '#ff8c00' : '#00ff88'}
        />
        <HealthCard 
          title="Remaining Life" 
          value={data.rul} 
          unit="cycles" 
          icon={TrendingUp} 
          color="#8b5cf6"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a]">
          <h3 className="text-white font-semibold mb-4">Voltage Monitor</h3>
          <div className="h-48 flex items-center justify-center text-[#606070]">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-2 text-[#ffd700]" />
              <p className="text-2xl font-bold text-white">{data.voltage.toFixed(1)}V</p>
              <p className="text-sm">Pack Voltage</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a]">
          <h3 className="text-white font-semibold mb-4">Thermal Risk</h3>
          <div className="h-48 flex items-center justify-center">
            <div className="relative">
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={data.thermalRisk > 60 ? '#ff0000' : data.thermalRisk > 30 ? '#ffd700' : '#00ff88'} 
                  strokeWidth="8"
                  strokeDasharray={`${data.thermalRisk * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{data.thermalRisk.toFixed(0)}%</span>
                <span className="text-xs text-[#a0a0b0]">Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alerts Panel */}
      <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a]">
        <h3 className="text-white font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg">
            <AlertTriangle className="w-5 h-5 text-[#ffd700]" />
            <div className="flex-1">
              <p className="text-white text-sm">Temperature variance elevated</p>
              <p className="text-[#a0a0b0] text-xs">Cell #23 showing 2.3°C deviation</p>
            </div>
            <span className="text-[#ffd700] text-xs">Warning</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg">
            <Shield className="w-5 h-5 text-[#00ff88]" />
            <div className="flex-1">
              <p className="text-white text-sm">System operating normally</p>
              <p className="text-[#a0a0b0] text-xs">All parameters within safe range</p>
            </div>
            <span className="text-[#00ff88] text-xs">Info</span>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="bg-[#12121e] rounded-xl p-5 border border-[#2a2a3a]">
        <h3 className="text-white font-semibold mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/30">
            <Lightbulb className="w-5 h-5 text-[#3b82f6] mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Reduce fast charging frequency</p>
              <p className="text-[#a0a0b0] text-xs">Fast charging contributes 8.7% to battery degradation</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/30">
            <Lightbulb className="w-5 h-5 text-[#3b82f6] mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Schedule thermal inspection</p>
              <p className="text-[#a0a0b0] text-xs">Temperature variance detected, recommend cooling system check</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return (
    <Router>
      <div className="flex bg-[#0a0a1a] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/twin" element={<DigitalTwinView />} />
            <Route path="/passport" element={<BatteryPassport />} />
            <Route path="/simulator" element={<BatteryLifeSimulator />} />
            <Route path="/fleet" element={<div className="text-white">Fleet View - Coming Soon</div>} />
            <Route path="/recommendations" element={<div className="text-white">Recommendations - Coming Soon</div>} />
            <Route path="/alerts" element={<div className="text-white">Alerts - Coming Soon</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
