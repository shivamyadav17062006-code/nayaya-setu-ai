"""
app/services/rag_service.py — Retrieval-Augmented Generation pipeline.
"""

import time
from typing import Optional
from app.schemas import QueryRequest, QueryResponse, Citation
from app.services.intent_service import intent_service
from app.services.language_service import language_service
from app.services.legal_service import legal_service
from app.services.llm_service import llm_service
from app.utils.prompts import build_prompt

class RAGService:
    async def query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()

        # 1. Detect language
        user_lang = request.language
        if not user_lang or user_lang == "en":
            detected = language_service.detect_language(request.message)
            if detected:
                user_lang = detected

        # 2. Classify legal intent
        intent = request.intent
        if not intent:
            intent_result = intent_service.classify(request.message)
            intent = intent_result.get("intent", "GENERAL")

        # 3. Retrieve verified legal context
        provisions = legal_service.get_provisions_by_intent(intent, limit=3)
        context_str = "\n\n".join([
            f"Act: {p['act']} ({p['year']}), {p['section']}: {p['title']}\n"
            f"Statutory text: {p['text']}\n"
            f"Simplified meaning: {p['simplified']}\n"
            f"Remedy: {p['remedy']}"
            for p in provisions
        ])

        # 4. Generate answer via LLM
        prompt = build_prompt(
            user_message=request.message,
            context=context_str,
            language=user_lang,
            intent=intent,
        )

        answer = await llm_service.generate(prompt=prompt, language=user_lang, intent=intent)

        # 5. Extract citations and actionable steps
        citations = [
            Citation(
                act=p["act"],
                section=p["section"],
                year=p["year"],
                relevance=p["simplified"],
            )
            for p in provisions
        ]

        # Determine next steps based on intent
        if intent == "LABOUR":
            next_steps = [
                "Compile evidence: salary slips, bank statements, appointment letters, and chat records",
                "Serve a formal demand notice or email giving 7 days to clear pending wages",
                "Lodge an online complaint on the Shram Suvidha portal (shramsuvidha.gov.in)",
                "Approach the District Labour Commissioner or contact DLSA (15100) for free legal representation",
            ]
        elif intent == "WOMEN_RIGHTS":
            next_steps = [
                "Call 112 (Emergency Police) or 181 (Women in Distress Helpline)",
                "Contact your local Protection Officer (PO) or One Stop Centre (OSC)",
                "Submit a Domestic Incident Report (DIR) to seek urgent protection and residence orders",
                "Apply for free legal aid through the District Legal Services Authority (DLSA)",
            ]
        elif intent == "CONSUMER":
            next_steps = [
                "Save purchase invoices, receipts, warranties, and communication with customer support",
                "File an online grievance on National Consumer Helpline (1915 or consumerhelpline.gov.in)",
                "If unresolved in 15 days, lodge an e-complaint on e-Daakhil (edaakhil.nic.in) for refund and compensation",
            ]
        else:
            next_steps = [
                "Identify the exact legal provision that applies to your situation",
                "Gather documentation and proof of incident or dispute",
                "Contact NALSA National Legal Helpline 15100 to check your free lawyer eligibility",
            ]

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
