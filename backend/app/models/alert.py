"""
EdgeTwin-BMS+ Alert Model
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Alert(Base):
    """
    Alert model for storing system alerts.
    """
    
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(
        Enum("info", "warning", "critical", "emergency", name="alert_severity"),
        nullable=False,
        index=True,
    )
    status = Column(
        Enum("active", "acknowledged", "resolved", "dismissed", name="alert_status"),
        nullable=False,
        default="active",
        index=True,
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100))
    metadata = Column(JSONB)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert {self.severity} - {self.title}>"
