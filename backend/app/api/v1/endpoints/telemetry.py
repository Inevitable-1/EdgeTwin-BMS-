"""
EdgeTwin-BMS+ Telemetry Endpoints
"""

import math
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.telemetry import Telemetry
from app.models.battery import Battery
from app.schemas.telemetry import (
    TelemetryCreate,
    TelemetryResponse,
    TelemetryListResponse,
    TelemetryStats,
    TelemetryBulkCreate,
)

router = APIRouter()


@router.get("/{battery_id}", response_model=TelemetryListResponse)
async def list_telemetry(
    battery_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List telemetry data for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    query = select(Telemetry).where(Telemetry.battery_id == battery_id)
    count_query = select(func.count(Telemetry.id)).where(Telemetry.battery_id == battery_id)
    
    # Apply time filters
    if start_time:
        query = query.where(Telemetry.timestamp >= start_time)
        count_query = count_query.where(Telemetry.timestamp >= start_time)
    
    if end_time:
        query = query.where(Telemetry.timestamp <= end_time)
        count_query = count_query.where(Telemetry.timestamp <= end_time)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    query = query.order_by(Telemetry.timestamp.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    telemetry = result.scalars().all()
    
    return TelemetryListResponse(
        items=telemetry,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{battery_id}/stats", response_model=TelemetryStats)
async def get_telemetry_stats(
    battery_id: UUID,
    hours: int = Query(24, ge=1, le=720),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get telemetry statistics for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Get statistics using the database function
    stats_query = """
        SELECT * FROM get_telemetry_stats(:battery_id, :hours)
    """
    result = await db.execute(stats_query, {"battery_id": str(battery_id), "hours": hours})
    stats = result.mappings().first()
    
    return TelemetryStats(
        avg_voltage=float(stats["avg_voltage"]) if stats["avg_voltage"] else None,
        max_voltage=float(stats["max_voltage"]) if stats["max_voltage"] else None,
        min_voltage=float(stats["min_voltage"]) if stats["min_voltage"] else None,
        avg_current=float(stats["avg_current"]) if stats["avg_current"] else None,
        max_current=float(stats["max_current"]) if stats["max_current"] else None,
        avg_temperature=float(stats["avg_temperature"]) if stats["avg_temperature"] else None,
        max_temperature=float(stats["max_temperature"]) if stats["max_temperature"] else None,
        avg_soc=float(stats["avg_soc"]) if stats["avg_soc"] else None,
        data_points=stats["data_points"],
    )


@router.get("/{battery_id}/latest", response_model=TelemetryResponse)
async def get_latest_telemetry(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get latest telemetry data for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Get latest telemetry
    query = (
        select(Telemetry)
        .where(Telemetry.battery_id == battery_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(1)
    )
    result = await db.execute(query)
    telemetry = result.scalar_one_or_none()
    
    if not telemetry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data found",
        )
    
    return telemetry


@router.post("/{battery_id}", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
async def create_telemetry(
    battery_id: UUID,
    telemetry_data: TelemetryCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create telemetry data for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Create telemetry record
    telemetry = Telemetry(
        battery_id=battery_id,
        voltage=telemetry_data.voltage,
        current=telemetry_data.current,
        temperature=telemetry_data.temperature,
        soc=telemetry_data.soc,
        soh=telemetry_data.soh,
        power=telemetry_data.power,
        cell_voltages=telemetry_data.cell_voltages,
        cell_temperatures=telemetry_data.cell_temperatures,
        charging=telemetry_data.charging,
        driving=telemetry_data.driving,
    )
    db.add(telemetry)
    await db.commit()
    await db.refresh(telemetry)
    
    return telemetry


@router.post("/{battery_id}/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_bulk_telemetry(
    battery_id: UUID,
    bulk_data: TelemetryBulkCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create bulk telemetry data for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Create telemetry records
    telemetry_records = []
    for data in bulk_data.data:
        telemetry = Telemetry(
            battery_id=battery_id,
            voltage=data.voltage,
            current=data.current,
            temperature=data.temperature,
            soc=data.soc,
            soh=data.soh,
            power=data.power,
            cell_voltages=data.cell_voltages,
            cell_temperatures=data.cell_temperatures,
            charging=data.charging,
            driving=data.driving,
        )
        telemetry_records.append(telemetry)
    
    db.add_all(telemetry_records)
    await db.commit()
    
    return {"message": f"Created {len(telemetry_records)} telemetry records"}
