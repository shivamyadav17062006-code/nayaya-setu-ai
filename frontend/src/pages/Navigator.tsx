import React, { useState, useEffect } from 'react'
import { 
  Compass, 
  Briefcase, 
  ShieldAlert, 
  ShoppingBag, 
  FileText, 
  ExternalLink, 
  Clock, 
  Building, 
  CheckSquare, 
  Printer,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { workflowsApi } from '@/api/workflows'
import { Workflow } from '@/types'

export default function Navigator() {
  const [selectedWorkflowKey, setSelectedWorkflowKey] = useState('labour')
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})

  const categories = [
    { key: 'labour', title: 'Unpaid Salary / Delayed Wages', icon: Briefcase, color: 'amber' },
    { key: 'domestic_violence', title: 'Domestic Violence & Safety Order', icon: ShieldAlert, color: 'rose' },
    { key: 'consumer', title: 'Defective Product / Online Fraud', icon: ShoppingBag, color: 'emerald' },
  ]

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const data = await workflowsApi.getWorkflowByCategory(selectedWorkflowKey)
        setWorkflow(data)
      } catch {
        // Fallback robust workflows
        if (selectedWorkflowKey === 'labour') {
          setWorkflow({
            id: 'wf-labour',
            categoryId: 'labour',
            title: 'Recovery of Unpaid Wages or Delayed Salary',
            description: 'Statutory legal recovery process under the Payment of Wages Act, 1936 and Industrial Disputes Act for formal or daily wage earners.',
            totalSteps: 4,
            estimatedDays: 30,
            steps: [
              {
                id: 's1',
                stepNumber: 1,
                title: 'Collate Proof of Employment & Attendance Records',
                description: 'Collect all documents confirming the employer-employee relationship and the work carried out during the unpaid period.',
                requiredDocuments: [
                  'Offer letter or work agreement',
                  'Past bank statements showing salary credits',
                  'Attendance muster log or biometric screenshots',
                  'WhatsApp chats or emails discussing work tasks',
                ],
                authorityName: 'Your Records / Local Trade Union',
                timeLimitDays: 7,
                tips: ['Even informal text messages and UPI logs are accepted as primary evidence under the Indian Evidence Act.'],
              },
              {
                id: 's2',
                stepNumber: 2,
                title: 'Serve a Formal Demand Letter / Legal Notice',
                description: 'Send a written demand via Registered Post AD or email giving the employer 7 to 15 days to disburse pending dues with statutory interest.',
                requiredDocuments: ['Demand letter copy with Postal / Email Delivery receipt'],
                authorityName: 'Employer Management / HR',
                timeLimitDays: 14,
                tips: ['Mention Section 15 of Payment of Wages Act: delayed wages attract penalty up to 10x the amount.'],
              },
              {
                id: 's3',
                stepNumber: 3,
                title: 'Lodge Grievance on Shram Suvidha / Samadhan Portal',
                description: 'Register an online conciliation dispute on the Ministry of Labour portal (SAMADHAN) or your State Labour Commission portal.',
                requiredDocuments: ['Digital copies of Demand Notice and salary proof'],
                authorityName: 'Labour Conciliation Officer',
                officialLink: 'https://shramsuvidha.gov.in',
                timeLimitDays: 15,
                tips: ['Conciliation meetings are free and do not require engaging an advocate.'],
              },
              {
                id: 's4',
                stepNumber: 4,
                title: 'File Claim with Labour Court / DLSA Authority',
                description: 'If conciliation fails, the Conciliation Officer refers the case to the Labour Court. Free legal representation is guaranteed via NALSA / DLSA.',
                requiredDocuments: ['Conciliation failure report', 'Affidavit of claim'],
                authorityName: 'District Labour Court / DLSA',
                officialLink: 'https://nalsa.gov.in',
                timeLimitDays: 30,
                tips: ['Call 15100 to request an empanelled legal aid advocate free of charge.'],
              },
            ],
          })
        } else if (selectedWorkflowKey === 'domestic_violence') {
          setWorkflow({
            id: 'wf-dv',
            categoryId: 'domestic_violence',
            title: 'Protection Order & Shelter against Domestic Abuse',
            description: 'Emergency safety and judicial remedies under the Protection of Women from Domestic Violence Act (PWDVA), 2005.',
            totalSteps: 3,
            estimatedDays: 7,
            steps: [
              {
                id: 'dv1',
                stepNumber: 1,
                title: 'Emergency Help & Police Dispatch',
                description: 'Call Emergency 112 or Women Helpline 181 immediately. Request medical aid and temporary shelter if facing physical threats.',
                requiredDocuments: ['Identity card (Aadhaar/Voter ID if accessible)'],
                authorityName: 'Emergency Response 112 / One Stop Centre (OSC)',
                officialLink: 'https://wcd.nic.in',
                timeLimitDays: 1,
              },
              {
                id: 'dv2',
                stepNumber: 2,
                title: 'Register Domestic Incident Report (DIR)',
                description: 'Meet the Taluka/District Protection Officer (PO) or service provider to record a standardized Domestic Incident Report (DIR).',
                requiredDocuments: ['Medical injury report (if any)', 'Proof of matrimonial/shared residence'],
                authorityName: 'District Protection Officer / DLSA',
                timeLimitDays: 3,
              },
              {
                id: 'dv3',
                stepNumber: 3,
                title: 'Application to Magistrate for Immediate Protection Order',
                description: 'Protection Officer submits DIR to the Judicial Magistrate under Section 12 seeking Protection Orders (Sec 18) and Residence Orders (Sec 19).',
                requiredDocuments: ['DIR copy', 'Income details of respondent (for maintenance)'],
                authorityName: 'Judicial Magistrate First Class (JMFC)',
                officialLink: 'https://nalsa.gov.in',
                timeLimitDays: 3,
                tips: ['The magistrate is legally required to hold the first hearing within 3 days.'],
              },
            ],
          })
        } else {
          setWorkflow({
            id: 'wf-consumer',
            categoryId: 'consumer',
            title: 'Consumer Dispute Resolution (Defective Goods / Services)',
            description: 'Online grievance and compensation filing under Consumer Protection Act 2019 via National Consumer Helpline and e-Daakhil.',
            totalSteps: 3,
            estimatedDays: 45,
            steps: [
              {
                id: 'c1',
                stepNumber: 1,
                title: 'Preserve Transaction Proof & Written Complaint',
                description: 'Save invoice, warranty card, delivery receipts, photos/videos of defective item, and email thread with the seller/company.',
                requiredDocuments: ['Tax Invoice / Bill', 'Warranty card', 'Photos/Videos of defect', 'Customer support ticket'],
                authorityName: 'Seller / E-commerce platform',
                timeLimitDays: 7,
              },
              {
                id: 'c2',
                stepNumber: 2,
                title: 'Call 1915 or File on National Consumer Helpline (NCH)',
                description: 'File an online ticket on consumerhelpline.gov.in or WhatsApp 8800001915. Most registered companies resolve complaints within 15-30 days.',
                requiredDocuments: ['Invoice copy', 'Complaint narrative'],
                authorityName: 'National Consumer Helpline (NCH)',
                officialLink: 'https://consumerhelpline.gov.in',
                timeLimitDays: 15,
              },
              {
                id: 'c3',
                stepNumber: 3,
                title: 'File E-Complaint on e-Daakhil Portal',
                description: 'If unresolved, file an official case before the District Consumer Disputes Redressal Commission electronically via e-Daakhil without hiring a lawyer.',
                requiredDocuments: ['Statement of facts', 'Supporting invoices', 'Demand of refund + compensation amount'],
                authorityName: 'District Consumer Commission',
                officialLink: 'https://edaakhil.nic.in',
                timeLimitDays: 30,
              },
            ],
          })
        }
      }
    }
    loadWorkflow()
  }, [selectedWorkflowKey])

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase">
            <Compass className="w-3.5 h-3.5" /> Action Navigator
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Step-by-Step Complaint Redressal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Know exactly what documents to gather, which authority to contact, and how long the process takes under Indian law.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" /> Print Guide
        </button>
      </div>

      {/* Category selector pills */}
      <div className="flex flex-wrap gap-3">
        {categories.map((c) => {
          const Icon = c.icon
          const isSelected = selectedWorkflowKey === c.key
          return (
            <button
              key={c.key}
              onClick={() => setSelectedWorkflowKey(c.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              {c.title}
            </button>
          )
        })}
      </div>

      {/* Workflow Details */}
      {workflow && (
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

          {/* Stepper Timeline */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
            {workflow.steps.map((step) => (
              <div key={step.id} className="relative flex items-start gap-4 group">
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
