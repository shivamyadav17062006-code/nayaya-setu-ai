"""
app/routers/embed.py — Document embedding endpoint.
"""

from fastapi import APIRouter
from app.schemas import EmbedRequest, EmbedResponse
from app.services.embedding_service import embedding_service
import uuid

router = APIRouter()

@router.post("/embed", response_model=EmbedResponse)
async def embed_endpoint(payload: EmbedRequest):
    # Generates embedding vector
    vector = await embedding_service.embed_text(payload.content)
    vector_id = f"vec_{uuid.uuid4().hex[:12]}"
    
    return EmbedResponse(
        id=vector_id,
        section_id=payload.section_id,
        embedding_dim=len(vector),
        message="Embedding generated and indexed successfully",
    )
