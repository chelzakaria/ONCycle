"""
Prediction API endpoints
"""

import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends

from core.logging import get_logger
from schemas.prediction import (
    SingleStationPredictionRequest,
    SingleStationPredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ErrorResponse,
)
from services.model_service import ModelService

logger = get_logger()
router = APIRouter()


def get_model_service(request: Request) -> ModelService:
    """Dependency to get model service from app state"""
    model_service = getattr(request.app.state, "model_service", None)
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not available")
    return model_service


@router.post(
    "/predict/single-station",
    response_model=SingleStationPredictionResponse,
    summary="Predict delay for next station",
    description="Predict the arrival and departure delay for the next station",
)
async def predict_single_station(
    request: SingleStationPredictionRequest,
    model_service: ModelService = Depends(get_model_service),
) -> SingleStationPredictionResponse:
    """Predict delay for the next station"""
    try:
        logger.info(f"Single station prediction request for train {request.train_id}")
        result = await model_service.predict_single_station(request)
        logger.info(f"Single station prediction completed for train {request.train_id}")
        return result

    except Exception as _e:
        logger.error(f"Single station prediction failed: {_e}")
        raise HTTPException(
            status_code=500, detail=f"Prediction failed: {str(_e)}"
        ) from _e


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch predictions",
    description="Process multiple prediction requests in a single call",
)
async def predict_batch(
    request: BatchPredictionRequest,
    model_service: ModelService = Depends(get_model_service),
) -> BatchPredictionResponse:
    """Process batch predictions"""
    start_time = time.perf_counter()
    successful_predictions = 0
    failed_predictions = 0
    results = []

    try:
        logger.info(f"Batch prediction request with {len(request.predictions)} items")

        for i, pred_data in enumerate(request.predictions):
            try:
                if request.prediction_type == "single_station":
                    pred_request = SingleStationPredictionRequest(
                        train_id=pred_data.get("train_id"),
                        scheduled_departure_time=pred_data.get(
                            "scheduled_departure_time"
                        ),
                        trip_date=pred_data.get("trip_date"),
                    )
                    logger.info(f"Processing batch item {i}: {pred_request}")
                    result = await model_service.predict_single_station(pred_request)

                else:
                    raise ValueError(
                        f"Unknown prediction type: {request.prediction_type}"
                    )

                results.append(result)
                successful_predictions += 1

            except Exception as _e:
                logger.error(f"Batch prediction item {i} failed: {_e}")
                error_response = ErrorResponse(
                    error=str(_e),
                    error_code="PREDICTION_FAILED",
                    details={"item_index": i},
                )
                results.append(error_response)
                failed_predictions += 1

        total_time = (time.perf_counter() - start_time) * 1000

        logger.info(
            f"Batch prediction completed: {successful_predictions} successful, {failed_predictions} failed"
        )
        return BatchPredictionResponse(
            predictions=results,
            total_processing_time_ms=total_time,
            successful_predictions=successful_predictions,
            failed_predictions=failed_predictions,
        )

    except Exception as _e:
        logger.error(f"Batch prediction failed: {_e}")
        raise HTTPException(
            status_code=500, detail=f"Batch prediction failed: {str(_e)}"
        ) from _e


@router.get(
    "/models/info",
    summary="Get model information",
    description="Get information about loaded models",
)
async def get_model_info(
    model_service: ModelService = Depends(get_model_service),
) -> Dict[str, Any]:
    """Get information about loaded models"""
    try:
        health_info = await model_service.health_check()

        return {
            "model_version": model_service.model_version,
            "models_loaded": model_service.models_loaded,
            "model_accuracy": model_service.model_accuracy,
            "model_error": model_service.model_error,
            "health": health_info,
            "supported_prediction_types": ["single_station"],
        }

    except Exception as _e:
        logger.error(f"Failed to get model info: {_e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get model info: {str(_e)}"
        ) from _e
