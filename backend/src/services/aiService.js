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
 * Unicode-based Language Detector for citizen queries
 */
export function detectQueryLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { code: 'en', name: 'English' };
  }

  // Devanagari script: Marathi vs Hindi
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  if (devanagariMatches && devanagariMatches.length >= 2) {
    const isMarathi = /(आहे|नाहीत|नाही|झाले|केले|पाहिजे|माझे|त्यांचे|कामगार|पगार|करावे|काय|कसे|माझ्या|मालकाने)/i.test(text);
    return isMarathi
      ? { code: 'mr', name: 'Marathi' }
      : { code: 'hi', name: 'Hindi' };
  }

  // Bengali / Assamese
  if ((text.match(/[\u0980-\u09FF]/g) || []).length >= 2) {
    return { code: 'bn', name: 'Bengali' };
  }

  // Tamil
  if ((text.match(/[\u0B80-\u0BFF]/g) || []).length >= 2) {
    return { code: 'ta', name: 'Tamil' };
  }

  // Telugu
  if ((text.match(/[\u0C00-\u0C7F]/g) || []).length >= 2) {
    return { code: 'te', name: 'Telugu' };
  }

  // Kannada
  if ((text.match(/[\u0C80-\u0CFF]/g) || []).length >= 2) {
    return { code: 'kn', name: 'Kannada' };
  }

  // Malayalam
  if ((text.match(/[\u0D00-\u0D7F]/g) || []).length >= 2) {
    return { code: 'ml', name: 'Malayalam' };
  }

  // Gujarati
  if ((text.match(/[\u0A80-\u0AFF]/g) || []).length >= 2) {
    return { code: 'gu', name: 'Gujarati' };
  }

  // Gurmukhi / Punjabi
  if ((text.match(/[\u0A00-\u0A7F]/g) || []).length >= 2) {
    return { code: 'pa', name: 'Punjabi' };
  }

  // Odia
  if ((text.match(/[\u0B00-\u0B7F]/g) || []).length >= 2) {
    return { code: 'or', name: 'Odia' };
  }

  // Perso-Arabic / Urdu
  if ((text.match(/[\u0600-\u06FF]/g) || []).length >= 2) {
    return { code: 'ur', name: 'Urdu' };
  }

  // Hinglish (Roman Hindi) — requires distinctly Hindi lexical markers
  const hinglishMatches = text.match(/\b(mera|meri|mere|mujhe|hum|paisa|vetan|nahi|mili|mila|kya|karu|karein|kaise|shikayat|maalik|patni|aurat|dahej|kanoon|vakil|adhikar|dhara)\b/gi);
  if (hinglishMatches && hinglishMatches.length >= 2) {
    return { code: 'hi', name: 'Hinglish (conversational Hindi in Roman script)', isHinglish: true };
  }

  // Spanish
  if (/[¿¡]/.test(text) || /\b(hola|por favor|derechos|trabajo|salario|sueldo|abogado|ayuda|ley|que puedo hacer)\b/i.test(text)) {
    return { code: 'es', name: 'Spanish' };
  }

  // French
  if (/\b(bonjour|droits|loi|salaire|travail|avocat|aide|plainte|que faire)\b/i.test(text)) {
    return { code: 'fr', name: 'French' };
  }

  // German
  if (/\b(hallo|recht|rechte|arbeit|gehalt|lohn|anwalt|hilfe|gesetz)\b/i.test(text)) {
    return { code: 'de', name: 'German' };
  }

  return { code: 'en', name: 'English' };
}

/**
 * Checks if a user message is a conversational greeting or intro request
 */
