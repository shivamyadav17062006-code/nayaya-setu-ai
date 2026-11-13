"""
app/routers/embed.py — Embed and index a legal chunk into Supabase.
"""

import uuid

from fastapi import APIRouter

from app.schemas import EmbedRequest, EmbedResponse
from app.services.embedding_service import embedding_service
from app.services.legal_service import legal_service

router = APIRouter()


@router.post("/embed", response_model=EmbedResponse)
async def embed_endpoint(payload: EmbedRequest):
    vector = await embedding_service.embed_text(payload.content)

    source_url = (payload.metadata or {}).get("source_url")
    stored = await legal_service.store_chunk(
        section_id=payload.section_id,
        content=payload.content,
        embedding=vector,
        language=payload.language,
        source_url=source_url,
    )

    return EmbedResponse(
        id=f"vec_{uuid.uuid4().hex[:12]}",
        section_id=payload.section_id,
        embedding_dim=len(vector),
        stored=stored,
        message=(
            "Embedding generated and indexed in Supabase"
            if stored
            else "Embedding generated but not stored (Supabase unavailable or section_id missing)"
        ),
    )
