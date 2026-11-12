import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, MessageSquare, Compass, ExternalLink } from 'lucide-react'
import { LegalSection } from '@/types'

interface SectionCardProps {
  section: LegalSection
}

export function SectionCard({ section }: SectionCardProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
      {/* Act & Section Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {section.sectionNumber}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {section.actName} {section.year && `(${section.year})`}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
        </div>

        {section.beneficiaryTypes && (
          <div className="flex flex-wrap gap-1">
            {section.beneficiaryTypes.map((b, i) => (
              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Simplified Explanation */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Simplified Plain Meaning:
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/60">
          {section.simplifiedText}
        </p>
      </div>

      {/* Original Statute Accordion */}
      {section.originalText && (
        <div className="pt-1">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            {showOriginal ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Hide Original Legal Gazette Text
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Read Original Statute / Act Section
              </>
            )}
          </button>

          {showOriginal && (
            <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed space-y-1">
              <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">
                Authentic Statutory Text (Source: India Code):
              </span>
              <p>{section.originalText}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/chat?q=${encodeURIComponent(`Explain my rights under ${section.actName} ${section.sectionNumber}`)}`}
            className="inline-flex items-center gap-1.5 font-semibold text-amber-600 hover:text-amber-700"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Ask Assistant About This
          </Link>

          <Link
            to="/navigator"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
          >
            <Compass className="w-3.5 h-3.5" /> View Complaint Steps
          </Link>
        </div>

        {section.complaintUrl && (
          <a
            href={section.complaintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
          >
            Statutory Redressal Portal <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
