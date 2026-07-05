"""
EdgeTwin-BMS+ Battery Passport Endpoints
"""

import math
import uuid
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.battery_passport import BatteryPassport
from app.models.battery import Battery
from app.schemas.battery_passport import (
    BatteryPassportCreate,
    BatteryPassportUpdate,
    BatteryPassportResponse,
    BatteryPassportListResponse,
    BatteryPassportFull,
)

router = APIRouter()


@router.get("/", response_model=BatteryPassportListResponse)
async def list_passports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    second_life_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all battery passports.
    """
    query = select(BatteryPassport)
    count_query = select(func.count(BatteryPassport.id))
    
    # Apply filters
    if status_filter:
        query = query.where(BatteryPassport.status == status_filter)
        count_query = count_query.where(BatteryPassport.status == status_filter)
    
    if second_life_status:
        query = query.where(BatteryPassport.second_life_status == second_life_status)
        count_query = count_query.where(BatteryPassport.second_life_status == second_life_status)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    passports = result.scalars().all()
    
    return BatteryPassportListResponse(
        items=passports,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{passport_id}", response_model=BatteryPassportResponse)
async def get_passport(
    passport_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific battery passport.
    """
    result = await db.execute(select(BatteryPassport).where(BatteryPassport.id == passport_id))
    passport = result.scalar_one_or_none()
    
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery passport not found",
        )
    
    return passport


@router.get("/by-battery/{battery_id}", response_model=BatteryPassportResponse)
async def get_passport_by_battery(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get battery passport by battery ID.
    """
    result = await db.execute(
        select(BatteryPassport).where(BatteryPassport.battery_id == battery_id)
    )
    passport = result.scalar_one_or_none()
    
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery passport not found",
        )
    
    return passport


@router.get("/{passport_id}/full", response_model=BatteryPassportFull)
async def get_full_passport(
    passport_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get complete battery passport with all lifecycle data.
    """
    result = await db.execute(select(BatteryPassport).where(BatteryPassport.id == passport_id))
    passport = result.scalar_one_or_none()
    
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery passport not found",
        )
    
    # Get battery info
    battery_result = await db.execute(select(Battery).where(Battery.id == passport.battery_id))
    battery = battery_result.scalar_one_or_none()
    
    # Get maintenance history
    from app.models.maintenance import MaintenanceRecord
    maintenance_query = (
        select(MaintenanceRecord)
        .where(MaintenanceRecord.battery_id == passport.battery_id)
        .order_by(MaintenanceRecord.created_at.desc())
    )
    maintenance_result = await db.execute(maintenance_query)
    maintenance_records = maintenance_result.scalars().all()
    
    return BatteryPassportFull(
        **passport.__dict__,
        battery_info=battery.__dict__ if battery else None,
        maintenance_history=[m.__dict__ for m in maintenance_records] if maintenance_records else None,
    )


@router.post("/", response_model=BatteryPassportResponse, status_code=status.HTTP_201_CREATED)
async def create_passport(
    passport_data: BatteryPassportCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new battery passport.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == passport_data.battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Check if passport already exists for this battery
    existing = await db.execute(
        select(BatteryPassport).where(BatteryPassport.battery_id == passport_data.battery_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passport already exists for this battery",
        )
    
    # Generate passport number
    passport_number = f"PP-{uuid.uuid4().hex[:12].upper()}"
    
    # Create passport
    passport = BatteryPassport(
        battery_id=passport_data.battery_id,
        passport_number=passport_number,
        manufacturing_date=passport_data.manufacturing_date,
        first_use_date=passport_data.first_use_date,
        warranty_expiry=passport_data.warranty_expiry,
        total_energy_throughput=passport_data.total_energy_throughput,
        fast_charge_count=passport_data.fast_charge_count,
        total_cycles=passport_data.total_cycles,
        carbon_footprint_kg=passport_data.carbon_footprint_kg,
        second_life_status=passport_data.second_life_status,
        recycling_date=passport_data.recycling_date,
        recycling_facility=passport_data.recycling_facility,
    )
    db.add(passport)
    await db.commit()
    await db.refresh(passport)
    
    return passport


@router.put("/{passport_id}", response_model=BatteryPassportResponse)
async def update_passport(
    passport_id: UUID,
    passport_data: BatteryPassportUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a battery passport.
    """
    result = await db.execute(select(BatteryPassport).where(BatteryPassport.id == passport_id))
    passport = result.scalar_one_or_none()
    
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery passport not found",
        )
    
    # Update fields
    update_data = passport_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(passport, field, value)
    
    await db.commit()
    await db.refresh(passport)
    
    return passport


@router.delete("/{passport_id}")
async def delete_passport(
    passport_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a battery passport.
    """
    result = await db.execute(select(BatteryPassport).where(BatteryPassport.id == passport_id))
    passport = result.scalar_one_or_none()
    
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery passport not found",
        )
    
    await db.delete(passport)
    await db.commit()
    
    return {"message": "Battery passport deleted successfully"}
