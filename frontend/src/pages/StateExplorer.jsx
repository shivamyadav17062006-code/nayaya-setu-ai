import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  BookOpen,
  Scale,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Landmark,
} from 'lucide-react';
import { statesApi } from '@/api/states';

export default function StateExplorer() {
  const navigate = useNavigate();
  const [jurisdictions, setJurisdictions] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | STATE | UT
  const [coverageFilter, setCoverageFilter] = useState('ALL'); // ALL | VERIFIED_INGESTED | CATALOGUED_PENDING_INGESTION

  // Selected State Detail
  const [selectedStateCode, setSelectedStateCode] = useState('MH');
  const [stateDetail, setStateDetail] = useState(null);
  const [stateActs, setStateActs] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // 1. Fetch initial list & audit summary
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await statesApi.listStates();
        if (data.success) {
          setJurisdictions(data.data || []);
          setAuditSummary(data.auditSummary || null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load jurisdiction registry');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Fetch details for selected state
  useEffect(() => {
    if (!selectedStateCode) return;
    async function loadStateDetails() {
      try {
        setLoadingDetail(true);
        const [detailRes, actsRes] = await Promise.all([
          statesApi.getStateByCode(selectedStateCode),
          statesApi.getStateActs(selectedStateCode),
        ]);
        if (detailRes.success) setStateDetail(detailRes.data);
        if (actsRes.success) setStateActs(actsRes.data || []);
      } catch (err) {
        console.warn('Failed to load state details:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadStateDetails();
  }, [selectedStateCode]);

  // Toggle section accordion
  const toggleSection = (secId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Filter logic
  const filteredJurisdictions = jurisdictions.filter((j) => {
    const matchesSearch =
      !searchQuery ||
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.keyStatutoryDomains || []).some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'STATE' && j.type === 'STATE') ||
      (typeFilter === 'UT' && j.type.startsWith('UT'));

    const matchesCoverage =
      coverageFilter === 'ALL' || j.coverageStatus === coverageFilter;

    return matchesSearch && matchesType && matchesCoverage;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2">
                <Scale className="w-3.5 h-3.5" />
                <span>Article 246 & Seventh Schedule — State & Concurrent Legal Coverage</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <Landmark className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                State & Union Territory Legal Database
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Explore verified State Acts, State Subordinate Rules, e-Gazette records, and State Legal Services
                Authority (SLSA) legal aid income thresholds across all 28 Indian States and 8 Union Territories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/chat?prompt=What%20are%20the%20shop%20working%20hours%20and%20leave%20rules%20in%20Maharashtra?')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Ask State Law Query
              </button>
            </div>
          </div>

          {/* Live Honest Audit Metrics */}
          {auditSummary && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Jurisdictions</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {auditSummary.totalJurisdictions}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({auditSummary.totalStates} States, {auditSummary.totalUnionTerritories} UTs)
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Pilot States
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                  {auditSummary.verifiedAndIngestedJurisdictions}{' '}
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                    ({auditSummary.totalStateActsIngested + auditSummary.totalStateRulesIngested} Acts & Rules)
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Official Portals Mapped</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  36 / 36{' '}
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">(100% Traceable)</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Catalogued (Pending Ingestion)
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-300">
                  {auditSummary.cataloguedPendingIngestion}{' '}
                  <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                    (SLSA & Portals Verified)
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Layout: Grid of Jurisdictions (Left) & State Details (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Filter & Jurisdiction Grid (7 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search & Tabs */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search state, capital, or topic (e.g. Shops, Rent)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    typeFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All (36)
                </button>
                <button
                  onClick={() => setTypeFilter('STATE')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    typeFilter === 'STATE'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  States (28)
                </button>
                <button
                  onClick={() => setTypeFilter('UT')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    typeFilter === 'UT'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Union Territories (8)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Status:</span>
                <button
                  onClick={() => setCoverageFilter('ALL')}
                  className={`px-2 py-1 rounded text-xs ${coverageFilter === 'ALL' ? 'font-bold underline' : 'text-slate-500'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setCoverageFilter('VERIFIED_INGESTED')}
                  className={`px-2 py-1 rounded text-xs text-emerald-600 dark:text-emerald-400 ${coverageFilter === 'VERIFIED_INGESTED' ? 'font-bold underline' : ''}`}
                >
                  Verified Pilot (3)
                </button>
                <button
                  onClick={() => setCoverageFilter('CATALOGUED_PENDING_INGESTION')}
                  className={`px-2 py-1 rounded text-xs text-amber-600 dark:text-amber-400 ${coverageFilter === 'CATALOGUED_PENDING_INGESTION' ? 'font-bold underline' : ''}`}
                >
                  Catalogued (33)
                </button>
              </div>
            </div>

            {/* Jurisdiction List Scrollable */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Loading jurisdictions...</div>
              ) : filteredJurisdictions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No jurisdictions matching filters.</div>
              ) : (
                filteredJurisdictions.map((j) => {
                  const isSelected = selectedStateCode === j.code;
                  const isIngested = j.coverageStatus === 'VERIFIED_INGESTED';

                  return (
                    <div
                      key={j.code}
                      onClick={() => setSelectedStateCode(j.code)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                            {j.code}
                          </span>
                          <div>
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                              {j.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {j.capital} • {j.type === 'STATE' ? 'State' : 'Union Territory'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isIngested ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Ingested ({j.ingestedDocumentsCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="w-3 h-3" />
                              Catalogued
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Domain tags preview */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {(j.keyStatutoryDomains || []).slice(0, 3).map((domain, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: State Details & Ingested Acts (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {loadingDetail ? (
              <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                Loading state details...
              </div>
            ) : !stateDetail ? (
              <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                Select a state from the list on the left.
              </div>
            ) : (
              <>
                {/* State Overview Header Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                          {stateDetail.code}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {stateDetail.name}
                        </h2>
                        {stateDetail.hindiName && (
                          <span className="text-sm text-slate-500 font-normal">
                            ({stateDetail.hindiName})
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Capital: <strong className="text-slate-700 dark:text-slate-300">{stateDetail.capital}</strong> •
                        Official Languages: {stateDetail.officialLanguages?.join(', ')}
                      </p>
                    </div>

                    <div>
                      {stateDetail.coverageStatus === 'VERIFIED_INGESTED' ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified & Ingested into RAG
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {stateDetail.ingestedDocumentsInDB} Acts in Database
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            Catalogued & Mapped
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">Full text ingestion queued</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Official Portal Directory */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Traceable Official Portals
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {stateDetail.officialPortals?.government && (
                        <a
                          href={stateDetail.officialPortals.government}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span>Official State Portal</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      {stateDetail.officialPortals?.egazette && (
                        <a
                          href={stateDetail.officialPortals.egazette}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span>Official e-Gazette</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      {stateDetail.officialPortals?.legislature && !stateDetail.officialPortals.legislature.startsWith('N/A') && (
                        <a
                          href={stateDetail.officialPortals.legislature}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span>Legislative Assembly Portal</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                      {stateDetail.officialPortals?.indiaCode && (
                        <a
                          href={stateDetail.officialPortals.indiaCode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span>India Code State Repository</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Free Legal Aid (SLSA) Threshold Card */}
                  {stateDetail.slsaFreeLegalAidIncomeThreshold && (
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                      <div className="flex items-start gap-3">
                        <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                              Free Legal Aid Eligibility (SLSA)
                            </h4>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                              Ceiling: ₹{stateDetail.slsaFreeLegalAidIncomeThreshold.amount?.toLocaleString('en-IN') || '0'} / year
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-blue-800 dark:text-blue-300 font-mono">
                            {stateDetail.slsaFreeLegalAidIncomeThreshold.ruleCitation}
                          </p>
                          <p className="mt-2 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                            <strong>Statutory Non-Income Exemptions:</strong>{' '}
                            {stateDetail.slsaFreeLegalAidIncomeThreshold.statutoryExemptions}
                          </p>
                          {stateDetail.officialPortals?.slsa && (
                            <a
                              href={stateDetail.officialPortals.slsa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>Visit State Legal Services Authority Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingested State Legislation Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Ingested State Legislation & Subordinate Rules
                    </h3>
                    <span className="text-xs text-slate-500">
                      {stateActs.length} active documents
                    </span>
                  </div>

                  {stateActs.length === 0 ? (
                    <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        Full Text Pending Ingestion for {stateDetail.name}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Official source repositories and SLSA income rules for this jurisdiction are fully verified.
                        Full-text statutory vector ingestion is currently active for pilot states (Maharashtra, Delhi, Karnataka).
                      </p>
                      {stateDetail.officialPortals?.indiaCode && (
                        <a
                          href={stateDetail.officialPortals.indiaCode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <span>Browse Official Acts on India Code</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stateActs.map((act) => (
                        <div
                          key={act.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {act.documentType || 'ACT'}
                                </span>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {act.title} ({act.year})
                                </h4>
                              </div>
                              {act.actNumber && (
                                <p className="text-xs text-slate-500 mt-0.5">{act.actNumber}</p>
                              )}
                              {act.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {act.description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => navigate(`/chat?prompt=Explain%20my%20rights%20under%20the%20${encodeURIComponent(act.title)}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-medium transition-colors shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Ask About This Law
                            </button>
                          </div>

                          {/* Sections Accordion */}
                          <div className="p-4 space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Key Statutory Provisions ({act.sections?.length || 0})
                            </h5>

                            <div className="space-y-2">
                              {(act.sections || []).map((sec) => {
                                const isExpanded = Boolean(expandedSections[sec.id]);
                                return (
                                  <div
                                    key={sec.id}
                                    className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                                  >
                                    <button
                                      onClick={() => toggleSection(sec.id)}
                                      className="w-full text-left p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <div>
                                        <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                          {sec.sectionNumber}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 ml-2">
                                          {sec.title}
                                        </span>
                                      </div>
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                      )}
                                    </button>

                                    {isExpanded && (
                                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                                        <div>
                                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                                            Simplified Legal Meaning:
                                          </p>
                                          <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                            {sec.simplifiedText}
                                          </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                          <p className="font-semibold text-slate-500 dark:text-slate-400">
                                            Original Statutory Text:
                                          </p>
                                          <blockquote className="mt-0.5 pl-2.5 border-l-2 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-serif leading-relaxed italic">
                                            {sec.originalText}
                                          </blockquote>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
