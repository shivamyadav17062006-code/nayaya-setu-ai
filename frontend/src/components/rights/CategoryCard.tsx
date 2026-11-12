import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Scale, LucideIcon } from 'lucide-react'
import { RightCategory } from '@/types'

interface CategoryCardProps {
  category: RightCategory
  iconComponent?: LucideIcon
}

export function CategoryCard({ category, iconComponent: Icon = Scale }: CategoryCardProps) {
  return (
    <Link
      to={`/rights/${category.slug || category.id}`}
      className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {category.sectionCount} Sections
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        </div>

        {category.beneficiaryTypes && category.beneficiaryTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {category.beneficiaryTypes.map((ben, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                {ben}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
        <span>View Legal Provisions</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
