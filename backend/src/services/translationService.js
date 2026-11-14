import axios from 'axios';

/**
 * Service to interface with Government of India's BHASHINI API
 * Supports translation between Indian Languages (Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati, etc.)
 */
export async function translateText(text, sourceLang, targetLang) {
  if (sourceLang === targetLang || !text) {
    return text;
  }

  const bhashiniKey = process.env.BHASHINI_API_KEY;
  if (!bhashiniKey) {
    return text;
  }

  try {
    const res = await axios.post(
      'https://dhruva-api.bhashini.gov.in/services/inference/translation',
      {
        input: [{ source: text }],
        config: {
          language: {
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
          },
        },
      },
      {
        headers: {
          Authorization: bhashiniKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return res.data?.pipelineResponse?.[0]?.output?.[0]?.target || text;
  } catch (error) {
    console.warn('BHASHINI translation failed, returning source text:', error.message);
    return text;
  }
}
