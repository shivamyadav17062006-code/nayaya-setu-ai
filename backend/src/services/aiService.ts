import axios from 'axios';

interface QueryParams {
  query: string;
  language: string;
  session_id: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIResponsePayload {
  answer: string;
  language: string;
  sources?: Array<{
    act: string;
    section: string;
    title?: string;
    sourceUrl?: string;
  }>;
  nextSteps?: string[];
  legalAidSuggested?: boolean;
}

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';

export async function queryAIEngine(params: QueryParams): Promise<AIResponsePayload> {
  try {
    const res = await axios.post(`${AI_ENGINE_URL}/query`, {
      message: params.query,
      language: params.language,
      session_id: params.session_id,
      history: params.history,
    }, {
      timeout: 15000,
    });

    return {
      answer: res.data.answer,
      language: res.data.language || params.language,
      sources: res.data.citations,
      nextSteps: res.data.next_steps,
      legalAidSuggested: res.data.legal_aid_suggested,
    };
  } catch (error: any) {
    console.warn('AI Engine unavailable, falling back to smart legal rule engine response:', error.message);
    
    // Fallback response for resilience if AI engine is starting or offline
    const isHindi = params.language === 'hi';
    const isLabour = /salary|wage|employer|kaam|paisa|vetan|dihadi/i.test(params.query);
    const isWomen = /domestic|violence|patni|aurat|marpeet|dahej|harassment/i.test(params.query);

    if (isLabour) {
      return {
        answer: isHindi
          ? "मजदूरी भुगतान अधिनियम 1936 (धारा 5) के तहत, नियोक्ता को तय समय सीमा में वेतन देना अनिवार्य है। यदि नियोक्ता 3 महीने से वेतन नहीं दे रहा है, तो यह कानून का उल्लंघन है। आप लेबर कमिश्नर कार्यालय में शिकायत दर्ज कर सकते हैं या धारा 15 के तहत क्लेम दाखिल कर सकते हैं।"
          : "Under Section 5 of the Payment of Wages Act, 1936, employers are legally required to disburse earned wages on or before the 7th or 10th of the following month. Failure to pay salary for 3 months violates this statutory requirement. You have the right to file a claim under Section 15 before the Labour Commissioner Authority.",
        language: params.language,
        sources: [
          { act: 'Payment of Wages Act', section: 'Section 5 & 15', title: 'Time of payment and claims' }
        ],
        nextSteps: [
          'Collect evidence: appointment letter, bank statements, work messages',
          'Send a formal demand letter or legal notice to the employer',
          'File an online grievance on the Shram Suvidha / Samadhan portal or visit local DLSA'
        ],
        legalAidSuggested: true,
      };
    } else if (isWomen) {
      return {
        answer: isHindi
          ? "घरेलू हिंसा से महिलाओं का संरक्षण अधिनियम 2005 (धारा 3 एवं 12) के तहत शारीरिक, मानसिक, आर्थिक या मौखिक दुर्व्यवहार दंडनीय है। आप संरक्षण अधिकारी (Protection Officer) या नजदीकी मजिस्ट्रेट के पास सुरक्षा आदेश (Protection Order) के लिए आवेदन कर सकती हैं। राष्ट्रीय महिला आयोग (NCW) हेल्पलाइन 7827170170 पर भी संपर्क किया जा सकता है।"
          : "Under the Protection of Women from Domestic Violence Act, 2005 (Sections 3 & 12), any form of physical, emotional, economic, or verbal abuse is legally prohibited. You can approach a Protection Officer or Magistrate for Protection Orders (Section 18) and Residence Orders (Section 19). Free legal assistance is available via DLSA/NALSA.",
        language: params.language,
        sources: [
          { act: 'Protection of Women from Domestic Violence Act', section: 'Section 3 & 12', title: 'Definition and Application to Magistrate' }
        ],
        nextSteps: [
          'Call Emergency Helpline 112 or Women Helpline 181',
          'Contact local Protection Officer or DLSA for free legal aid',
          'File an application under Section 12 before the Judicial Magistrate'
        ],
        legalAidSuggested: true,
      };
    }

    return {
      answer: isHindi
        ? "नमस्ते! न्यायसाथी (NyayaSaathi) में आपका स्वागत है। भारतीय कानून के तहत सभी नागरिकों को समानता, न्याय और कानूनी सहायता का अधिकार है। कृपया अपने मामले का विवरण साझा करें (जैसे वेतन, उपभोक्ता मामला, महिला सुरक्षा या ज़मीन विवाद)।"
        : "Welcome to NyayaSaathi. Under the Constitution of India and statutory frameworks, every citizen is entitled to legal awareness and free legal aid under Article 39A. Please describe your situation regarding employment, consumer dispute, family, or property rights to receive tailored guidance.",
      language: params.language,
      sources: [
        { act: 'Constitution of India', section: 'Article 39A', title: 'Equal justice and free legal aid' }
      ],
      nextSteps: [
        'Explore your specific rights in the Know Your Rights catalog',
        'Check free legal aid eligibility under NALSA Section 12'
      ],
      legalAidSuggested: false,
    };
  }
}
