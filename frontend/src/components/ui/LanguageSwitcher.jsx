import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/types";
export function LanguageSwitcher({ className = "", compact = false }) {
  const { i18n } = useTranslation();
  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };
  return <div
    className={`inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors ${className}`}
  ><Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" /><select
    value={i18n.language || "en"}
    onChange={(e) => handleLanguageChange(e.target.value)}
    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
    aria-label="Select language"
  >{SUPPORTED_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{compact ? l.code.toUpperCase() : `${l.nativeName} (${l.name})`}</option>)}</select></div>;
}
