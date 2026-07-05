"""
EdgeTwin-BMS+ Battery Schemas
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class BatteryBase(BaseModel):
    """
    Base battery schema.
    """
    battery_id: str = Field(..., min_length=1, max_length=50)
    manufacturer: str = Field(..., min_length=1, max_length=255)
    model: Optional[str] = None
    chemistry: str = Field(..., min_length=1, max_length=50)
    capacity_kwh: float = Field(..., gt=0)
    nominal_voltage: float = Field(..., gt=0)
    max_voltage: float = Field(..., gt=0)
    min_voltage: float = Field(..., gt=0)
    max_current: float = Field(..., gt=0)
    cycles_in_series: int = Field(..., gt=0)
    cycles_in_parallel: int = Field(..., gt=0)


class BatteryCreate(BatteryBase):
    """
    Schema for creating a battery.
    """
    fleet_id: Optional[UUID] = None
    manufacturing_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_expiry: Optional[date] = None


class BatteryUpdate(BaseModel):
    """
    Schema for updating a battery.
    """
    fleet_id: Optional[UUID] = None
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=255)
    model: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|maintenance|retired|recycled)$")
    warranty_expiry: Optional[date] = None


class BatteryResponse(BatteryBase):
    """
    Schema for battery response.
    """
    id: UUID
    fleet_id: Optional[UUID] = None
    status: str
    manufacturing_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BatteryListResponse(BaseModel):
    """
    Schema for paginated battery list response.
    """
    items: list[BatteryResponse]
    total: int
    page: int
    page_size: int
    pages: int


class BatteryHealth(BaseModel):
    """
    Schema for battery health overview.
    """
    id: UUID
    battery_id: str
    manufacturer: str
    model: Optional[str] = None
    chemistry: str
    capacity_kwh: float
    status: str
    fleet_id: Optional[UUID] = None
    fleet_name: Optional[str] = None
    current_soh: Optional[float] = None
    current_soc: Optional[float] = None
    current_temperature: Optional[float] = None
    current_voltage: Optional[float] = None
    current_current: Optional[float] = None
    active_alerts: int = 0
    total_cycles: Optional[int] = None
    total_energy_throughput: Optional[float] = None
    carbon_footprint_kg: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BatteryWithTelemetry(BatteryResponse):
    """
    Schema for battery with latest telemetry data.
    """
    latest_telemetry: Optional[dict] = None
    health_score: Optional[float] = None
