"""
EdgeTwin-BMS+ Alert Endpoints
"""

import math
from typing import Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.alert import Alert
from app.models.battery import Battery
from app.schemas.alert import (
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertListResponse,
    AlertStatistics,
)

router = APIRouter()


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    battery_id: Optional[UUID] = None,
    severity: Optional[str] = None,
    alert_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all alerts.
    """
    query = select(Alert)
    count_query = select(func.count(Alert.id))
    
    # Apply filters
    if battery_id:
        query = query.where(Alert.battery_id == battery_id)
        count_query = count_query.where(Alert.battery_id == battery_id)
    
    if severity:
        query = query.where(Alert.severity == severity)
        count_query = count_query.where(Alert.severity == severity)
    
    if alert_status:
        query = query.where(Alert.status == alert_status)
        count_query = count_query.where(Alert.status == alert_status)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    query = query.order_by(Alert.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return AlertListResponse(
        items=alerts,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/statistics", response_model=AlertStatistics)
async def get_alert_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get alert statistics.
    """
    # Count active alerts by severity
    active_count = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "active")
    )
    critical_count = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.status == "active", Alert.severity == "critical"
        )
    )
    warning_count = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.status == "active", Alert.severity == "warning"
        )
    )
    info_count = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.status == "active", Alert.severity == "info"
        )
    )
    acknowledged_count = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "acknowledged")
    )
    resolved_count = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "resolved")
    )
    
    return AlertStatistics(
        total_active=active_count.scalar(),
        critical=critical_count.scalar(),
        warning=warning_count.scalar(),
        info=info_count.scalar(),
        acknowledged=acknowledged_count.scalar(),
        resolved=resolved_count.scalar(),
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific alert.
    """
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    
    return alert


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new alert.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == alert_data.battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Create alert
    alert = Alert(
        battery_id=alert_data.battery_id,
        severity=alert_data.severity,
        title=alert_data.title,
        message=alert_data.message,
        source=alert_data.source,
        metadata=alert_data.metadata,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    alert_data: AlertUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an alert (acknowledge, resolve, dismiss).
    """
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    
    # Update fields
    update_data = alert_data.model_dump(exclude_unset=True)
    
    if "status" in update_data:
        if update_data["status"] == "acknowledged":
            alert.acknowledged_by = current_user.id
            alert.acknowledged_at = datetime.utcnow()
        elif update_data["status"] == "resolved":
            alert.resolved_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an alert.
    """
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    
    await db.delete(alert)
    await db.commit()
    
    return {"message": "Alert deleted successfully"}
