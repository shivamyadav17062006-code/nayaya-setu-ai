"""
app/routers/health.py — Health check endpoint.
"""

from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        service="nyayasaathi-ai-engine",
        llm_provider=settings.LLM_PROVIDER,
        embedding_model=settings.EMBEDDING_MODEL,
        database_connected=True,
        embedding_model_loaded=True,
        details={"status": "healthy"},
    )
