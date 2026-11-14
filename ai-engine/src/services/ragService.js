import { classifyIntent } from './intentService.js';
import { detectLanguage, SUPPORTED_LANGUAGES } from './languageService.js';
import { legalService } from './legalService.js';
import { providerManager } from '../providers/providerManager.js';
import { buildSystemPrompt, NEXT_STEPS_BY_INTENT } from '../utils/prompts.js';
import { env } from '../config/env.js';

export class RAGService {
  /**
   * Main RAG query workflow:
   * 1. Detect language (or use specified ISO code)
   * 2. Classify legal intent
   * 3. Retrieve statutory chunks via pgvector / legalService
   * 4. Synthesize grounded answer via providerManager (Gemini with fallback to Mock)
   * 5. Extract genuine statutory citations and next steps
   */
  async query({ message, language = 'en', intent = null, session_id = null }) {
    const startTime = Date.now();

    // 1. Language detection
    let userLang = language || 'en';
    if (!language || userLang === 'en') {
      const detected = detectLanguage(message);
      if (SUPPORTED_LANGUAGES[detected.code]) {
        userLang = detected.code;
      }
    }
    const langName = SUPPORTED_LANGUAGES[userLang]?.name || 'English';

    // 2. Intent classification
    let classifiedIntent = intent;
    if (!classifiedIntent) {
      const classification = await classifyIntent(message);
      classifiedIntent = classification.intent || 'GENERAL';
    }

    // 3. Statutory Retrieval (Supabase pgvector)
    const provisions = await legalService.retrieve(message, classifiedIntent, env.ragTopK);

    const contextStr = provisions
      .map(
        (p) =>
          `Act: ${p.act} (${p.year || 'n/a'})\n` +
          `Section: ${p.section} — ${p.title}\n` +
          `Statutory text: ${p.text}\n` +
          `Simplified explanation: ${p.simplified}\n` +
          `Legal Remedy: ${p.remedy || 'Approaching designated Authority / DLSA'}\n` +
          `Official Link: ${p.source_url || 'https://indiacode.nic.in'}`
      )
      .join('\n\n---\n\n');

    // 4. Prompt synthesis with strict zero-hallucination constraint
    const systemPrompt = buildSystemPrompt(langName);

    const userPrompt = `CONTEXT (Verified Indian statutory provisions retrieved for this query):
${contextStr || 'No specific section match found in database. Rely strictly on general Indian constitutional rights under Article 39A and Legal Services Authorities Act, 1987.'}

---
CITIZEN INQUIRY: "${message}"

Please provide a compassionate, grounded explanation based strictly on the statutory CONTEXT above.`;

    // 5. Generate Response via Provider Manager
    const genResult = await providerManager.generateContent({
      systemPrompt,
      userPrompt,
      language: userLang,
      intent: classifiedIntent,
      question: message,
    });

    // 6. Assemble verified citations (never fabricated)
    const citations = provisions.map((p) => ({
      act: p.act,
      section: p.section,
      year: p.year || null,
      title: p.title || p.section,
      relevance: p.simplified || p.text,
      source_url: p.source_url || 'https://www.indiacode.nic.in',
    }));

    // If no context matched, provide verified Article 39A baseline
    const verifiedSources = citations.length > 0 ? citations : [
      {
        act: 'Constitution of India',
        section: 'Article 39A',
        year: 1950,
        title: 'Equal justice and free legal aid',
        relevance: 'Mandates the State to ensure justice is not denied to any citizen by reason of economic or other disabilities.',
        source_url: 'https://legislative.gov.in/constitution-of-india',
      },
      {
        act: 'Legal Services Authorities Act',
        section: 'Section 12',
        year: 1987,
        title: 'Criteria for giving legal services',
        relevance: 'Statutory entitlement to free court advocates for women, children, workers, and vulnerable groups.',
        source_url: 'https://nalsa.gov.in',
      },
    ];

    const nextSteps = NEXT_STEPS_BY_INTENT[classifiedIntent] || NEXT_STEPS_BY_INTENT.GENERAL;
    const processingTimeMs = Date.now() - startTime;

    return {
      answer: genResult.answer,
      language: userLang,
      intent: classifiedIntent,
      citations: verifiedSources,
      next_steps: nextSteps,
      legal_aid_suggested: true,
      session_id,
      degraded: genResult.degraded,
      warning: genResult.warning,
      engine: genResult.provider,
      processing_time_ms: processingTimeMs,
    };
  }
}

export const ragService = new RAGService();
export default ragService;
