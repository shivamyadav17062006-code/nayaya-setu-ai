import React from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import { Citation } from '@/types'

interface CitationBadgeProps {
  citation: Citation
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  const content = (
    <span className="inline-flex items-center gap-1.5 text-[11px] bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-medium transition-colors">
      <BookOpen className="w-3 h-3 text-amber-600" />
      <span>{citation.actName}</span>
      {citation.sectionNumber && (
        <span className="font-bold text-amber-700">§{citation.sectionNumber}</span>
      )}
      {citation.url && <ExternalLink className="w-2.5 h-2.5 text-slate-400 ml-0.5" />}
    </span>
  )

  if (citation.url) {
    return (
      <a href={citation.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}
