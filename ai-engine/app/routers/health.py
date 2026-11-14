"""
app/routers/health.py — Health check endpoint.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.schemas import HealthResponse
from app.services.embedding_service import embedding_service
from app.services.legal_service import legal_service
from app.services.llm_service import sanitize_api_key

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    details: dict = {}
    database_connected = False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        database_connected = True
    except Exception as exc:
        details["database_error"] = str(exc)[:200]

    gemini_key = sanitize_api_key(settings.GOOGLE_API_KEY) or sanitize_api_key(settings.GEMINI_API_KEY)
    details["gemini_configured"] = bool(gemini_key)
    details["supabase_configured"] = legal_service.is_configured
    details["llm_model"] = (
        settings.GEMINI_MODEL if settings.LLM_PROVIDER == "google" else settings.LLM_PROVIDER
    )

    return HealthResponse(
        status="ok" if database_connected else "degraded",
        version="1.0.0",
        service="nyayasaathi-ai-engine",
        llm_provider=settings.LLM_PROVIDER,
        embedding_model=settings.EMBEDDING_MODEL,
        database_connected=database_connected,
        embedding_model_loaded=embedding_service.is_loaded,
        details=details,
    )
