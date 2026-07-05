#!/usr/bin/env python3
"""
EdgeTwin-BMS+ FastAPI Backend
Main application with REST and WebSocket endpoints.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import asyncio

app = FastAPI(
    title="EdgeTwin-BMS+ API",
    description="AI-Powered Edge Digital Twin & Battery Passport Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class BatteryInfo(BaseModel):
    battery_id: str
    manufacturer: str
    chemistry: str
    capacity_kwh: float
    nominal_voltage: float
    manufacturing_date: str
    warranty_status: str
    soh: float
    cycle_count: int

class TelemetryData(BaseModel):
    device_id: str
    timestamp: str
    voltage: float
    current: float
    temperature: float
    soc: float
    soh: float
    power: float
    cycle_count: int
    rul: float
    thermal_risk: float
    anomaly_score: float
    cell_voltages: List[float]
    cell_temperatures: List[float]
    charging: bool
    driving: bool
    anomaly_active: bool

class PredictionResult(BaseModel):
    battery_id: str
    soh: float
    soc: float
    rul: float
    thermal_risk: float
    anomaly_score: float
    confidence: float
    explanation: Dict[str, Any]
    timestamp: str

class SimulationParams(BaseModel):
    driving_style: str = "normal"
    charging_pattern: str = "slow"
    daily_distance: float = 60
    ambient_temperature: float = 25
    charging_soc: float = 80

class SimulationResult(BaseModel):
    battery_life_years: float
    thermal_risk: float
    charging_efficiency: float
    remaining_useful_life: int
    recommendations: List[str]

# In-memory storage (replace with database in production)
batteries_db: Dict[str, BatteryInfo] = {}
telemetry_db: List[TelemetryData] = []
predictions_db: Dict[str, PredictionResult] = {}

# WebSocket connections
active_connections: List[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    """Initialize with demo data."""
    batteries_db["BT-2024-001"] = BatteryInfo(
        battery_id="BT-2024-001",
        manufacturer="Tata Autocomp",
        chemistry="NMC 811",
        capacity_kwh=75.0,
        nominal_voltage=355.2,
        manufacturing_date="2024-01-15",
        warranty_status="ACTIVE",
        soh=87.3,
        cycle_count=1247
    )

# REST Endpoints
@app.get("/")
async def root():
    return {
        "name": "EdgeTwin-BMS+ API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/api/v1/batteries", response_model=List[BatteryInfo])
async def get_batteries():
    """List all batteries."""
    return list(batteries_db.values())

@app.get("/api/v1/batteries/{battery_id}", response_model=BatteryInfo)
async def get_battery(battery_id: str):
    """Get battery details."""
    if battery_id not in batteries_db:
        raise HTTPException(status_code=404, detail="Battery not found")
    return batteries_db[battery_id]

@app.get("/api/v1/batteries/{battery_id}/health")
async def get_battery_health(battery_id: str):
    """Get comprehensive battery health metrics."""
    if battery_id not in batteries_db:
        raise HTTPException(status_code=404, detail="Battery not found")
    
    # Get latest prediction
    prediction = predictions_db.get(battery_id)
    if not prediction:
        prediction = PredictionResult(
            battery_id=battery_id,
            soh=87.3,
            soc=62.4,
            rul=847,
            thermal_risk=12.5,
            anomaly_score=0.02,
            confidence=0.95,
            explanation={
                "summary": "Battery health is good with minor thermal stress",
                "feature_importance": {
                    "temperature_variance": 0.123,
                    "fast_charge_count": 0.087,
                    "cycle_count": 0.052,
                    "cell_imbalance": 0.031,
                    "age_factor": 0.007
                },
                "root_cause": "Minor temperature cycling effects detected",
                "recommendations": [
                    "Continue normal operation",
                    "Monitor temperature variance",
                    "Consider reducing fast charging frequency"
                ]
            },
            timestamp=datetime.now().isoformat()
        )
    
    return prediction

@app.get("/api/v1/batteries/{battery_id}/passport")
async def get_battery_passport(battery_id: str):
    """Get complete battery passport."""
    if battery_id not in batteries_db:
        raise HTTPException(status_code=404, detail="Battery not found")
    
    return {
        "battery_id": battery_id,
        "manufacturer": "Tata Autocomp",
        "chemistry": "NMC 811",
        "capacity_kwh": 75.0,
        "nominal_voltage": 355.2,
        "manufacturing_date": "2024-01-15",
        "warranty_status": "ACTIVE",
        "warranty_expiry": "2032-01-15",
        "cycle_count": 1247,
        "soh": 87.3,
        "predicted_rul_cycles": 847,
        "fast_charge_count": 234,
        "total_energy_throughput": 74820.0,
        "carbon_footprint_kg": 465.0,
        "second_life_eligible": True,
        "recycling_recommended": False,
        "end_of_life_status": "ACTIVE",
        "charging_history": {
            "total_sessions": 892,
            "fast_charge_percentage": 26.2,
            "avg_charge_time_min": 45,
            "avg_energy_per_session_kwh": 22.3
        },
        "maintenance_history": [
            {"date": "2024-06-15", "type": "inspection", "cost": 2000, "status": "completed"},
            {"date": "2024-12-01", "type": "balancing", "cost": 500, "status": "completed"},
            {"date": "2025-03-10", "type": "thermal_service", "cost": 5000, "status": "completed"}
        ]
    }

@app.get("/api/v1/predictions/{battery_id}/soh")
async def predict_soh(battery_id: str):
    """Get State of Health prediction."""
    return {
        "battery_id": battery_id,
        "soh": 87.3,
        "confidence": 0.95,
        "trend": "stable",
        "predicted_eol_cycles": 847,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/predictions/{battery_id}/rul")
async def predict_rul(battery_id: str):
    """Get Remaining Useful Life prediction."""
    return {
        "battery_id": battery_id,
        "rul_cycles": 847,
        "rul_years": 2.3,
        "confidence": 0.92,
        "degradation_rate": 0.008,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/predictions/{battery_id}/thermal")
async def predict_thermal(battery_id: str):
    """Get thermal risk assessment."""
    return {
        "battery_id": battery_id,
        "thermal_risk_score": 12.5,
        "risk_level": "safe",
        "max_temperature": 32.4,
        "prediction_lead_time_seconds": 540,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/simulator/run", response_model=SimulationResult)
async def run_simulation(params: SimulationParams):
    """Run battery life simulation."""
    # Simplified simulation logic
    base_life = 10  # years
    
    # Adjust based on driving style
    style_factor = {"eco": 1.2, "normal": 1.0, "sport": 0.8}
    life_factor = style_factor.get(params.driving_style, 1.0)
    
    # Adjust based on charging pattern
    charging_factor = {"slow": 1.1, "fast": 0.9, "rapid": 0.7}
    charge_factor = charging_factor.get(params.charging_pattern, 1.0)
    
    # Adjust based on temperature
    temp_factor = 1.0 - abs(params.ambient_temperature - 25) * 0.01
    
    predicted_life = base_life * life_factor * charge_factor * temp_factor
    rul_cycles = int(predicted_life * 300)
    
    thermal_risk = 20 if params.charging_pattern == "slow" else 40 if params.charging_pattern == "fast" else 60
    efficiency = 95 if params.charging_pattern == "slow" else 90 if params.charging_pattern == "fast" else 85
    
    recommendations = []
    if params.driving_style == "sport":
        recommendations.append("Switch to Eco mode for +0.8 years battery life")
    if params.charging_pattern in ["fast", "rapid"]:
        recommendations.append("Use slow charging for +0.5 years battery life")
    if params.charging_soc > 90:
        recommendations.append("Charge to 80% for optimal battery longevity")
    if params.ambient_temperature > 35:
        recommendations.append("Park in shade to reduce thermal stress")
    
    return SimulationResult(
        battery_life_years=round(predicted_life, 1),
        thermal_risk=thermal_risk,
        charging_efficiency=efficiency,
        remaining_useful_life=rul_cycles,
        recommendations=recommendations
    )

@app.get("/api/v1/fleet/overview")
async def get_fleet_overview():
    """Get fleet overview."""
    return {
        "total_vehicles": 24,
        "active_vehicles": 22,
        "maintenance_vehicles": 2,
        "average_soh": 82.4,
        "min_soh": 61.2,
        "max_soh": 98.1,
        "alerts": {
            "critical": 3,
            "warning": 5,
            "normal": 16
        },
        "health_distribution": {
            "soh_above_80": 17,
            "soh_60_to_80": 5,
            "soh_below_60": 2
        }
    }

# WebSocket endpoints
@app.websocket("/ws/telemetry/{battery_id}")
async def websocket_telemetry(websocket: WebSocket, battery_id: str):
    """WebSocket for real-time telemetry."""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial data
        await websocket.send_json({
            "type": "connected",
            "battery_id": battery_id,
            "message": "Real-time telemetry stream active"
        })
        
        # Keep connection alive
        while True:
            # In production, this would receive MQTT messages
            # For demo, we send simulated data
            await asyncio.sleep(1)
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket for alert notifications."""
    await websocket.accept()
    
    try:
        while True:
            await asyncio.sleep(5)
            await websocket.send_json({
                "type": "alert",
                "level": "info",
                "message": "System operating normally",
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        pass

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
