"""
EdgeTwin-BMS+ AI Inference Service
"""

import numpy as np
from typing import Optional
from datetime import datetime
from loguru import logger
from pathlib import Path
import json


class AIInferenceService:
    """
    Service for running AI model inference.
    """
    
    def __init__(self):
        self.models_loaded = False
        self.model_paths = {}
        self.feature_names = [
            'voltage', 'current', 'temperature', 'soc',
            'cycle_count', 'voltage_std', 'current_std', 'temp_std',
            'voltage_mean', 'current_mean', 'temp_mean',
            'voltage_slope', 'current_slope', 'temp_slope',
            'energy_throughput', 'fast_charge_ratio'
        ]
    
    async def initialize(self):
        """Load AI models."""
        try:
            # In production, load actual trained models
            # For now, use rule-based predictions
            self.models_loaded = True
            logger.info("AI inference service initialized (using rule-based models)")
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")
    
    def predict_soh(self, features: dict) -> dict:
        """
        Predict State of Health.
        """
        try:
            # Rule-based SOH prediction
            cycle_count = features.get("cycle_count", 0)
            temperature = features.get("temperature", 25)
            fast_charge_ratio = features.get("fast_charge_ratio", 0)
            
            # Degradation factors
            cycle_degradation = min(30, cycle_count / 3000 * 30)
            temp_degradation = min(20, max(0, temperature - 35) / 100 * 20)
            fast_charge_degradation = min(10, fast_charge_ratio * 10)
            
            soh = max(0, min(100, 100 - cycle_degradation - temp_degradation - fast_charge_degradation))
            
            # Calculate confidence based on feature quality
            confidence = 0.85
            if features.get("voltage_std", 0) > 0.1:
                confidence -= 0.1
            
            return {
                "soh": round(soh, 2),
                "confidence": round(confidence, 4),
                "explanation": {
                    "cycle_degradation": round(cycle_degradation, 2),
                    "temp_degradation": round(temp_degradation, 2),
                    "fast_charge_degradation": round(fast_charge_degradation, 2),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"SOH prediction error: {e}")
            return {"soh": 85.0, "confidence": 0.5, "error": str(e)}
    
    def predict_soc(self, voltage: float, current: float, temperature: float) -> dict:
        """
        Predict State of Charge from voltage.
        """
        try:
            # OCV-SOC relationship approximation for NMC cells
            # Nominal voltage range: 3.0V (0%) to 4.2V (100%)
            cell_voltage = voltage / 96  # For 96S configuration
            
            # Nonlinear OCV curve approximation
            if cell_voltage < 3.0:
                soc = 0
            elif cell_voltage > 4.2:
                soc = 100
            else:
                # Polynomial approximation
                soc = 100 * ((cell_voltage - 3.0) / 1.2) ** 0.8
            
            # Temperature compensation
            temp_factor = 1.0 + (temperature - 25) * 0.002
            soc = soc * temp_factor
            
            soc = max(0, min(100, soc))
            
            return {
                "soc": round(soc, 2),
                "confidence": 0.92,
                "explanation": {
                    "cell_voltage": round(cell_voltage, 3),
                    "temperature_compensation": round(temp_factor, 4),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"SOC prediction error: {e}")
            return {"soc": 50.0, "confidence": 0.5, "error": str(e)}
    
    def predict_rul(self, soh: float, cycle_count: int, temperature_history: list) -> dict:
        """
        Predict Remaining Useful Life.
        """
        try:
            # RUL based on SOH and degradation rate
            soh_threshold = 70  # End of life threshold
            remaining_soh = soh - soh_threshold
            
            # Estimate cycles remaining
            if remaining_soh <= 0:
                rul_cycles = 0
            else:
                # Assume linear degradation
                degradation_per_cycle = 100 / 5000  # Typical 5000 cycle life
                rul_cycles = remaining_soh / degradation_per_cycle
            
            # Temperature adjustment
            avg_temp = np.mean(temperature_history) if temperature_history else 25
            temp_factor = 1.0 + (avg_temp - 25) * 0.01
            rul_cycles = rul_cycles / temp_factor
            
            # Convert to years (assuming 300 cycles/year)
            rul_years = rul_cycles / 300
            
            return {
                "rul_cycles": round(rul_cycles),
                "rul_years": round(rul_years, 1),
                "confidence": 0.82,
                "explanation": {
                    "remaining_soh": round(remaining_soh, 2),
                    "avg_temperature": round(avg_temp, 1),
                    "temp_factor": round(temp_factor, 3),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"RUL prediction error: {e}")
            return {"rul_cycles": 1000, "rul_years": 3.3, "confidence": 0.5, "error": str(e)}
    
    def predict_thermal_risk(self, temperature: float, cell_temperatures: list, current: float) -> dict:
        """
        Predict thermal risk.
        """
        try:
            # Calculate thermal risk score (0-100)
            risk_score = 0
            
            # Temperature contribution
            if temperature > 65:
                risk_score += 40
            elif temperature > 55:
                risk_score += 25
            elif temperature > 45:
                risk_score += 15
            elif temperature > 35:
                risk_score += 5
            
            # Cell temperature variance contribution
            if cell_temperatures:
                temp_variance = np.var(cell_temperatures)
                if temp_variance > 25:
                    risk_score += 30
                elif temp_variance > 10:
                    risk_score += 20
                elif temp_variance > 5:
                    risk_score += 10
            
            # High current contribution
            if abs(current) > 150:
                risk_score += 20
            elif abs(current) > 100:
                risk_score += 10
            
            risk_score = min(100, risk_score)
            
            # Determine risk level
            if risk_score > 70:
                risk_level = "critical"
            elif risk_score > 40:
                risk_level = "high"
            elif risk_score > 20:
                risk_level = "moderate"
            else:
                risk_level = "low"
            
            return {
                "thermal_risk": round(risk_score, 2),
                "risk_level": risk_level,
                "confidence": 0.88,
                "explanation": {
                    "temperature": temperature,
                    "cell_variance": round(np.var(cell_temperatures), 2) if cell_temperatures else 0,
                    "current": current,
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Thermal risk prediction error: {e}")
            return {"thermal_risk": 20, "risk_level": "low", "confidence": 0.5, "error": str(e)}
    
    def detect_anomaly(self, features: dict, history: list = None) -> dict:
        """
        Detect anomalies in battery behavior.
        """
        try:
            anomaly_score = 0
            anomalies = []
            
            # Check voltage imbalance
            cell_voltages = features.get("cell_voltages", [])
            if cell_voltages:
                voltage_std = np.std(cell_voltages)
                if voltage_std > 0.1:
                    anomaly_score += voltage_std * 10
                    anomalies.append(f"High voltage imbalance: {voltage_std:.3f}V")
            
            # Check temperature imbalance
            cell_temperatures = features.get("cell_temperatures", [])
            if cell_temperatures:
                temp_std = np.std(cell_temperatures)
                if temp_std > 5:
                    anomaly_score += temp_std * 0.5
                    anomalies.append(f"High temperature imbalance: {temp_std:.1f}°C")
            
            # Check for sudden changes
            if history and len(history) > 1:
                voltage_changes = [abs(history[i]["voltage"] - history[i-1]["voltage"]) 
                                   for i in range(1, len(history))]
                max_change = max(voltage_changes) if voltage_changes else 0
                if max_change > 5:
                    anomaly_score += 20
                    anomalies.append(f"Sudden voltage change: {max_change:.1f}V")
            
            anomaly_score = min(1.0, anomaly_score / 100)
            
            is_anomaly = anomaly_score > 0.5
            
            return {
                "anomaly_score": round(anomaly_score, 4),
                "is_anomaly": is_anomaly,
                "anomalies": anomalies,
                "confidence": 0.90,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Anomaly detection error: {e}")
            return {"anomaly_score": 0.0, "is_anomaly": False, "confidence": 0.5, "error": str(e)}
    
    def generate_explanation(self, model_type: str, prediction: float, features: dict) -> dict:
        """
        Generate human-readable explanation for prediction.
        """
        explanations = {
            "soh": {
                "high": "Battery health is good. Continue normal operation.",
                "medium": "Battery shows moderate degradation. Consider reducing fast charging.",
                "low": "Battery health is poor. Schedule replacement soon.",
            },
            "thermal": {
                "low": "Thermal conditions are safe. No action needed.",
                "medium": "Moderate thermal risk. Monitor temperatures closely.",
                "high": "High thermal risk! Reduce power output immediately.",
            },
            "anomaly": {
                "normal": "Battery behavior is normal. No anomalies detected.",
                "suspicious": "Unusual patterns detected. Recommend diagnostic check.",
                "anomaly": "Anomaly detected! Immediate inspection required.",
            },
        }
        
        model_explanations = explanations.get(model_type, {})
        
        if model_type == "soh":
            if prediction > 80:
                level = "high"
            elif prediction > 60:
                level = "medium"
            else:
                level = "low"
        elif model_type == "thermal":
            if prediction < 30:
                level = "low"
            elif prediction < 60:
                level = "medium"
            else:
                level = "high"
        elif model_type == "anomaly":
            if prediction < 0.3:
                level = "normal"
            elif prediction < 0.6:
                level = "suspicious"
            else:
                level = "anomaly"
        else:
            level = "medium"
        
        return {
            "summary": model_explanations.get(level, "No explanation available."),
            "level": level,
            "value": prediction,
            "recommendations": self._get_recommendations(model_type, level),
        }
    
    def _get_recommendations(self, model_type: str, level: str) -> list:
        """Get recommendations based on prediction."""
        recommendations = {
            "soh": {
                "high": ["Continue normal operation", "Monitor periodically"],
                "medium": ["Reduce fast charging frequency", "Schedule preventive maintenance"],
                "low": ["Plan battery replacement", "Reduce load if possible", "Schedule immediate inspection"],
            },
            "thermal": {
                "low": ["Continue normal operation"],
                "medium": ["Monitor cell temperatures", "Check cooling system"],
                "high": ["Reduce power output immediately", "Activate cooling", "Schedule thermal inspection"],
            },
            "anomaly": {
                "normal": ["Continue normal operation"],
                "suspicious": ["Run diagnostic scan", "Check sensor calibration"],
                "anomaly": ["Immediate inspection required", "Check BMS communication", "Verify cell connections"],
            },
        }
        
        return recommendations.get(model_type, {}).get(level, ["Consult technical support"])


# Global instance
ai_service = AIInferenceService()
