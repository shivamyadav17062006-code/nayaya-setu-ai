"""
app/services/rag_service.py — Retrieval-Augmented Generation pipeline.
"""

import time

from app.config import settings
from app.schemas import QueryRequest, QueryResponse, Citation
from app.services.intent_service import classify_intent
from app.services.language_service import detect_language
from app.services.legal_service import legal_service
from app.services.llm_service import llm_service
from app.utils.prompts import DISCLAIMER, LEGAL_SYSTEM_PROMPT, LEGAL_USER_PROMPT

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
}

NEXT_STEPS_BY_INTENT = {
    "LABOUR": [
        "Compile evidence: salary slips, bank statements, appointment letters, and chat records",
        "Serve a formal demand notice or email giving 7 days to clear pending wages",
        "Lodge an online complaint on the Shram Suvidha / SAMADHAN portal",
        "Approach the District Labour Commissioner or DLSA (15100) for free legal representation",
    ],
    "WOMEN_RIGHTS": [
        "Call 112 (Emergency Police) or 181 (Women in Distress Helpline)",
        "Contact your local Protection Officer or One Stop Centre",
        "Submit a Domestic Incident Report (DIR) to seek protection and residence orders",
        "Apply for free legal aid through the District Legal Services Authority (DLSA)",
    ],
    "CONSUMER": [
        "Save purchase invoices, receipts, warranties, and correspondence with the seller",
        "File an online grievance on the National Consumer Helpline (1915 or consumerhelpline.gov.in)",
        "If unresolved in 15 days, file an e-complaint on e-Daakhil (edaakhil.nic.in) for refund and compensation",
    ],
    "CHILDREN": [
        "Collect school records and any written communication regarding admission or fees",
        "Approach the District Education Officer for RTE admissions",
        "Contact the State Commission for Protection of Child Rights for serious violations",
    ],
    "CRIMINAL": [
        "Record the facts, dates, and names of officials involved",
        "Request the grounds of arrest and inform a family member or lawyer",
        "Approach the nearest DLSA or call 15100 for free legal representation",
    ],
    "GENERAL": [
        "Identify the exact legal provision that applies to your situation",
        "Gather documentation and proof of the incident or dispute",
        "Contact NALSA National Legal Helpline 15100 to check your free lawyer eligibility",
    ],
}

class RAGService:
    async def query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()

        # 1. Resolve the response language. English input may actually be
        #    Hindi/Marathi/etc. typed in a native script.
        user_lang = request.language or "en"
        if user_lang == "en":
            detected = detect_language(request.message)
            if detected in LANGUAGE_NAMES:
                user_lang = detected

        # 2. Classify legal intent
        intent = request.intent or (await classify_intent(request.message)).intent

        # 3. Retrieve verified provisions (pgvector RPC, static fallback)
        provisions = await legal_service.retrieve(
            request.message, intent=intent, limit=settings.RAG_TOP_K
        )
        context_str = "\n\n".join(
            f"Act: {p['act']} ({p.get('year') or 'n/a'}), {p['section']}: {p['title']}\n"
            f"Statutory text: {p['text']}\n"
            f"Simplified meaning: {p['simplified']}\n"
            f"Remedy: {p['remedy']}"
            for p in provisions
        )

        # 4. Generate the grounded answer
        system_prompt = LEGAL_SYSTEM_PROMPT.format(
            language=LANGUAGE_NAMES.get(user_lang, "English"),
            disclaimer=DISCLAIMER,
        )
        user_prompt = LEGAL_USER_PROMPT.format(context=context_str, question=request.message)

        answer = await llm_service.generate_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            language=user_lang,
            intent=intent,
            question=request.message,
        )

        # 5. Citations and actionable next steps
        citations = [
            Citation(
                act=p["act"],
                section=p["section"],
                year=p.get("year"),
                relevance=p.get("simplified"),
                source_url=p.get("source_url"),
            )
            for p in provisions
        ]
        next_steps = NEXT_STEPS_BY_INTENT.get(intent, NEXT_STEPS_BY_INTENT["GENERAL"])

        elapsed_ms = int((time.time() - start_time) * 1000)

        return QueryResponse(
            answer=answer,
            language=user_lang,
            intent=intent,
            citations=citations,
            next_steps=next_steps,
            legal_aid_suggested=True,
            session_id=request.session_id,
            processing_time_ms=elapsed_ms,
        )

rag_service = RAGService()
