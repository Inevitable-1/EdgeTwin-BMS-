"""
EdgeTwin-BMS+ Telemetry Schemas
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class TelemetryBase(BaseModel):
    """
    Base telemetry schema.
    """
    voltage: Optional[float] = None
    current: Optional[float] = None
    temperature: Optional[float] = None
    soc: Optional[float] = Field(None, ge=0, le=100)
    soh: Optional[float] = Field(None, ge=0, le=100)
    power: Optional[float] = None
    cell_voltages: Optional[List[float]] = None
    cell_temperatures: Optional[List[float]] = None
    charging: bool = False
    driving: bool = False


class TelemetryCreate(TelemetryBase):
    """
    Schema for creating telemetry data.
    """
    battery_id: UUID
    timestamp: Optional[datetime] = None


class TelemetryResponse(TelemetryBase):
    """
    Schema for telemetry response.
    """
    id: int
    battery_id: UUID
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class TelemetryListResponse(BaseModel):
    """
    Schema for paginated telemetry list response.
    """
    items: list[TelemetryResponse]
    total: int
    page: int
    page_size: int
    pages: int


class TelemetryStats(BaseModel):
    """
    Schema for telemetry statistics.
    """
    avg_voltage: Optional[float] = None
    max_voltage: Optional[float] = None
    min_voltage: Optional[float] = None
    avg_current: Optional[float] = None
    max_current: Optional[float] = None
    avg_temperature: Optional[float] = None
    max_temperature: Optional[float] = None
    avg_soc: Optional[float] = None
    data_points: int = 0


class TelemetryBulkCreate(BaseModel):
    """
    Schema for bulk telemetry creation.
    """
    battery_id: UUID
    data: List[TelemetryCreate]
