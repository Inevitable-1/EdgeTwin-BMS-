"""
EdgeTwin-BMS+ Battery Model
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Numeric, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Battery(Base):
    """
    Battery model for storing battery information.
    """
    
    __tablename__ = "batteries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(String(50), unique=True, nullable=False, index=True)
    fleet_id = Column(UUID(as_uuid=True), ForeignKey("fleets.id", ondelete="SET NULL"))
    manufacturer = Column(String(255), nullable=False)
    model = Column(String(255))
    chemistry = Column(String(50), nullable=False)
    capacity_kwh = Column(Numeric(10, 2), nullable=False)
    nominal_voltage = Column(Numeric(10, 2), nullable=False)
    max_voltage = Column(Numeric(10, 2), nullable=False)
    min_voltage = Column(Numeric(10, 2), nullable=False)
    max_current = Column(Numeric(10, 2), nullable=False)
    cycles_in_series = Column(Integer, nullable=False)
    cycles_in_parallel = Column(Integer, nullable=False)
    status = Column(
        Enum("active", "inactive", "maintenance", "retired", "recycled", name="battery_status"),
        nullable=False,
        default="active",
    )
    manufacturing_date = Column(Date)
    installation_date = Column(Date)
    warranty_expiry = Column(Date)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fleet = relationship("Fleet", back_populates="batteries")
    telemetry = relationship("Telemetry", back_populates="battery", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="battery", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="battery", cascade="all, delete-orphan")
    passport = relationship("BatteryPassport", back_populates="battery", uselist=False, cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="battery", cascade="all, delete-orphan")
    digital_twin = relationship("DigitalTwin", back_populates="battery", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Battery {self.battery_id}>"
