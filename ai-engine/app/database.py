"""
app/database.py — Async SQLAlchemy engine for the Supabase PostgreSQL database.

The schema itself is owned by supabase/schema.sql. This module only verifies
connectivity and reports missing tables; it never creates or alters tables.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

logger = logging.getLogger(__name__)

REQUIRED_TABLES = (
    "legal_acts",
    "legal_sections",
    "right_categories",
    "section_categories",
    "complaint_workflows",
    "workflow_steps",
    "legal_aid_providers",
    "legal_chunks",
)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> dict:
    """
    Verify the connection and the expected Supabase schema.
    Returns a dict describing missing tables (empty when everything is ready).
    """
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        result = await conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        )
        existing = {row[0] for row in result}

    missing = [table for table in REQUIRED_TABLES if table not in existing]
    if missing:
        logger.warning(
            "Missing database tables: %s. Run supabase/schema.sql in the Supabase "
            "SQL Editor before using vector retrieval.",
            ", ".join(missing),
        )
    else:
        logger.info("All required legal tables are present")

    return {"missing_tables": missing}


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