export function isGreeting(text = '') {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();

  // Single word greetings and abbreviations
  if (/^(hi|hello|hey|heya|hlo|hii|hiii|hiya|hola|bonjour|namaste|namaskar|pranam|pranaam|salaam|sasriyakal|adaab|vanakkam|namaskara|nomoshkar)[.!?\s]*$/i.test(trimmed)) {
    return true;
  }

  // Indic scripts greetings
  if (/^(नमस्ते|नमस्कार|प्रणाम|हेलो|हाय|केम छो|வணக்கம்|నమస్కారం|নমস্কার|ਸਤਿ ਸ੍ਰੀ ਅಕਾਲ)[.!?\s]*$/i.test(trimmed)) {
    return true;
  }

  // Greetings with polite words: "hello there", "hi team", "hello sir", "namaste ji"
  if (/^(hi|hello|hey|namaste|namaskar)\s+(there|sir|madam|team|ji|bot|assistant|nyayasaathi)?[.!?\s]*$/i.test(trimmed)) {
    return true;
  }

  // Conversational questions asking identity, role, or general help without legal specifics
  const isIntroQuestion =
    /who are you/i.test(trimmed) ||
    /what can you do/i.test(trimmed) ||
    /how can you help/i.test(trimmed) ||
    /what is nyayasaathi/i.test(trimmed) ||
    /help me/i.test(trimmed) ||
    /i need help/i.test(trimmed) ||
    /i need advice/i.test(trimmed) ||
    /i need legal advice/i.test(trimmed) ||
    /legal advice/i.test(trimmed) ||
    /aap kaun hai/i.test(trimmed) ||
    /tum kaun ho/i.test(trimmed) ||
    /kya madad/i.test(trimmed) ||
    /good\s+(morning|afternoon|evening|day)/i.test(trimmed);

  // But make sure it doesn't contain specific legal domain keywords like salary, domestic violence, police, fir, etc.
  const hasSpecificCaseDetails =
    /\b(salary|wage|employer|fired|posh|domestic|violence|beating|divorce|dowry|fir|arrest|bail|police|tenant|rent|eviction|refund|cheated|fraud|पगार|वेतन)\b/i.test(trimmed);

  if (isIntroQuestion && !hasSpecificCaseDetails) {
    return true;
  }

  return false;
}

