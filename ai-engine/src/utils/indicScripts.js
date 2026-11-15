/**
 * Unicode range-based language detector for Indic languages.
 * Detects Indian scripts deterministically without external binary dependencies.
 */

export const INDIC_SCRIPTS = [
  { lang: 'hi', name: 'Hindi', script: 'Devanagari', regex: /[\u0900-\u097F]/ },
  { lang: 'mr', name: 'Marathi', script: 'Devanagari', regex: /[\u0900-\u097F]/ },
  { lang: 'bn', name: 'Bengali', script: 'Bengali', regex: /[\u0980-\u09FF]/ },
  { lang: 'ta', name: 'Tamil', script: 'Tamil', regex: /[\u0B80-\u0BFF]/ },
  { lang: 'te', name: 'Telugu', script: 'Telugu', regex: /[\u0C00-\u0C7F]/ },
  { lang: 'kn', name: 'Kannada', script: 'Kannada', regex: /[\u0C80-\u0CFF]/ },
  { lang: 'ml', name: 'Malayalam', script: 'Malayalam', regex: /[\u0D00-\u0D7F]/ },
  { lang: 'gu', name: 'Gujarati', script: 'Gujarati', regex: /[\u0A80-\u0AFF]/ },
  { lang: 'pa', name: 'Punjabi', script: 'Gurmukhi', regex: /[\u0A00-\u0A7F]/ },
  { lang: 'or', name: 'Odia', script: 'Odia', regex: /[\u0B00-\u0B7F]/ },
  { lang: 'ur', name: 'Urdu', script: 'Perso-Arabic', regex: /[\u0600-\u06FF]/ },
];

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', native: 'English' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  mr: { name: 'Marathi', native: 'मराठी' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ' },
  ur: { name: 'Urdu', native: 'اردو' },
  es: { name: 'Spanish', native: 'Español' },
  fr: { name: 'French', native: 'Français' },
  de: { name: 'German', native: 'Deutsch' },
};

/**
 * Detects the language of a text string.
 * Examines Unicode codepoints for Indic scripts and vocabulary markers.
 *
 * @param {string} text
 * @returns {{ code: string, name: string, confidence: number }}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { code: 'en', name: 'English', confidence: 1.0 };
  }

  // Check Indic scripts by counting matching characters
  let highestCount = 0;
  let detected = null;

  for (const item of INDIC_SCRIPTS) {
    const matches = text.match(new RegExp(item.regex, 'g'));
    const count = matches ? matches.length : 0;
    if (count > highestCount && count >= 2) {
      highestCount = count;
      detected = item;
    }
  }

  if (detected) {
    // If Devanagari script, check for Marathi vs Hindi lexical clues
    // Note: Do not use \b with Unicode scripts in JS regex as \b only handles ASCII word characters
    if (detected.lang === 'hi' || detected.lang === 'mr') {
      const isMarathi = /(आहे|नाहीत|नाही|झाले|केले|पाहिजे|माझे|त्यांचे|कामगार|पगार|करावे|काय|कसे|माझ्या|मालकाने|नमस्कार)/i.test(text);
      if (isMarathi) {
        return { code: 'mr', name: 'Marathi', confidence: 0.95 };
      }
      return { code: 'hi', name: 'Hindi', confidence: 0.95 };
    }
    return { code: detected.lang, name: detected.name, confidence: 0.95 };
  }

  // Check for common Romanized Hindi / Hinglish keywords (requiring distinct Indic words)
  const hinglishMatches = text.match(/\b(mera|meri|mere|mujhe|hum|paisa|vetan|nahi|mili|mila|kya|karu|karein|kaise|shikayat|maalik|patni|aurat|dahej|kanoon|vakil|adhikar|dhara)\b/gi);
  if (hinglishMatches && hinglishMatches.length >= 2) {
    return { code: 'hi', name: 'Hindi (Romanized / Hinglish)', confidence: 0.85, isHinglish: true };
  }

  // Check for Spanish markers
  if (/[¿¡]/.test(text) || /\b(hola|por favor|derechos|trabajo|salario|sueldo|abogado|ayuda|ley|que puedo hacer)\b/i.test(text)) {
    return { code: 'es', name: 'Spanish', confidence: 0.9 };
  }

  // Check for French markers
  if (/\b(bonjour|droits|loi|salaire|travail|avocat|aide|plainte|que faire)\b/i.test(text)) {
    return { code: 'fr', name: 'French', confidence: 0.9 };
  }

  // Check for German markers
  if (/\b(hallo|recht|rechte|arbeit|gehalt|lohn|anwalt|hilfe|gesetz)\b/i.test(text)) {
    return { code: 'de', name: 'German', confidence: 0.9 };
  }

  return { code: 'en', name: 'English', confidence: 0.99 };
}

export default detectLanguage;
