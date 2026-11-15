import { classifyIntent, GoalType, Intent } from './intentService.js';
import { detectLanguage, SUPPORTED_LANGUAGES } from './languageService.js';
import { normalizeQuery } from './queryNormalizer.js';
import { embeddingService } from './embeddingService.js';
import { legalService } from './legalService.js';
import { caseLawService } from './caseLawService.js';
import { citationValidator } from './citationValidator.js';
import { providerManager } from '../providers/providerManager.js';
import { buildSystemPrompt, formatUntrustedContext, NEXT_STEPS_BY_INTENT } from '../utils/prompts.js';
import { env } from '../config/env.js';

export function getGreetingResponse(lang = 'en', isHinglish = false) {
  const normalizedLang = isHinglish ? 'hinglish' : (lang || 'en').toLowerCase();

  const GREETINGS = {
    en: {
      answer: `**Hello! Welcome to NyayaSaathi.** I am your AI Legal Assistant and Know Your Rights companion.

Just like an advisor at a legal aid clinic, I am here to listen to your situation, help you understand your statutory rights under Indian law, and guide you on what practical steps you can take.

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
    bn: {
      answer: `**নমস্কার! ন্যায়সাথীতে আপনাকে স্বাগতম।** আমি আপনার এআই আইনি সহকারী। ভারতীয় আইন অনুযায়ী আপনার অধিকার বুঝতে এবং সঠিক আইনি পদক্ষেপ নিতে আমি আপনাকে সাহায্য করব। বকেয়া বেতন, ভোক্তা অধিকার, পারিবারিক সুরক্ষা বা বিনামূল্যে সরকারি আইনজীবী (নালসা ১৫১০০) সংক্রান্ত আপনার প্রশ্ন নিচে জানান।`,
      nextSteps: [
        'নিয়োগকর্তা বেতন না দিলে কী করণীয়?',
        'ভোক্তা ফোরামে অভিযোগ দায়েরের পদ্ধতি',
        'বিনামূল্যে সরকারি আইনজীবীর জন্য নালসা ১৫১০০',
      ],
    },
    ta: {
      answer: `**வணக்கம்! நியாயசாதிக்கு உங்களை வரவேற்கிறோம்.** நான் உங்கள் ஏஐ சட்ட ஆலோசகர். இந்திய சட்டத்தின் கீழ் உங்கள் உரிமைகளை புரிந்து கொள்ளவும், தேவையான சட்ட நடவடிக்கைகளை எடுக்கவும் நான் உங்களுக்கு உதவுவேன். ஊதிய பிரச்சனை, குடும்ப பாதுகாப்பு அல்லது இலவச சட்ட உதவி (நல்சா 15100) பற்றிய உங்கள் கேள்விகளை கீழே கேட்கலாம்.`,
      nextSteps: [
        'சம்பளம் வரவில்லை என்றால் என்ன செய்ய வேண்டும்?',
        'நுகர்வோர் புகார் பதிவு செய்வது எப்படி?',
        'இலவச அரசு வழக்கறிஞர் உதவி (15100)',
      ],
    },
    te: {
      answer: `**నమస్కారం! న్యాయసాథికి స్వాగతం.** నేను మీ ఏఐ చట్టపరమైన సహాయకుడిని. భారతీయ చట్టాల ప్రకారం మీ హక్కులను అర్థం చేసుకోవడానికి మరియు సరైన చట్టపరమైన చర్యలు తీసుకోవడానికి నేను మీకు సహాయం చేస్తాను. జీతాల సమస్యలు, వినియోగదారుల హక్కులు లేదా ఉచిత న్యాయ సహాయం (నల్సా 15100) కోసం మీ ప్రశ్నను కింద వివరించండి.`,
      nextSteps: [
        'యజమాని జీతం ఇవ్వకపోతే ఏమి చేయాలి?',
        'వినియోగదారుల ఫోరంలో ఫిర్యాదు ఎలా చేయాలి?',
        'ఉచిత ప్రభుత్వ న్యాయవాది సహాయం (15100)',
      ],
    },
    gu: {
      answer: `**નમસ્તે! ન્યાયસાથીમાં આપનું સ્વાગત છે.** હું આપનો AI કાનૂની સહાયક છું. ભારતીય કાયદા હેઠળ આપના અધિકારો સમજવા અને યોગ્ય કાનૂની પગલાં લેવામાં હું આપને મદદ કરીશ. બાકી પગાર, ઉપભોક્તા સુરક્ષા, કૌટુંબિક બાબતો અથવા મફત સરકારી વકીલ (નાલસા 15100) સંબંધિત આપનો પ્રશ્ન નીચે જણાવો.`,
      nextSteps: [
        'પગાર ન મળે તો શું કરવું?',
        'ગ્રાહક ફોરમમાં ફરિયાદ કેવી રીતે કરવી?',
        'મફત કાનૂની સહાય માટે નાલસા 15100',
      ],
    },
    kn: {
      answer: `**ನಮಸ್ಕಾರ! ನ್ಯಾಯಸಾಥಿಗೆ ಸ್ವಾಗತ.** ನಾನು ನಿಮ್ಮ AI ಕಾನೂನು ಸಹಾಯಕ. ಭಾರತೀಯ ಕಾನೂನಿನ ಪ್ರಕಾರ ನಿಮ್ಮ ಹಕ್ಕುಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಸೂಕ್ತ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಬಾಕಿ ವೇತನ, ಗ್ರಾಹಕ ಹಕ್ಕುಗಳು ಅಥವಾ ಉಚಿತ ಕಾನೂನು ನೆರವು (15100) ಕುರಿತು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೆಳಗೆ ತಿಳಿಸಿ.`,
      nextSteps: [
        'ಮಾಲೀಕರು ವೇತನ ನೀಡದಿದ್ದರೆ ಏನು ಮಾಡಬೇಕು?',
        'ಗ್ರಾಹಕ ವೇದಿಕೆಯಲ್ಲಿ ದೂರು ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?',
        'ಉಚಿತ ಸರ್ಕಾರಿ ವಕೀಲರ ನೆರವು (15100)',
      ],
    },
  };

  return GREETINGS[normalizedLang] || GREETINGS.hi || GREETINGS.en;
}

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
    // Step 1: Dynamic Language Detection
    // ------------------------------------------------------------------------
    const detected = detectLanguage(message);
    let userLang = language || 'en';
    if (detected.code && detected.code !== 'en') {
      userLang = detected.code;
    } else if (!language || language === 'en') {
      userLang = detected.code || 'en';
    }
    const langName = detected.isHinglish ? 'Hinglish (conversational Hindi in Roman script)' : (SUPPORTED_LANGUAGES[userLang]?.name || detected.name || 'English');

    // ------------------------------------------------------------------------
    // Step 2: Legal Intent & Goal Detection
    // ------------------------------------------------------------------------
    const classification = classifyIntent(message);
    const classifiedIntent = intent || classification.intent || 'GENERAL';
    const goalType = classification.goal || GoalType.GENERAL_EXPLANATION;

    // ------------------------------------------------------------------------
    // Step 2.1: Conversational Greeting / Legal Intake Interceptor
    // ------------------------------------------------------------------------
    if (classifiedIntent === Intent.GREETING || classifiedIntent === 'GREETING') {
      const greetingResponse = getGreetingResponse(userLang, detected.isHinglish);
      return {
        answer: greetingResponse.answer,
        language: userLang,
        intent: Intent.GREETING,
        goal: 'GREETING_INTAKE',
        citations: [],
        precedents: [],
        reliableSourceAvailable: true,
        next_steps: greetingResponse.nextSteps,
        legal_aid_suggested: true,
        session_id,
        degraded: false,
        warning: null,
        engine: 'ai-legal-intake-assistant',
        processing_time_ms: Date.now() - startTime,
        normalized_query: message,
        retrieval_count: 0,
      };
    }

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

    // Retrieve Relevant Case Law Precedents (Distinct Channel)
    let caseLawPrecedents = [];
    try {
      caseLawPrecedents = await caseLawService.retrieveCaseLaw(searchQuery, { limit: 2 });
    } catch (clErr) {
      console.warn('[RAGService] Case law retrieval warning:', clErr.message);
    }

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
      isHinglish: Boolean(detected.isHinglish),
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
      precedents: caseLawPrecedents,
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
