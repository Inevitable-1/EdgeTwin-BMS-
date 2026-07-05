"""
EdgeTwin-BMS+ Audit Log Model
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    """
    Audit Log model for tracking system actions.
    """
    
    __tablename__ = "audit_logs"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(UUID(as_uuid=True), index=True)
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} on {self.resource_type}>"
