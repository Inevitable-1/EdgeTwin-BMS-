"""
EdgeTwin-BMS+ Maintenance Schemas
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class MaintenanceBase(BaseModel):
    """
    Base maintenance record schema.
    """
    maintenance_type: str = Field(
        ...,
        pattern="^(inspection|repair|replacement|balancing|calibration|software_update)$",
    )
    description: str
    cost: Optional[float] = Field(None, ge=0)
    duration_hours: Optional[float] = Field(None, ge=0)
    parts_replaced: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    next_maintenance_date: Optional[date] = None


class MaintenanceCreate(MaintenanceBase):
    """
    Schema for creating a maintenance record.
    """
    battery_id: UUID


class MaintenanceUpdate(BaseModel):
    """
    Schema for updating a maintenance record.
    """
    description: Optional[str] = None
    cost: Optional[float] = Field(None, ge=0)
    duration_hours: Optional[float] = Field(None, ge=0)
    parts_replaced: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    next_maintenance_date: Optional[date] = None


class MaintenanceResponse(MaintenanceBase):
    """
    Schema for maintenance record response.
    """
    id: UUID
    battery_id: UUID
    performed_by: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MaintenanceListResponse(BaseModel):
    """
    Schema for paginated maintenance record list response.
    """
    items: list[MaintenanceResponse]
    total: int
    page: int
    page_size: int
    pages: int


class MaintenanceSchedule(BaseModel):
    """
    Schema for maintenance schedule.
    """
    battery_id: UUID
    battery_id_display: str
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[date] = None
    maintenance_type: Optional[str] = None
    days_until_maintenance: Optional[int] = None