export function getGreetingResponse(lang = 'en', isHinglish = false) {
  const normalizedLang = isHinglish ? 'hinglish' : (lang || 'en').toLowerCase();

  const GREETINGS = {
    en: {
      answer: `**Hello! Welcome to NyayaSaathi.** I am your AI Legal Assistant and Know Your Rights companion.

Just like consulting an advisor at a legal aid clinic, I am here to help you understand your statutory rights under Indian law, evaluate your situation, and guide you on what practical steps you can take.

**How can I assist you today? You can ask me about:**
1. **Employment & Salary:** Unpaid wages, delayed salary, minimum wage violations, or sudden termination.
2. **Women's Rights & Safety:** Domestic violence protection orders, maintenance, cruelty, or workplace safety (POSH).
3. **Consumer Rights:** Defective goods, refused refunds, deficiency in services, or online fraud.
4. **Tenancy & Property:** Landlord eviction notices, tenancy agreements, or property possession rights.
5. **Free Legal Aid:** Checking your statutory entitlement for 100% free court representation under NALSA (Helpline **15100**).

Please describe your situation or legal concern in your own words, and I will walk you through your applicable rights and remedies.`,
      nextSteps: [
        'My employer has not paid my salary on time',
        'How to file a consumer complaint for a refund',
        'Need legal assistance for domestic safety / maintenance',
        'Check if I am eligible for free legal aid (NALSA 15100)',
      ],
    },
    hi: {
      answer: `**नमस्ते! न्यायसाथी में आपका स्वागत है।** मैं आपका AI कानूनी सहायक (Legal Assistant) हूँ।

जिस प्रकार किसी कानूनी परामर्श केंद्र या वकील के पास जाने पर वे आपकी समस्या सुनकर सही कानूनी विकल्प बताते हैं, ठीक उसी तरह मैं आपको भारतीय कानूनों के तहत आपके अधिकार समझने और आगे के कानूनी कदम उठाने में मार्गदर्शन प्रदान करूँगा।

**आज मैं आपकी किस प्रकार सहायता कर सकता हूँ? आप मुझसे इन विषयों पर पूछ सकते हैं:**
1. **श्रम व वेतन सम्बन्धी विवाद:** बकाया वेतन न मिलना, बिना नोटिस नौकरी से निकाला जाना या पीएफ विवाद।
2. **महिला सुरक्षा व अधिकार:** घरेलू हिंसा, संरक्षण आदेश (Protection Orders), भरण-पोषण या वैवाहिक अधिकार।
3. **उपभोक्ता शिकायत:** दोषपूर्ण उत्पाद, रिफंड न मिलना या ऑनलाइन खरीद धोखाधड़ी।
4. **किरायेदारी व संपत्ति:** मकान मालिक द्वारा मनमानी बेदखली, किराया विवाद या जमीन के कागजात।
5. **निःशुल्क विधिक सहायता:** नालसा (NALSA हेल्पलाइन **15100**) के तहत सरकारी वकील पाने की पात्रता।

कृपया अपनी समस्या या स्थिति के बारे में अपनी भाषा में बताएं, मैं आपको सही कानूनी उपाय और विकल्प समझाऊँगा।`,
      nextSteps: [
        'मेरे मालिक ने वेतन नहीं दिया, क्या करूँ?',
        'दोषपूर्ण सामान का रिफंड पाने हेतु उपभोक्ता शिकायत कैसे करें?',
        'घरेलू हिंसा के विरुद्ध कानूनी सुरक्षा आदेश कैसे प्राप्त करें?',
        'जांचें कि क्या आप मुफ्त सरकारी वकील (नालसा 15100) के पात्र हैं',
      ],
    },
    mr: {
      answer: `**नमस्कार! न्यायसाथीमध्ये आपले स्वागत आहे.** मी तुमचा AI कायदेशीर सहाय्यक (Legal Assistant) आहे.

एखाद्या वकिलाकडे किंवा कायदेशीर सल्लागाराकडे गेल्यानंतर जशी प्राथमिक मदत मिळते, तशीच मदत मी तुम्हाला भारतीय कायद्यांनुसार तुमचे हक्क समजून घेण्यासाठी आणि योग्य पावले उचलण्यासाठी करेन.

**मी तुम्हाला खालील विषयांवर मार्गदर्शन करू शकतो:**
1. **पगार व कामगार हक्क:** थकीत पगार न मिळणे, अचानक कामावरून काढणे किंवा पीएफ समस्या.
2. **महिला सुरक्षा व हक्क:** कौटुंबिक छळ, संरक्षण आदेश (Protection Orders) किंवा पोटगीचे हक्क.
3. **ग्राहक तक्रार:** सदोष वस्तू, परतावा (Refund) न मिळणे किंवा ऑनलाइन फसवणूक.
4. **भाडेकरू व मालमत्ता:** घरावरून बेकायदेशीरपणे काढणे, भाडेकरार किंवा जमीन वाद.
5. **मोफत कायदेशीर मदत:** नालसा (NALSA हेल्पलाइन **15100**) अंतर्गत मोफत सरकारी वकील कसा मिळवावा.

कृपया तुमची समस्या किंवा प्रश्न सांगा, मी तुम्हाला कायदेशीर उपाय आणि पुढची दिशा सांगेन.`,
      nextSteps: [
        'मालकाने थकीत पगार दिला नाही, काय करावे?',
        'ग्राहकाची फसवणूक झाल्यास तक्रार कशी दाखल करावी?',
        'कौटुंबिक छळाविरुद्ध संरक्षण आदेश कसा मिळवावा?',
        'मोफत सरकारी वकिलासाठी पात्रता तपासा (नालसा 15100)',
      ],
    },
    hinglish: {
      answer: `**Hello! NyayaSaathi me aapka swagat hai.** Main aapka AI Legal Assistant hoon.

Jaise kisi lawyer ke paas jane par wo aapki problem sunkar legal options aur remedies batate hain, waise hi main aapko Indian laws ke mutabiq aapke rights aur action steps explain karunga.

**Main in topics me aapki madad kar sakta hoon:**
1. **Salary & Job:** Ruka hua vetan, salary delay, wrongful termination, ya minimum wages.
2. **Women's Rights & Safety:** Domestic violence, protection orders, ya maintenance.
3. **Consumer Grievance:** Defective product, refund na milna, ya online fraud.
4. **Tenancy & Property:** Landlord dwara unlawful eviction ya rent agreement disputes.
5. **Free Legal Aid:** NALSA (Helpline **15100**) ke zariye free sarkari advocate pane ka process.

Aap apni situation simple shabdon me bataiye, main aapko poora legal roadmap samjhaunga.`,
      nextSteps: [
        'Employer ne salary nahi di, kya steps lene chahiye?',
        'Defective product par consumer court me complaint kaise karein?',
        'Domestic violence ke khilaf protection orders kaise milte hain?',
        'Check karein agar aap free lawyer (NALSA 15100) ke eligible hain',
      ],
    },
  };

  return GREETINGS[normalizedLang] || GREETINGS.hi || GREETINGS.en;
}

