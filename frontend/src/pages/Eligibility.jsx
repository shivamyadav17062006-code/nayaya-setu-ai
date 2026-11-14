import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  PhoneCall,
  HelpCircle,
  Building,
  Info,
  Lock,
  ChevronRight,
  Award,
  HeartHandshake
} from "lucide-react";
import { eligibilityApi } from "@/api/eligibility";
import { INDIAN_STATES } from "@/types";

const CATEGORIES = [
  {
    value: "woman",
    label: "Woman",
    desc: "Unconditionally entitled under Section 12(c). No income limit.",
    isExempt: true,
  },
  {
    value: "minor",
    label: "Child (Under 18 Years)",
    desc: "Unconditionally entitled under Section 12(c). No income limit.",
    isExempt: true,
  },
  {
    value: "sc_st",
    label: "Scheduled Caste (SC) / Scheduled Tribe (ST)",
    desc: "Statutorily entitled under Section 12(a). No income limit.",
    isExempt: true,
  },
  {
    value: "disabled",
    label: "Person with a Disability",
    desc: "Entitled under Section 12(d) & RPwD Act. No income limit.",
    isExempt: true,
  },
  {
    value: "custody",
    label: "Person in Custody / Undertrial",
    desc: "Entitled under Section 12(g). Free bail & trial defense.",
    isExempt: true,
  },
  {
    value: "disaster_victim",
    label: "Victim of Disaster / Calamity / Atrocity",
    desc: "Entitled under Section 12(e) for circumstances of undeserved want.",
    isExempt: true,
  },
  {
    value: "worker",
    label: "Industrial Workman / Labourer",
    desc: "Entitled under Section 12(f) for industrial & wage disputes.",
    isExempt: true,
  },
  {
    value: "senior_citizen",
    label: "Senior Citizen (Age 60+)",
    desc: "Priority assistance before Maintenance Tribunals & higher income limits.",
    isExempt: false,
  },
  {
    value: "transgender",
    label: "Transgender Person",
    desc: "Affirmative legal aid under NALSA v. UOI (2014) guidelines.",
    isExempt: true,
  },
  {
    value: "general",
    label: "General Citizen / Other",
    desc: "Evaluated under Section 12(h) based on state annual income ceilings.",
    isExempt: false,
  },
];

const COURT_LEVELS = [
  { value: "SUBORDINATE_COURT", label: "District / Subordinate Courts (Magistrate, Civil, Sessions)", desc: "Governed by State Legal Services Authority Rules." },
  { value: "HIGH_COURT", label: "High Court of the State", desc: "Governed by High Court Legal Services Committee Rules." },
  { value: "SUPREME_COURT", label: "Supreme Court of India (All-India)", desc: "Governed by Supreme Court Legal Services Committee (₹5 Lakh limit)." },
];

