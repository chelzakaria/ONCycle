"""
Pydantic schemas for prediction requests and responses
"""

from datetime import datetime, date
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PredictionType(str, Enum):
    """Prediction type enumeration"""

    SINGLE_STATION = "single_station"
    # MULTI_STATION = "multi_station"
    # RECURSIVE = "recursive"
    # WHOLE_TRIP = "whole_trip"


class TripBaseRequest(BaseModel):
    """Base trip information for predictions"""

    train_id: str = Field(..., description="Unique identifier for the train")
    scheduled_departure_time: str = Field(
        ...,
        description="Scheduled departure time from the current station in HH:MM format",
    )
    trip_date: date = Field(..., description="Date of the trip in YYYY-MM-DD format")


class SingleStationPredictionRequest(TripBaseRequest):
    """Request for single station ahead prediction"""

    train_id: str = Field(..., description="Unique identifier for the train")
    scheduled_departure_time: str = Field(
        ...,
        description="Scheduled departure time from the current station in HH:MM format",
    )
    trip_date: date = Field(..., description="Date of the trip in YYYY-MM-DD format")


class PredictionResult(BaseModel):
    """Single prediction result"""

    shcedule_departure_time: str = Field(
        ...,
        description="Scheduled departure time from the current station in HH:MM format",
    )
    arrival_delay: float = Field(
        ..., description="Predicted arrival delay in minutes", ge=0
    )
    departure_delay: float = Field(
        None, description="Predicted departure delay in minutes", ge=0
    )
    start_station: Optional[str] = Field(
        None, description="Starting station of the trip"
    )
    next_station: Optional[str] = Field(
        None, description="Next station for which the prediction is made"
    )


class SingleStationPredictionResponse(BaseModel):
    """Response for single station prediction"""

    prediction_type: PredictionType = PredictionType.SINGLE_STATION
    result: PredictionResult
    processing_time_ms: float
    model_version: str
    model_accuracy: float
    model_error: float


class BatchPredictionRequest(BaseModel):
    """Request for batch predictions"""

    predictions: List[dict] = Field(
        ...,
        description="List of single station prediction requests",
    )
    prediction_type: PredictionType = Field(
        default=PredictionType.SINGLE_STATION,
        description="Type of prediction to perform",
    )


class BatchPredictionResponse(BaseModel):
    """Response for batch predictions"""

    predictions: List[SingleStationPredictionResponse] = Field(
        ..., description="List of prediction results"
    )
    total_processing_time_ms: float = Field(
        ..., description="Total processing time for batch predictions"
    )
    successful_predictions: int = Field(
        ..., description="Number of successful predictions"
    )
    failed_predictions: int = Field(..., description="Number of failed predictions")


class ErrorResponse(BaseModel):
    """Error response schema"""

    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(
        None, description="Additional error details"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Error timestamp"
    )
