import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

function sanitizeApiKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('your-') ||
    trimmed.startsWith('[YOUR-') ||
    trimmed.startsWith('<') ||
    trimmed === 'your-gemini-api-key' ||
    trimmed.length < 15
  ) {
    return null;
  }
  return trimmed;
}

const rawGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_API_KEY = sanitizeApiKey(rawGeminiKey);
export const isGeminiConfigured = Boolean(GEMINI_API_KEY);

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Baseline Indian Law Knowledge Context for RAG Prompt Grounding
const INDIAN_LEGAL_KNOWLEDGE = `
[Statutory Knowledge Base - India]:
1. Labour & Wages:
- Payment of Wages Act, 1936, Section 5: Wages must be paid on or before the 7th day of the following month (10th day if over 1000 employees). Withholding salary beyond this is an actionable violation.
- Payment of Wages Act, 1936, Section 15: An employee or trade union can file a claim before the Labour Commissioner Authority to recover delayed wages plus statutory compensation up to 10 times the amount.
- Minimum Wages Act, 1948, Section 12: Mandatory payment of government-notified minimum wage rates. Less than minimum wage violates Article 23 (forced labour).
- Industrial Disputes Act, 1947, Section 33C: Recovery of statutory dues from employer through Labour Court.
- Official Grievance Portals: Shram Suvidha (shramsuvidha.gov.in) & SAMADHAN portal.

2. Women's Protections:
- Protection of Women from Domestic Violence Act, 2005 (PWDVA), Section 3: Defines domestic violence including physical, verbal, emotional, and economic abuse.
- PWDVA 2005, Section 12 & 18: Application to Judicial Magistrate for emergency Protection Orders (barring abuser from entering residence or workplace) and Residence Orders (Section 19).
- Bharatiya Nyaya Sanhita (BNS) Section 85 / IPC 498A: Cruelty by husband or relatives is a cognizable offence.
- Emergency Helplines: National Emergency 112, Women Helpline 181, NCW Helpline 7827170170.

3. Consumer Protection:
- Consumer Protection Act, 2019, Section 35: Filing consumer complaints against defective goods, unfair contracts, or deficiency in service before the District Commission.
- Electronic Redressal: e-Daakhil portal (edaakhil.nic.in) enables citizens to file cases online without hiring a private lawyer.
- National Consumer Helpline: 1915 or consumerhelpline.gov.in.

4. Free Legal Aid & Constitutional Rights:
- Constitution of India, Article 39A: Equal justice and free legal aid to all citizens.
- Legal Services Authorities Act, 1987, Section 12: ALL women, children, SC/ST, custody inmates, disabled, industrial workers, and citizens below statutory income limits are entitled to 100% FREE court representation by government-appointed advocates.
- National Legal Helpline: 15100 (24x7 toll-free by NALSA).
`;

/**
 * Direct call to Google Gemini via @google/genai SDK when configured.
 */
