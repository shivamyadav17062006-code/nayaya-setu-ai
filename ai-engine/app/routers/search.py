"""
app/routers/search.py — Semantic search across legal provisions.
"""

from fastapi import APIRouter, Query
from app.schemas import SearchResponse, SearchResult
from app.services.legal_service import legal_service

router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search_endpoint(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(5, ge=1, le=20),
    language: str = Query("en"),
):
    provisions = await legal_service.semantic_search(q, limit=limit)

    results = [
        SearchResult(
            id=str(provision.get("chunk_id") or f"res_{index}"),
            section_id=provision.get("section_id"),
            content=provision.get("simplified") or provision.get("text") or "",
            act_name=provision.get("act"),
            section_number=provision.get("section"),
            section_title=provision.get("title"),
            category=provision.get("category") or None,
            language=language,
            similarity_score=min(max(float(provision.get("similarity") or 0.0), 0.0), 1.0),
        )
        for index, provision in enumerate(provisions)
    ]

    return SearchResponse(
        query=q,
        language=language,
        results=results,
        total=len(results),
    )
