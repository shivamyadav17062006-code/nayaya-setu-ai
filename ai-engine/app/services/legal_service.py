"""
app/services/legal_service.py — Retrieval across verified Indian provisions.

Primary path: semantic search over Supabase `legal_chunks` through the
`match_legal_chunks` pgvector RPC.
Fallback path: a small verified, in-process knowledge base so the API keeps
answering (with lower confidence) when Supabase is unreachable.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional

from app.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

# Verified baseline statutory provisions used when vector search is unavailable.
LEGAL_KNOWLEDGE_BASE = [
    {
        "act": "Payment of Wages Act",
        "year": 1936,
        "section": "Section 5",
        "title": "Time of payment of wages",
        "category": "LABOUR",
        "text": "Wages must be paid before the expiry of the 7th day (or 10th day if over 1000 employees) after the wage period ends.",
        "simplified": "Your employer cannot withhold salary past the 7th or 10th of the following month. Withholding pay beyond this is an actionable legal violation.",
        "remedy": "File a claim with the Labour Commissioner Authority under Section 15.",
    },
    {
        "act": "Payment of Wages Act",
        "year": 1936,
        "section": "Section 15",
        "title": "Claims arising out of deductions from wages or delay in payment",
        "category": "LABOUR",
        "text": "Where any deduction has been made from wages or payment has been delayed, the worker or trade union official may apply to the Authority for payment plus compensation up to ten times the withheld amount.",
        "simplified": "You can recover all unpaid wages along with statutory penalty compensation up to 10x the delayed amount through the Labour Court / Authority.",
        "remedy": "File an application before District Labour Court / DLSA.",
    },
    {
        "act": "Protection of Women from Domestic Violence Act",
        "year": 2005,
        "section": "Section 3",
        "title": "Definition of domestic violence",
        "category": "WOMEN_RIGHTS",
        "text": "Domestic violence includes physical abuse, sexual abuse, verbal and emotional abuse, and economic abuse (deprivation of financial resources).",
        "simplified": "Domestic violence covers physical harm, verbal abuse, threats, or depriving a woman of maintenance or financial support.",
        "remedy": "Call 112 / 181 or contact the District Protection Officer.",
    },
    {
        "act": "Protection of Women from Domestic Violence Act",
        "year": 2005,
        "section": "Section 12 & 18",
        "title": "Application to Magistrate and Protection Orders",
        "category": "WOMEN_RIGHTS",
        "text": "An aggrieved person or Protection Officer may apply to the Magistrate for Protection Orders prohibiting acts of domestic violence, entering the workplace, or alienating shared household assets.",
        "simplified": "The Magistrate can pass urgent interim orders barring the abuser from entering your residence or workplace within 3 days of complaint.",
        "remedy": "File an application under Section 12 before the Judicial Magistrate with free legal representation from DLSA.",
    },
    {
        "act": "Consumer Protection Act",
        "year": 2019,
        "section": "Section 35",
        "title": "Complaint to District Commission",
        "category": "CONSUMER",
        "text": "A complaint regarding defective goods, deficiency of service, unfair contract, or misleading advertisement may be filed before the District Commission electronically via e-Daakhil or physically.",
        "simplified": "You can file an official complaint against a seller or company online without a lawyer to get a refund, replacement, and compensation.",
        "remedy": "File online complaint on https://edaakhil.nic.in or National Consumer Helpline 1915.",
    },
    {
        "act": "Right of Children to Free and Compulsory Education Act",
        "year": 2009,
        "section": "Section 3 & 12",
        "title": "Right of child to free and compulsory education",
        "category": "CHILDREN",
        "text": "Every child between 6 to 14 years has the right to free education in a neighbourhood school, including a 25% quota in private unaided schools for economically weaker sections (EWS).",
        "simplified": "Every child aged 6-14 is guaranteed free schooling. Private schools must reserve 25% of seats for disadvantaged and EWS children.",
        "remedy": "Approach the District Education Officer (DEO) or State Commission for Protection of Child Rights.",
    },
    {
        "act": "Constitution of India",
        "year": 1950,
        "section": "Article 39A",
        "title": "Equal justice and free legal aid",
        "category": "CONSTITUTIONAL",
        "text": "The State shall secure that the operation of the legal system promotes justice on a basis of equal opportunity, and shall provide free legal aid by suitable legislation or schemes.",
        "simplified": "No citizen should be denied justice due to poverty. The government is constitutionally bound to provide free lawyers through NALSA.",
        "remedy": "Call NALSA National Legal Helpline at 15100.",
    },
]

# Intent → category names used in the Supabase right_categories table.
INTENT_TO_CATEGORIES: Dict[str, set[str]] = {
    "LABOUR": {"labour rights", "labour", "workers"},
    "WOMEN_RIGHTS": {"women rights", "women's rights", "women"},
    "CHILDREN": {"child rights", "children's rights", "children"},
    "CONSUMER": {"consumer rights", "consumer"},
    "PROPERTY": {"property rights", "property"},
    "CONSTITUTIONAL": {"constitutional rights", "constitutional"},
    "CRIMINAL": {"criminal law", "criminal"},
    "DISABILITY": {"disability rights", "disability"},
    "SENIOR_CITIZEN": {"senior citizen rights", "senior citizens", "senior citizen"},
    "TRIBAL": {"tribal rights", "tribal"},
}


STOPWORDS = {
    "the", "and", "for", "not", "has", "have", "with", "what", "can", "how",
    "are", "was", "were", "you", "your", "his", "her", "its", "from", "this",
    "that", "under", "about", "after", "before", "when", "who", "why", "will",
    "should", "would", "could", "does", "did", "been", "being", "they", "them",
    "there", "their", "our", "out", "get", "got", "any", "all", "more", "most",
    "some", "such", "into", "than", "then", "also", "now", "need", "want",
}


def _tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9\u0900-\u097F]+", text.lower())
        if len(token) > 2 and token not in STOPWORDS
    }


class LegalService:
    def __init__(self) -> None:
        self._client = None
        self._client_checked = False

    # ── Supabase client ───────────────────────────────────────────────────────
    def _supabase_client(self):
        if self._client_checked:
            return self._client

        self._client_checked = True
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not settings.SUPABASE_URL or not key:
            logger.info("Supabase credentials not set — vector retrieval disabled")
            return None

        try:
            from supabase import create_client  # type: ignore

            self._client = create_client(settings.SUPABASE_URL, key)
            logger.info("Supabase client ready for legal chunk retrieval")
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Supabase client initialization failed: %s", exc)

        return self._client

    @property
    def is_configured(self) -> bool:
        return self._supabase_client() is not None

    # ── Retrieval ─────────────────────────────────────────────────────────────
    async def retrieve(
        self,
        query: str,
        intent: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        limit = limit or settings.RAG_TOP_K

        try:
            vector_rows = await self._vector_search(query, limit)
            if vector_rows:
                return vector_rows
        except Exception as exc:
            logger.warning("Vector retrieval failed, using static knowledge base: %s", exc)

        return self._static_retrieve(query, intent, limit)

    async def semantic_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return await self.retrieve(query, limit=limit)

    async def _vector_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        client = self._supabase_client()
        if client is None:
            return []

        embedding = await embedding_service.embed_text(query)

        def _call():
            return client.rpc(
                "match_legal_chunks",
                {
                    "query_embedding": embedding,
                    "match_count": limit,
                    "min_similarity": settings.RAG_SIMILARITY_THRESHOLD,
                },
            ).execute()

        response = await asyncio.to_thread(_call)
        rows = response.data or []

        provisions = [self._row_to_provision(row) for row in rows]
        return [
            provision
            for provision in provisions
            if provision["similarity"] >= settings.RAG_SIMILARITY_THRESHOLD
        ]

    @staticmethod
    def _row_to_provision(row: Dict[str, Any]) -> Dict[str, Any]:
        categories = row.get("categories") or ""
        category = categories.split(",")[0].strip() if categories else ""
        content = row.get("content") or ""

        return {
            "chunk_id": row.get("id"),
            "section_id": row.get("section_id"),
            "act": row.get("act_title") or "Indian Statute",
            "year": row.get("act_year"),
            "section": row.get("section_number") or "Provision",
            "title": row.get("section_title") or "Statutory provision",
            "category": category,
            "text": content,
            "simplified": row.get("simplified_text") or content,
            "remedy": "Follow the complaint workflow for the authority named in the Act.",
            "source_url": row.get("source_url"),
            "similarity": float(row.get("similarity") or 0.0),
        }

    def _static_retrieve(
        self, query: str, intent: Optional[str], limit: int
    ) -> List[Dict[str, Any]]:
        categories = INTENT_TO_CATEGORIES.get(intent or "", set())
        intent_pool = [
            provision
            for provision in LEGAL_KNOWLEDGE_BASE
            if provision["category"].lower().replace("_", " ") in categories
        ]
        # When the classified intent has known provisions, never cite other
        # categories — that is how ungrounded citations leak in.
        pool = intent_pool or LEGAL_KNOWLEDGE_BASE
        query_tokens = _tokens(query)

        scored: List[tuple[float, Dict[str, Any]]] = []
        for provision in pool:
            relevance = 2.0 if provision in intent_pool else 0.0
            haystack = _tokens(
                f"{provision['act']} {provision['section']} {provision['title']} "
                f"{provision['text']} {provision['simplified']}"
            )
            relevance += len(query_tokens & haystack)
            scored.append((relevance, provision))

        scored.sort(key=lambda item: item[0], reverse=True)
        selected = [provision for score, provision in scored if score > 0][:limit]
        if not selected:
            selected = pool[:limit]

        return [
            {**provision, "section_id": None, "source_url": None, "similarity": 0.5}
            for provision in selected
        ]

    def get_provisions_by_intent(self, intent: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Synchronous static lookup, kept for callers that cannot await."""
        return self._static_retrieve("", intent, limit)

    # ── Ingestion ─────────────────────────────────────────────────────────────
    async def store_chunk(
        self,
        section_id: Optional[str],
        content: str,
        embedding: List[float],
        language: str = "en",
        source_url: Optional[str] = None,
        chunk_number: int = 1,
    ) -> bool:
        """Upsert a chunk + embedding into Supabase `legal_chunks`."""
        client = self._supabase_client()
        if client is None or not section_id:
            return False

        payload = {
            "section_id": section_id,
            "content": content,
            "chunk_number": chunk_number,
            "language": language,
            "source_url": source_url,
            "embedding": embedding,
        }

        def _call():
            return client.table("legal_chunks").upsert(
                payload, on_conflict="section_id,chunk_number,language"
            ).execute()

        try:
            await asyncio.to_thread(_call)
            return True
        except Exception as exc:
            logger.warning("Storing legal chunk failed: %s", exc)
            return False


legal_service = LegalService()