export default function Eligibility() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "woman",
    state: "Delhi",
    courtLevel: "SUBORDINATE_COURT",
    annualIncome: "",
    situation: "general",
    age: "",
    gender: "",
    userConsent: false,
  });

  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomeLimits, setIncomeLimits] = useState([]);
  const [activeStateLimit, setActiveStateLimit] = useState(300000);

  // Fetch state income limits on mount or state change
  useEffect(() => {
    async function fetchLimits() {
      try {
        const limits = await eligibilityApi.getIncomeLimits(formData.state);
        setIncomeLimits(limits);
        if (limits.length > 0) {
          const matched = limits.find((l) => l.courtLevel === formData.courtLevel) || limits[0];
          setActiveStateLimit(matched.annualIncomeLimit);
        } else {
          setActiveStateLimit(formData.courtLevel === "SUPREME_COURT" ? 500000 : 300000);
        }
      } catch {
        setActiveStateLimit(300000);
      }
    }
    fetchLimits();
  }, [formData.state, formData.courtLevel]);

  const selectedCategoryObj = CATEGORIES.find((c) => c.value === formData.category) || CATEGORIES[0];
  const isSelectedExempt = selectedCategoryObj.isExempt;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await eligibilityApi.checkEligibility({
        ...formData,
        category: formData.category.toUpperCase(),
        annualIncome: isSelectedExempt && !formData.annualIncome ? null : formData.annualIncome,
      });
      setResult(res);
      setCurrentStep(4);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setResult(null);
    setFormData({
      category: "woman",
      state: "Delhi",
      courtLevel: "SUBORDINATE_COURT",
      annualIncome: "",
      situation: "general",
      age: "",
      gender: "",
      userConsent: false,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
          <HeartHandshake className="w-3.5 h-3.5" /> Legal Aid & Services Assistant
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          NALSA Free Legal Aid Eligibility Evaluator
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Under Section 12 of the <strong>Legal Services Authorities Act, 1987</strong>, Indian citizens
          facing court or police proceedings are entitled to 100% free legal representation, exemption
          from court fees, and panel advocate services. Evaluate your statutory entitlement below.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>Questionnaire Step {currentStep} of 4</span>
          <span className="text-emerald-700">
            {currentStep === 1 && "Beneficiary Category"}
            {currentStep === 2 && "Jurisdiction & Court Level"}
            {currentStep === 3 && "Financial & Legal Circumstances"}
            {currentStep === 4 && "Evaluation Result"}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* QUESTIONNAIRE: STEP 1 — CATEGORY */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Step 1: Which category best describes your situation?
            </h2>
            <p className="text-xs text-slate-500">
              The Legal Services Authorities Act provides automatic free legal aid to specific protected
              groups regardless of income. Select the category that applies to you:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat.value;
              return (
                <div
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{cat.label}</span>
                    {cat.isExempt ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full shrink-0">
                        No Income Cap
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full shrink-0">
                        Income Tested
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">{cat.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Continue to Step 2 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE: STEP 2 — JURISDICTION & COURT */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Step 2: Where is your case located or to be filed?
            </h2>
            <p className="text-xs text-slate-500">
              Statutory income ceilings are determined individually by each State Government and Court Level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                State or Union Territory:
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Court Level:
              </label>
              <select
                value={formData.courtLevel}
                onChange={(e) => setFormData({ ...formData, courtLevel: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {COURT_LEVELS.map((cl) => (
                  <option key={cl.value} value={cl.value}>
                    {cl.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">
                Applicable Statutory Threshold for {formData.state}:
              </span>
              <span>
                Under {formData.state} Legal Services Authority Rules, the annual income ceiling for{" "}
                {formData.courtLevel === "SUPREME_COURT" ? "Supreme Court" : "subordinate courts"} is{" "}
                <strong>₹{activeStateLimit.toLocaleString("en-IN")} per annum</strong>. Citizens falling in
                affirmative categories (e.g. Women, SC/ST, Disability) are exempt from this ceiling.
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Continue to Step 3 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE: STEP 3 — FINANCIAL & LEGAL DETAILS */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Step 3: Income & Specific Legal Circumstances
            </h2>
            <p className="text-xs text-slate-500">
              {isSelectedExempt
                ? `You selected "${selectedCategoryObj.label}". Income information is optional because this category qualifies unconditionally under Section 12.`
                : `Because your category is subject to Section 12(h), your declared annual income determines free legal representation eligibility.`}
            </p>
          </div>

          {isSelectedExempt ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950 block">
                  Automatic Statutory Exemption Activated
                </span>
                <span>
                  Under Section 12 of the Legal Services Authorities Act, 1987, you are not legally required
                  to declare or prove your income to receive free legal aid. You may leave the income field
                  blank or provide it optionally.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Approximate Annual Household Income (₹ INR):
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                placeholder="e.g. 150000"
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                required={!isSelectedExempt}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 block">
                Current statutory ceiling in {formData.state}: ₹{activeStateLimit.toLocaleString("en-IN")} per annum.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Nature of Case / Legal Need:
            </label>
            <select
              value={formData.situation}
              onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="general">Civil / Property / Contract Dispute</option>
              <option value="domestic_violence">Domestic Abuse / Matrimonial Maintenance</option>
              <option value="wages">Unpaid Wages / Labour Dispute</option>
              <option value="criminal">Criminal Defense / Police Arrest / Bail</option>
              <option value="consumer">Consumer Redressal / Financial Fraud</option>
              <option value="senior_maintenance">Senior Citizen Care & Eviction Protection</option>
            </select>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.userConsent}
                onChange={(e) => setFormData({ ...formData, userConsent: e.target.checked })}
                className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-slate-700">
                (Optional) Save this assessment privately to my local session so I can resume or export it
                later. I understand that NyayaSaathi does not sell or share my data.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Evaluating Criteria..." : "Evaluate Legal Aid Eligibility"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* EVALUATION RESULTS: STEP 4 */}
      {currentStep === 4 && result && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
              result.status === "POTENTIALLY_ELIGIBLE"
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                : result.status === "MORE_INFORMATION_REQUIRED"
                ? "bg-amber-50/80 border-amber-300 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {result.status === "POTENTIALLY_ELIGIBLE" ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                ) : result.status === "MORE_INFORMATION_REQUIRED" ? (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Info className="w-6 h-6 stroke-[2.5]" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Evaluation Result
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {result.status === "POTENTIALLY_ELIGIBLE" && "Potentially Eligible for Free Legal Aid"}
                    {result.status === "POTENTIALLY_NOT_ELIGIBLE" && "Exceeds Free Legal Representation Limit"}
                    {result.status === "MORE_INFORMATION_REQUIRED" && "More Information Required"}
                    {result.status === "HUMAN_VERIFICATION_RECOMMENDED" && "Human Verification Recommended"}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Edit Answers
              </button>
            </div>

            {/* Statutory Clause Badge */}
            {result.statutoryClause && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Statutory Basis: {result.statutoryClause}
              </div>
            )}

            {/* Explanation Prose */}
            <p className="text-xs sm:text-sm leading-relaxed">{result.explanation}</p>

            {/* Direct CTA: Find Providers */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={`/aid-finder?state=${encodeURIComponent(formData.state)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Building className="w-4 h-4 text-amber-400" /> Find Legal Aid Centers in {formData.state}
              </Link>

              <a
                href="tel:15100"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" /> Dial NALSA Helpline (15100)
              </a>
            </div>
          </div>

          {/* Statutory Disclaimer Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950 block">Statutory Non-Approval Disclaimer:</span>
              <p className="leading-relaxed">{result.disclaimer}</p>
            </div>
          </div>

          {/* Actionable Schemes & Next Steps */}
          {result.schemes && result.schemes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Available Statutory Legal Aid Schemes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.schemes.map((s, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                        {s.authority}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                    {s.benefits && s.benefits.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-slate-800 text-[11px] block">Statutory Benefits:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                          {s.benefits.slice(0, 3).map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium text-[11px]">{s.contactInfo}</span>
                      {s.officialUrl && (
                        <a
                          href={s.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800 text-[11px]"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Nearby Providers */}
          {result.recommendedProviders && result.recommendedProviders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Official Legal Services Offices in {formData.state}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.recommendedProviders.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {p.type}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Verified</span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{p.address}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                      <span>Helpline: {p.helpline || p.phone || "15100"}</span>
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5">
                          Portal <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset / Recalculate */}
          <div className="text-center pt-4">
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Start a new evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
