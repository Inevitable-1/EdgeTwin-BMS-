"""
EdgeTwin-BMS+ Telemetry Service
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from loguru import logger

from app.models.telemetry import Telemetry
from app.models.battery import Battery
from app.models.alert import Alert
from app.models.prediction import Prediction
from app.schemas.telemetry import TelemetryCreate
from app.core.websocket import ConnectionManager


class TelemetryService:
    """
    Service for handling telemetry data ingestion and processing.
    """
    
    def __init__(self, db: AsyncSession, connection_manager: ConnectionManager):
        self.db = db
        self.connection_manager = connection_manager
    
    async def ingest_telemetry(self, device_id: str, data: dict) -> Optional[Telemetry]:
        """
        Ingest telemetry data from MQTT.
        """
        try:
            # Find battery by device_id
            result = await self.db.execute(
                select(Battery).where(Battery.battery_id == device_id)
            )
            battery = result.scalar_one_or_none()
            
            if not battery:
                logger.warning(f"Battery not found for device_id: {device_id}")
                return None
            
            # Extract telemetry data
            battery_data = data.get("battery", {})
            ai_data = data.get("ai", {})
            
            # Create telemetry record
            telemetry = Telemetry(
                battery_id=battery.id,
                timestamp=datetime.utcnow(),
                voltage=battery_data.get("voltage"),
                current=battery_data.get("current"),
                temperature=battery_data.get("temperature"),
                soc=battery_data.get("soc"),
                soh=battery_data.get("soh"),
                power=battery_data.get("power"),
                cell_voltages=battery_data.get("cell_voltages"),
                cell_temperatures=battery_data.get("cell_temperatures"),
                charging=battery_data.get("charging", False),
                driving=battery_data.get("driving", False),
            )
            
            self.db.add(telemetry)
            
            # Create predictions if AI data provided
            if ai_data:
                await self._create_predictions(battery.id, ai_data)
            
            # Check for alerts
            await self._check_alerts(battery.id, battery_data, ai_data)
            
            await self.db.commit()
            
            # Broadcast to WebSocket clients
            await self.connection_manager.broadcast_telemetry(device_id, {
                "voltage": telemetry.voltage,
                "current": telemetry.current,
                "temperature": telemetry.temperature,
                "soc": float(telemetry.soc) if telemetry.soc else None,
                "soh": float(telemetry.soh) if telemetry.soh else None,
                "timestamp": telemetry.timestamp.isoformat(),
            })
            
            logger.debug(f"Telemetry ingested for {device_id}")
            return telemetry
            
        except Exception as e:
            logger.error(f"Error ingesting telemetry: {e}")
            await self.db.rollback()
            return None
    
    async def _create_predictions(self, battery_id: UUID, ai_data: dict):
        """Create prediction records from AI data."""
        # SOH prediction
        if "soh" in ai_data:
            prediction = Prediction(
                battery_id=battery_id,
                model_type="soh",
                prediction_value=ai_data["soh"],
                confidence=ai_data.get("confidence", 0.9),
                explanation={"type": "state_of_health", "value": ai_data["soh"]},
            )
            self.db.add(prediction)
        
        # RUL prediction
        if "rul" in ai_data:
            prediction = Prediction(
                battery_id=battery_id,
                model_type="rul",
                prediction_value=ai_data["rul"],
                confidence=ai_data.get("confidence", 0.85),
                explanation={"type": "remaining_useful_life", "cycles": ai_data["rul"]},
            )
            self.db.add(prediction)
        
        # Thermal risk prediction
        if "thermal_risk" in ai_data:
            prediction = Prediction(
                battery_id=battery_id,
                model_type="thermal",
                prediction_value=ai_data["thermal_risk"],
                confidence=ai_data.get("confidence", 0.88),
                explanation={"type": "thermal_risk", "score": ai_data["thermal_risk"]},
            )
            self.db.add(prediction)
        
        # Anomaly score prediction
        if "anomaly_score" in ai_data:
            prediction = Prediction(
                battery_id=battery_id,
                model_type="anomaly",
                prediction_value=ai_data["anomaly_score"],
                confidence=ai_data.get("confidence", 0.92),
                explanation={"type": "anomaly_detection", "score": ai_data["anomaly_score"]},
            )
            self.db.add(prediction)
    
    async def _check_alerts(self, battery_id: UUID, battery_data: dict, ai_data: dict):
        """Check for alert conditions and create alerts."""
        alerts_to_create = []
        
        # Check temperature alerts
        temperature = battery_data.get("temperature")
        if temperature:
            if temperature > 65:
                alerts_to_create.append({
                    "severity": "critical",
                    "title": "Critical Temperature",
                    "message": f"Battery temperature {temperature}°C exceeds critical threshold (65°C)",
                    "source": "telemetry_monitor",
                })
            elif temperature > 55:
                alerts_to_create.append({
                    "severity": "warning",
                    "title": "High Temperature",
                    "message": f"Battery temperature {temperature}°C exceeds warning threshold (55°C)",
                    "source": "telemetry_monitor",
                })
        
        # Check voltage alerts
        voltage = battery_data.get("voltage")
        if voltage:
            if voltage < 288 or voltage > 403.2:
                alerts_to_create.append({
                    "severity": "critical",
                    "title": "Voltage Out of Range",
                    "message": f"Battery voltage {voltage}V is outside safe range",
                    "source": "telemetry_monitor",
                })
        
        # Check SOC alerts
        soc = battery_data.get("soc")
        if soc is not None:
            if soc < 10:
                alerts_to_create.append({
                    "severity": "warning",
                    "title": "Low State of Charge",
                    "message": f"Battery SOC {soc}% is critically low",
                    "source": "telemetry_monitor",
                })
        
        # Check thermal risk alerts
        if ai_data:
            thermal_risk = ai_data.get("thermal_risk")
            if thermal_risk and thermal_risk > 70:
                alerts_to_create.append({
                    "severity": "critical",
                    "title": "High Thermal Risk",
                    "message": f"AI prediction indicates high thermal risk: {thermal_risk}%",
                    "source": "ai_prediction",
                })
            
            # Check anomaly alerts
            anomaly_score = ai_data.get("anomaly_score")
            if anomaly_score and anomaly_score > 0.5:
                alerts_to_create.append({
                    "severity": "warning",
                    "title": "Anomaly Detected",
                    "message": f"AI detected anomaly with score: {anomaly_score}",
                    "source": "ai_prediction",
                })
        
        # Create alerts
        for alert_data in alerts_to_create:
            # Check if similar alert already exists
            existing = await self.db.execute(
                select(Alert).where(
                    and_(
                        Alert.battery_id == battery_id,
                        Alert.title == alert_data["title"],
                        Alert.status == "active",
                    )
                )
            )
            
            if not existing.scalar_one_or_none():
                alert = Alert(
                    battery_id=battery_id,
                    **alert_data,
                )
                self.db.add(alert)
                
                # Broadcast alert
                await self.connection_manager.broadcast_alert({
                    "battery_id": str(battery_id),
                    **alert_data,
                })
    
    async def get_latest_telemetry(self, battery_id: UUID) -> Optional[Telemetry]:
        """Get latest telemetry for a battery."""
        result = await self.db.execute(
            select(Telemetry)
            .where(Telemetry.battery_id == battery_id)
            .order_by(Telemetry.timestamp.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    async def get_telemetry_stats(self, battery_id: UUID, hours: int = 24) -> dict:
        """Get telemetry statistics for a battery."""
        query = text("SELECT * FROM get_telemetry_stats(:battery_id, :hours)")
        result = await self.db.execute(query, {"battery_id": str(battery_id), "hours": hours})
        stats = result.mappings().first()
        
        if stats:
            return {
                "avg_voltage": float(stats["avg_voltage"]) if stats["avg_voltage"] else None,
                "max_voltage": float(stats["max_voltage"]) if stats["max_voltage"] else None,
                "min_voltage": float(stats["min_voltage"]) if stats["min_voltage"] else None,
                "avg_current": float(stats["avg_current"]) if stats["avg_current"] else None,
                "max_current": float(stats["max_current"]) if stats["max_current"] else None,
                "avg_temperature": float(stats["avg_temperature"]) if stats["avg_temperature"] else None,
                "max_temperature": float(stats["max_temperature"]) if stats["max_temperature"] else None,
                "avg_soc": float(stats["avg_soc"]) if stats["avg_soc"] else None,
                "data_points": stats["data_points"],
            }
        return {}
