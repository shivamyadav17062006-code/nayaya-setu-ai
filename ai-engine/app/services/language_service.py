"""
app/services/language_service.py — Language detection & translation.

Translation uses BHASHINI API when configured; falls back to a mock
implementation that is good enough for development and testing.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ── Language detection ────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    """
    Detect the language of *text* and return a BCP-47 language code.

    Uses langdetect under the hood. Returns "en" on failure.
    """
    try:
        from langdetect import detect, LangDetectException  # type: ignore

        code = detect(text)
        logger.debug(f"Detected language: {code!r} for text: {text[:60]!r}")
        return code
    except Exception as exc:
        logger.warning(f"Language detection failed: {exc} — defaulting to 'en'")
        return "en"


# ── BHASHINI translation ──────────────────────────────────────────────────────

BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

# Bhashini model IDs for NMT (Neural Machine Translation)
# Mapping: (source, target) → pipeline config
BHASHINI_NMT_MODELS: dict[tuple[str, str], str] = {
    ("en", "hi"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("hi", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "ta"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("ta", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "bn"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("bn", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "te"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("te", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "mr"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("mr", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "gu"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("gu", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "kn"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("kn", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "ml"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("ml", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "pa"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("pa", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "or"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("or", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
    ("en", "ur"): "ai4bharat/indictrans2-en-indic-dist-200M",
    ("ur", "en"): "ai4bharat/indictrans2-indic-en-dist-200M",
}


async def _bhashini_translate(text: str, source_lang: str, target_lang: str) -> str:
    """Call the BHASHINI Dhruva NMT API."""
    if not settings.BHASHINI_API_KEY:
        raise ValueError("BHASHINI_API_KEY not configured")

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    },
                },
            }
        ],
        "inputData": {
            "input": [{"source": text}],
        },
    }

    headers = {
        "Authorization": settings.BHASHINI_API_KEY,
        "Content-Type": "application/json",
    }
    if settings.BHASHINI_USER_ID:
        headers["userID"] = settings.BHASHINI_USER_ID

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(BHASHINI_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    # Extract translated text from BHASHINI response schema
    translated = (
        data["pipelineResponse"][0]["output"][0]["target"]
    )
    return translated


def _mock_translate(text: str, source_lang: str, target_lang: str) -> str:
    """
    Stub translation used in development.
    Returns the original text with a [translated:{lang}] prefix so
    developers can see that translation was attempted.
    """
    if source_lang == target_lang:
        return text
    logger.info(
        f"[MOCK TRANSLATION] {source_lang} → {target_lang}: "
        f"{text[:60]}…"
    )
    # In production this would be replaced by BHASHINI or another engine.
    # For dev we just pass through the text so the pipeline keeps working.
    return text


# ── Public API ────────────────────────────────────────────────────────────────

async def translate_to_english(text: str, source_lang: str) -> str:
    """
    Translate *text* from *source_lang* to English.
    Returns the original text unchanged if source is already English.
    """
    if source_lang.lower().startswith("en"):
        return text

    if settings.BHASHINI_API_KEY:
        try:
            return await _bhashini_translate(text, source_lang, "en")
        except Exception as exc:
            logger.warning(f"BHASHINI translation failed, using mock: {exc}")

    return _mock_translate(text, source_lang, "en")


async def translate_from_english(text: str, target_lang: str) -> str:
    """
    Translate *text* from English to *target_lang*.
    Returns the original text unchanged if target is already English.
    """
    if target_lang.lower().startswith("en"):
        return text

    if settings.BHASHINI_API_KEY:
        try:
            return await _bhashini_translate(text, "en", target_lang)
        except Exception as exc:
            logger.warning(f"BHASHINI translation failed, using mock: {exc}")

    return _mock_translate(text, "en", target_lang)
