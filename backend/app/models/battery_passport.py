"""
EdgeTwin-BMS+ Battery Passport Model
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Numeric, Integer, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class BatteryPassport(Base):
    """
    Battery Passport model for storing lifecycle information.
    Compliant with EU Battery Regulation.
    """
    
    __tablename__ = "battery_passports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), unique=True, nullable=False)
    passport_number = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(
        Enum("active", "expired", "revoked", "pending", name="passport_status"),
        nullable=False,
        default="active",
    )
    manufacturing_date = Column(Date, nullable=False)
    first_use_date = Column(Date)
    warranty_expiry = Column(Date)
    total_energy_throughput = Column(Numeric(15, 2), default=0)
    fast_charge_count = Column(Integer, default=0)
    total_cycles = Column(Integer, default=0)
    carbon_footprint_kg = Column(Numeric(10, 2), default=0)
    second_life_status = Column(
        Enum("eligible", "not_eligible", "in_process", "completed", name="second_life_status"),
        default="eligible",
    )
    recycling_date = Column(Date)
    recycling_facility = Column(String(255))
    qr_code = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="passport")
    
    def __repr__(self):
        return f"<BatteryPassport {self.passport_number}>"
