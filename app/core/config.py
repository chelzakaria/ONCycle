"""
Configuration management for the ONCycle API
"""

import json
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    APP_NAME: str = "ONCycle Train Delay Prediction API"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["*"]
    SINGLE_STATION_MODEL_PATH: str
    ENCODER_PATH: str
    METRICS_JSON: str
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    SUPABASE_URL: str
    SUPABASE_KEY: str
    API_KEY: str

    class Config:
        """Pydantic configuration"""

        env_file = ".env"
        case_sensitive = True

    @property
    def MODEL_VERSION(self) -> str:
        """Read model version from metrics.json"""
        try:
            with open(self.METRICS_JSON, "r", encoding="utf-8") as _f:
                metrics_data = json.load(_f)
            return metrics_data.get("version", "1.0.0")
        except (json.JSONDecodeError, KeyError, FileNotFoundError, IOError):
            return "1.0.0"

    @property
    def MODEL_ACCURACY(self) -> float:
        """Read model accuracy from metrics.json"""
        try:
            with open(self.METRICS_JSON, "r") as _f:
                metrics_data = json.load(_f)
            return round(metrics_data.get("r2", 0.0), 2)
        except (json.JSONDecodeError, KeyError, FileNotFoundError, IOError):
            return 0.0

    @property
    def MODEL_ERROR(self) -> float:
        """Read model error (MAE) from metrics.json"""
        try:
            with open(self.METRICS_JSON, "r", encoding="utf-8") as _f:
                metrics_data = json.load(_f)
            return round(metrics_data.get("mae", 0.0), 2)
        except (json.JSONDecodeError, KeyError, FileNotFoundError, IOError):
            return 0.0


settings = Settings()
