import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, Battery, Leaf, Recycle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils';

interface BatteryPassportViewProps {
  batteryId: string;
}

export default function BatteryPassportView({ batteryId }: BatteryPassportViewProps) {
  const { data: passport, isLoading } = useQuery({
    queryKey: ['fullPassport', batteryId],
    queryFn: () => api.getPassportByBattery(batteryId),
  });
  
  const { data: fullPassport } = useQuery({
    queryKey: ['passportFull', passport?.id],
    queryFn: () => api.getFullPassport(passport!.id),
    enabled: !!passport?.id,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!fullPassport) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-dark-500 mx-auto mb-4" />
        <p className="text-dark-400">No passport data available</p>
      </div>
    );
  }
  
  const handleExportPDF = () => {
    // In production, this would generate a PDF
    alert('PDF export functionality - In production, this would generate a downloadable PDF');
  };
  
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">EU Battery Passport</h3>
              <p className="text-dark-400 text-sm">{fullPassport.passport.passport_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              fullPassport.passport.status === 'active' 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-dark-600 text-dark-400'
            }`}>
              {fullPassport.passport.status}
            </span>
            <button
              onClick={handleExportPDF}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Manufacturing Info */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-500" />
            <h4 className="text-white font-medium">Manufacturing</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Date</span>
              <span className="text-white">{fullPassport.passport.manufacturing_date || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">First Use</span>
              <span className="text-white">{fullPassport.passport.first_use_date || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Warranty</span>
              <span className="text-white">{fullPassport.passport.warranty_expiry || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {/* Usage Statistics */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Battery className="w-5 h-5 text-yellow-500" />
            <h4 className="text-white font-medium">Usage Statistics</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Total Cycles</span>
              <span className="text-white">{fullPassport.statistics.total_cycles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Fast Charges</span>
              <span className="text-white">{fullPassport.statistics.fast_charge_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Energy Throughput</span>
              <span className="text-white">{fullPassport.statistics.total_energy_throughput.toFixed(0)} kWh</span>
            </div>
          </div>
        </div>
        
        {/* Environmental Impact */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-green-500" />
            <h4 className="text-white font-medium">Environmental</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Carbon Footprint</span>
              <span className="text-white">{fullPassport.statistics.carbon_footprint_kg} kg CO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Second Life</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                fullPassport.second_life.eligible 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-dark-600 text-dark-400'
              }`}>
                {fullPassport.second_life.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Recycling</span>
              <span className="text-white">{fullPassport.second_life.recycling_date || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {/* Battery Info */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Battery className="w-5 h-5 text-purple-500" />
            <h4 className="text-white font-medium">Battery Details</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Manufacturer</span>
              <span className="text-white">{fullPassport.battery.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Chemistry</span>
              <span className="text-white">{fullPassport.battery.chemistry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Capacity</span>
              <span className="text-white">{fullPassport.battery.capacity_kwh} kWh</span>
            </div>
          </div>
        </div>
        
        {/* Current Status */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h4 className="text-white font-medium">Current Status</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Voltage</span>
              <span className="text-white">{fullPassport.current_status.voltage || 'N/A'}V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Temperature</span>
              <span className="text-white">{fullPassport.current_status.temperature || 'N/A'}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">SOC</span>
              <span className="text-white">{fullPassport.current_status.soc || 'N/A'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">SOH</span>
              <span className="text-white">{fullPassport.current_status.soh || 'N/A'}%</span>
            </div>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-orange-500" />
            <h4 className="text-white font-medium">Digital Passport</h4>
          </div>
          {fullPassport.qr_code ? (
            <div className="flex justify-center">
              <img 
                src={`data:image/png;base64,${fullPassport.qr_code}`} 
                alt="Passport QR Code"
                className="w-32 h-32"
              />
            </div>
          ) : (
            <div className="text-center text-dark-400 text-sm">
              QR Code not available
            </div>
          )}
        </div>
      </div>
      
      {/* Maintenance History */}
      {fullPassport.maintenance_history && fullPassport.maintenance_history.length > 0 && (
        <div className="p-6 border-t border-dark-700">
          <h4 className="text-white font-medium mb-4">Maintenance History</h4>
          <div className="space-y-3">
            {fullPassport.maintenance_history.map((record: any, idx: number) => (
              <div key={idx} className="bg-dark-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center">
                    <Recycle className="w-4 h-4 text-dark-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm capitalize">{record.type}</div>
                    <div className="text-dark-400 text-xs">{record.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">{formatDate(record.date)}</div>
                  {record.cost && (
                    <div className="text-dark-400 text-xs">₹{record.cost}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
