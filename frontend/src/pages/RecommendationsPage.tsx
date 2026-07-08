import { AlertTriangle, CheckCircle, Clock, ArrowRight, Zap, Thermometer, Battery, RefreshCw } from 'lucide-react';

const recommendations = [
  {
    id: 1, type: 'maintenance', priority: 'high', title: 'Schedule Battery Balancing',
    description: 'Battery BAT-003 showing 45mV cell imbalance. Cell balancing recommended within 7 days.',
    impact: 'Prevents accelerated degradation', icon: Battery, time: '2 days ago',
  },
  {
    id: 2, type: 'operation', priority: 'critical', title: 'Reduce Charging Current',
    description: 'Fleet-wide temperature spikes detected during fast charging sessions. Consider limiting to 1.5C rate.',
    impact: 'Reduces thermal stress by 30%', icon: Thermometer, time: '5 hours ago',
  },
  {
    id: 3, type: 'maintenance', priority: 'medium', title: 'Coolant System Inspection',
    description: 'Fleet BAT-004 coolant temperature 5°C above baseline. Schedule thermal system check.',
    impact: 'Prevents thermal runaway risk', icon: RefreshCw, time: '1 day ago',
  },
  {
    id: 4, type: 'operation', priority: 'low', title: 'Optimize Charge Schedule',
    description: 'Shift charging to off-peak hours to reduce grid strain and improve charging efficiency.',
    impact: '15% reduction in charging cost', icon: Zap, time: '3 days ago',
  },
  {
    id: 5, type: 'replacement', priority: 'high', title: 'Battery BAT-005 End of Life',
    description: 'SOH dropped to 68%. Schedule replacement within 30 days to maintain fleet performance.',
    impact: 'Restores fleet capacity by 12%', icon: AlertTriangle, time: '1 week ago',
  },
];

const priorityColors = { critical: 'text-red-400 bg-red-500/10 border-red-500/20', high: 'text-orange-400 bg-orange-500/10 border-orange-500/20', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', low: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };

export default function RecommendationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Recommendations</h1>
        <p className="text-dark-400 mt-1">Intelligent suggestions for fleet optimization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Critical', value: recommendations.filter(r => r.priority === 'critical').length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'High Priority', value: recommendations.filter(r => r.priority === 'high').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Total Savings', value: '₹2.4L/yr', color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((s) => (
          <div key={s.label} className="bg-dark-900 rounded-xl border border-dark-700 p-4 flex items-center justify-between">
            <span className="text-dark-400 text-sm">{s.label}</span>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {recommendations.map((r) => (
          <div key={r.id} className="bg-dark-900 rounded-xl border border-dark-700 p-4 hover:border-dark-600 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${priorityColors[r.priority as keyof typeof priorityColors].split(' ').slice(1, 3).join(' ')}`}>
                  <r.icon className={`w-5 h-5 ${priorityColors[r.priority as keyof typeof priorityColors].split(' ')[0]}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{r.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityColors[r.priority as keyof typeof priorityColors]}`}>
                      {r.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm mt-1">{r.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-primary-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {r.impact}
                    </span>
                    <span className="text-xs text-dark-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {r.time}
                    </span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm transition-colors">
                Apply <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
