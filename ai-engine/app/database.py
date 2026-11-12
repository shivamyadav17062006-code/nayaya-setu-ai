"""
app/database.py — Async SQLAlchemy engine + pgvector setup.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger(__name__)

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # set True to log all SQL
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # verify connections before use
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base ──────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Helpers ───────────────────────────────────────────────────────────────────
async def init_db() -> None:
    """
    Create all tables and ensure the pgvector extension is installed.
    Safe to call on every startup (idempotent).
    """
    async with engine.begin() as conn:
        # Install pgvector extension if not already present
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create all tables declared in models
        from app import models  # noqa: F401 — registers models with Base
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialised (pgvector extension + tables)")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
