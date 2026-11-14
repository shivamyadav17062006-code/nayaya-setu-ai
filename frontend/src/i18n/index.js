import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";

// Supported Indian languages specification
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English", speechCode: "en-IN" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "mr", label: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
];

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("nyayasaathi_lang") || "en" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  saveMissing: false,
  missingKeyHandler: (lng, ns, key) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: "${key}" in language "${lng}" (namespace: "${ns}"). Falling back to English.`);
    }
  },
});

// Sync language changes with localStorage
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("nyayasaathi_lang", lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
