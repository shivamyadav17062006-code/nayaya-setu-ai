"""
NyayaSaathi AI Engine — Entry Point
FastAPI application with RAG pipeline for Indian legal awareness.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import query, embed, search, health
from app.services.embedding_service import embedding_service

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nyayasaathi")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 NyayaSaathi AI Engine starting up…")

    # 1. Verify DB connection and ensure pgvector tables exist
    try:
        await init_db()
        logger.info("✅ Database connection established")
    except Exception as exc:
        logger.warning(f"⚠️  Database init failed (non-fatal in dev): {exc}")

    # 2. Pre-load the embedding model so the first request is fast
    try:
        await embedding_service.ensure_loaded()
        logger.info(f"✅ Embedding model loaded: {settings.EMBEDDING_MODEL}")
    except Exception as exc:
        logger.warning(f"⚠️  Embedding model load failed (will retry on first use): {exc}")

    logger.info(f"✅ NyayaSaathi AI Engine ready on port {settings.AI_ENGINE_PORT}")
    yield

    logger.info("🛑 NyayaSaathi AI Engine shutting down…")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NyayaSaathi AI Engine",
    description=(
        "AI-powered legal awareness assistant for Indian citizens. "
        "Provides RAG-based answers citing Indian law."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://nyayasaathi.in",
        "https://www.nyayasaathi.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(query.router, tags=["Query"])
app.include_router(embed.router, tags=["Embed"])
app.include_router(search.router, tags=["Search"])


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.AI_ENGINE_PORT,
        reload=True,
        log_level="info",
    )
