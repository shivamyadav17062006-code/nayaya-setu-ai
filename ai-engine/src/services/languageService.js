/**
 * Language detection and script analysis for Indian languages
 */

const SCRIPT_RANGES = [
  { lang: 'hi', regex: /[\u0900-\u097F]/ }, // Devanagari (Hindi, Marathi)
  { lang: 'ta', regex: /[\u0B80-\u0BFF]/ }, // Tamil
  { lang: 'te', regex: /[\u0C00-\u0C7F]/ }, // Telugu
  { lang: 'bn', regex: /[\u0980-\u09FF]/ }, // Bengali
  { lang: 'gu', regex: /[\u0A80-\u0AFF]/ }, // Gujarati
  { lang: 'kn', regex: /[\u0C80-\u0CFF]/ }, // Kannada
  { lang: 'ml', regex: /[\u0D00-\u0D7F]/ }, // Malayalam
  { lang: 'pa', regex: /[\u0A00-\u0A7F]/ }, // Gurmukhi (Punjabi)
  { lang: 'or', regex: /[\u0B00-\u0B7F]/ }, // Odia
  { lang: 'ur', regex: /[\u0600-\u06FF]/ }, // Arabic / Urdu
];

const HINDI_ROMANIZED_WORDS = [
  'salary', 'paisa', 'nahi', 'diya', 'vetan', 'dihadi', 'kaam', 'maalik',
  'shikayat', 'mahila', 'patni', 'dahej', 'marpeet', 'bacha', 'zameen', 'kiraya'
];

export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  for (const { lang, regex } of SCRIPT_RANGES) {
    if (regex.test(text)) {
      return lang;
    }
  }

  // Check Romanized Hindi keywords
  const lower = text.toLowerCase();
  let hits = 0;
  for (const word of HINDI_ROMANIZED_WORDS) {
    if (lower.includes(word)) hits++;
  }
  if (hits >= 2) return 'hi';

  return 'en';
}

export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  ur: 'Urdu',
};

export const SUPPORTED_LANGUAGES = LANGUAGE_NAMES;

