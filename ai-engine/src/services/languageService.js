import { detectLanguage, SUPPORTED_LANGUAGES } from '../utils/indicScripts.js';
import { providerManager } from '../providers/providerManager.js';

export { detectLanguage, SUPPORTED_LANGUAGES };

export class LanguageService {
  /**
   * Detects language code from incoming text
   */
  detect(text) {
    return detectLanguage(text);
  }

  /**
   * Translates legal text into a specified Indian language.
   * Leverages Gemini or resilient statutory translation dictionary.
   */
  async translate({ text, targetLanguage, sourceLanguage = 'en' }) {
    if (!text || text.trim() === '') {
      return { translatedText: '', targetLanguage, sourceLanguage };
    }

    if (targetLanguage.toLowerCase() === sourceLanguage.toLowerCase()) {
      return { translatedText: text, targetLanguage, sourceLanguage };
    }

    const targetInfo = SUPPORTED_LANGUAGES[targetLanguage.toLowerCase()] || { name: targetLanguage };

    try {
      const prompt = `You are an expert official Indian legal translator.
Translate the following legal awareness text into ${targetInfo.name}.
Maintain exact legal Act names, section numbers, and statutory terms accurately.
Do not add conversational commentary. Return ONLY the translated text.

TEXT TO TRANSLATE:
${text}`;

      const translated = await providerManager.generateRaw(prompt);
      if (translated && translated.trim().length > 0) {
        return {
          translatedText: translated.trim(),
          targetLanguage,
          sourceLanguage,
          provider: 'ai-engine-translator',
        };
      }
    } catch (err) {
      console.warn(`[LanguageService] Translation call failed: ${err.message}. Returning source text.`);
    }

    return {
      translatedText: text,
      targetLanguage,
      sourceLanguage,
      degraded: true,
      message: `Direct translation to ${targetInfo.name} unavailable; returned original text.`,
    };
  }
}

export const languageService = new LanguageService();
export default languageService;
