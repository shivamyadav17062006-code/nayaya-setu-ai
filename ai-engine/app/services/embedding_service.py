"""
app/services/embedding_service.py — Sentence embedding generation.

Uses the multilingual MiniLM model which supports 50+ languages
including Hindi, Tamil, Bengali, Telugu, Marathi, etc.
"""

from __future__ import annotations

import asyncio
import logging
from typing import List

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Wraps sentence-transformers to produce dense embedding vectors.
    The model is loaded lazily on first use and then cached in memory.
    """

    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def ensure_loaded(self) -> None:
        """Load the sentence-transformers model if not already loaded."""
        if self._model is not None:
            return

        async with self._lock:
            if self._model is not None:  # double-checked locking
                return

            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            # Run the blocking model load in a thread pool so we don't block
            # the event loop.
            loop = asyncio.get_event_loop()
            self._model = await loop.run_in_executor(
                None, self._load_model, settings.EMBEDDING_MODEL
            )
            logger.info(
                f"Embedding model loaded. Dimension: {self._model.get_sentence_embedding_dimension()}"
            )

    @staticmethod
    def _load_model(model_name: str):
        from sentence_transformers import SentenceTransformer  # type: ignore

        return SentenceTransformer(model_name)

    # ── Embedding ─────────────────────────────────────────────────────────────

    async def embed_text(self, text: str) -> List[float]:
        """Return a 384-dimensional embedding vector for a single text."""
        await self.ensure_loaded()
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None, lambda: self._model.encode(text, normalize_embeddings=True).tolist()
        )
        return embedding

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Return embedding vectors for a list of texts."""
        await self.ensure_loaded()
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            lambda: self._model.encode(
                texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False
            ).tolist(),
        )
        return embeddings

    @property
    def dimension(self) -> int:
        return settings.EMBEDDING_DIM

    @property
    def is_loaded(self) -> bool:
        return self._model is not None


# Singleton instance
embedding_service = EmbeddingService()
