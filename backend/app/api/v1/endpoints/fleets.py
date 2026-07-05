"""
EdgeTwin-BMS+ Fleet Endpoints
"""

import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.fleet import Fleet
from app.models.battery import Battery
from app.models.alert import Alert
from app.schemas.fleet import FleetCreate, FleetUpdate, FleetResponse, FleetListResponse, FleetStatistics

router = APIRouter()


@router.get("/", response_model=FleetListResponse)
async def list_fleets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all fleets.
    """
    query = select(Fleet)
    count_query = select(func.count(Fleet.id))
    
    # Non-admin users can only see their own fleets
    if current_user.role != "admin":
        query = query.where(Fleet.owner_id == current_user.id)
        count_query = count_query.where(Fleet.owner_id == current_user.id)
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.where(Fleet.name.ilike(search_filter))
        count_query = count_query.where(Fleet.name.ilike(search_filter))
    
    if is_active is not None:
        query = query.where(Fleet.is_active == is_active)
        count_query = count_query.where(Fleet.is_active == is_active)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    fleets = result.scalars().all()
    
    return FleetListResponse(
        items=fleets,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{fleet_id}", response_model=FleetResponse)
async def get_fleet(
    fleet_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get fleet by ID.
    """
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fleet not found",
        )
    
    # Non-admin users can only view their own fleets
    if current_user.role != "admin" and fleet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return fleet


@router.post("/", response_model=FleetResponse, status_code=status.HTTP_201_CREATED)
async def create_fleet(
    fleet_data: FleetCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new fleet.
    """
    fleet = Fleet(
        name=fleet_data.name,
        description=fleet_data.description,
        owner_id=current_user.id,
    )
    db.add(fleet)
    await db.commit()
    await db.refresh(fleet)
    
    return fleet


@router.put("/{fleet_id}", response_model=FleetResponse)
async def update_fleet(
    fleet_id: UUID,
    fleet_data: FleetUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a fleet.
    """
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fleet not found",
        )
    
    # Non-admin users can only update their own fleets
    if current_user.role != "admin" and fleet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Update fields
    update_data = fleet_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fleet, field, value)
    
    await db.commit()
    await db.refresh(fleet)
    
    return fleet


@router.delete("/{fleet_id}")
async def delete_fleet(
    fleet_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a fleet.
    """
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fleet not found",
        )
    
    # Non-admin users can only delete their own fleets
    if current_user.role != "admin" and fleet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    await db.delete(fleet)
    await db.commit()
    
    return {"message": "Fleet deleted successfully"}


@router.get("/{fleet_id}/statistics", response_model=FleetStatistics)
async def get_fleet_statistics(
    fleet_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get fleet statistics.
    """
    result = await db.execute(select(Fleet).where(Fleet.id == fleet_id))
    fleet = result.scalar_one_or_none()
    
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fleet not found",
        )
    
    # Non-admin users can only view their own fleet statistics
    if current_user.role != "admin" and fleet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Get fleet statistics using direct queries
    # Total batteries in fleet
    total_result = await db.execute(
        select(func.count(Battery.id)).where(Battery.fleet_id == fleet_id)
    )
    total_batteries = total_result.scalar() or 0
    
    # Active batteries in fleet
    active_result = await db.execute(
        select(func.count(Battery.id)).where(
            and_(Battery.fleet_id == fleet_id, Battery.status == "active")
        )
    )
    active_batteries = active_result.scalar() or 0
    
    # SOH statistics
    soh_result = await db.execute(
        select(
            func.avg(Battery.current_soh),
            func.min(Battery.current_soh),
            func.max(Battery.current_soh),
        ).where(Battery.fleet_id == fleet_id)
    )
    soh_stats = soh_result.one()
    
    # Critical alerts
    critical_result = await db.execute(
        select(func.count(Alert.id)).join(Battery).where(
            and_(
                Battery.fleet_id == fleet_id,
                Alert.severity == "critical",
                Alert.status == "active",
            )
        )
    )
    critical_alerts = critical_result.scalar() or 0
    
    # Warning alerts
    warning_result = await db.execute(
        select(func.count(Alert.id)).join(Battery).where(
            and_(
                Battery.fleet_id == fleet_id,
                Alert.severity == "warning",
                Alert.status == "active",
            )
        )
    )
    warning_alerts = warning_result.scalar() or 0
    
    return FleetStatistics(
        id=fleet.id,
        name=fleet.name,
        total_batteries=total_batteries,
        active_batteries=active_batteries,
        avg_soh=float(soh_stats[0]) if soh_stats[0] else None,
        min_soh=float(soh_stats[1]) if soh_stats[1] else None,
        max_soh=float(soh_stats[2]) if soh_stats[2] else None,
        critical_alerts=critical_alerts,
        warning_alerts=warning_alerts,
    )
