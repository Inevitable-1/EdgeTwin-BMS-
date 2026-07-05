"""
EdgeTwin-BMS+ Digital Twin Model
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class DigitalTwin(Base):
    """
    Digital Twin model for 3D visualization configuration.
    """
    
    __tablename__ = "digital_twins"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    configuration = Column(JSONB, nullable=False, default={})
    sync_status = Column(String(50), default="synced")
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="digital_twin")
    
    def __repr__(self):
        return f"<DigitalTwin {self.name}>"
