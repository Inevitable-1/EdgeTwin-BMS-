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
    query = "SELECT * FROM v_battery_health WHERE 1=1"
    params = {}
    
    if fleet_id:
        query += " AND fleet_id = :fleet_id"
        params["fleet_id"] = str(fleet_id)
    
    if status_filter:
        query += " AND status = :status"
        params["status"] = status_filter
    
    result = await db.execute(query, params)
    batteries = result.mappings().all()
    
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
        health_score_query = """
            SELECT calculate_health_score(:soh, :soc, :temperature, :voltage)
        """
        health_result = await db.execute(
            health_score_query,
            {
                "soh": float(telemetry.soh),
                "soc": float(telemetry.soc),
                "temperature": float(telemetry.temperature),
                "voltage": float(telemetry.voltage),
            },
        )
        health_score = health_result.scalar()
    
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
