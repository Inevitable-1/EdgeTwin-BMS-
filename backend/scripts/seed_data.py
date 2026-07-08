"""
EdgeTwin-BMS+ Database Seed Script
Generates sample data for development and testing.
"""

import asyncio
import uuid
import random
from datetime import datetime, timedelta, date

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.user import User
from app.models.fleet import Fleet
from app.models.battery import Battery
from app.models.telemetry import Telemetry
from app.models.alert import Alert
from app.models.prediction import Prediction
from app.models.battery_passport import BatteryPassport
from app.models.maintenance import MaintenanceRecord
from app.models.digital_twin import DigitalTwin
from app.models.audit_log import AuditLog

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

BATTERY_DEFS = [
    {"id": "BAT-001", "manufacturer": "Tata Autocomp", "model": "NMC-96S4P", "chemistry": "NMC 811", "capacity_kwh": 75.0},
    {"id": "BAT-002", "manufacturer": "Tata Autocomp", "model": "NMC-96S4P", "chemistry": "NMC 811", "capacity_kwh": 75.0},
    {"id": "BAT-003", "manufacturer": "Tata Autocomp", "model": "LFP-120S1P", "chemistry": "LFP", "capacity_kwh": 60.0},
    {"id": "BAT-004", "manufacturer": "Tata Autocomp", "model": "LFP-120S1P", "chemistry": "LFP", "capacity_kwh": 60.0},
    {"id": "BAT-005", "manufacturer": "LG Energy", "model": "NMC-96S3P", "chemistry": "NMC 622", "capacity_kwh": 68.0},
    {"id": "BAT-006", "manufacturer": "Samsung SDI", "model": "NMC-96S4P", "chemistry": "NMC 811", "capacity_kwh": 72.0},
]


def seed_telemetry(battery_id: uuid.UUID, start: datetime, count: int, battery_seed: int) -> list[Telemetry]:
    rng = random.Random(battery_seed)
    points = []
    soc = 50 + rng.random() * 40
    soh = 85 + rng.random() * 12
    voltage = 350 + rng.random() * 30
    temp = 28 + rng.random() * 8
    charging = True
    charge_ticks = 0

    for i in range(count):
        ts = start + timedelta(seconds=i)
        charge_ticks += 1

        if charge_ticks % (30 + rng.randint(0, 50)) == 0:
            charging = not charging
            charge_ticks = 0

        if charging:
            soc = min(98, soc + 0.08 + rng.random() * 0.12)
        else:
            soc = max(5, soc - 0.06 - rng.random() * 0.1)

        diurnal = rng.random() * 4
        joule_heat = abs(40 + rng.random() * 40) * 0.03 if charging else abs(-20 - rng.random() * 60) * 0.03
        temp = temp * 0.95 + (temp + diurnal + joule_heat + (rng.random() - 0.5) * 2) * 0.05
        temp = max(15, min(58, temp))

        soc_factor = soc / 100
        voltage = voltage * 0.92 + (voltage * (0.85 + soc_factor * 0.2) * 0.08) + (rng.random() - 0.5) * 0.8
        voltage = max(310, min(400, voltage))

        current = 30 + rng.random() * 80 if charging else -(20 + rng.random() * 60)
        soh = max(60, soh - rng.random() * 0.0005)

        cell_voltages = {f"cell_{j}": round(voltage / 96 + (rng.random() - 0.5) * 0.05, 3) for j in range(96)}
        cell_temps = {f"cell_{j}": round(temp + (rng.random() - 0.5) * 3, 1) for j in range(96)}

        points.append(Telemetry(
            battery_id=battery_id,
            timestamp=ts,
            voltage=round(voltage, 2),
            current=round(current, 2),
            temperature=round(temp, 1),
            soc=round(soc, 2),
            soh=round(soh, 2),
            power=round(voltage * current, 2),
            cell_voltages=cell_voltages,
            cell_temperatures=cell_temps,
            charging=charging,
            driving=not charging,
        ))
    return points


