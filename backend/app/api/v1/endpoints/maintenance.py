"""
EdgeTwin-BMS+ Maintenance Endpoints
"""

import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.maintenance import MaintenanceRecord
from app.models.battery import Battery
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
    MaintenanceListResponse,
    MaintenanceSchedule,
)

router = APIRouter()


@router.get("/{battery_id}", response_model=MaintenanceListResponse)
async def list_maintenance_records(
    battery_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    maintenance_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List maintenance records for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    query = select(MaintenanceRecord).where(MaintenanceRecord.battery_id == battery_id)
    count_query = select(func.count(MaintenanceRecord.id)).where(MaintenanceRecord.battery_id == battery_id)
    
    # Apply filters
    if maintenance_type:
        query = query.where(MaintenanceRecord.maintenance_type == maintenance_type)
        count_query = count_query.where(MaintenanceRecord.maintenance_type == maintenance_type)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    query = query.order_by(MaintenanceRecord.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    records = result.scalars().all()
    
    return MaintenanceListResponse(
        items=records,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{battery_id}/schedule", response_model=MaintenanceSchedule)
async def get_maintenance_schedule(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get maintenance schedule for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    battery = battery_result.scalar_one_or_none()
    
    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Get latest maintenance record
    latest_query = (
        select(MaintenanceRecord)
        .where(MaintenanceRecord.battery_id == battery_id)
        .order_by(MaintenanceRecord.created_at.desc())
        .limit(1)
    )
    latest_result = await db.execute(latest_query)
    latest_record = latest_result.scalar_one_or_none()
    
    # Get next scheduled maintenance
    from datetime import date
    next_query = (
        select(MaintenanceRecord)
        .where(
            MaintenanceRecord.battery_id == battery_id,
            MaintenanceRecord.next_maintenance_date >= date.today(),
        )
        .order_by(MaintenanceRecord.next_maintenance_date.asc())
        .limit(1)
    )
    next_result = await db.execute(next_query)
    next_record = next_result.scalar_one_or_none()
    
    days_until_maintenance = None
    if next_record and next_record.next_maintenance_date:
        from datetime import datetime
        delta = next_record.next_maintenance_date - date.today()
        days_until_maintenance = delta.days
    
    return MaintenanceSchedule(
        battery_id=battery_id,
        battery_id_display=battery.battery_id,
        last_maintenance=latest_record.created_at if latest_record else None,
        next_maintenance=next_record.next_maintenance_date if next_record else None,
        maintenance_type=next_record.maintenance_type if next_record else None,
        days_until_maintenance=days_until_maintenance,
    )


@router.get("/{battery_id}/{record_id}", response_model=MaintenanceResponse)
async def get_maintenance_record(
    battery_id: UUID,
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific maintenance record.
    """
    result = await db.execute(
        select(MaintenanceRecord).where(
            MaintenanceRecord.id == record_id,
            MaintenanceRecord.battery_id == battery_id,
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found",
        )
    
    return record


@router.post("/{battery_id}", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_record(
    battery_id: UUID,
    record_data: MaintenanceCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new maintenance record.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Create maintenance record
    record = MaintenanceRecord(
        battery_id=battery_id,
        maintenance_type=record_data.maintenance_type,
        description=record_data.description,
        performed_by=current_user.id,
        cost=record_data.cost,
        duration_hours=record_data.duration_hours,
        parts_replaced=record_data.parts_replaced,
        notes=record_data.notes,
        next_maintenance_date=record_data.next_maintenance_date,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    
    return record


@router.put("/{battery_id}/{record_id}", response_model=MaintenanceResponse)
async def update_maintenance_record(
    battery_id: UUID,
    record_id: UUID,
    record_data: MaintenanceUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a maintenance record.
    """
    result = await db.execute(
        select(MaintenanceRecord).where(
            MaintenanceRecord.id == record_id,
            MaintenanceRecord.battery_id == battery_id,
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found",
        )
    
    # Update fields
    update_data = record_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    
    await db.commit()
    await db.refresh(record)
    
    return record


@router.delete("/{battery_id}/{record_id}")
async def delete_maintenance_record(
    battery_id: UUID,
    record_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a maintenance record.
    """
    result = await db.execute(
        select(MaintenanceRecord).where(
            MaintenanceRecord.id == record_id,
            MaintenanceRecord.battery_id == battery_id,
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found",
        )
    
    await db.delete(record)
    await db.commit()
    
    return {"message": "Maintenance record deleted successfully"}
