import { useQuery } from '@tanstack/react-query';
import { Brain, Lightbulb, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface XAIExplanationProps {
  batteryId: string;
}

export default function XAIExplanation({ batteryId }: XAIExplanationProps) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions', batteryId],
    queryFn: () => api.getLatestPredictions(batteryId),
    refetchInterval: 30000,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const getExplanation = (type: string, value: number) => {
    const explanations: Record<string, { summary: string; recommendations: string[] }> = {
      soh: {
        summary: value > 80 
          ? "Battery health is good with minor degradation." 
          : value > 60 
            ? "Battery shows moderate degradation. Consider maintenance." 
            : "Battery health is poor. Replacement recommended.",
        recommendations: value > 80 
          ? ["Continue normal operation", "Monitor periodically"]
          : value > 60 
            ? ["Reduce fast charging", "Schedule preventive maintenance"]
            : ["Plan battery replacement", "Reduce load if possible"],
      },
      thermal: {
        summary: value < 30 
          ? "Thermal conditions are safe." 
          : value < 60 
            ? "Moderate thermal risk detected." 
            : "High thermal risk! Immediate action required.",
        recommendations: value < 30 
          ? ["Continue normal operation"]
          : value < 60 
            ? ["Monitor temperatures", "Check cooling system"]
            : ["Reduce power output", "Activate cooling", "Schedule inspection"],
      },
      anomaly: {
        summary: value < 0.3 
          ? "Battery behavior is normal." 
          : value < 0.6 
            ? "Unusual patterns detected." 
            : "Anomaly detected! Inspection required.",
        recommendations: value < 0.3 
          ? ["Continue normal operation"]
          : value < 0.6 
            ? ["Run diagnostic scan", "Check sensors"]
            : ["Immediate inspection", "Check BMS communication"],
      },
      rul: {
        summary: `Estimated ${value} cycles remaining.`,
        recommendations: value > 1000 
          ? ["Continue normal operation"]
          : value > 500 
            ? ["Plan for replacement", "Optimize usage"]
            : ["Replace soon", "Reduce load"],
      },
    };
    
    return explanations[type] || { summary: "No explanation available", recommendations: [] };
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary-500" />
        <h3 className="text-white font-semibold">Explainable AI Insights</h3>
      </div>
      
      <div className="space-y-4">
        {predictions && Object.entries(predictions).map(([type, pred]: [string, any]) => {
          const explanation = getExplanation(type, pred.value);
          
          return (
            <div key={type} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium capitalize">{type} Prediction</span>
                  <span className={`text-sm ${getConfidenceColor(pred.confidence)}`}>
                    {(pred.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <span className="text-lg font-bold text-white">
                  {type === 'anomaly' 
                    ? pred.value.toFixed(3)
                    : type === 'rul'
                      ? `${pred.value} cycles`
                      : `${pred.value.toFixed(1)}%`
                  }
                </span>
              </div>
              
              <div className="mt-3 p-3 bg-dark-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-dark-300 text-sm">{explanation.summary}</p>
                </div>
              </div>
              
              {explanation.recommendations.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-dark-400 mb-2">Recommendations:</div>
                  <ul className="space-y-1">
                    {explanation.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-dark-300">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {pred.explanation && (
                <div className="mt-3 pt-3 border-t border-dark-600">
                  <div className="text-xs text-dark-400 mb-2">Feature Importance:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(pred.explanation).slice(0, 4).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-dark-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-white">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
