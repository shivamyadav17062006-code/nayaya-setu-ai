import { classifyIntent, GoalType } from './intentService.js';
import { detectLanguage, SUPPORTED_LANGUAGES } from './languageService.js';
import { normalizeQuery } from './queryNormalizer.js';
import { embeddingService } from './embeddingService.js';
import { legalService } from './legalService.js';
import { citationValidator } from './citationValidator.js';
import { providerManager } from '../providers/providerManager.js';
import { buildSystemPrompt, formatUntrustedContext, NEXT_STEPS_BY_INTENT } from '../utils/prompts.js';
import { env } from '../config/env.js';

export class RAGService {
  /**
   * Complete 10-Step Retrieval Augmented Generation Pipeline:
   *
   * 1. Language Detection (languageService.js)
   * 2. Legal Intent & Goal Detection (intentService.js)
   * 3. Question Normalization (queryNormalizer.js)
   * 4. Embedding Generation (embeddingService.js)
   * 5. Supabase Vector Search (match_legal_chunks pgvector)
   * 6. Legal Document Retrieval (metadata filters, acts, sections)
   * 7. Relevance Ranking & Deduplication (hybrid vector + lexical)
   * 8. Verified Legal Context (isolated untrusted data block)
   * 9. Gemini Generation (dedicated scenario prompt templates)
   * 10. Citation Validation & Final Packaging (citationValidator.js)
   */
  async query({ message, language = 'en', intent = null, session_id = null }) {
    const startTime = Date.now();

    // ------------------------------------------------------------------------
    // Step 1: Language Detection
    // ------------------------------------------------------------------------
    let userLang = language || 'en';
    if (!language || userLang === 'en') {
      const detected = detectLanguage(message);
      if (SUPPORTED_LANGUAGES[detected.code]) {
        userLang = detected.code;
      }
    }
    const langName = SUPPORTED_LANGUAGES[userLang]?.name || 'English';

    // ------------------------------------------------------------------------
    // Step 2: Legal Intent & Goal Detection
    // ------------------------------------------------------------------------
    const classification = classifyIntent(message);
    const classifiedIntent = intent || classification.intent || 'GENERAL';
    const goalType = classification.goal || GoalType.GENERAL_EXPLANATION;

    // ------------------------------------------------------------------------
    // Step 3: Question Normalization & Keyword Expansion
    // ------------------------------------------------------------------------
    const normalized = normalizeQuery(message);
    const searchQuery = normalized.expanded || normalized.normalized || message;

    // ------------------------------------------------------------------------
    // Step 4: Embedding Generation (Consistent 384 dimensions)
    // ------------------------------------------------------------------------
    let queryEmbedding = null;
    try {
      queryEmbedding = await embeddingService.embedText(searchQuery);
    } catch (err) {
      console.warn('[RAGService] Embedding generation fallback:', err.message);
    }

    // ------------------------------------------------------------------------
    // Step 5 & 6 & 7: Supabase Vector Search, Document Retrieval & Ranking
    // ------------------------------------------------------------------------
    const retrievedProvisions = await legalService.retrieve(
      searchQuery,
      classifiedIntent,
      env.ragTopK || 4,
      queryEmbedding
    );

    // ------------------------------------------------------------------------
    // Step 8: Verified Legal Context (Structured & Untrusted Isolation)
    // ------------------------------------------------------------------------
    const contextStr = formatUntrustedContext(retrievedProvisions);

    // ------------------------------------------------------------------------
    // Step 9: Gemini Generation with Dedicated Scenario Prompt
    // ------------------------------------------------------------------------
    const systemPrompt = buildSystemPrompt(langName, goalType);

    const userPrompt = `${contextStr}

---
CITIZEN QUESTION:
"${message}"

Provide a compassionate, grounded explanation adhering strictly to the <retrieved_legal_context> above.`;

    const genResult = await providerManager.generateContent({
      systemPrompt,
      userPrompt,
      language: userLang,
      intent: classifiedIntent,
      question: message,
    });

    // ------------------------------------------------------------------------
    // Step 10: Citation Validation & Final Answer Packaging
    // ------------------------------------------------------------------------
    const validationResult = citationValidator.validateCitations(
      retrievedProvisions,
      genResult.answer,
      message
    );

    // Sanitize response to prevent fabricated section references
    const sanitizedAnswer = citationValidator.sanitizeResponseText(
      genResult.answer,
      validationResult.citations
    );

    const nextSteps = NEXT_STEPS_BY_INTENT[classifiedIntent] || NEXT_STEPS_BY_INTENT.GENERAL;
    const processingTimeMs = Date.now() - startTime;

    return {
      answer: sanitizedAnswer,
      language: userLang,
      intent: classifiedIntent,
      goal: goalType,
      citations: validationResult.citations,
      reliableSourceAvailable: validationResult.reliableSourceAvailable,
      next_steps: nextSteps,
      legal_aid_suggested: true,
      session_id,
      degraded: genResult.degraded,
      warning: genResult.warning,
      engine: genResult.provider,
      processing_time_ms: processingTimeMs,
      normalized_query: normalized.normalized,
      retrieval_count: retrievedProvisions.length,
    };
  }
}

export const ragService = new RAGService();
export default ragService;
