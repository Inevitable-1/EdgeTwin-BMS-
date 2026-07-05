"""
EdgeTwin-BMS+ Fleet Schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class FleetBase(BaseModel):
    """
    Base fleet schema.
    """
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class FleetCreate(FleetBase):
    """
    Schema for creating a fleet.
    """
    pass


class FleetUpdate(BaseModel):
    """
    Schema for updating a fleet.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FleetResponse(FleetBase):
    """
    Schema for fleet response.
    """
    id: UUID
    owner_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FleetListResponse(BaseModel):
    """
    Schema for paginated fleet list response.
    """
    items: list[FleetResponse]
    total: int
    page: int
    page_size: int
    pages: int


class FleetStatistics(BaseModel):
    """
    Schema for fleet statistics.
    """
    id: UUID
    name: str
    total_batteries: int
    active_batteries: int
    avg_soh: Optional[float] = None
    min_soh: Optional[float] = None
    max_soh: Optional[float] = None
    critical_alerts: int
    warning_alerts: int
