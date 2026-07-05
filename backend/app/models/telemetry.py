"""
EdgeTwin-BMS+ Telemetry Model
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Telemetry(Base):
    """
    Telemetry model for storing time-series battery data.
    This is a TimescaleDB hypertable.
    """
    
    __tablename__ = "telemetry"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    voltage = Column(Numeric(10, 2))
    current = Column(Numeric(10, 2))
    temperature = Column(Numeric(10, 2))
    soc = Column(Numeric(5, 2))
    soh = Column(Numeric(5, 2))
    power = Column(Numeric(10, 2))
    cell_voltages = Column(JSONB)
    cell_temperatures = Column(JSONB)
    charging = Column(Boolean, default=False)
    driving = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="telemetry")
    
    def __repr__(self):
        return f"<Telemetry {self.battery_id} @ {self.timestamp}>"
