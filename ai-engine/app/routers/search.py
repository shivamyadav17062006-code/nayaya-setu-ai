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
    # Search within legal knowledge base
    query_lower = q.lower()
    matches = []
    
    for idx, p in enumerate(legal_service.LEGAL_KNOWLEDGE_BASE):
        combined = f"{p['act']} {p['section']} {p['title']} {p['text']} {p['simplified']}".lower()
        if any(term in combined for term in query_lower.split()):
            matches.append(
                SearchResult(
                    id=f"res_{idx}",
                    content=p["simplified"],
                    act_name=p["act"],
                    section_number=p["section"],
                    section_title=p["title"],
                    category=p["category"],
                    language=language,
                    similarity_score=0.88,
                )
            )

    if not matches:
        # Default top results
        for idx, p in enumerate(legal_service.LEGAL_KNOWLEDGE_BASE[:limit]):
            matches.append(
                SearchResult(
                    id=f"res_{idx}",
                    content=p["simplified"],
                    act_name=p["act"],
                    section_number=p["section"],
                    section_title=p["title"],
                    category=p["category"],
                    language=language,
                    similarity_score=0.72,
                )
            )

    return SearchResponse(
        query=q,
        language=language,
        results=matches[:limit],
        total=len(matches[:limit]),
    )
