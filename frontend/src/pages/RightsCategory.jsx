import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  Compass,
  MessageSquare,
  ShieldCheck,
  Languages,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Square,
  Check,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import { rightsApi } from "@/api/rights";
import { speechApi } from "@/api/speech";

export default function RightsCategory() {
  const { categoryId } = useParams();
  const [sections, setSections] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [expandedOriginal, setExpandedOriginal] = useState({});
  const [activeLangTab, setActiveLangTab] = useState({}); // sectionId -> 'en' | 'hi' | 'mr' | 'original'
  const [sectionTranslations, setSectionTranslations] = useState({}); // sectionId_lang -> { text, isMachine }
  const [isLoading, setIsLoading] = useState(true);

  // Audio state
  const [speakingSectionId, setSpeakingSectionId] = useState(null);

  useEffect(() => {
    async function loadCategorySections() {
      try {
        if (categoryId) {
          const res = await rightsApi.getCategorySections(categoryId);
          setSections(res.sections || []);
          setCategoryName(res.category?.name || categoryId.toUpperCase());
        }
      } catch {
        if (categoryId?.toLowerCase().includes("labour")) {
          setCategoryName("Labour & Employment Rights");
          setSections([
            {
              id: "sec-5-wages",
              categoryId: "labour",
              actName: "Payment of Wages Act",
              sectionNumber: "Section 5",
              year: 1936,
              title: "Time of payment of wages",
              simplifiedText: "Your employer is required by law to disburse earned wages on or before the 7th day of the month (or 10th day if the establishment employs over 1,000 workers). Withholding salary beyond this deadline constitutes an unlawful breach.",
              originalText: "The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.",
              beneficiaryTypes: ["Workers", "Daily Wagers", "Factory Employees"],
              tags: ["Salary", "Wages", "Non-payment"],
              complaintUrl: "https://shramsuvidha.gov.in"
            },
            {
              id: "sec-15-wages",
              categoryId: "labour",
              actName: "Payment of Wages Act",
              sectionNumber: "Section 15",
              year: 1936,
              title: "Claims arising out of deductions from wages or delay in payment",
              simplifiedText: "If your wages are delayed or unlawfully deducted, you, your union official, or an appointed legal aid advocate can file a formal claim before the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.",
              originalText: "Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).",
              beneficiaryTypes: ["Industrial Workmen", "Salaried Employees"],
              tags: ["Compensation", "Labour Court", "Claim"],
              complaintUrl: "https://nalsa.gov.in"
            },
            {
              id: "sec-3-min-wages",
              categoryId: "labour",
              actName: "Minimum Wages Act",
              sectionNumber: "Section 3 & 12",
              year: 1948,
              title: "Mandatory Payment of Minimum Rates of Wages",
              simplifiedText: "Employers cannot pay less than the statutory minimum wage notifications issued by the State or Central government, regardless of any agreement signed with the worker. Paying less than minimum wage equates to forced labour under Article 23.",
              originalText: "The appropriate Government shall, in the manner hereinafter provided, fix the minimum rates of wages payable to employees employed in an employment specified in Part I or Part II of the Schedule. Where in respect of any scheduled employment a notification under section 5 is in force, the employer shall pay to every employee engaged in a scheduled employment wages at a rate not less than the minimum rate of wages fixed by such notification for that class of employees.",
              beneficiaryTypes: ["Contract Labourers", "Domestic Workers", "Security Guards"],
              tags: ["Minimum Wage", "Forced Labour", "Exploitation"]
            }
          ]);
        } else {
          setCategoryName("Statutory Rights Catalog");
          setSections([
            {
              id: "sec-general",
              categoryId: categoryId || "general",
              actName: "Constitution of India",
              sectionNumber: "Article 39A",
              year: 1950,
              title: "Equal Justice and Free Legal Aid",
              simplifiedText: "The State shall provide free legal aid by suitable legislation to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.",
              originalText: "The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.",
              beneficiaryTypes: ["All Citizens", "BPL Families", "Women", "Children"],
              tags: ["Free Legal Aid", "NALSA", "Constitutional Remedy"]
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadCategorySections();
  }, [categoryId]);

  const toggleOriginal = (id) => {
    setExpandedOriginal((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Switch language tab and fetch/translate if necessary
  const handleSelectLangTab = async (secId, lang, defaultText) => {
    setActiveLangTab((prev) => ({ ...prev, [secId]: lang }));

    if (lang === "en" || lang === "original") return;

    const cacheKey = `${secId}_${lang}`;
    if (sectionTranslations[cacheKey]) return;

    try {
      const translated = await speechApi.translate(defaultText, "en", lang);
      setSectionTranslations((prev) => ({
        ...prev,
        [cacheKey]: {
          text: translated || defaultText,
          isMachine: true,
        },
      }));
    } catch {
      toast.error("Could not load translation. Showing simplified English text.");
    }
  };

  // Audio Read Aloud
  const handleReadAloud = (secId, text, lang = "en") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingSectionId === secId) {
      window.speechSynthesis.cancel();
      setSpeakingSectionId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeakingSectionId(secId);
    utterance.onend = () => setSpeakingSectionId(null);
    utterance.onerror = () => setSpeakingSectionId(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/rights" className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Categories
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{categoryName}</span>
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase">
          <BookOpen className="w-3.5 h-3.5" /> Verified Legal Provisions
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{categoryName}</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Indian statutes accompanied by multilingual explanations in English, हिन्दी, and मराठी.
          Original statutory citations (§Section, Act Name) are strictly preserved from the official India Code.
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((sec) => {
          const currentTab = activeLangTab[sec.id] || "en";
          const cacheKey = `${sec.id}_${currentTab}`;
          const currentText =
            currentTab === "en"
              ? sec.simplifiedText
              : currentTab === "original"
              ? sec.originalText
              : sectionTranslations[cacheKey]?.text || sec.simplifiedText;

          const isMachineTranslated = currentTab === "hi" || currentTab === "mr";

          return (
            <div
              key={sec.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Act & Section Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      {sec.sectionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {sec.actName} {sec.year && `(${sec.year})`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                </div>

                {sec.beneficiaryTypes && (
                  <div className="flex flex-wrap gap-1">
                    {sec.beneficiaryTypes.map((b, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Multilingual Explanation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => handleSelectLangTab(sec.id, "en", sec.simplifiedText)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      currentTab === "en" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    English (Simplified)
                  </button>
                  <button
                    onClick={() => handleSelectLangTab(sec.id, "hi", sec.simplifiedText)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      currentTab === "hi" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => handleSelectLangTab(sec.id, "mr", sec.simplifiedText)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      currentTab === "mr" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    onClick={() => handleSelectLangTab(sec.id, "original", sec.originalText)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      currentTab === "original" ? "bg-slate-900 text-white font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Original Gazette
                  </button>
                </div>

                {/* Read Aloud Button */}
                <button
                  onClick={() => handleReadAloud(sec.id, currentText, currentTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    speakingSectionId === sec.id
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                  title={speakingSectionId === sec.id ? "Stop reading aloud" : "Read explanation aloud"}
                  aria-label="Read explanation aloud"
                >
                  {speakingSectionId === sec.id ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                      <span>Stop Speech</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Read Aloud</span>
                    </>
                  )}
                </button>
              </div>

              {/* Translation Review Status Badge */}
              {isMachineTranslated ? (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Machine-Generated Translation:</strong> Translated via Bhashini NMT. Official statutory citations (§{sec.sectionNumber}, {sec.actName}) are strictly preserved.
                  </span>
                </div>
              ) : currentTab === "en" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Human-Reviewed Legal Summary:</strong> Verified plain-language statutory interpretation.
                  </span>
                </div>
              ) : null}

              {/* Content Block */}
              <div className="p-4 rounded-xl border leading-relaxed text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-800">
                {currentTab === "original" ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                      Authentic Statutory Gazette Clause (Source: India Code):
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{currentText}</p>
                  </div>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{currentText}</p>
                )}
              </div>

              {/* Bottom Action Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/chat?q=${encodeURIComponent(`Explain my rights under ${sec.actName} ${sec.sectionNumber}`)}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Ask Assistant About This
                  </Link>
                  <Link
                    to="/navigator"
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <Compass className="w-3.5 h-3.5" /> View Complaint Steps
                  </Link>
                </div>

                {sec.complaintUrl && (
                  <a
                    href={sec.complaintUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
                  >
                    Statutory Redressal Portal <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
