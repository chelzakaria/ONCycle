"""Health check endpoints"""

import time
from fastapi import APIRouter, Request, HTTPException

router = APIRouter()


@router.get("/")
async def api_health() -> dict:
    """Simple API health check"""
    return {"status": "healthy", "datetime": time.strftime("%Y-%m-%d %H:%M:%S")}


@router.get("/model")
async def model_health(request: Request) -> dict:
    """Model service health check"""
    model_service = getattr(request.app.state, "model_service", None)

    if not model_service or not getattr(model_service, "models_loaded", False):
        raise HTTPException(status_code=503, detail={"status": "not_ready"})

    return {"status": "ready"}
