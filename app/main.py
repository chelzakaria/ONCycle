"""
ONCycle Train Delay Prediction API

A FastAPI application for predicting train delays using machine learning models.
Supports multiple prediction types: single station, multi-station, recursive, and whole trip.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes import prediction, health
from core.config import settings
from core.logging import setup_logging, get_logger
from services.model_service import ModelService


# Setup logging
setup_logging()
logger = get_logger()
# Global model service instance
MODEL_SERVICE = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    global MODEL_SERVICE

    logger.info("Starting ONCycle Train Delay Prediction API")
    try:
        MODEL_SERVICE = ModelService()
        await MODEL_SERVICE.load_models()
        app.state.model_service = MODEL_SERVICE
        logger.info("Models loaded successfully")
    except Exception as _e:
        logger.error(f"Failed to load models: {_e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down ONCycle Train Delay Prediction API")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Machine learning API for predicting train delays",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(prediction.router, prefix="/api/v1", tags=["Predictions"])


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ONCycle Train Delay Prediction API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
