import { useState, useEffect } from "react";
import { Eye, Type, Volume2, Sparkles, Check } from "lucide-react";

export default function AccessibilityToolbar({ className = "" }) {
  const [fontSize, setFontSize] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("nyayasaathi_font_size") || "md" : "md";
  });

  const [highContrast, setHighContrast] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("nyayasaathi_high_contrast") === "true" : false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("font-size-sm", "font-size-md", "font-size-lg", "font-size-xl");
    root.classList.add(`font-size-${fontSize}`);
    localStorage.setItem("nyayasaathi_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    localStorage.setItem("nyayasaathi_high_contrast", String(highContrast));
  }, [highContrast]);

  return (
    <div
      role="region"
      aria-label="Accessibility Options"
      className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs ${className}`}
    >
      {/* Font Size Scaling: A- / A / A+ */}
      <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <button
          onClick={() => setFontSize("sm")}
          title="Smaller font size (90%)"
          aria-label="Decrease font size"
          className={`px-2 py-1 text-[11px] font-bold transition-colors ${
            fontSize === "sm" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          A-
        </button>
        <button
          onClick={() => setFontSize("md")}
          title="Normal font size (100%)"
          aria-label="Reset font size to normal"
          className={`px-2 py-1 text-[11px] font-bold border-x border-slate-200 transition-colors ${
            fontSize === "md" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          A
        </button>
        <button
          onClick={() => setFontSize("lg")}
          title="Large font size (112.5%)"
          aria-label="Increase font size"
          className={`px-2 py-1 text-[11px] font-bold transition-colors ${
            fontSize === "lg" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          A+
        </button>
      </div>

      {/* High Contrast Mode Toggle */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        title={highContrast ? "Disable High Contrast" : "Enable High Contrast (WCAG 2.2 AA)"}
        aria-label={highContrast ? "Disable High Contrast" : "Enable High Contrast"}
        aria-pressed={highContrast}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-all ${
          highContrast
            ? "bg-amber-400 text-slate-950 border-amber-500 shadow-xs"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Contrast</span>
      </button>

      {/* Screen Reader Live Region for Announcements */}
      <div
        id="a11y-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {highContrast ? "High contrast mode enabled" : "Standard contrast mode"}
      </div>
    </div>
  );
}
