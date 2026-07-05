import React, { useState } from 'react';
import { Play, RotateCcw, Battery, Thermometer, Clock, TrendingDown } from 'lucide-react';

interface SimulationParams {
  driving_style: 'eco' | 'normal' | 'sport';
  charging_pattern: 'slow' | 'fast' | 'rapid';
  daily_distance: number;
  ambient_temperature: number;
  charging_soc: number;
}

interface SimulationResult {
  battery_life_years: number;
  thermal_risk: number;
  charging_efficiency: number;
  remaining_useful_life: number;
  recommendations: string[];
}

export const BatteryLifeSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    driving_style: 'normal',
    charging_pattern: 'slow',
    daily_distance: 60,
    ambient_temperature: 25,
    charging_soc: 80
  });
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Simulate computation delay
    setTimeout(() => {
      // Simple simulation logic
      const baseLife = 10;
      const styleFactor = { eco: 1.2, normal: 1.0, sport: 0.8 };
      const chargingFactor = { slow: 1.1, fast: 0.9, rapid: 0.7 };
      
      const lifeFactor = styleFactor[params.driving_style] * chargingFactor[params.charging_pattern];
      const tempFactor = 1 - Math.abs(params.ambient_temperature - 25) * 0.01;
      const predictedLife = baseLife * lifeFactor * tempFactor;
      
      const thermalRisk = params.charging_pattern === 'slow' ? 18 : 
                          params.charging_pattern === 'fast' ? 38 : 58;
      
      const efficiency = params.charging_pattern === 'slow' ? 95 : 
                         params.charging_pattern === 'fast' ? 90 : 85;
      
      const recommendations: string[] = [];
      if (params.driving_style === 'sport') {
        recommendations.push('Switch to Eco mode for +0.8 years battery life');
      }
      if (params.charging_pattern !== 'slow') {
        recommendations.push('Use slow charging for +0.5 years battery life');
      }
      if (params.charging_soc > 90) {
        recommendations.push('Charge to 80% for optimal battery longevity');
      }
      if (params.ambient_temperature > 35) {
        recommendations.push('Park in shade to reduce thermal stress');
      }
      if (params.daily_distance > 100) {
        recommendations.push('Consider carpooling to reduce daily stress');
      }
      
      setResult({
        battery_life_years: Math.round(predictedLife * 10) / 10,
        thermal_risk: thermalRisk,
        charging_efficiency: efficiency,
        remaining_useful_life: Math.round(predictedLife * 300),
        recommendations
      });
      
      setIsSimulating(false);
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Battery Life Simulator</h1>
        <p className="text-[#a0a0b0]">Predict battery performance based on usage patterns</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-[#12121e] rounded-xl p-6 border border-[#2a2a3a]">
          <h2 className="text-white font-semibold mb-6">Input Parameters</h2>
          
          {/* Driving Style */}
          <div className="mb-6">
            <label className="text-[#a0a0b0] text-sm mb-3 block">Driving Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['eco', 'normal', 'sport'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setParams({ ...params, driving_style: style })}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    params.driving_style === style
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-[#1a1a2e] text-[#a0a0b0] hover:bg-[#22223a]'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Charging Pattern */}
          <div className="mb-6">
            <label className="text-[#a0a0b0] text-sm mb-3 block">Charging Pattern</label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'fast', 'rapid'] as const).map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => setParams({ ...params, charging_pattern: pattern })}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    params.charging_pattern === pattern
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-[#1a1a2e] text-[#a0a0b0] hover:bg-[#22223a]'
                  }`}
                >
                  {pattern === 'slow' ? 'Slow (AC)' : pattern === 'fast' ? 'Fast (DC)' : 'Rapid (DC)'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Daily Distance */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-[#a0a0b0] text-sm">Daily Distance</label>
              <span className="text-white text-sm font-medium">{params.daily_distance} km</span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              value={params.daily_distance}
              onChange={(e) => setParams({ ...params, daily_distance: Number(e.target.value) })}
              className="w-full h-2 bg-[#2a2a3a] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#606070] mt-1">
              <span>20 km</span>
              <span>200 km</span>
            </div>
          </div>
          
          {/* Ambient Temperature */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-[#a0a0b0] text-sm">Ambient Temperature</label>
              <span className="text-white text-sm font-medium">{params.ambient_temperature}°C</span>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              value={params.ambient_temperature}
              onChange={(e) => setParams({ ...params, ambient_temperature: Number(e.target.value) })}
              className="w-full h-2 bg-[#2a2a3a] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#606070] mt-1">
              <span>-10°C</span>
              <span>45°C</span>
            </div>
          </div>
          
          {/* Charging SOC */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-[#a0a0b0] text-sm">Charge to</label>
              <span className="text-white text-sm font-medium">{params.charging_soc}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={params.charging_soc}
              onChange={(e) => setParams({ ...params, charging_soc: Number(e.target.value) })}
              className="w-full h-2 bg-[#2a2a3a] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#606070] mt-1">
              <span>20%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Run Button */}
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              isSimulating
                ? 'bg-[#3b82f6]/50 text-white/50 cursor-not-allowed'
                : 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
            }`}
          >
            {isSimulating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Simulation
              </>
            )}
          </button>
        </div>
        
        {/* Results */}
        <div className="bg-[#12121e] rounded-xl p-6 border border-[#2a2a3a]">
          <h2 className="text-white font-semibold mb-6">Simulation Results</h2>
          
          {result ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                  <Battery className="w-8 h-8 mx-auto mb-2 text-[#00ff88]" />
                  <p className="text-3xl font-bold text-white">{result.battery_life_years}</p>
                  <p className="text-[#a0a0b0] text-sm">Years</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                  <Thermometer className="w-8 h-8 mx-auto mb-2 text-[#ffd700]" />
                  <p className="text-3xl font-bold text-white">{result.thermal_risk}%</p>
                  <p className="text-[#a0a0b0] text-sm">Thermal Risk</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 text-[#3b82f6]" />
                  <p className="text-3xl font-bold text-white">{result.charging_efficiency}%</p>
                  <p className="text-[#a0a0b0] text-sm">Efficiency</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-[#8b5cf6]" />
                  <p className="text-3xl font-bold text-white">{result.remaining_useful_life}</p>
                  <p className="text-[#a0a0b0] text-sm">Cycles</p>
                </div>
              </div>
              
              {/* Degradation Curve */}
              <div className="bg-[#1a1a2e] rounded-lg p-4">
                <h3 className="text-white text-sm font-medium mb-4">Predicted Degradation</h3>
                <div className="h-32 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 80">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="200" y2="20" stroke="#2a2a3a" strokeWidth="1" />
                    <line x1="0" y1="40" x2="200" y2="40" stroke="#2a2a3a" strokeWidth="1" />
                    <line x1="0" y1="60" x2="200" y2="60" stroke="#2a2a3a" strokeWidth="1" />
                    
                    {/* Degradation curve */}
                    <path
                      d={`M 0 10 Q 50 15, 100 30 T 200 70`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    
                    {/* EOL line */}
                    <line x1="0" y1="60" x2="200" y2="60" stroke="#ff0000" strokeWidth="1" strokeDasharray="4" />
                    <text x="205" y="63" fill="#ff0000" fontSize="8">EOL</text>
                    
                    {/* Labels */}
                    <text x="0" y="78" fill="#606070" fontSize="8">0</text>
                    <text x="95" y="78" fill="#606070" fontSize="8">{result.battery_life_years / 2}y</text>
                    <text x="185" y="78" fill="#606070" fontSize="8">{result.battery_life_years}y</text>
                  </svg>
                </div>
              </div>
              
              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="bg-[#3b82f6]/10 rounded-lg p-4 border border-[#3b82f6]/30">
                  <h3 className="text-white text-sm font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-[#3b82f6]">•</span>
                        <span className="text-[#a0a0b0]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#606070]">
              <div className="text-center">
                <Battery className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Configure parameters and run simulation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
