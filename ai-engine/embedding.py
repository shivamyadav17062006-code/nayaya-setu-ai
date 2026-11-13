"""
ai-engine/embedding.py — Backfill pgvector embeddings for verified legal sections.

Reads `legal_sections` (already seeded by supabase/schema.sql), embeds each
provision with the multilingual MiniLM model, and upserts one row per
(section_id, chunk_number, language) into `legal_chunks`.

Run from the ai-engine directory:

    python embedding.py            # embed every section
    python embedding.py --force    # re-embed sections that already have chunks
"""

import argparse
import asyncio
import logging
from typing import Any

from app.config import settings
from app.services.embedding_service import embedding_service
from app.services.legal_service import legal_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("nyayasaathi.embed")

MAX_CHUNK_CHARS = 1200
LANGUAGE = "en"


def chunk_text(text: str) -> list[str]:
    """Split long statutory text into paragraph-sized chunks."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs or [text]:
        if len(current) + len(paragraph) + 2 <= MAX_CHUNK_CHARS:
            current = f"{current}\n\n{paragraph}".strip()
            continue
        if current:
            chunks.append(current)
        current = paragraph[:MAX_CHUNK_CHARS]

    if current:
        chunks.append(current)
    return chunks or [text[:MAX_CHUNK_CHARS]]


def section_to_text(section: dict[str, Any]) -> str:
    act = section.get("legal_acts") or {}
    categories = [
        (row.get("right_categories") or {}).get("name")
        for row in section.get("section_categories") or []
    ]
    header = ", ".join(
        part
        for part in [
            act.get("title"),
            section.get("section_number"),
            section.get("section_title"),
            " / ".join(filter(None, categories)) or None,
        ]
        if part
    )
    body = section.get("simplified_text") or section.get("original_text") or ""
    return f"{header}\n\n{body}".strip()


async def fetch_sections(client, force: bool) -> list[dict[str, Any]]:
    def _call():
        query = client.table("legal_sections").select(
            "id, section_number, section_title, original_text, simplified_text, "
            "legal_acts(title, year, source_url), "
            "section_categories(right_categories(name))"
        )
        return query.execute()

    response = await asyncio.to_thread(_call)
    sections = response.data or []

    if force:
        return sections

    def _existing():
        return client.table("legal_chunks").select("section_id").execute()

    existing_response = await asyncio.to_thread(_existing)
    embedded = {row["section_id"] for row in existing_response.data or []}
    return [section for section in sections if section["id"] not in embedded]


async def run(force: bool) -> None:
    client = legal_service._supabase_client()
    if client is None:
        logger.error(
            "Supabase is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in ai-engine/.env first."
        )
        return

    sections = await fetch_sections(client, force)
    if not sections:
        logger.info("No legal sections need embedding. Use --force to re-embed.")
        return

    logger.info("Embedding %d sections with %s", len(sections), settings.EMBEDDING_MODEL)

    stored = 0
    for section in sections:
        act = section.get("legal_acts") or {}
        chunks = chunk_text(section_to_text(section))

        for index, chunk in enumerate(chunks, start=1):
            vector = await embedding_service.embed_text(chunk)
            ok = await legal_service.store_chunk(
                section_id=section["id"],
                content=chunk,
                embedding=vector,
                language=LANGUAGE,
                source_url=act.get("source_url"),
                chunk_number=index,
            )
            if ok:
                stored += 1
                logger.info(
                    "Stored chunk %d/%d for %s %s",
                    index,
                    len(chunks),
                    act.get("title", "Act"),
                    section.get("section_number", ""),
                )
            else:
                logger.warning(
                    "Failed to store chunk %d for section %s", index, section["id"]
                )

    logger.info("Done — %d chunks stored in Supabase legal_chunks", stored)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill legal_chunks embeddings")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-embed sections that already have chunks",
    )
    args = parser.parse_args()
    asyncio.run(run(args.force))
