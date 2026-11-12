"""
app/routers/query.py — Main RAG chat endpoint.
"""

from fastapi import APIRouter, HTTPException
from app.schemas import QueryRequest, QueryResponse
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_endpoint(payload: QueryRequest):
    try:
        response = await rag_service.query(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
