import { classifyIntent } from './intentService.js';
import { detectLanguage, SUPPORTED_LANGUAGES } from './languageService.js';
import { legalService } from './legalService.js';
import { llmService } from './llmService.js';
import { config } from '../config.js';

const DISCLAIMER =
  'This is legal awareness information, not formal legal advice. For personalized counsel or court representation, contact a qualified lawyer or NALSA (Helpline 15100).';

const NEXT_STEPS_BY_INTENT = {
  LABOUR: [
    'Compile evidence: salary slips, bank statements, appointment letters, and chat records',
    'Serve a formal demand notice or email giving 7 days to clear pending wages',
    'Lodge an online complaint on the Shram Suvidha / SAMADHAN portal',
    'Approach the District Labour Commissioner or DLSA (15100) for free legal representation',
  ],
  WOMEN_RIGHTS: [
    'Call 112 (Emergency Police) or 181 (Women in Distress Helpline)',
    'Contact your local Protection Officer or One Stop Centre',
    'Submit a Domestic Incident Report (DIR) to seek protection and residence orders',
    'Apply for free legal aid through the District Legal Services Authority (DLSA)',
  ],
  CONSUMER: [
    'Save purchase invoices, receipts, warranties, and correspondence with the seller',
    'File an online grievance on the National Consumer Helpline (1915 or consumerhelpline.gov.in)',
    'If unresolved in 15 days, file an e-complaint on e-Daakhil (edaakhil.nic.in) for refund and compensation',
  ],
  CHILDREN: [
    'Collect school records and any written communication regarding admission or fees',
    'Approach the District Education Officer for RTE admissions',
    'Contact the State Commission for Protection of Child Rights for serious violations',
  ],
  CRIMINAL: [
    'Record the facts, dates, and names of officials involved',
    'Request the grounds of arrest and inform a family member or lawyer',
    'Approach the nearest DLSA or call 15100 for free legal representation',
  ],
  PROPERTY: [
    'Verify property registration documents at the local Sub-Registrar office',
    'For tenancy disputes, approach the local Rent Controller / Civil Court',
    'Consult your District Legal Services Authority (DLSA) for dispute mediation',
  ],
  CONSTITUTIONAL: [
    'For RTI queries, file an application on the RTI Online portal (rtionline.gov.in)',
    'For civil liberties violations, approach the State or National Human Rights Commission',
    'Seek pro bono legal aid from NALSA at 15100',
  ],
  GENERAL: [
    'Identify the exact legal provision that applies to your situation',
    'Gather documentation and proof of the incident or dispute',
    'Contact NALSA National Legal Helpline 15100 to check your free lawyer eligibility',
  ],
};

export class RAGService {
  async query({ message, language = 'en', intent = null, session_id = null }) {
    const startTime = Date.now();

    // 1. Language detection
    let userLang = language || 'en';
    if (userLang === 'en') {
      const detected = detectLanguage(message);
      if (SUPPORTED_LANGUAGES[detected]) {
        userLang = detected;
      }
    }
    const langName = SUPPORTED_LANGUAGES[userLang]?.name || 'English';

    // 2. Intent classification
    let classifiedIntent = intent;
    if (!classifiedIntent) {
      const classification = await classifyIntent(message);
      classifiedIntent = classification.intent || 'GENERAL';
    }

    // 3. Retrieval
    const provisions = await legalService.retrieve(message, classifiedIntent, config.ragTopK);

    const contextStr = provisions
      .map(
        (p) =>
          `Act: ${p.act} (${p.year || 'n/a'}), ${p.section}: ${p.title}\n` +
          `Statutory text: ${p.text}\n` +
          `Simplified meaning: ${p.simplified}\n` +
          `Remedy: ${p.remedy}`
      )
      .join('\n\n');

    // 4. Prompt synthesis
    const systemPrompt = `You are NyayaSaathi (न्यायसाथी), an AI legal awareness assistant for Indian citizens.
Answer in ${langName}.
Strict rules:
1. NEVER invent or fabricate legal sections, act names, or citations.
2. ONLY cite laws present in the CONTEXT below.
3. This is legal awareness, not formal legal advice.
4. Structure your response clearly with: **Your Rights**, **Relevant Law**, **What You Can Do**, and **Where to Get Help** (NALSA Helpline 15100).
5. Include the disclaimer at the bottom: "${DISCLAIMER}"`;

    const userPrompt = `CONTEXT (Indian legal sections relevant to this query):
${contextStr}

---
USER QUESTION: ${message}

Please answer based strictly on the CONTEXT provided above.`;

    const answer = await llmService.generateResponse({
      systemPrompt,
      userPrompt,
      language: userLang,
      intent: classifiedIntent,
      question: message,
    });

    // 5. Citations and steps
    const citations = provisions.map((p) => ({
      act: p.act,
      section: p.section,
      year: p.year || null,
      relevance: p.simplified || p.text,
      source_url: p.source_url || null,
    }));

    const nextSteps =
      NEXT_STEPS_BY_INTENT[classifiedIntent] || NEXT_STEPS_BY_INTENT.GENERAL;

    const processingTimeMs = Date.now() - startTime;

    return {
      answer,
      language: userLang,
      intent: classifiedIntent,
      citations,
      next_steps: nextSteps,
      legal_aid_suggested: true,
      session_id,
      processing_time_ms: processingTimeMs,
    };
  }
}

export const ragService = new RAGService();
