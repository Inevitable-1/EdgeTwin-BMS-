"""
EdgeTwin-BMS+ Prediction Endpoints
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
from app.models.prediction import Prediction
from app.models.battery import Battery
from app.schemas.prediction import (
    PredictionCreate,
    PredictionResponse,
    PredictionListResponse,
    PredictionExplanation,
)

router = APIRouter()


@router.get("/{battery_id}", response_model=PredictionListResponse)
async def list_predictions(
    battery_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model_type: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List predictions for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    query = select(Prediction).where(Prediction.battery_id == battery_id)
    count_query = select(func.count(Prediction.id)).where(Prediction.battery_id == battery_id)
    
    # Apply filters
    if model_type:
        query = query.where(Prediction.model_type == model_type)
        count_query = count_query.where(Prediction.model_type == model_type)
    
    if start_time:
        query = query.where(Prediction.timestamp >= start_time)
        count_query = count_query.where(Prediction.timestamp >= start_time)
    
    if end_time:
        query = query.where(Prediction.timestamp <= end_time)
        count_query = count_query.where(Prediction.timestamp <= end_time)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    query = query.order_by(Prediction.timestamp.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    predictions = result.scalars().all()
    
    return PredictionListResponse(
        items=predictions,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{battery_id}/latest", response_model=dict)
async def get_latest_predictions(
    battery_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get latest predictions for all model types for a battery.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Get latest prediction for each model type
    model_types = ["soh", "soc", "rul", "thermal", "anomaly"]
    latest_predictions = {}
    
    for model_type in model_types:
        query = (
            select(Prediction)
            .where(Prediction.battery_id == battery_id)
            .where(Prediction.model_type == model_type)
            .order_by(Prediction.timestamp.desc())
            .limit(1)
        )
        result = await db.execute(query)
        prediction = result.scalar_one_or_none()
        
        if prediction:
            latest_predictions[model_type] = {
                "value": float(prediction.prediction_value),
                "confidence": float(prediction.confidence),
                "timestamp": prediction.timestamp.isoformat(),
                "explanation": prediction.explanation,
            }
    
    return latest_predictions


@router.get("/{battery_id}/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    battery_id: UUID,
    prediction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific prediction.
    """
    result = await db.execute(
        select(Prediction).where(
            Prediction.id == prediction_id,
            Prediction.battery_id == battery_id,
        )
    )
    prediction = result.scalar_one_or_none()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    
    return prediction


@router.get("/{battery_id}/{prediction_id}/explanation", response_model=PredictionExplanation)
async def get_prediction_explanation(
    battery_id: UUID,
    prediction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed explanation for a prediction.
    """
    result = await db.execute(
        select(Prediction).where(
            Prediction.id == prediction_id,
            Prediction.battery_id == battery_id,
        )
    )
    prediction = result.scalar_one_or_none()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    
    # Generate explanation based on prediction type and value
    explanation = generate_explanation(prediction)
    
    return explanation


@router.post("/{battery_id}", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    battery_id: UUID,
    prediction_data: PredictionCreate,
    current_user: User = Depends(require_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new prediction.
    """
    # Verify battery exists
    battery_result = await db.execute(select(Battery).where(Battery.id == battery_id))
    if not battery_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    
    # Create prediction
    prediction = Prediction(
        battery_id=battery_id,
        model_type=prediction_data.model_type,
        prediction_value=prediction_data.prediction_value,
        confidence=prediction_data.confidence,
        explanation=prediction_data.explanation,
        features_used=prediction_data.features_used,
        inference_time_ms=prediction_data.inference_time_ms,
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    
    return prediction


def generate_explanation(prediction: Prediction) -> PredictionExplanation:
    """
    Generate detailed explanation for a prediction.
    """
    feature_importance = {}
    top_features = []
    root_cause = None
    recommendations = []
    
    if prediction.model_type == "soh":
        if prediction.prediction_value < 70:
            root_cause = "Significant battery degradation detected"
            recommendations = [
                "Schedule battery replacement within 3 months",
                "Reduce fast charging to less than 20% of sessions",
                "Monitor temperature variance closely",
            ]
        elif prediction.prediction_value < 80:
            root_cause = "Moderate battery degradation"
            recommendations = [
                "Continue normal operation with monitoring",
                "Consider reducing charge rate",
                "Schedule preventive maintenance",
            ]
        else:
            root_cause = "Battery health is good"
            recommendations = [
                "Continue normal operation",
                "Maintain regular monitoring schedule",
            ]
    
    elif prediction.model_type == "thermal":
        if prediction.prediction_value > 70:
            root_cause = "Critical thermal risk detected"
            recommendations = [
                "IMMEDIATE: Reduce power output by 50%",
                "Activate active cooling system",
                "Schedule thermal system inspection",
            ]
        elif prediction.prediction_value > 30:
            root_cause = "Moderate thermal risk"
            recommendations = [
                "Monitor cell temperatures closely",
                "Consider reducing charge rate",
                "Check cooling system efficiency",
            ]
        else:
            root_cause = "Thermal conditions are safe"
            recommendations = [
                "Continue normal operation",
            ]
    
    elif prediction.model_type == "anomaly":
        if prediction.prediction_value > 0.5:
            root_cause = "Anomaly detected in battery behavior"
            recommendations = [
                "Run diagnostic scan on battery cells",
                "Check sensor calibration",
                "Verify BMS communication",
            ]
        else:
            root_cause = "No anomalies detected"
            recommendations = [
                "Continue normal operation",
            ]
    
    # Extract feature importance from explanation if available
    if prediction.explanation:
        if "feature_importance" in prediction.explanation:
            feature_importance = prediction.explanation["feature_importance"]
            top_features = sorted(
                feature_importance.keys(),
                key=lambda x: feature_importance[x],
                reverse=True,
            )[:5]
    
    return PredictionExplanation(
        prediction_id=prediction.id,
        model_type=prediction.model_type,
        prediction_value=float(prediction.prediction_value),
        confidence=float(prediction.confidence),
        feature_importance=feature_importance,
        top_features=top_features,
        root_cause=root_cause,
        recommendations=recommendations,
    )
