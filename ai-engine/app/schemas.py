"""
app/schemas.py — Pydantic request/response schemas for NyayaSaathi AI Engine.
"""

from __future__ import annotations

from typing import Any, List, Optional
from pydantic import BaseModel, Field


# ── Shared / sub-schemas ──────────────────────────────────────────────────────

class Citation(BaseModel):
    act: str = Field(..., description="Name of the Indian Act")
    section: str = Field(..., description="Section number / description")
    year: Optional[int] = Field(None, description="Year the act was passed")
    relevance: Optional[str] = Field(None, description="Why this section is relevant")


class SearchResult(BaseModel):
    id: str
    section_id: Optional[str] = None
    content: str
    act_name: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    category: Optional[str] = None
    language: str = "en"
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    metadata: Optional[dict] = None


# ── /query ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's legal question")
    language: str = Field(default="en", description="BCP-47 language code (e.g. 'en', 'hi', 'ta')")
    session_id: str = Field(..., description="UUID of the chat session")
    intent: Optional[str] = Field(None, description="Pre-classified legal intent (optional)")

    model_config = {"json_schema_extra": {
        "example": {
            "message": "My employer has not paid my salary for 2 months. What can I do?",
            "language": "en",
            "session_id": "550e8400-e29b-41d4-a716-446655440000",
        }
    }}


class QueryResponse(BaseModel):
    answer: str = Field(..., description="AI-generated legal answer in the user's language")
    language: str = Field(..., description="BCP-47 language code of the response")
    intent: str = Field(..., description="Classified legal intent")
    citations: List[Citation] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    legal_aid_suggested: bool = Field(default=False)
    disclaimer: str = Field(
        default=(
            "This is legal information, not legal advice. "
            "For specific legal counsel, contact a qualified lawyer or NALSA "
            "(National Legal Services Authority) at 15100."
        )
    )
    session_id: str
    processing_time_ms: Optional[int] = None


# ── /embed ────────────────────────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    section_id: Optional[str] = Field(None, description="ID of the LegalSection record")
    content: str = Field(..., min_length=10, description="Text content to embed")
    language: str = Field(default="en")
    act_name: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    category: Optional[str] = None
    metadata: Optional[dict] = None

    model_config = {"json_schema_extra": {
        "example": {
            "section_id": "clxyz123",
            "content": "Section 21 of the Payment of Wages Act...",
            "language": "en",
            "act_name": "Payment of Wages Act",
            "section_number": "21",
        }
    }}


class EmbedResponse(BaseModel):
    id: str = Field(..., description="ID of the created LegalSectionVector record")
    section_id: Optional[str] = None
    embedding_dim: int
    message: str = "Embedding stored successfully"


class BatchEmbedRequest(BaseModel):
    items: List[EmbedRequest] = Field(..., min_length=1, max_length=100)


class BatchEmbedResponse(BaseModel):
    created: int
    ids: List[str]
    message: str


# ── /search ───────────────────────────────────────────────────────────────────

class SearchResponse(BaseModel):
    query: str
    language: str
    results: List[SearchResult]
    total: int


# ── /health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    service: str = "nyayasaathi-ai-engine"
    llm_provider: str
    embedding_model: str
    database_connected: bool
    embedding_model_loaded: bool
    details: Optional[dict] = None
