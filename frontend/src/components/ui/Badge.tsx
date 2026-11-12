import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'slate'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }

  const variantStyles = {
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-800 border border-blue-200/80',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200/80',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
