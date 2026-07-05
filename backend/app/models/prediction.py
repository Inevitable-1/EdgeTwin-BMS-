"""
EdgeTwin-BMS+ Prediction Model
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Prediction(Base):
    """
    Prediction model for storing AI model predictions.
    """
    
    __tablename__ = "predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battery_id = Column(UUID(as_uuid=True), ForeignKey("batteries.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    model_type = Column(String(50), nullable=False, index=True)
    prediction_value = Column(Numeric(10, 4), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=False)
    explanation = Column(JSONB)
    features_used = Column(JSONB)
    inference_time_ms = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    battery = relationship("Battery", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction {self.model_type} for {self.battery_id}>"