async def seed_database():
    engine = create_async_engine(settings.DATABASE_URL.replace("+asyncpg", "").replace("+psycopg", ""))
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check if data already exists
        existing = await db.execute(select(User).limit(1))
        if existing.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # 1. Create admin user
        admin = User(
            email="admin@edgetwin.com",
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            full_name="System Administrator",
            role="admin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        await db.flush()
        print(f"  Created admin user: admin@edgetwin.com / admin123")

        # 2. Create operator user
        operator = User(
            email="operator@edgetwin.com",
            username="operator",
            hashed_password=pwd_context.hash("operator123"),
            full_name="Fleet Operator",
            role="operator",
            is_active=True,
            is_verified=True,
        )
        db.add(operator)
        await db.flush()

        # 3. Create fleet
        fleet = Fleet(
            name="Tata EV Fleet",
            description="Primary electric vehicle fleet for testing and demo",
            owner_id=admin.id,
            is_active=True,
        )
        db.add(fleet)
        await db.flush()
        fleet2 = Fleet(
            name="Mumbai Bus Depot",
            description="Municipal electric bus fleet",
            owner_id=admin.id,
            is_active=True,
        )
        db.add(fleet2)
        await db.flush()
        print(f"  Created fleets: {fleet.name}, {fleet2.name}")

        # 4. Create batteries
        batteries = []
        for i, bdef in enumerate(BATTERY_DEFS):
            bat = Battery(
                battery_id=bdef["id"],
                fleet_id=fleet.id if i < 4 else fleet2.id,
                manufacturer=bdef["manufacturer"],
                model=bdef["model"],
                chemistry=bdef["chemistry"],
                capacity_kwh=bdef["capacity_kwh"],
                nominal_voltage=355.2,
                max_voltage=403.2,
                min_voltage=288.0,
                max_current=200.0,
                cycles_in_series=96,
                cycles_in_parallel=4 if "4P" in bdef["model"] else (1 if "1P" in bdef["model"] else 3),
                status="active" if i < 5 else "maintenance",
                manufacturing_date=date(2024, 1, 15) if i < 3 else date(2024, 6, 1) if i < 5 else date(2023, 11, 1),
                installation_date=date(2024, 2, 1) if i < 3 else date(2024, 7, 1) if i < 5 else date(2023, 12, 1),
                warranty_expiry=date(2032, 1, 15) if i < 3 else date(2032, 6, 1) if i < 5 else date(2031, 11, 1),
            )
            db.add(bat)
            await db.flush()
            batteries.append(bat)
        print(f"  Created {len(batteries)} batteries")

        # 5. Create battery passports
        for bat, bdef in zip(batteries, BATTERY_DEFS):
            passport = BatteryPassport(
                battery_id=bat.id,
                passport_number=f"PP-{bdef['id']}",
                status="active",
                manufacturing_date=bat.manufacturing_date,
                first_use_date=bat.installation_date,
                warranty_expiry=bat.warranty_expiry,
                total_energy_throughput=random.uniform(15000, 60000),
                fast_charge_count=random.randint(50, 400),
                total_cycles=random.randint(200, 1800),
                carbon_footprint_kg=random.uniform(200, 600),
                second_life_status="eligible",
                qr_code=f"https://edgetwin.example.com/passport/{bdef['id']}",
            )
            db.add(passport)
        await db.flush()
        print(f"  Created {len(batteries)} passports")

        # 6. Create digital twins
        for bat, bdef in zip(batteries, BATTERY_DEFS):
            twin = DigitalTwin(
                battery_id=bat.id,
                name=f"Digital Twin - {bdef['id']}",
                configuration={
                    "update_interval_ms": 1000,
                    "enable_3d_visualization": True,
                    "enable_heatmap": True,
                    "cells_in_series": 96,
                    "cells_in_parallel": 4,
                    "thermal_model": True,
                    "prediction_enabled": True,
                },
                sync_status="synced",
                last_sync_at=datetime.utcnow(),
            )
            db.add(twin)
        await db.flush()
        print(f"  Created {len(batteries)} digital twins")

        # 7. Create telemetry data
        now = datetime.utcnow()
        telem_count = 500
        for i, bat in enumerate(batteries):
            points = seed_telemetry(bat.id, now - timedelta(hours=1), telem_count, i)
            db.add_all(points)
        await db.flush()
        print(f"  Created {len(batteries) * telem_count} telemetry points")

        # 8. Create predictions
        model_types = ["soh", "soc", "rul", "thermal", "anomaly"]
        for bat in batteries:
            for mt in model_types:
                if mt == "soh":
                    val = random.uniform(75, 98)
                    conf = random.uniform(0.85, 0.98)
                elif mt == "soc":
                    val = random.uniform(20, 95)
                    conf = random.uniform(0.88, 0.99)
                elif mt == "rul":
                    val = random.uniform(200, 2000)
                    conf = random.uniform(0.75, 0.95)
                elif mt == "thermal":
                    val = random.uniform(5, 80)
                    conf = random.uniform(0.80, 0.96)
                else:
                    val = random.uniform(0, 1)
                    conf = random.uniform(0.70, 0.95)

                pred = Prediction(
                    battery_id=bat.id,
                    timestamp=now - timedelta(minutes=random.randint(0, 60)),
                    model_type=mt,
                    prediction_value=round(val, 2),
                    confidence=round(conf, 4),
                    explanation={
                        "feature_importance": {"voltage": 0.35, "current": 0.20, "temperature": 0.30, "soc": 0.15},
                        "method": "shap",
                    },
                    features_used=["voltage", "current", "temperature", "soc", "soh"],
                    inference_time_ms=round(random.uniform(5, 50), 2),
                )
                db.add(pred)
        await db.flush()
        print(f"  Created {len(batteries) * len(model_types)} predictions")

        # 9. Create alerts
        alert_templates = [
            ("Cell Voltage Imbalance", "Voltage deviation of 0.15V detected between cells", "warning"),
            ("Temperature Spike", "Cell temperature exceeded 52°C in module 3", "critical"),
            ("SOC Calibration Required", "SOC drift detected, recalibration recommended", "warning"),
            ("Battery Health Degradation", "SOH dropped below 80% threshold", "critical"),
            ("Charging Interrupted", "Charging stopped due to grid fluctuation", "info"),
            ("Insulation Resistance Low", "Insulation resistance below 1MΩ threshold", "critical"),
            ("Coolant Level Low", "Coolant level below minimum threshold", "warning"),
            ("Scheduled Maintenance Due", "Regular inspection due in 500km", "info"),
            ("BMS Communication Error", "Intermittent communication loss with BMS", "warning"),
            ("Overcurrent Detected", "Current exceeded 180A for more than 5 seconds", "critical"),
        ]

        for bat in batteries[:4]:
            for title, message, severity in alert_templates[:5]:
                alert = Alert(
                    battery_id=bat.id,
                    severity=severity,
                    status=random.choice(["active", "acknowledged", "resolved"]),
                    title=title,
                    message=message,
                    source="BMS",
                    metadata={"trigger": "rule_based", "threshold": 0.85},
                    created_at=now - timedelta(hours=random.randint(1, 48)),
                )
                db.add(alert)
        await db.flush()
        print(f"  Created alerts")

        # 10. Create maintenance records
        maint_types = ["inspection", "repair", "replacement", "balancing", "calibration", "software_update"]
        for bat in batteries[:3]:
            for j in range(3):
                record = MaintenanceRecord(
                    battery_id=bat.id,
                    maintenance_type=random.choice(maint_types),
                    description=f"Routine {random.choice(['inspection', 'maintenance', 'checkup'])} - {random.choice(['module check', 'thermal imaging', 'BMS firmware update', 'cell balancing'])}",
                    performed_by=admin.id,
                    cost=random.uniform(100, 2000),
                    duration_hours=random.uniform(1, 8),
                    parts_replaced={"cells": random.randint(0, 2), "connectors": random.randint(0, 4)} if random.random() > 0.7 else None,
                    notes="All parameters within normal range." if random.random() > 0.5 else "Minor adjustments made.",
                    next_maintenance_date=date.today() + timedelta(days=random.randint(30, 180)),
                    created_at=now - timedelta(days=random.randint(1, 90)),
                )
                db.add(record)
        await db.flush()
        print(f"  Created maintenance records")

        await db.commit()
        print("\nDatabase seeding complete!")
        print("  Admin login: admin@edgetwin.com / admin123")
        print("  Operator login: operator@edgetwin.com / operator123")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
