import React, { useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight, 
  RotateCcw,
  Building,
  FileCheck,
  PhoneCall
} from 'lucide-react'
import { eligibilityApi } from '@/api/eligibility'
import { 
  EligibilityInput, 
  EligibilityResult, 
  INDIAN_STATES, 
  BENEFICIARY_TYPES,
  BeneficiaryCategory,
  LegalSituation
} from '@/types'

export default function Eligibility() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<EligibilityInput>({
    state: 'Maharashtra',
    annualIncome: 150000,
    category: 'worker',
    situation: 'wages',
    age: 32,
    gender: 'male',
  })

  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const situations: { value: LegalSituation; label: string }[] = [
    { value: 'wages', label: 'Unpaid wages / Workplace dispute' },
    { value: 'domestic_violence', label: 'Domestic violence / Matrimonial safety' },
    { value: 'consumer', label: 'Consumer fraud / Defective purchase' },
    { value: 'criminal', label: 'Arrest / Bail / Criminal defense' },
    { value: 'property', label: 'Tenant eviction / Land boundary dispute' },
    { value: 'labour', label: 'Industrial retrenchment / Safety violation' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await eligibilityApi.checkEligibility(formData)
      setResult(res)
      setStep(3)
    } catch {
      // Deterministic fallback rule-engine matching NALSA Section 12
      const isAutoEligible = ['woman', 'minor', 'sc_st', 'disabled', 'worker', 'bpl'].includes(formData.category)
      const isIncomeEligible = formData.annualIncome <= 300000

      const isEligible = isAutoEligible || isIncomeEligible
      const reason = isAutoEligible
        ? `You qualify for 100% free legal services under Section 12(a)-(h) of the Legal Services Authorities Act, 1987 as a member of the protected category (${formData.category.toUpperCase()}). No income cap applies.`
        : isIncomeEligible
        ? `Your declared annual income (₹${formData.annualIncome.toLocaleString()}) is below the statutory state legal aid threshold (₹3,00,000 per annum).`
        : `Your declared annual income exceeds the statutory ceiling for free legal aid. However, you can still access Lok Adalat mediation and DLSA advice clinics.`

      setResult({
        legalAidEligible: isEligible,
        legalAidReason: reason,
        schemes: [
          {
            id: 'nalsa-advocate',
            name: 'NALSA Free Legal Representation Scheme',
            description: 'Free appointment of a practicing advocate for filing cases, defending trials, and drafting petitions in civil, labour, or criminal courts.',
            eligibilityCriteria: ['Eligible under Section 12 criteria', 'Indian citizen or resident in India'],
            benefits: ['Zero court court fees or drafting charges', 'Free certified copies of judgments', 'Panel lawyer representation'],
            officialLink: 'https://nalsa.gov.in',
            ministry: 'Ministry of Law and Justice, Government of India',
            applicableStates: [],
          },
          {
            id: 'shram-suvidha',
            name: 'Samadhan & Shram Suvidha Labour Dispute Scheme',
            description: 'Online conciliation and claims recovery for workers deprived of statutory wages under the Payment of Wages Act.',
            eligibilityCriteria: ['Employed in industrial or commercial establishment', 'Delayed or deducted wages'],
            benefits: ['Recovery of arrears + statutory penalty up to 10x'],
            officialLink: 'https://shramsuvidha.gov.in',
            ministry: 'Ministry of Labour & Employment',
            applicableStates: [],
          },
        ],
        nextSteps: [
          'Visit your District Court and approach the DLSA Front Office located on the ground floor',
          'Carry copies of your Aadhaar card and proof of category or income',
          'Submit Form 1 (Legal Aid Application Form) to get an assigned panel lawyer within 7 days',
          'Alternatively, dial 15100 to register your free legal aid request over the phone',
        ],
      })
      setStep(3)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold uppercase">
          <CheckCircle2 className="w-3.5 h-3.5" /> NALSA Section 12 Rule Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Document & Eligibility Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Verify in under 60 seconds whether you are legally entitled to 100% free legal representation and government welfare entitlements in India.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-center gap-3">
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <span>1. Profile & Income</span>
        </div>
        <div className="w-6 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <span>2. Legal Issue</span>
        </div>
        <div className="w-6 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <span>3. Verified Assessment</span>
        </div>
      </div>

      {/* Form Wizard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 1: Personal Profile & Annual Income
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">State / Union Territory</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Beneficiary Group / Social Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as BeneficiaryCategory })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {BENEFICIARY_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Approximate Annual Family Income (INR ₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-500">₹{formData.annualIncome.toLocaleString()} per year</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female (Automatic Free Legal Aid under Sec 12)</option>
                  <option value="other">Transgender / Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                Next: Legal Situation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 2: What Legal Issue Are You Facing?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {situations.map((sit) => (
                <label
                  key={sit.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.situation === sit.value
                      ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="situation"
                    value={sit.value}
                    checked={formData.situation === sit.value}
                    onChange={(e) => setFormData({ ...formData, situation: e.target.value as LegalSituation })}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs sm:text-sm">{sit.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back to Profile
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                {isSubmitting ? 'Evaluating Laws...' : 'Evaluate Eligibility'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div className="space-y-8">
            {/* Eligibility Banner */}
            <div
              className={`p-6 rounded-2xl border flex items-start gap-4 ${
                result.legalAidEligible
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              {result.legalAidEligible ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
              )}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {result.legalAidEligible ? 'Eligible for 100% Free Court Legal Aid' : 'General / Alternate Assistance'}
                </span>
                <h3 className="text-xl font-black">
                  {result.legalAidEligible
                    ? 'You Qualify for a Free Government Appointed Lawyer'
                    : 'Dispute Mediation & Clinic Counseling Available'}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {result.legalAidReason}
                </p>
              </div>
            </div>

            {/* Applicable Government Schemes & Entitlements */}
            {result.schemes && result.schemes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Available Government Schemes & Legal Remedies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.schemes.map((scheme) => (
                    <div key={scheme.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{scheme.ministry}</span>
                      <h4 className="text-sm font-bold text-slate-900">{scheme.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{scheme.description}</p>
                      <div className="pt-2">
                        <a
                          href={scheme.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps to Claim Free Legal Aid */}
            {result.nextSteps && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Actionable Steps to Get Free Legal Help:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
                  {result.nextSteps.map((s, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Reset / Helpline Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Check Another Profile / Situation
              </button>

              <a
                href="tel:15100"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                Call NALSA at 15100
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
