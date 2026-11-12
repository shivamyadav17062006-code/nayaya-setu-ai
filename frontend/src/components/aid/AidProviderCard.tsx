import React from 'react'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'
import { AidProvider } from '@/types'

interface AidProviderCardProps {
  provider: AidProvider
}

export function AidProviderCard({ provider }: AidProviderCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {provider.type}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{provider.name}</h3>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            {provider.state}
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{provider.address}</span>
        </div>

        {/* Contacts */}
        <div className="space-y-1 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <div className="flex flex-wrap gap-2">
              {provider.phone.map((ph, idx) => (
                <a key={idx} href={`tel:${ph}`} className="font-medium text-slate-800 hover:text-emerald-600">
                  {ph}
                </a>
              ))}
            </div>
          </div>

          {provider.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <a href={`mailto:${provider.email}`} className="text-slate-600 hover:underline">
                {provider.email}
              </a>
            </div>
          )}
        </div>

        {/* Services List */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Free Services Provided:
          </span>
          <ul className="text-xs text-slate-700 space-y-1">
            {provider.servicesOffered.map((srv, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{srv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Website Action */}
      {provider.website && (
        <div className="pt-3 border-t border-slate-100">
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            Visit Official Authority Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}
