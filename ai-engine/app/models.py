"""
app/models.py — SQLAlchemy ORM models for NyayaSaathi.

Mirrors the Prisma schema defined in the Next.js backend while adding
pgvector columns for semantic search.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from pgvector.sqlalchemy import Vector

from app.database import Base
from app.config import settings


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Legal Acts ────────────────────────────────────────────────────────────────
class LegalAct(Base):
    __tablename__ = "legal_act"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(500), nullable=False)
    shortName = Column(String(100))
    year = Column(Integer)
    category = Column(String(100))
    description = Column(Text)
    language = Column(String(10), default="en")
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())


# ── Legal Sections ────────────────────────────────────────────────────────────
class LegalSection(Base):
    __tablename__ = "legal_section"

    id = Column(String, primary_key=True, default=_uuid)
    actId = Column(String, ForeignKey("legal_act.id"), nullable=False)
    sectionNumber = Column(String(50))
    title = Column(String(500))
    originalText = Column(Text)
    simplifiedText = Column(Text)
    keywords = Column(JSON, default=list)
    category = Column(String(100))
    language = Column(String(10), default="en")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())


# ── Legal Section Vectors (pgvector) ──────────────────────────────────────────
class LegalSectionVector(Base):
    """
    Stores dense embedding vectors for each legal section chunk.
    Used by the RAG pipeline for semantic similarity search.
    """

    __tablename__ = "legal_section_vectors"

    id = Column(String, primary_key=True, default=_uuid)
    section_id = Column(String, ForeignKey("legal_section.id"), nullable=True)
    content = Column(Text, nullable=False)        # originalText + simplifiedText combined
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)
    language = Column(String(10), default="en")
    act_name = Column(String(500))                # denormalised for fast retrieval
    section_number = Column(String(50))
    section_title = Column(String(500))
    category = Column(String(100))
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Chat Sessions ─────────────────────────────────────────────────────────────
class ChatSession(Base):
    __tablename__ = "chat_session"

    id = Column(String, primary_key=True, default=_uuid)
    userId = Column(String, nullable=True)
    language = Column(String(10), default="en")
    intent = Column(String(100))
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())


# ── Chat Messages ─────────────────────────────────────────────────────────────
class ChatMessage(Base):
    __tablename__ = "chat_message"

    id = Column(String, primary_key=True, default=_uuid)
    sessionId = Column(String, ForeignKey("chat_session.id"), nullable=False)
    role = Column(String(20), nullable=False)   # "user" | "assistant"
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    intent = Column(String(100))
    citations = Column(JSON, default=list)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
