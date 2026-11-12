import React from 'react'
import { Workflow } from '@/types'
import { StepCard } from './StepCard'

interface WorkflowStepperProps {
  workflow: Workflow
}

export function WorkflowStepper({ workflow }: WorkflowStepperProps) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-2">
        <h2 className="text-lg font-bold text-amber-950">{workflow.title}</h2>
        <p className="text-xs text-amber-900/80 leading-relaxed">{workflow.description}</p>
        <div className="flex items-center gap-4 text-[11px] font-semibold text-amber-900 pt-2">
          <span>Total Steps: {workflow.totalSteps}</span>
          <span>•</span>
          <span>Typical Resolution Timeline: ~{workflow.estimatedDays} days</span>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
        {workflow.steps.map((step) => (
          <StepCard key={step.id || step.stepNumber} step={step} />
        ))}
      </div>
    </div>
  )
}
