"""
EdgeTwin-BMS+ Battery Endpoints
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
from app.models.battery import Battery
from app.models.telemetry import Telemetry
from app.schemas.battery import (
    BatteryCreate,
    BatteryUpdate,
    BatteryResponse,
    BatteryListResponse,
    BatteryHealth,
    BatteryWithTelemetry,
)

router = APIRouter()


@router.get("/", response_model=BatteryListResponse)
async def list_batteries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    fleet_id: Optional[UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    chemistry: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all batteries.
    """
    query = select(Battery)
    count_query = select(func.count(Battery.id))
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Battery.battery_id.ilike(search_filter)) |
            (Battery.manufacturer.ilike(search_filter)) |
            (Battery.model.ilike(search_filter))
        )
        count_query = count_query.where(
            (Battery.battery_id.ilike(search_filter)) |
            (Battery.manufacturer.ilike(search_filter)) |
            (Battery.model.ilike(search_filter))
        )
    
    if fleet_id:
        query = query.where(Battery.fleet_id == fleet_id)
        count_query = count_query.where(Battery.fleet_id == fleet_id)
    
    if status_filter:
        query = query.where(Battery.status == status_filter)
        count_query = count_query.where(Battery.status == status_filter)
    
    if chemistry:
        query = query.where(Battery.chemistry == chemistry)
        count_query = count_query.where(Battery.chemistry == chemistry)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    batteries = result.scalars().all()
    
    return BatteryListResponse(
        items=batteries,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/health", response_model=list[BatteryHealth])
async def list_battery_health(
    fleet_id: Optional[UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all batteries with health overview.
    """
    query = select(
        Battery,
        Telemetry.voltage,
        Telemetry.current,
        Telemetry.temperature,
        Telemetry.soc,
        Telemetry.soh,
    ).outerjoin(
        Telemetry,
        Battery.id == Telemetry.battery_id,
    ).distinct(Battery.id).order_by(Battery.id, Telemetry.timestamp.desc())
    
    if fleet_id:
        query = query.where(Battery.fleet_id == fleet_id)
    
    if status_filter:
        query = query.where(Battery.status == status_filter)
    
    result = await db.execute(query)
    rows = result.all()
    
    from app.models.alert import Alert
    
    batteries = []
    for row in rows:
        battery = row.Battery
        health_score = None
        if row.soh and row.soc and row.temperature and row.voltage:
            soh_score = float(row.soh) / 100
            soc_score = float(row.soc) / 100
            temp_score = max(0, 1 - abs(float(row.temperature) - 25) / 40)
            volt_score = min(1, float(row.voltage) / 400)
            health_score = round((soh_score * 0.4 + soc_score * 0.2 + temp_score * 0.2 + volt_score * 0.2) * 100, 1)
        
        alert_count = await db.execute(
            select(func.count(Alert.id)).where(
                Alert.battery_id == battery.id, Alert.status == "active"
            )
        )
        active_alerts = alert_count.scalar() or 0
        
        fleet_name = None
        if battery.fleet:
            fleet_name = battery.fleet.name
        
        batteries.append(BatteryHealth(
            id=battery.id,
            battery_id=battery.battery_id,
            fleet_id=battery.fleet_id,
            fleet_name=fleet_name,
            status=battery.status,
            manufacturer=battery.manufacturer,
            model=battery.model,
            chemistry=battery.chemistry,
            capacity_kwh=float(battery.capacity_kwh),
            current_soh=float(row.soh) if row.soh else None,
            current_soc=float(row.soc) if row.soc else None,
            current_voltage=float(row.voltage) if row.voltage else None,
            current_current=float(row.current) if row.current else None,
            current_temperature=float(row.temperature) if row.temperature else None,
            active_alerts=active_alerts,
            total_cycles=None,
            created_at=battery.created_at,
            updated_at=battery.updated_at,
        ))
    
    return batteries


@router.get("/{battery_id}", response_model=BatteryResponse)
async def get_battery(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get battery by ID.
    """
    result = await db.execute(select(Battery).where(Battery.id == battery_id))
    battery = result.scalar_one_or_none()
    
    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    return battery


@router.get("/{battery_id}/with-telemetry", response_model=BatteryWithTelemetry)
async def get_battery_with_telemetry(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get battery with latest telemetry data.
    """
    result = await db.execute(select(Battery).where(Battery.id == battery_id))
    battery = result.scalar_one_or_none()
    
    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Get latest telemetry
    telemetry_query = (
        select(Telemetry)
        .where(Telemetry.battery_id == battery_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(1)
    )
    telemetry_result = await db.execute(telemetry_query)
    telemetry = telemetry_result.scalar_one_or_none()
    
    # Calculate health score
    health_score = None
    if telemetry and telemetry.soh and telemetry.soc and telemetry.temperature and telemetry.voltage:
        soh_score = float(telemetry.soh) / 100
        soc_score = float(telemetry.soc) / 100
        temp_score = max(0, 1 - abs(float(telemetry.temperature) - 25) / 40)
        volt_score = min(1, float(telemetry.voltage) / 400)
        health_score = round((soh_score * 0.4 + soc_score * 0.2 + temp_score * 0.2 + volt_score * 0.2) * 100, 1)
    
    return BatteryWithTelemetry(
        **battery.__dict__,
        latest_telemetry=telemetry.__dict__ if telemetry else None,
        health_score=float(health_score) if health_score else None,
    )


@router.post("/", response_model=BatteryResponse, status_code=status.HTTP_201_CREATED)
async def create_battery(
    battery_data: BatteryCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new battery.
    """
    # Check if battery_id already exists
    result = await db.execute(
        select(Battery).where(Battery.battery_id == battery_data.battery_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Battery ID already exists",
        )
    
    battery = Battery(**battery_data.model_dump())
    db.add(battery)
    await db.commit()
    await db.refresh(battery)
    
    return battery


@router.put("/{battery_id}", response_model=BatteryResponse)
async def update_battery(
    battery_id: UUID,
    battery_data: BatteryUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a battery.
    """
    result = await db.execute(select(Battery).where(Battery.id == battery_id))
    battery = result.scalar_one_or_none()
    
    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Update fields
    update_data = battery_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(battery, field, value)
    
    await db.commit()
    await db.refresh(battery)
    
    return battery


@router.delete("/{battery_id}")
async def delete_battery(
    battery_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a battery.
    """
    result = await db.execute(select(Battery).where(Battery.id == battery_id))
    battery = result.scalar_one_or_none()
    
    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    await db.delete(battery)
    await db.commit()
    
    return {"message": "Battery deleted successfully"}
