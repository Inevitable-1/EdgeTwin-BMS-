"""
EdgeTwin-BMS+ Battery Passport Schemas
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class BatteryPassportBase(BaseModel):
    """
    Base battery passport schema.
    """
    manufacturing_date: date
    first_use_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    total_energy_throughput: float = 0
    fast_charge_count: int = 0
    total_cycles: int = 0
    carbon_footprint_kg: float = 0
    second_life_status: str = Field(default="eligible", pattern="^(eligible|not_eligible|in_process|completed)$")
    recycling_date: Optional[date] = None
    recycling_facility: Optional[str] = None


class BatteryPassportCreate(BatteryPassportBase):
    """
    Schema for creating a battery passport.
    """
    battery_id: UUID


class BatteryPassportUpdate(BaseModel):
    """
    Schema for updating a battery passport.
    """
    first_use_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    total_energy_throughput: Optional[float] = None
    fast_charge_count: Optional[int] = None
    total_cycles: Optional[int] = None
    carbon_footprint_kg: Optional[float] = None
    second_life_status: Optional[str] = Field(None, pattern="^(eligible|not_eligible|in_process|completed)$")
    recycling_date: Optional[date] = None
    recycling_facility: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|expired|revoked|pending)$")


class BatteryPassportResponse(BatteryPassportBase):
    """
    Schema for battery passport response.
    """
    id: UUID
    battery_id: UUID
    passport_number: str
    status: str
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BatteryPassportListResponse(BaseModel):
    """
    Schema for paginated battery passport list response.
    """
    items: list[BatteryPassportResponse]
    total: int
    page: int
    page_size: int
    pages: int


class BatteryPassportFull(BatteryPassportResponse):
    """
    Schema for complete battery passport with all lifecycle data.
    """
    battery_info: Optional[dict] = None
    maintenance_history: Optional[List[dict]] = None
    charging_history: Optional[dict] = None
    ownership_history: Optional[List[dict]] = None