async function callGeminiDirect(params) {
  if (!GEMINI_API_KEY) return null;

  try {
    const languageInstruction =
      params.language === 'hi'
        ? 'Respond strictly in simple, respectful Hindi (Devanagari script).'
        : params.language === 'mr'
        ? 'Respond strictly in simple Marathi (Devanagari script).'
        : params.language === 'ta'
        ? 'Respond strictly in simple Tamil script.'
        : params.language === 'te'
        ? 'Respond strictly in simple Telugu script.'
        : params.language === 'bn'
        ? 'Respond strictly in simple Bengali script.'
        : 'Respond in clear, accessible plain English.';

    const systemPrompt = `You are NyayaSaathi (न्यायसाथी), an AI-powered legal awareness companion for Indian citizens.
Your mission is to make Indian statutory law accessible to ordinary people.

RULES:
1. ${languageInstruction}
2. Ground all answers strictly in verified Indian statutes. NEVER invent laws or section numbers.
3. Structure your response clearly:
   - **Simple Explanation**: Explain the citizen's rights in conversational, jargon-free language.
   - **Applicable Indian Law**: State the exact Act name, Section number, and what it provides.
   - **Action Steps**: Numbered steps on what documents to gather and which official authority/portal to approach.
   - **Free Legal Aid**: Mention NALSA helpline 15100 and DLSA assistance.
4. Conclude with: "Important: This is legal awareness information, not formal legal counsel. For court representation, contact DLSA or NALSA at 15100."

Use this verified Indian legal context:
${INDIAN_LEGAL_KNOWLEDGE}
`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nCitizen Query: "${params.query}"` }] }
      ],
      config: {
        temperature: 0.2,
      },
    });

    const generatedText = response?.text;
    if (!generatedText) return null;

    // Detect citations from generated text
    const sources = [];
    if (/payment of wages/i.test(generatedText)) {
      sources.push({ act: 'Payment of Wages Act', section: 'Section 5 & 15', title: 'Time of payment & claims' });
    }
    if (/domestic violence|pwdva/i.test(generatedText)) {
      sources.push({ act: 'Protection of Women from Domestic Violence Act', section: 'Section 12 & 18', title: 'Magistrate application & protection orders' });
    }
    if (/consumer protection/i.test(generatedText)) {
      sources.push({ act: 'Consumer Protection Act', section: 'Section 35', title: 'District Commission complaint' });
    }
    if (/minimum wages/i.test(generatedText)) {
      sources.push({ act: 'Minimum Wages Act', section: 'Section 12', title: 'Payment of minimum rates of wages' });
    }
    if (/article 39a|legal services/i.test(generatedText)) {
      sources.push({ act: 'Legal Services Authorities Act', section: 'Section 12', title: 'Free legal aid criteria' });
    }

    return {
      answer: generatedText,
      language: params.language,
      sources: sources.length > 0 ? sources : [
        { act: 'Constitution of India', section: 'Article 39A', title: 'Equal justice and free legal aid' },
      ],
      nextSteps: [
        'Collect relevant receipts, appointment letters, or dispute records',
        'Lodge an online complaint on the statutory portal or local authority',
        'Contact NALSA National Legal Helpline 15100 for a free appointed advocate',
      ],
      legalAidSuggested: true,
      engine: 'gemini-direct',
    };
  } catch (err) {
    console.warn(`[AI Service] Gemini direct call failed: ${err.message}`);
    return null;
  }
}

/**
 * Main query dispatcher for legal awareness.
 * 1. Primary: NyayaSaathi AI Engine (Node.js/FastAPI RAG via pgvector)
 * 2. Secondary: Direct Gemini API (if GEMINI_API_KEY is configured)
 * 3. Graceful Degraded Fallback: Explicitly marked statutory notices
 */
export async function queryAIEngine(params) {
  try {
    const res = await axios.post(
      `${AI_ENGINE_URL}/query`,
      {
        message: params.query,
        language: params.language,
        session_id: params.session_id,
        history: params.history,
      },
      {
        timeout: 15000,
      }
    );

    if (res.data && res.data.answer) {
      return {
        answer: res.data.answer,
        language: res.data.language || params.language,
        sources: (res.data.citations ?? []).map((citation) => ({
          act: citation.act,
          section: citation.section,
          year: citation.year,
          title: citation.section,
          relevance: citation.relevance,
          sourceUrl: citation.source_url,
        })),
        nextSteps: res.data.next_steps,
        legalAidSuggested: res.data.legal_aid_suggested,
        engine: 'ai-engine-rag',
      };
    }
  } catch (error) {
    console.warn(`[AI Service] AI Engine at ${AI_ENGINE_URL} unavailable: ${error.message}`);
  }

  // 2. Direct Gemini fallback if valid API key is available
  if (isGeminiConfigured) {
    const geminiResult = await callGeminiDirect(params);
    if (geminiResult) return geminiResult;
  }

  // 3. Fallback: Provide grounded statutory awareness with explicit degraded markers
  const isHindi = params.language === 'hi';
  const isLabour = /salary|wage|employer|kaam|paisa|vetan|dihadi/i.test(params.query);
  const isWomen = /domestic|violence|patni|aurat|marpeet|dahej|harassment/i.test(params.query);
  const isConsumer = /consumer|refund|defective|product|fraud|shopping/i.test(params.query);

  const fallbackWarning =
    'AI Engine and Gemini are currently unreachable. Serving verified statutory guidance in offline mode.';

  if (isLabour) {
    return {
      answer: isHindi
        ? 'मजदूरी भुगतान अधिनियम 1936 (धारा 5) के तहत, नियोक्ता को तय समय सीमा (माह की 7 या 10 तारीख) में वेतन देना कानूनी रूप से अनिवार्य है। यदि नियोक्ता 3 महीने से वेतन नहीं दे रहा है, तो यह कानून का गंभीर उल्लंघन है। आप लेबर कमिश्नर कार्यालय में शिकायत दर्ज कर सकते हैं या धारा 15 के तहत क्लेम दाखिल कर सकते हैं जिसमें 10 गुना तक मुआवजे का प्रावधान है।'
        : 'Under Section 5 of the Payment of Wages Act, 1936, employers are legally required to disburse earned wages on or before the 7th or 10th of the following month. Failure to pay salary violates this statutory requirement. You have the right to file a claim under Section 15 before the Labour Commissioner Authority to recover delayed wages plus statutory compensation.',
      language: params.language,
      sources: [
        { act: 'Payment of Wages Act', section: 'Section 5 & 15', title: 'Time of payment and claims' },
      ],
      nextSteps: [
        'Collect evidence: appointment letter, bank statements, work messages',
        'Send a formal demand letter or legal notice to the employer',
        'File an online grievance on the Shram Suvidha / Samadhan portal or visit local DLSA',
      ],
      legalAidSuggested: true,
      engine: 'offline-statutory-notice',
      degraded: true,
      warning: fallbackWarning,
    };
  } else if (isWomen) {
    return {
      answer: isHindi
        ? 'घरेलू हिंसा से महिलाओं का संरक्षण अधिनियम 2005 (धारा 3 एवं 12) के तहत शारीरिक, मानसिक, आर्थिक या मौखिक दुर्व्यवहार दंडनीय है। आप संरक्षण अधिकारी (Protection Officer) या नजदीकी मजिस्ट्रेट के पास सुरक्षा आदेश (Protection Order) के लिए आवेदन कर सकती हैं। राष्ट्रीय महिला आयोग (NCW) हेल्पलाइन 7827170170 पर भी संपर्क किया जा सकता है।'
        : 'Under the Protection of Women from Domestic Violence Act, 2005 (Sections 3 & 12), any form of physical, emotional, economic, or verbal abuse is legally prohibited. You can approach a Protection Officer or Magistrate for Protection Orders (Section 18) and Residence Orders (Section 19). Free legal assistance is available via DLSA/NALSA.',
      language: params.language,
      sources: [
        { act: 'Protection of Women from Domestic Violence Act', section: 'Section 3 & 12', title: 'Definition and Application to Magistrate' },
      ],
      nextSteps: [
        'Call Emergency Helpline 112 or Women Helpline 181',
        'Contact local Protection Officer or DLSA for free legal aid',
        'File an application under Section 12 before the Judicial Magistrate',
      ],
      legalAidSuggested: true,
      engine: 'offline-statutory-notice',
      degraded: true,
      warning: fallbackWarning,
    };
  } else if (isConsumer) {
    return {
      answer: isHindi
        ? 'उपभोक्ता संरक्षण अधिनियम 2019 (धारा 35) के तहत, किसी भी दोषपूर्ण उत्पाद या सेवा में कमी के लिए आप जिला उपभोक्ता आयोग में शिकायत दर्ज कर सकते हैं। आप ई-दाखिल पोर्टल (edaakhil.nic.in) या राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर भी शिकायत दर्ज करा सकते हैं।'
        : 'Under Section 35 of the Consumer Protection Act, 2019, any consumer can file a complaint before the District Consumer Commission for defective goods, deficiency in services, or unfair trade practices. Complaints can be registered online at edaakhil.nic.in or by calling 1915.',
      language: params.language,
      sources: [
        { act: 'Consumer Protection Act, 2019', section: 'Section 35', title: 'District Consumer Commission Complaint' },
      ],
      nextSteps: [
        'Preserve invoice, payment receipts, and communications with seller',
        'Call National Consumer Helpline 1915 or register on consumerhelpline.gov.in',
        'File formal consumer claim on e-Daakhil portal (edaakhil.nic.in)',
      ],
      legalAidSuggested: false,
      engine: 'offline-statutory-notice',
      degraded: true,
      warning: fallbackWarning,
    };
  }

  return {
    answer: isHindi
      ? 'न्यायसाथी में आपका स्वागत है। वर्तमान में AI इंजन या जेमिनी API उपलब्ध नहीं है, इसलिए हम केवल बुनियादी वैधानिक जानकारी प्रदान कर पा रहे हैं। कृपया अपने प्रश्न में विशिष्ट विषय (वेतन, महिला सुरक्षा, उपभोक्ता विवाद) का उल्लेख करें या AI इंजन शुरू करें।'
      : 'Welcome to NyayaSaathi. The AI reasoning engine and cloud LLM are currently offline, so responses are running in basic statutory notice mode. For comprehensive AI analysis, please ensure the AI engine is running on port 8001 or configure a valid GEMINI_API_KEY.',
    language: params.language,
    sources: [
      { act: 'Constitution of India', section: 'Article 39A', title: 'Equal justice and free legal aid' },
    ],
    nextSteps: [
      'Check the Know Your Rights catalog for specific statutory sections',
      'Contact NALSA National Legal Helpline 15100 for immediate legal aid',
    ],
    legalAidSuggested: true,
    engine: 'offline-statutory-notice',
    degraded: true,
    warning: fallbackWarning,
  };
}
