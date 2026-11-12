"""
app/utils/helpers.py — Utility functions for NyayaSaathi AI Engine.
"""

from __future__ import annotations

import re
import uuid
import time
from typing import Any


def new_id() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def now_ms() -> int:
    """Current time in milliseconds."""
    return int(time.time() * 1000)


def elapsed_ms(start_ms: int) -> int:
    """Milliseconds elapsed since start_ms."""
    return now_ms() - start_ms


def truncate_text(text: str, max_chars: int = 2000) -> str:
    """Truncate text to max_chars, appending '…' if truncated."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "…"


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize newlines."""
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def combine_legal_texts(original: str | None, simplified: str | None) -> str:
    """
    Combine the original legal text and its simplified version into a
    single string for embedding. The simplified text helps retrieval for
    plain-language queries.
    """
    parts = []
    if original:
        parts.append(f"Legal Text: {original.strip()}")
    if simplified:
        parts.append(f"Simplified: {simplified.strip()}")
    return "\n\n".join(parts)


SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "sd": "Sindhi",
    "ks": "Kashmiri",
    "ne": "Nepali",
    "sa": "Sanskrit",
    "mai": "Maithili",
    "doi": "Dogri",
    "kok": "Konkani",
    "mni": "Manipuri",
    "sat": "Santali",
    "bo": "Bodo",
    "si": "Sindhi",
}


def language_name(code: str) -> str:
    """Return the human-readable name of a BCP-47 language code."""
    return SUPPORTED_LANGUAGES.get(code.lower(), code)


def build_context_string(chunks: list[dict]) -> str:
    """
    Format retrieved RAG chunks into a readable context block for the LLM.
    """
    if not chunks:
        return "No specific legal sections found in the knowledge base for this query."

    lines: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        act = chunk.get("act_name", "Unknown Act")
        sec = chunk.get("section_number", "")
        title = chunk.get("section_title", "")
        content = chunk.get("content", "")
        score = chunk.get("similarity_score", 0.0)

        header = f"[{i}] {act}"
        if sec:
            header += f", Section {sec}"
        if title:
            header += f" — {title}"
        header += f" (relevance: {score:.2f})"

        lines.append(header)
        lines.append(truncate_text(content, 800))
        lines.append("")

    return "\n".join(lines)
