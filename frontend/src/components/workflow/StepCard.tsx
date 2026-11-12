import React, { useState } from 'react'
import { Clock, Building, ExternalLink, AlertCircle } from 'lucide-react'
import { WorkflowStep } from '@/types'

interface StepCardProps {
  step: WorkflowStep
}

export function StepCard({ step }: StepCardProps) {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }))
  }

  return (
    <div className="relative flex items-start gap-4 group">
      {/* Step Number Circle */}
      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md ring-4 ring-white z-10">
        {step.stepNumber}
      </div>

      {/* Step Card */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
          {step.timeLimitDays && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Within {step.timeLimitDays} days
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {step.description}
        </p>

        {/* Documents Required Checklist */}
        {step.requiredDocuments && step.requiredDocuments.length > 0 && (
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Documents Checklist (Check as you prepare):
            </span>
            <div className="space-y-1.5">
              {step.requiredDocuments.map((doc, idx) => {
                const isChecked = !!checkedDocs[doc]
                return (
                  <label
                    key={idx}
                    onClick={() => toggleDoc(doc)}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={isChecked ? 'line-through text-slate-400' : ''}>
                      {doc}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Authority & Official Portal */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Building className="w-3.5 h-3.5 text-amber-600" />
            Authority: {step.authorityName}
          </span>

          {step.officialLink && (
            <a
              href={step.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Official Government Portal <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Pro Tip */}
        {step.tips && step.tips.length > 0 && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>{step.tips[0]}</span>
          </div>
        )}
      </div>
    </div>
  )
}
