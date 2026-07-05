"""
EdgeTwin-BMS+ Prediction Schemas
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class PredictionBase(BaseModel):
    """
    Base prediction schema.
    """
    model_type: str = Field(..., min_length=1, max_length=50)
    prediction_value: float
    confidence: float = Field(..., ge=0, le=1)
    explanation: Optional[Dict[str, Any]] = None
    features_used: Optional[Dict[str, Any]] = None
    inference_time_ms: Optional[float] = None


class PredictionCreate(PredictionBase):
    """
    Schema for creating a prediction.
    """
    battery_id: UUID
    timestamp: Optional[datetime] = None


class PredictionResponse(PredictionBase):
    """
    Schema for prediction response.
    """
    id: UUID
    battery_id: UUID
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class PredictionListResponse(BaseModel):
    """
    Schema for paginated prediction list response.
    """
    items: list[PredictionResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PredictionExplanation(BaseModel):
    """
    Schema for detailed prediction explanation.
    """
    prediction_id: UUID
    model_type: str
    prediction_value: float
    confidence: float
    feature_importance: Dict[str, float]
    top_features: list[str]
    root_cause: Optional[str] = None
    recommendations: list[str]
    shap_values: Optional[Dict[str, float]] = None