/**
 * Direct call to Google Gemini via @google/genai SDK when configured.
 */
async function callGeminiDirect(params) {
  if (!GEMINI_API_KEY) return null;

  try {
    const detected = detectQueryLanguage(params.query);
    const targetLanguageCode = detected.code !== 'en' ? detected.code : (params.language || 'en');
    const targetLanguageName = detected.name;

    const languageInstruction = `MANDATORY LANGUAGE MATCHING DIRECTIVE:
You MUST formulate your entire answer in ${targetLanguageName} (${targetLanguageCode}), matching the exact language and script of the Citizen Query.
- If the query is in Hindi, respond strictly in respectful, accessible Hindi (Devanagari script).
- If the query is in Marathi, respond strictly in authentic Marathi (Devanagari script).
- If the query is in Bengali, respond strictly in Bengali script.
- If the query is in Tamil, respond strictly in Tamil script.
- If the query is in Telugu, respond strictly in Telugu script.
- If the query is in Gujarati, respond strictly in Gujarati script.
- If the query is in Kannada, respond strictly in Kannada script.
- If the query is in Malayalam, respond strictly in Malayalam script.
- If the query is in Punjabi, respond strictly in Punjabi (Gurmukhi script).
- If the query is in Hinglish, respond strictly in natural conversational Hinglish.
- If the query is in Spanish, French, German, or any other language, respond in that language.
- DO NOT default to English unless the citizen query was written in English.`;

    const systemPrompt = `You are NyayaSaathi (न्यायसाथी), an AI-powered legal awareness companion for Indian citizens.
Your mission is to make Indian statutory law accessible to ordinary people.

RULES:
1. ${languageInstruction}
2. Ground all answers strictly in verified Indian statutes. NEVER invent laws or section numbers.
3. Structure your response clearly:
   - **Simple Explanation**: Explain the citizen's rights in conversational, jargon-free language in the requested language.
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
    if (/payment of wages/i.test(generatedText) || /वेतन भुगतान/i.test(generatedText) || /पगार/i.test(generatedText)) {
      sources.push({ act: 'Payment of Wages Act, 1936', section: 'Section 5 & 15', title: 'Time of payment & claims' });
    }
    if (/domestic violence|pwdva/i.test(generatedText) || /घरेलू हिंसा/i.test(generatedText) || /कौटुंबिक छळ/i.test(generatedText)) {
      sources.push({ act: 'Protection of Women from Domestic Violence Act, 2005', section: 'Section 12 & 18', title: 'Magistrate application & protection orders' });
    }
    if (/consumer protection/i.test(generatedText) || /उपभोक्ता संरक्षण/i.test(generatedText) || /ग्राहक संरक्षण/i.test(generatedText)) {
      sources.push({ act: 'Consumer Protection Act, 2019', section: 'Section 35', title: 'District Commission complaint' });
    }
    if (/minimum wages/i.test(generatedText) || /न्यूनतम मजदूरी/i.test(generatedText)) {
      sources.push({ act: 'Minimum Wages Act, 1948', section: 'Section 12', title: 'Payment of minimum rates of wages' });
    }
    if (/article 39a|legal services/i.test(generatedText) || /विधिक सेवा/i.test(generatedText)) {
      sources.push({ act: 'Legal Services Authorities Act, 1987', section: 'Section 12', title: 'Free legal aid criteria' });
    }

    return {
      answer: generatedText,
      language: targetLanguageCode,
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
  const detected = detectQueryLanguage(params.query);
  const effectiveLanguage = detected.code !== 'en' ? detected.code : (params.language || 'en');

  try {
    const res = await axios.post(
      `${AI_ENGINE_URL}/query`,
      {
        message: params.query,
        language: effectiveLanguage,
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
        language: res.data.language || effectiveLanguage,
        sources: (res.data.citations ?? []).map((citation) => ({
          act: citation.act,
          section: citation.section,
          year: citation.year,
          title: citation.title || citation.section,
          relevance: citation.relevance,
          sourceUrl: citation.sourceUrl || citation.source_url,
          originalText: citation.originalText || citation.original_text,
          simplifiedText: citation.simplifiedText || citation.simplified_text,
          jurisdiction: citation.jurisdiction || 'CENTRAL',
          verificationStatus: citation.verificationStatus || citation.verification_status || 'VERIFIED',
          similarity: citation.similarity,
        })),
        nextSteps: res.data.next_steps,
        legalAidSuggested: res.data.legal_aid_suggested,
        engine: res.data.engine || 'ai-engine-rag',
        degraded: res.data.degraded ?? false,
        warning: res.data.warning ?? null,
      };
    }
  } catch (error) {
    console.warn(`[AI Service] AI Engine at ${AI_ENGINE_URL} unavailable: ${error.message}`);
  }

  // 2. Direct Gemini fallback if valid API key is available
  if (isGeminiConfigured) {
    const geminiResult = await callGeminiDirect({ ...params, language: effectiveLanguage });
    if (geminiResult) return geminiResult;
  }

  // 3. Fallback: Provide grounded statutory awareness with explicit degraded markers
  if (isGreeting(params.query)) {
    const greeting = getGreetingResponse(effectiveLanguage, detected.isHinglish);
    return {
      answer: greeting.answer,
      language: effectiveLanguage,
      sources: [],
      nextSteps: greeting.nextSteps,
      legalAidSuggested: true,
      engine: 'ai-legal-intake-assistant',
      degraded: false,
      warning: null,
    };
  }

  const isHindi = effectiveLanguage === 'hi';
  const isMarathi = effectiveLanguage === 'mr';
  const isLabour = /salary|wage|employer|kaam|paisa|vetan|dihadi|pagar|kamgar/i.test(params.query);
  const isWomen = /domestic|violence|patni|aurat|marpeet|dahej|harassment|mahila|stri/i.test(params.query);
  const isConsumer = /consumer|refund|defective|product|fraud|shopping|grahak/i.test(params.query);

  const fallbackWarning =
    'AI Engine and Gemini are currently unreachable. Serving verified statutory guidance in offline mode.';

  if (isLabour) {
    let answerText = 'Under Section 5 of the Payment of Wages Act, 1936, employers are legally required to disburse earned wages on or before the 7th or 10th of the following month. Failure to pay salary violates this statutory requirement. You have the right to file a claim under Section 15 before the Labour Commissioner Authority to recover delayed wages plus statutory compensation.';
    if (isMarathi) {
      answerText = 'वेतन प्रदान कायदा 1936 (कलम 5) अन्वये, प्रत्येक मालकाने महिन्याच्या 7 किंवा 10 तारखेच्या आत कर्मचाऱ्याला पगार देणे कायदेशीररीत्या बंधनकारक आहे. जर मालक पगार देत नसेल, तर हा गंभीर गुन्हा आहे. आपण कलम 15 अन्वये कामगार आयुक्तांकडे 10 पट नुकसानभरपाईसह थकीत वेतनाची वसुली करण्यासाठी दावा करू शकता.';
    } else if (isHindi) {
      answerText = 'मजदूरी भुगतान अधिनियम 1936 (धारा 5) के तहत, नियोक्ता को तय समय सीमा (माह की 7 या 10 तारीख) में वेतन देना कानूनी रूप से अनिवार्य है। यदि नियोक्ता वेतन नहीं दे रहा है, तो यह कानून का गंभीर उल्लंघन है। आप लेबर कमिश्नर कार्यालय में शिकायत दर्ज कर सकते हैं या धारा 15 के तहत क्लेम दाखिल कर सकते हैं जिसमें 10 गुना तक मुआवजे का प्रावधान है।';
    }

    return {
      answer: answerText,
      language: effectiveLanguage,
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
    let answerText = 'Under the Protection of Women from Domestic Violence Act, 2005 (Sections 3 & 12), any form of physical, emotional, economic, or verbal abuse is legally prohibited. You can approach a Protection Officer or Magistrate for Protection Orders (Section 18) and Residence Orders (Section 19). Free legal assistance is available via DLSA/NALSA.';
    if (isMarathi) {
      answerText = 'कौटुंबिक छळापासून महिलांचे संरक्षण कायदा 2005 (कलम 3 व 12) अन्वये शारीरिक, मानसिक, आर्थिक किंवा शाब्दिक छळ करणे दंडनीय गुन्हा आहे. आपण संरक्षण अधिकारी किंवा न्यायदंडाधिकाऱ्यांकडे संरक्षण आदेशासाठी (Protection Order) अर्ज करू शकता. राष्ट्रीय विधिक सेवा प्राधिकरण (NALSA 15100) कडून मोफत सरकारी वकील उपलब्ध आहे.';
    } else if (isHindi) {
      answerText = 'घरेलू हिंसा से महिलाओं का संरक्षण अधिनियम 2005 (धारा 3 एवं 12) के तहत शारीरिक, मानसिक, आर्थिक या मौखिक दुर्व्यवहार दंडनीय है। आप संरक्षण अधिकारी (Protection Officer) या नजदीकी मजिस्ट्रेट के पास सुरक्षा आदेश (Protection Order) के लिए आवेदन कर सकती हैं। राष्ट्रीय महिला आयोग (NCW) हेल्पलाइन 7827170170 या NALSA 15100 पर संपर्क करें।';
    }

    return {
      answer: answerText,
      language: effectiveLanguage,
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
    let answerText = 'Under Section 35 of the Consumer Protection Act, 2019, any consumer can file a complaint before the District Consumer Commission for defective goods, deficiency in services, or unfair trade practices. Complaints can be registered online at edaakhil.nic.in or by calling 1915.';
    if (isMarathi) {
      answerText = 'ग्राहक संरक्षण कायदा 2019 (कलम 35) अन्वये सदोष वस्तू किंवा सेवेतील त्रुटींसाठी आपण जिल्हा ग्राहक आयोगात थेट तक्रार दाखल करू शकता. आपण ई-दाखील पोर्टल (edaakhil.nic.in) किंवा राष्ट्रीय ग्राहक हेल्पलाइन 1915 वर देखील तक्रार नोंदवू शकता.';
    } else if (isHindi) {
      answerText = 'उपभोक्ता संरक्षण अधिनियम 2019 (धारा 35) के तहत, किसी भी दोषपूर्ण उत्पाद या सेवा में कमी के लिए आप जिला उपभोक्ता आयोग में शिकायत दर्ज कर सकते हैं। आप ई-दाखिल पोर्टल (edaakhil.nic.in) या राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर भी शिकायत दर्ज करा सकते हैं।';
    }

    return {
      answer: answerText,
      language: effectiveLanguage,
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

  let defaultAnswer = 'Welcome to NyayaSaathi. The AI reasoning engine and cloud LLM are currently offline, so responses are running in basic statutory notice mode. For comprehensive AI analysis, please ensure the AI engine is running on port 8001 or configure a valid GEMINI_API_KEY.';
  if (isMarathi) {
    defaultAnswer = 'न्यायसाथीमध्ये आपले स्वागत आहे. सध्या एआय इंजिन किंवा क्लाउड एलएलएम उपलब्ध नसल्याने आम्ही मूलभूत वैधानिक माहिती देत आहोत. कृपया आपल्या प्रश्नात विशिष्ट विषय (पगार, महिला सुरक्षा, ग्राहक वाद) नमूद करा किंवा नालसा हेल्पलाइन 15100 वर संपर्क साधा.';
  } else if (isHindi) {
    defaultAnswer = 'न्यायसाथी में आपका स्वागत है। वर्तमान में AI इंजन या जेमिनी API उपलब्ध नहीं है, इसलिए हम केवल बुनियादी वैधानिक जानकारी प्रदान कर पा रहे हैं। कृपया अपने प्रश्न में विशिष्ट विषय (वेतन, महिला सुरक्षा, उपभोक्ता विवाद) का उल्लेख करें या नालसा हेल्पलाइन 15100 पर संपर्क करें।';
  }

  return {
    answer: defaultAnswer,
    language: effectiveLanguage,
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
