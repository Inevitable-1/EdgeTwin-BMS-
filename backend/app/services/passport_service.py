"""
EdgeTwin-BMS+ Battery Passport Service
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4
import qrcode
from io import BytesIO
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.models.battery_passport import BatteryPassport
from app.models.battery import Battery
from app.models.maintenance import MaintenanceRecord
from app.models.telemetry import Telemetry


class PassportService:
    """
    Service for managing battery passports.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_passport(self, battery_id: UUID) -> Optional[BatteryPassport]:
        """Get existing passport or create new one."""
        result = await self.db.execute(
            select(BatteryPassport).where(BatteryPassport.battery_id == battery_id)
        )
        passport = result.scalar_one_or_none()
        
        if not passport:
            # Get battery info
            battery_result = await self.db.execute(
                select(Battery).where(Battery.id == battery_id)
            )
            battery = battery_result.scalar_one_or_none()
            
            if not battery:
                return None
            
            # Create passport
            passport_number = f"PP-{battery.battery_id}-{datetime.now().strftime('%Y%m%d')}"
            
            passport = BatteryPassport(
                battery_id=battery_id,
                passport_number=passport_number,
                manufacturing_date=battery.manufacturing_date or date.today(),
                first_use_date=battery.installation_date,
                warranty_expiry=battery.warranty_expiry,
            )
            
            self.db.add(passport)
            await self.db.commit()
            await self.db.refresh(passport)
            
            logger.info(f"Created passport {passport_number} for battery {battery.battery_id}")
        
        return passport
    
    async def update_passport_stats(self, battery_id: UUID, telemetry_data: dict) -> None:
        """Update passport statistics from telemetry."""
        passport = await self.get_or_create_passport(battery_id)
        
        if passport:
            # Update cycle count
            if "cycle_count" in telemetry_data:
                passport.total_cycles = telemetry_data["cycle_count"]
            
            # Update energy throughput
            if "power" in telemetry_data and "charging" in telemetry_data:
                if telemetry_data["charging"]:
                    # Approximate energy throughput (power * time)
                    passport.total_energy_throughput = float(passport.total_energy_throughput or 0) + \
                        (telemetry_data["power"] / 3600)  # Wh per second
            
            # Update fast charge count
            if telemetry_data.get("current", 0) > 100:  # Assuming >100A is fast charging
                passport.fast_charge_count = (passport.fast_charge_count or 0) + 1
            
            await self.db.commit()
    
    async def get_full_passport(self, battery_id: UUID) -> Optional[dict]:
        """Get complete passport with all lifecycle data."""
        passport = await self.get_or_create_passport(battery_id)
        
        if not passport:
            return None
        
        # Get battery info
        battery_result = await self.db.execute(
            select(Battery).where(Battery.id == battery_id)
        )
        battery = battery_result.scalar_one_or_none()
        
        # Get maintenance history
        maintenance_result = await self.db.execute(
            select(MaintenanceRecord)
            .where(MaintenanceRecord.battery_id == battery_id)
            .order_by(MaintenanceRecord.created_at.desc())
        )
        maintenance_records = maintenance_result.scalars().all()
        
        # Get latest telemetry
        telemetry_result = await self.db.execute(
            select(Telemetry)
            .where(Telemetry.battery_id == battery_id)
            .order_by(Telemetry.timestamp.desc())
            .limit(1)
        )
        latest_telemetry = telemetry_result.scalar_one_or_none()
        
        # Generate QR code
        qr_code = self._generate_qr_code(passport.passport_number)
        
        # Calculate carbon footprint
        carbon_footprint = self._calculate_carbon_footprint(
            float(passport.total_energy_throughput or 0),
            battery.chemistry if battery else "NMC"
        )
        
        # Determine second life eligibility
        second_life_eligible = await self._check_second_life_eligibility(battery_id)
        
        return {
            "passport": {
                "id": str(passport.id),
                "passport_number": passport.passport_number,
                "status": passport.status,
                "manufacturing_date": passport.manufacturing_date.isoformat() if passport.manufacturing_date else None,
                "first_use_date": passport.first_use_date.isoformat() if passport.first_use_date else None,
                "warranty_expiry": passport.warranty_expiry.isoformat() if passport.warranty_expiry else None,
            },
            "battery": {
                "id": str(battery.id) if battery else None,
                "battery_id": battery.battery_id if battery else None,
                "manufacturer": battery.manufacturer if battery else None,
                "model": battery.model if battery else None,
                "chemistry": battery.chemistry if battery else None,
                "capacity_kwh": float(battery.capacity_kwh) if battery else None,
                "nominal_voltage": float(battery.nominal_voltage) if battery else None,
            },
            "statistics": {
                "total_cycles": passport.total_cycles or 0,
                "fast_charge_count": passport.fast_charge_count or 0,
                "total_energy_throughput": float(passport.total_energy_throughput or 0),
                "carbon_footprint_kg": round(carbon_footprint, 2),
            },
            "second_life": {
                "status": passport.second_life_status,
                "eligible": second_life_eligible,
                "recycling_date": passport.recycling_date.isoformat() if passport.recycling_date else None,
                "recycling_facility": passport.recycling_facility,
            },
            "maintenance_history": [
                {
                    "id": str(m.id),
                    "type": m.maintenance_type,
                    "description": m.description,
                    "date": m.created_at.isoformat(),
                    "cost": float(m.cost) if m.cost else None,
                }
                for m in maintenance_records
            ],
            "current_status": {
                "voltage": float(latest_telemetry.voltage) if latest_telemetry and latest_telemetry.voltage else None,
                "current": float(latest_telemetry.current) if latest_telemetry and latest_telemetry.current else None,
                "temperature": float(latest_telemetry.temperature) if latest_telemetry and latest_telemetry.temperature else None,
                "soc": float(latest_telemetry.soc) if latest_telemetry and latest_telemetry.soc else None,
                "soh": float(latest_telemetry.soh) if latest_telemetry and latest_telemetry.soh else None,
                "last_updated": latest_telemetry.timestamp.isoformat() if latest_telemetry else None,
            },
            "qr_code": qr_code,
        }
    
    def _generate_qr_code(self, passport_number: str) -> str:
        """Generate QR code for passport."""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"edgetwin://passport/{passport_number}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
    
    def _calculate_carbon_footprint(self, energy_throughput_kwh: float, chemistry: str) -> float:
        """Calculate carbon footprint based on energy throughput."""
        # CO2 factors (kg CO2 per kWh) - typical values
        co2_factors = {
            "NMC": 0.5,
            "LFP": 0.4,
            "NCA": 0.55,
            "LTO": 0.45,
        }
        
        factor = co2_factors.get(chemistry, 0.5)
        return energy_throughput_kwh * factor * 0.001  # Convert to kg
    
    async def _check_second_life_eligibility(self, battery_id: UUID) -> bool:
        """Check if battery is eligible for second life."""
        # Get latest SOH
        telemetry_result = await self.db.execute(
            select(Telemetry.soh)
            .where(Telemetry.battery_id == battery_id)
            .order_by(Telemetry.timestamp.desc())
            .limit(1)
        )
        result = telemetry_result.first()
        
        if result and result[0]:
            soh = float(result[0])
            # Battery is eligible for second life if SOH > 70%
            return soh > 70
        
        return True  # Default to eligible if no data


# Global instance
def get_passport_service(db: AsyncSession) -> PassportService:
    return PassportService(db)
