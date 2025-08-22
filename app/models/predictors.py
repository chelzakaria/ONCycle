"""
Refactored prediction models for production use
"""

from typing import Any, Dict, List, Optional
import joblib

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

from supabase import Client, create_client
from core.config import settings
from core.logging import get_logger

logger = get_logger()


class BasePredictor:
    """Base class for all prediction models"""

    def __init__(self):
        self.label_encoders: LabelEncoder = joblib.load(settings.ENCODER_PATH)
        self.features: List[str] = None
        self.model: Optional[XGBRegressor] = None

    def preprocess_single_sample(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess a single sample for prediction"""
        # Convert to DataFrame
        _df = pd.DataFrame([data])

        # Get features
        _df = self._get_features(_df)

        # Apply the same preprocessing steps as training
        # _df = self._apply_preprocessing(_df)

        return (
            _df[self.features],
            _df["current_station"].iloc[0],
            _df["next_station"].iloc[0],
        )

    def _apply_preprocessing(self, _df: pd.DataFrame) -> pd.DataFrame:
        """Apply preprocessing transformations"""

        # Encode categorical variables
        categorical_cols = ["train_type", "route", "current_station", "next_station"]

        for col in categorical_cols:
            if (
                col in _df.columns
                and col in self.label_encoders
                and col in self.features
            ):
                try:
                    _df[f"{col}"] = self._decode_categorical(
                        [int(_df[col].iloc[0])], col
                    )
                except ValueError:
                    # Handle unknown categories
                    logger.warning(f"Unknown category in {col}, using default encoding")
                    _df[f"{col}"] = self.label_encoders[col].transform(
                        [_df[col].iloc[0]]
                    )

        return _df

    def _decode_categorical(self, values: List[int], col: str) -> List[str]:
        """Decode categorical values back to original labels"""
        if col in self.label_encoders:
            return self.label_encoders[col].inverse_transform(values).tolist()

        logger.warning(f"No label encoder found for column: {col}")
        return [str(v) for v in values]

    def _get_features(self, _df: pd.DataFrame) -> pd.DataFrame:
        """Select features for prediction"""
        supabase_client: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_KEY
        )
        # get additional features from Supabase filter by train_id and scheduled_departure_time
        if "train_id" in _df.columns and "scheduled_departure_time" in _df.columns:
            train_id = _df["train_id"].iloc[0]
            day = pd.to_datetime(_df["date"]).dt.day.iloc[0]
            day_of_week = pd.to_datetime(_df["date"]).dt.dayofweek.iloc[0]
            is_weekend = day_of_week >= 5
            scheduled_departure_time = _df["scheduled_departure_time"].iloc[0]
            columns = self.features + ["current_station", "next_station"]
            response = (
                supabase_client.table("processed_data")
                .select(",".join(columns))
                .eq("train_id", train_id)
                .eq("scheduled_departure_time", scheduled_departure_time)
                .eq("day_of_week", day_of_week)
                .limit(1)
                .execute()
            )

            if response.data:
                additional_features = pd.DataFrame(response.data)
                _df = pd.concat([_df, additional_features], axis=1)
                _df["day"] = day
                _df["day_of_week"] = day_of_week
                _df["is_weekend"] = is_weekend
        else:
            logger.warning(
                "train_id or scheduled_departure_time not found in input data"
            )
        return _df

    def load_model(self, path: str):
        """Load a trained model"""
        try:
            model_data = joblib.load(path)

            if isinstance(model_data, XGBRegressor):
                self.model = model_data
            else:
                raise ValueError(f"Model at {path} is not an XGBRegressor instance")
            self.features = model_data.get_booster().feature_names
            logger.info(f"Model loaded from {path}")
        except Exception as _e:
            logger.error(f"Failed to load model from {path}: {_e}")
            raise


class SingleStationPredictor(BasePredictor):
    """Single station ahead delay prediction"""

    def __init__(self):
        super().__init__()
        self.model: Optional[XGBRegressor] = None

    def predict(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Predict delay for next station"""

        # Preprocess input
        processed_data, current_station, next_station = self.preprocess_single_sample(
            data
        )

        # Make prediction
        prediction = self.model.predict(processed_data)[0]

        # Clip negatives
        prediction = np.maximum(prediction, 0)
        return {
            "prediction": prediction,
            "current_station": self._decode_categorical(
                [current_station], "current_station"
            )[0],
            "next_station": self._decode_categorical([next_station], "next_station")[0],
        }


class ModelEnsemble:
    """Ensemble of multiple prediction models"""

    def __init__(self) -> None:
        self.single_predictor = SingleStationPredictor()

    def predict_ensemble(
        self, data: Dict[str, Any], prediction_type: str = "single"
    ) -> Dict[str, Any]:
        """Make ensemble predictions"""
        try:
            if prediction_type == "single":
                return self.single_predictor.predict(data)
        except Exception as _e:
            logger.error(f"Ensemble prediction failed: {_e}")
            raise

    def load_all_models(self, model_paths: Dict[str, str]) -> None:
        """Load all models from specified paths"""
        if "single" in model_paths:
            self.single_predictor.load_model(model_paths["single"])
