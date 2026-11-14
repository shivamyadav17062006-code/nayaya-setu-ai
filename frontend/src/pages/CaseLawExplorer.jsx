import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  Scale,
  Search,
  ExternalLink,
  BookOpen,
  Calendar,
  Users,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Bookmark,
  Landmark,
} from 'lucide-react';
import { caseLawApi } from '@/api/caseLaw';

export default function CaseLawExplorer() {
  const navigate = useNavigate();
  const [judgments, setJudgments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState('ALL'); // ALL | SUPREME_COURT | HIGH_COURT
  const [authorityFilter, setAuthorityFilter] = useState('ALL'); // ALL | BINDING_NATIONWIDE | BINDING_WITHIN_STATE

  // Selected Modal Case Dossier
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load judgments
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = {};
        if (courtFilter !== 'ALL') params.court = courtFilter;
        if (authorityFilter !== 'ALL') params.authority = authorityFilter;
        if (searchQuery.trim()) params.q = searchQuery.trim();

        const res = await caseLawApi.listJudgments(params);
        if (res.success) {
          setJudgments(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load court judgments');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courtFilter, authorityFilter, searchQuery]);

  // Open detail modal
  const handleOpenDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await caseLawApi.getJudgmentById(id);
      if (res.success) {
        setSelectedCase(res.data);
      }
    } catch (err) {
      console.warn('Failed to load judgment detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 mb-2">
                <Gavel className="w-3.5 h-3.5" />
                <span>Article 141 & Judicial Precedent Architecture</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <Scale className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                Landmark Case Law & Judicial Precedents
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Explore authoritative Indian judicial precedents, binding Supreme Court doctrines,
                ratio decidendi, subsequent legislative treatments, and statutory interpretations
                grounded in official judicial publications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/chat?prompt=Explain%20the%20Vishaka%20guidelines%20and%20how%20they%20apply%20to%20my%20workplace')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Ask Precedent Query
              </button>
            </div>
          </div>

          {/* Machine Summary Disclaimer Banner (AGENTS.md & Rule 7) */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">
                Statutory Notice on Judicial Precedents & Machine-Generated Summaries:
              </p>
              <p className="leading-relaxed">
                Case law summaries and ratio extractions are structured as educational aids and do not substitute for
                authoritative court pronouncements. Under <strong>Article 141</strong>, Supreme Court judgments constitute
                binding law on all courts in India; High Court judgments are binding within their state jurisdiction and
                persuasive elsewhere. Always verify original text via the official court links provided.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search case name, citation, or doctrine (e.g. Vishaka, Shared household, Equal pay, Arrest memo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            {/* Court Tabs */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setCourtFilter('ALL')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  courtFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Courts
              </button>
              <button
                onClick={() => setCourtFilter('SUPREME_COURT')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  courtFilter === 'SUPREME_COURT'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Supreme Court of India
              </button>
              <button
                onClick={() => setCourtFilter('HIGH_COURT')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  courtFilter === 'HIGH_COURT'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                High Courts
              </button>
            </div>
          </div>

          {/* Precedent Authority Pills */}
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Precedent Authority:</span>
            <button
              onClick={() => setAuthorityFilter('ALL')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                authorityFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setAuthorityFilter('BINDING_NATIONWIDE')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                authorityFilter === 'BINDING_NATIONWIDE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              Binding Nationwide (Art. 141)
            </button>
            <button
              onClick={() => setAuthorityFilter('BINDING_WITHIN_STATE')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                authorityFilter === 'BINDING_WITHIN_STATE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              Binding within State / Persuasive
            </button>
          </div>
        </div>

        {/* Case Law Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading judicial precedents...
          </div>
        ) : judgments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No court judgments matching current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {judgments.map((item) => {
              const isSupremeCourt = item.court_level === 'SUPREME_COURT';
              const isBindingNationwide = item.precedent_authority === 'BINDING_NATIONWIDE';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Landmark className="w-3 h-3 text-slate-500" />
                        {item.court_name}
                      </span>

                      {isBindingNationwide ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          <ShieldCheck className="w-3 h-3" />
                          Binding Nationwide (Art. 141)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="w-3 h-3" />
                          Binding in {item.jurisdiction}
                        </span>
                      )}
                    </div>

                    {/* Case Title & Citation */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {item.case_title}
                      </h3>
                      <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {item.citation} {item.neutral_citation && `• ${item.neutral_citation}`}
                      </p>
                    </div>

                    {/* Metadata line: Date, Bench */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.decision_date ? new Date(item.decision_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {item.bench?.split(',').slice(0, 2).join(',')}
                      </span>
                    </div>

                    {/* Ratio Decidendi Excerpt */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Core Ratio Decidendi (Binding Principle)
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {item.ratio_decidendi}
                      </p>
                    </div>

                    {/* Subsequent Treatment / Codification */}
                    {item.subsequent_treatment && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Subsequent Impact:</strong>{' '}
                        {item.subsequent_treatment}
                      </p>
                    )}

                    {/* Statute links pills */}
                    {Array.isArray(item.statute_links) && item.statute_links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.statute_links.slice(0, 3).map((link, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {link.provisionCited} ({link.actTitle})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Official Judgment (PDF)
                    </a>

                    <button
                      onClick={() => handleOpenDetail(item.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors"
                    >
                      <span>View Case Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Case Dossier Modal */}
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {selectedCase.court_name || selectedCase.courtName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedCase.precedent_authority || selectedCase.precedentAuthority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedCase.case_title || selectedCase.caseTitle}
                  </h2>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {selectedCase.citation} • Case No: {selectedCase.case_number || selectedCase.caseNumber || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bench & Decision Date */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div>
                  <p className="text-slate-400 font-semibold">Coram / Bench:</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedCase.bench}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Decision Date:</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedCase.decision_date || selectedCase.decisionDate}
                  </p>
                </div>
              </div>

              {/* Facts Summary */}
              {selectedCase.summary_facts && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Facts of the Case
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                    {selectedCase.summary_facts}
                  </p>
                </div>
              )}

              {/* Substantive Issues */}
              {Array.isArray(selectedCase.issues) && selectedCase.issues.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Substantive Issues Formulated
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {selectedCase.issues.map((iss, idx) => (
                      <li key={idx}>{iss}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ratio Decidendi & Obiter Dicta */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Ratio Decidendi (Binding Legal Rule)
                  </h4>
                  <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-serif">
                    {selectedCase.ratio_decidendi || selectedCase.ratioDecidendi}
                  </p>
                </div>

                {selectedCase.obiter_dicta && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Obiter Dicta (Judicial Observations)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {selectedCase.obiter_dicta}
                    </p>
                  </div>
                )}
              </div>

              {/* Subsequent Treatment & Codification */}
              {selectedCase.subsequent_treatment && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Subsequent Treatment & Legislative Impact:
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">
                    {selectedCase.subsequent_treatment}
                  </span>
                </div>
              )}

              {/* Linked Statutes */}
              {Array.isArray(selectedCase.statute_links) && selectedCase.statute_links.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Statutory Provisions Interpreted
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedCase.statute_links.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800"
                      >
                        <p className="font-bold text-indigo-600 dark:text-indigo-400">
                          {link.provisionCited} — {link.actTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Relationship: <strong>{link.relationshipType}</strong>
                        </p>
                        {link.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {link.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a
                  href={selectedCase.source_url || selectedCase.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Official Judgment PDF
                </a>

                <button
                  onClick={() => {
                    const title = selectedCase.case_title || selectedCase.caseTitle;
                    setSelectedCase(null);
                    navigate(`/chat?prompt=Explain%20the%20holding%20and%20relevance%20of%20${encodeURIComponent(title)}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask NyayaSaathi About This Case
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
