import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  Scale, 
  Eye, 
  EyeOff, 
  Compass, 
  MessageSquare,
  ShieldCheck,
  Building
} from 'lucide-react'
import { rightsApi } from '@/api/rights'
import { LegalSection } from '@/types'

export default function RightsCategory() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [sections, setSections] = useState<LegalSection[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [expandedOriginal, setExpandedOriginal] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCategorySections() {
      try {
        if (categoryId) {
          const res = await rightsApi.getCategorySections(categoryId)
          setSections(res.sections || [])
          setCategoryName(res.category?.name || categoryId.toUpperCase())
        }
      } catch {
        // Fallback demo data if backend seed is being fetched
        if (categoryId?.toLowerCase().includes('labour')) {
          setCategoryName('Labour & Employment Rights')
          setSections([
            {
              id: 'sec-5-wages',
              categoryId: 'labour',
              actName: 'Payment of Wages Act',
              sectionNumber: 'Section 5',
              year: 1936,
              title: 'Time of payment of wages',
              simplifiedText: 'Your employer is required by law to disburse earned wages on or before the 7th day of the month (or 10th day if the establishment employs over 1,000 workers). Withholding salary beyond this deadline constitutes an unlawful breach.',
              originalText: 'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
              beneficiaryTypes: ['Workers', 'Daily Wagers', 'Factory Employees'],
              applicableStates: [],
              isConstitutional: false,
              tags: ['Salary', 'Wages', 'Non-payment'],
              complaintUrl: 'https://shramsuvidha.gov.in',
            },
            {
              id: 'sec-15-wages',
              categoryId: 'labour',
              actName: 'Payment of Wages Act',
              sectionNumber: 'Section 15',
              year: 1936,
              title: 'Claims arising out of deductions from wages or delay in payment',
              simplifiedText: 'If your wages are delayed or unlawfully deducted, you, your union official, or an appointed legal aid advocate can file a formal claim before the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.',
              originalText: 'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).',
              beneficiaryTypes: ['Industrial Workmen', 'Salaried Employees'],
              applicableStates: [],
              isConstitutional: false,
              tags: ['Compensation', 'Labour Court', 'Claim'],
              complaintUrl: 'https://nalsa.gov.in',
            },
            {
              id: 'sec-3-min-wages',
              categoryId: 'labour',
              actName: 'Minimum Wages Act',
              sectionNumber: 'Section 3 & 12',
              year: 1948,
              title: 'Mandatory Payment of Minimum Rates of Wages',
              simplifiedText: 'Employers cannot pay less than the statutory minimum wage notifications issued by the State or Central government, regardless of any agreement signed with the worker. Paying less than minimum wage equates to forced labour under Article 23.',
              originalText: 'The appropriate Government shall, in the manner hereinafter provided, fix the minimum rates of wages payable to employees employed in an employment specified in Part I or Part II of the Schedule. Where in respect of any scheduled employment a notification under section 5 is in force, the employer shall pay to every employee engaged in a scheduled employment wages at a rate not less than the minimum rate of wages fixed by such notification for that class of employees.',
              beneficiaryTypes: ['Contract Labourers', 'Domestic Workers', 'Security Guards'],
              applicableStates: [],
              isConstitutional: true,
              tags: ['Minimum Wage', 'Forced Labour', 'Exploitation'],
            },
          ])
        } else {
          setCategoryName('Statutory Rights Catalog')
          setSections([
            {
              id: 'sec-general',
              categoryId: categoryId || 'general',
              actName: 'Constitution of India',
              sectionNumber: 'Article 39A',
              year: 1950,
              title: 'Equal Justice and Free Legal Aid',
              simplifiedText: 'The State shall provide free legal aid by suitable legislation to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
              originalText: 'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
              beneficiaryTypes: ['All Citizens', 'BPL Families', 'Women', 'Children'],
              applicableStates: [],
              isConstitutional: true,
              tags: ['Free Legal Aid', 'NALSA', 'Constitutional Remedy'],
            },
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadCategorySections()
  }, [categoryId])

  const toggleOriginal = (id: string) => {
    setExpandedOriginal((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/rights" className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Categories
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{categoryName}</span>
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase">
          <BookOpen className="w-3.5 h-3.5" /> Verified Legal Provisions
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {categoryName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
          Original Indian statutes accompanied by simplified interpretations. You can review the exact statutory clause or jump straight into filing a grievance.
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
          >
            {/* Act & Section Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    {sec.sectionNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {sec.actName} {sec.year && `(${sec.year})`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
              </div>

              {sec.beneficiaryTypes && (
                <div className="flex flex-wrap gap-1">
                  {sec.beneficiaryTypes.map((b, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Simplified Explanation (Primary) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Simplified Plain Meaning:
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/60">
                {sec.simplifiedText}
              </p>
            </div>

            {/* Original Statute Accordion */}
            {sec.originalText && (
              <div className="pt-1">
                <button
                  onClick={() => toggleOriginal(sec.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {expandedOriginal[sec.id] ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide Original Legal Gazette Text
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Read Original Statute / Act Section
                    </>
                  )}
                </button>

                {expandedOriginal[sec.id] && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed space-y-1">
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">
                      Authentic Statutory Text (Source: India Code):
                    </span>
                    <p>{sec.originalText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <Link
                  to={`/chat?q=${encodeURIComponent(`Explain my rights under ${sec.actName} ${sec.sectionNumber}`)}`}
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

              {sec.complaintUrl && (
                <a
                  href={sec.complaintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
                >
                  Statutory Redressal Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
