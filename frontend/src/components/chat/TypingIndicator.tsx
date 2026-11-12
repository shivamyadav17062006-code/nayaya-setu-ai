import React from 'react'
import { Scale } from 'lucide-react'

interface TypingIndicatorProps {
  statusText?: string
}

export function TypingIndicator({
  statusText = 'Retrieving statutory provisions & verifying jurisdiction...',
}: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
        </div>
        <span className="text-xs text-slate-500 ml-1">{statusText}</span>
      </div>
    </div>
  )
}
