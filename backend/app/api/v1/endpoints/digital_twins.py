"""
EdgeTwin-BMS+ Digital Twin Endpoints
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models.user import User
from app.models.digital_twin import DigitalTwin
from app.models.battery import Battery
from pydantic import BaseModel

router = APIRouter()


class DigitalTwinCreate(BaseModel):
    """
    Schema for creating a digital twin.
    """
    battery_id: UUID
    name: str
    configuration: dict = {}


class DigitalTwinUpdate(BaseModel):
    """
    Schema for updating a digital twin.
    """
    name: Optional[str] = None
    configuration: Optional[dict] = None
    sync_status: Optional[str] = None


class DigitalTwinResponse(BaseModel):
    """
    Schema for digital twin response.
    """
    id: UUID
    battery_id: UUID
    name: str
    configuration: dict
    sync_status: str
    last_sync_at: Optional[str] = None
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


@router.get("/{battery_id}", response_model=DigitalTwinResponse)
async def get_digital_twin(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get digital twin for a battery.
    """
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.battery_id == battery_id)
    )
    digital_twin = result.scalar_one_or_none()
    
    if not digital_twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital twin not found",
        )
    
    return digital_twin


@router.post("/", response_model=DigitalTwinResponse, status_code=status.HTTP_201_CREATED)
async def create_digital_twin(
    twin_data: DigitalTwinCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new digital twin.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == twin_data.battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Check if digital twin already exists
    existing = await db.execute(
        select(DigitalTwin).where(DigitalTwin.battery_id == twin_data.battery_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Digital twin already exists for this battery",
        )
    
    # Create digital twin
    digital_twin = DigitalTwin(
        battery_id=twin_data.battery_id,
        name=twin_data.name,
        configuration=twin_data.configuration,
    )
    db.add(digital_twin)
    await db.commit()
    await db.refresh(digital_twin)
    
    return digital_twin


@router.put("/{battery_id}", response_model=DigitalTwinResponse)
async def update_digital_twin(
    battery_id: UUID,
    twin_data: DigitalTwinUpdate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a digital twin.
    """
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.battery_id == battery_id)
    )
    digital_twin = result.scalar_one_or_none()
    
    if not digital_twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital twin not found",
        )
    
    # Update fields
    update_data = twin_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(digital_twin, field, value)
    
    await db.commit()
    await db.refresh(digital_twin)
    
    return digital_twin


@router.delete("/{battery_id}")
async def delete_digital_twin(
    battery_id: UUID,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a digital twin.
    """
    result = await db.execute(
        select(DigitalTwin).where(DigitalTwin.battery_id == battery_id)
    )
    digital_twin = result.scalar_one_or_none()
    
    if not digital_twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital twin not found",
        )
    
    await db.delete(digital_twin)
    await db.commit()
    
    return {"message": "Digital twin deleted successfully"}
