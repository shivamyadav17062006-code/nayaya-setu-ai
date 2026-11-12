"""
app/config.py — Pydantic Settings for NyayaSaathi AI Engine.
All values are read from environment variables (or .env file).
"""

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/nyayasaathi",
        description="Async SQLAlchemy connection URL (must use asyncpg driver)",
    )

    # ── LLM ──────────────────────────────────────────────────────────────────
    LLM_PROVIDER: Literal["openai", "google", "mock"] = Field(
        default="mock",
        description="LLM backend to use. Use 'mock' for development without API keys.",
    )
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    GOOGLE_API_KEY: str = Field(default="", description="Google Gemini API key")

    # ── Embeddings ────────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = Field(
        default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        description="HuggingFace sentence-transformers model (384-dim, multilingual)",
    )
    EMBEDDING_DIM: int = Field(
        default=384,
        description="Dimensionality of embedding vectors",
    )

    # ── Translation / BHASHINI ────────────────────────────────────────────────
    BHASHINI_API_KEY: str = Field(default="", description="BHASHINI translation API key")
    BHASHINI_USER_ID: str = Field(default="", description="BHASHINI user ID")

    # ── Server ────────────────────────────────────────────────────────────────
    AI_ENGINE_PORT: int = Field(default=8001, description="Port for this service")

    # ── RAG ───────────────────────────────────────────────────────────────────
    RAG_TOP_K: int = Field(default=5, description="Number of chunks to retrieve")
    RAG_SIMILARITY_THRESHOLD: float = Field(
        default=0.3, description="Minimum cosine similarity to include a chunk"
    )


settings = Settings()
