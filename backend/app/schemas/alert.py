"""
EdgeTwin-BMS+ Alert Schemas
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class AlertBase(BaseModel):
    """
    Base alert schema.
    """
    severity: str = Field(..., pattern="^(info|warning|critical|emergency)$")
    title: str = Field(..., min_length=1, max_length=255)
    message: str
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    """
    Schema for creating an alert.
    """
    battery_id: UUID


class AlertUpdate(BaseModel):
    """
    Schema for updating an alert.
    """
    status: Optional[str] = Field(None, pattern="^(active|acknowledged|resolved|dismissed)$")
    acknowledged_by: Optional[UUID] = None


class AlertResponse(AlertBase):
    """
    Schema for alert response.
    """
    id: UUID
    battery_id: UUID
    status: str
    acknowledged_by: Optional[UUID] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    """
    Schema for paginated alert list response.
    """
    items: list[AlertResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AlertStatistics(BaseModel):
    """
    Schema for alert statistics.
    """
    total_active: int
    critical: int
    warning: int
    info: int
    acknowledged: int
    resolved: int
