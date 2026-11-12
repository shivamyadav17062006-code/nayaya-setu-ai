"""
app/services/intent_service.py — Legal intent classification.

Classifies a query into one of 10 legal categories using keyword
heuristics first (fast, offline), with an optional LLM fallback for
ambiguous cases.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ── Intent constants ──────────────────────────────────────────────────────────

class Intent:
    LABOUR = "LABOUR"
    WOMEN_RIGHTS = "WOMEN_RIGHTS"
    CHILDREN = "CHILDREN"
    CONSUMER = "CONSUMER"
    PROPERTY = "PROPERTY"
    CONSTITUTIONAL = "CONSTITUTIONAL"
    CRIMINAL = "CRIMINAL"
    DISABILITY = "DISABILITY"
    SENIOR_CITIZEN = "SENIOR_CITIZEN"
    GENERAL = "GENERAL"


@dataclass
class IntentResult:
    intent: str
    confidence: float
    reasoning: str


# ── Keyword rules ─────────────────────────────────────────────────────────────
# Each entry: (intent, keywords_list, weight)
# Score = sum(weight for each keyword found in query)

_KEYWORD_RULES: list[tuple[str, list[str], float]] = [
    # LABOUR
    (Intent.LABOUR, [
        "salary", "wage", "wages", "pay", "employer", "employee", "job",
        "workplace", "work", "labour", "labor", "pf", "provident fund", "epf",
        "esi", "gratuity", "minimum wage", "overtime", "fired", "dismissed",
        "retrenchment", "layoff", "trade union", "strike", "maternity leave",
        "factory", "contract worker", "bonded labour", "शर्मिक", "वेतन",
        "नौकरी", "मजदूर", "कर्मचारी",
    ], 1.0),

    # WOMEN_RIGHTS
    (Intent.WOMEN_RIGHTS, [
        "domestic violence", "dowry", "harassment", "sexual harassment",
        "posh", "rape", "assault", "stalking", "wife", "husband",
        "matrimonial", "divorce", "maintenance", "alimony", "gender",
        "woman", "women", "girl", "female", "she", "her",
        "mahila", "streedhan", "घरेलू हिंसा", "दहेज", "महिला",
    ], 1.2),

    # CHILDREN
    (Intent.CHILDREN, [
        "child", "children", "minor", "juvenile", "pocso", "rte",
        "right to education", "school", "child labour", "adoption",
        "custody", "guardian", "बच्चा", "बच्चे",
    ], 1.1),

    # CONSUMER
    (Intent.CONSUMER, [
        "consumer", "product", "defective", "refund", "complaint",
        "service", "ecommerce", "online shopping", "fraud", "cheated",
        "insurance", "bank", "credit card", "loan", "emi",
        "consumer forum", "consumer court", "unfair trade",
        "उपभोक्ता", "शिकायत", "धोखाधड़ी",
    ], 1.0),

    # PROPERTY
    (Intent.PROPERTY, [
        "land", "property", "plot", "house", "flat", "rent", "tenant",
        "landlord", "eviction", "inheritance", "will", "succession",
        "registry", "mutation", "title deed", "lease", "encroachment",
        "zameen", "makaan", "किरायेदार", "संपत्ति", "भूमि",
    ], 1.0),

    # CONSTITUTIONAL
    (Intent.CONSTITUTIONAL, [
        "fundamental right", "right to information", "rti", "constitution",
        "discrimination", "reservation", "caste", "equality", "liberty",
        "freedom", "article 14", "article 19", "article 21", "article 32",
        "writ", "habeas corpus", "public interest litigation", "pil",
        "मौलिक अधिकार", "संविधान",
    ], 1.1),

    # CRIMINAL
    (Intent.CRIMINAL, [
        "fir", "first information report", "police", "arrest", "bail",
        "criminal", "crime", "ipc", "offence", "murder", "theft",
        "robbery", "extortion", "cheating", "forgery", "bribe",
        "corruption", "chargesheet", "custody", "prison", "jail",
        "advocate", "lawyer", "legal aid",
        "एफआईआर", "गिरफ्तारी", "जमानत", "पुलिस",
    ], 1.0),

    # DISABILITY
    (Intent.DISABILITY, [
        "disability", "disabled", "handicap", "differently abled",
        "rpwd", "rights of persons with disabilities",
        "divyang", "wheelchair", "deaf", "blind", "specially abled",
    ], 1.3),

    # SENIOR_CITIZEN
    (Intent.SENIOR_CITIZEN, [
        "senior citizen", "elderly", "old age", "parent", "maintenance",
        "pension", "elder", "aged", "वृद्ध", "वरिष्ठ नागरिक",
    ], 1.2),
]


def _keyword_score(text: str, keywords: list[str]) -> float:
    text_lower = text.lower()
    score = 0.0
    for kw in keywords:
        if re.search(r"\b" + re.escape(kw.lower()) + r"\b", text_lower):
            score += 1.0
    return score


def _classify_by_keywords(query: str) -> IntentResult:
    """Fast keyword-based classification."""
    scores: dict[str, float] = {}
    for intent, keywords, weight in _KEYWORD_RULES:
        raw = _keyword_score(query, keywords)
        if raw > 0:
            scores[intent] = scores.get(intent, 0.0) + raw * weight

    if not scores:
        return IntentResult(intent=Intent.GENERAL, confidence=0.5, reasoning="No keywords matched")

    best_intent = max(scores, key=lambda k: scores[k])
    total_score = sum(scores.values())
    confidence = min(scores[best_intent] / max(total_score, 1.0), 1.0)
    # Boost confidence if the best is clearly dominant
    if scores[best_intent] >= 2.0:
        confidence = min(confidence + 0.2, 1.0)

    reasoning = f"Keyword match — scores: {scores}"
    return IntentResult(intent=best_intent, confidence=confidence, reasoning=reasoning)


async def _classify_by_llm(query: str) -> Optional[IntentResult]:
    """Optional LLM-based classification for low-confidence keyword results."""
    from app.utils.prompts import INTENT_CLASSIFICATION_PROMPT
    from app.services.llm_service import llm_service

    prompt = INTENT_CLASSIFICATION_PROMPT.format(query=query)
    try:
        raw = await llm_service.generate_raw(prompt)
        # Extract JSON block from the response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return IntentResult(
                intent=data.get("intent", Intent.GENERAL).upper(),
                confidence=float(data.get("confidence", 0.7)),
                reasoning=data.get("reasoning", "LLM classification"),
            )
    except Exception as exc:
        logger.warning(f"LLM intent classification failed: {exc}")
    return None


async def classify_intent(
    query: str,
    use_llm_fallback: bool = True,
    llm_confidence_threshold: float = 0.5,
) -> IntentResult:
    """
    Classify the legal intent of *query*.

    1. Try keyword heuristics.
    2. If confidence < threshold AND LLM is available, use LLM.
    3. Return the best result.
    """
    result = _classify_by_keywords(query)
    logger.debug(f"Keyword intent: {result.intent} ({result.confidence:.2f})")

    if (
        use_llm_fallback
        and result.confidence < llm_confidence_threshold
        and settings.LLM_PROVIDER != "mock"
    ):
        llm_result = await _classify_by_llm(query)
        if llm_result and llm_result.confidence > result.confidence:
            logger.debug(f"LLM intent override: {llm_result.intent} ({llm_result.confidence:.2f})")
            return llm_result

    return result
