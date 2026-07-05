"""
EdgeTwin-BMS+ Maintenance Record Model
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Numeric, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class MaintenanceRecord(Base):
    """
    Maintenance Record model for tracking battery maintenance.
    """
    
    __tablename__ = "maintenance_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type = Column(
        Enum(
            "inspection", "repair", "replacement", "balancing", "calibration", "software_update",
            name="maintenance_type",
        ),
        nullable=False,
    )
    description = Column(Text, nullable=False)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    cost = Column(Numeric(10, 2))
    duration_hours = Column(Numeric(5, 2))
    parts_replaced = Column(JSONB)
    notes = Column(Text)
    next_maintenance_date = Column(Date)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="maintenance_records")
    
    def __repr__(self):
        return f"<MaintenanceRecord {self.maintenance_type} for {self.battery_id}>"
