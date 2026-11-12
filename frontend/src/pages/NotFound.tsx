import React from 'react'
import { Link } from 'react-router-dom'
import { Scale, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
        <Scale className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Page or Legal Provision Not Found</h2>
        <p className="text-xs text-slate-500">
          The legal section or navigation workflow you are looking for does not exist or may have been relocated.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <Home className="w-4 h-4" /> Go to Home
        </Link>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
        >
          Ask Legal Assistant
        </Link>
      </div>
    </div>
  )
}
