"""
Model service for handling model loading and predictions
"""

import logging
import time
from typing import Dict, Any
import os

from models.predictors import ModelEnsemble
from core.config import settings
from schemas.prediction import (
    SingleStationPredictionRequest,
    SingleStationPredictionResponse,
    PredictionResult,
)

logger = logging.getLogger(__name__)


class ModelService:
    """Service for managing ML models and predictions"""

    def __init__(self):
        self.ensemble = ModelEnsemble()
        self.models_loaded = False
        self.model_version = settings.MODEL_VERSION
        self.model_accuracy = settings.MODEL_ACCURACY
        self.model_error = settings.MODEL_ERROR

    async def load_models(self):
        """Load all ML models"""
        try:
            logger.info("Starting model loading...")
            model_paths = {
                "single": settings.SINGLE_STATION_MODEL_PATH,
            }

            existing_models = {}
            for model_type, path in model_paths.items():
                if os.path.exists(path):
                    existing_models[model_type] = path
                    logger.info(f"Found {model_type} model at {path}")
                else:
                    logger.warning(f"Model file not found: {path}")

            if existing_models:
                self.ensemble.load_all_models(existing_models)
                logger.info(f"Loaded {len(existing_models)} models successfully")
            else:
                logger.error("No valid model files found")
                raise FileNotFoundError("No valid model files found")

            self.models_loaded = True
            logger.info("Model loading completed successfully")

        except Exception as _e:
            logger.error(f"Failed to load models: {_e}")
            self.models_loaded = False
            raise RuntimeError(f"Model loading failed: {_e}")

    def _convert_request_to_dict(self, request: Any) -> Dict[str, Any]:
        """Convert Pydantic request to dictionary for model input"""
        try:
            # Base conversion
            data = {
                "train_id": getattr(request, "train_id", None),
                "scheduled_departure_time": getattr(
                    request, "scheduled_departure_time", None
                ),
                "date": getattr(request, "trip_date", None),
            }

            return data

        except Exception as _e:
            logger.error(f"Failed to convert request to dict: {_e}")
            raise ValueError(f"Invalid request format: {_e}")

    async def predict_single_station(
        self, request: SingleStationPredictionRequest
    ) -> SingleStationPredictionResponse:
        """Predict delay for next station"""
        if not self.models_loaded:
            raise RuntimeError("Models not loaded")
        start_time = time.perf_counter()
        try:
            # Convert request to model input
            input_data = self._convert_request_to_dict(request)
            # Make prediction using ensemble
            if self.ensemble:
                prediction_result = self.ensemble.predict_ensemble(input_data, "single")
            else:
                raise RuntimeError("Model ensemble not initialized")
            processing_time = round((time.perf_counter() - start_time) * 1000, 2)

            result = PredictionResult(
                shcedule_departure_time=request.scheduled_departure_time,
                arrival_delay=prediction_result["prediction"][0],
                departure_delay=prediction_result["prediction"][1],
                start_station=prediction_result["current_station"],
                next_station=prediction_result["next_station"],
            )

            return SingleStationPredictionResponse(
                train_id=request.train_id,
                result=result,
                processing_time_ms=processing_time,
                model_version=self.model_version,
                model_accuracy=self.model_accuracy,
                model_error=self.model_error,
            )

        except Exception as _e:
            logger.error(f"Single station prediction failed: {_e}")
            raise RuntimeError(f"Prediction failed: {_e}") from _e

    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "healthy" if self.models_loaded else "unhealthy",
            "models_loaded": self.models_loaded,
            "model_version": self.model_version,
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
