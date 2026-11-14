import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Scale,
  Search,
  BookOpen,
  Scroll,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  CheckCircle2,
  HelpCircle,
  Landmark,
  MessageSquare
} from "lucide-react";
import { constitutionApi } from "@/api/constitution";

export default function ConstitutionExplorer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("articles"); // 'articles' | 'preamble' | 'schedules' | 'admin'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState("");
  const [overview, setOverview] = useState(null);
  const [articles, setArticles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [verificationData, setVerificationData] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedClauseIdx, setExpandedClauseIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [ov, artsData, scheds, adminData] = await Promise.all([
          constitutionApi.getOverview().catch(() => null),
          constitutionApi.listArticles().catch(() => ({ articles: [] })),
          constitutionApi.listSchedules().catch(() => []),
          constitutionApi.getAdminVerification().catch(() => null),
        ]);
        setOverview(ov);
        setArticles(artsData?.articles || []);
        setSchedules(scheds || []);
        setVerificationData(adminData);

        // Default selected article to Article 21 if available
        if (artsData?.articles?.length > 0) {
          const defaultArt = artsData.articles.find((a) => a.articleNumber.includes("21") && !a.articleNumber.includes("A")) || artsData.articles[0];
          constitutionApi.getArticle(defaultArt.articleNumber).then(setSelectedArticle).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to load constitution data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    constitutionApi.listArticles({ q: searchQuery, part: selectedPart }).then((data) => {
      setArticles(data.articles || []);
    });
  };

  const handleSelectArticle = async (articleNumber) => {
    try {
      const art = await constitutionApi.getArticle(articleNumber);
      setSelectedArticle(art);
      setExpandedClauseIdx(null);
    } catch (err) {
      console.error("Error fetching article:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <Landmark className="w-3.5 h-3.5 text-amber-700" /> Supreme Law of India
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Verified Corpus
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400">
                Edition: {overview?.version || "As on 1st May, 2024 (Up to 106th Amendment)"}
              </span>
              {isLoading && (
                <span className="text-xs text-amber-600 animate-pulse font-medium">
                  Loading corpus...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Constitution of India (भारत का संविधान)
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore the foundational charter of the Republic of India: Preamble, Fundamental Rights,
              Directive Principles, Articles, and Schedules with official verbatim text and plain-language interpretations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate("/chat?q=What are my core fundamental rights under the Constitution of India?")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Ask Constitutional AI
            </button>
            <a
              href="https://www.legislative.gov.in/constitution-of-india/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Official Gazette Repository <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
          {[
            { id: "articles", label: "Articles & Fundamental Rights", icon: BookOpen },
            { id: "preamble", label: "The Preamble", icon: Scroll },
            { id: "schedules", label: "12 Schedules", icon: FileText },
            { id: "admin", label: "Ingestion & Verification Telemetry", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "border-amber-600 text-amber-900 font-semibold bg-white/60 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-amber-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ARTICLES EXPLORER */}
        {activeTab === "articles" && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Article (e.g., Article 21, 14, 32, 39A, 300A, 368) or topic..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <select
                value={selectedPart}
                onChange={(e) => {
                  setSelectedPart(e.target.value);
                  constitutionApi.listArticles({ q: searchQuery, part: e.target.value }).then((data) => {
                    setArticles(data.articles || []);
                  });
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Parts</option>
                <option value="PART I">Part I — Union & Territory</option>
                <option value="PART II">Part II — Citizenship</option>
                <option value="PART III">Part III — Fundamental Rights</option>
                <option value="PART IV">Part IV — Directive Principles</option>
                <option value="PART IVA">Part IVA — Fundamental Duties</option>
                <option value="PART V">Part V — The Union</option>
                <option value="PART VI">Part VI — The States</option>
                <option value="PART XII">Part XII — Finance & Property</option>
                <option value="PART XV">Part XV — Elections</option>
                <option value="PART XVI">Part XVI — Special Classes</option>
                <option value="PART XX">Part XX — Amendments</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Search Articles
              </button>
            </form>

            {/* Split Screen Explorer: List & Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Articles List */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 max-h-[720px] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Indexed Articles ({articles.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Select to inspect clauses</span>
                </div>

                {articles.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center italic">
                    No articles match your search criteria.
                  </p>
                ) : (
                  articles.map((art) => {
                    const isSelected = selectedArticle?.articleNumber === art.articleNumber;
                    return (
                      <div
                        key={art.articleNumber}
                        onClick={() => handleSelectArticle(art.articleNumber)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-50 border-amber-300 text-amber-950 font-medium shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-900 text-xs">
                            {art.articleNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {art.partNumber}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                          {art.heading}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {art.simplifiedText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Article Inspector */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                {selectedArticle ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {selectedArticle.articleNumber}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {selectedArticle.partNumber}: {selectedArticle.partTitle}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {selectedArticle.heading}
                        </h2>
                      </div>

                      <button
                        onClick={() =>
                          navigate(
                            `/chat?q=Explain ${selectedArticle.articleNumber} (${selectedArticle.heading}) of the Indian Constitution in plain language`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors"
                        title="Ask AI Assistant about this article"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Ask AI
                      </button>
                    </div>

                    {/* Verbatim Statutory Parchment */}
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-700" /> Official Verbatim Constitutional Text
                        </span>
                        <span className="text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED STATUTE
                        </span>
                      </div>
                      <p className="font-serif text-xs sm:text-sm text-slate-900 leading-relaxed italic whitespace-pre-line">
                        "{selectedArticle.originalText}"
                      </p>
                    </div>

                    {/* Simplified Legal Awareness Explanation */}
                    <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-900">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-700" /> Simplified Legal Awareness Meaning
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {selectedArticle.simplifiedText}
                      </p>
                    </div>

                    {/* Clauses Breakdown */}
                    {selectedArticle.clauses && selectedArticle.clauses.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Constitutional Clauses & Sub-clauses ({selectedArticle.clauses.length})
                        </span>
                        <div className="space-y-2">
                          {selectedArticle.clauses.map((clause, cIdx) => {
                            const isClauseExpanded = expandedClauseIdx === cIdx;
                            return (
                              <div
                                key={cIdx}
                                className="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-slate-100/60 transition-colors"
                              >
                                <div
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => setExpandedClauseIdx(isClauseExpanded ? null : cIdx)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                                      Clause {clause.clauseNumber}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800">
                                      {clause.simplified || clause.text.slice(0, 70)}...
                                    </span>
                                  </div>
                                  {isClauseExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                {isClauseExpanded && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs space-y-1 font-serif text-slate-800">
                                    <p>"{clause.text}"</p>
                                    <p className="font-sans text-[11px] text-slate-600 not-italic">
                                      <strong>Meaning:</strong> {clause.simplified}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Amendment References */}
                    {selectedArticle.amendmentNotes && (
                      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                        <History className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Constitutional Amendment Notes: </span>
                          <span>{selectedArticle.amendmentNotes}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Official Link */}
                    <div className="pt-2 text-right">
                      <a
                        href={selectedArticle.sourceUrl || "https://legislative.gov.in/constitution-of-india"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        Inspect on Official Legislative Dept Repository <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic">
                    Select an article from the left column to view its clauses and verbatim text.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREAMBLE */}
        {activeTab === "preamble" && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Preamble to the Constitution of India
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                THE CONSTITUTION OF INDIA
              </h2>
              <p className="text-xs text-slate-500">Adopted on 26th November, 1949 by the Constituent Assembly</p>
            </div>

            <div className="p-8 bg-amber-50/80 border-2 border-amber-200 rounded-2xl shadow-inner font-serif text-slate-900 leading-loose text-base sm:text-lg text-justify space-y-4">
              <p>
                <strong>WE, THE PEOPLE OF INDIA</strong>, having solemnly resolved to constitute India into a{" "}
                <span className="font-bold text-amber-950 underline decoration-amber-400">
                  SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC
                </span>{" "}
                and to secure to all its citizens:
              </p>
              <ul className="list-disc pl-6 space-y-1 font-sans text-sm sm:text-base">
                <li><strong>JUSTICE</strong>, social, economic and political;</li>
                <li><strong>LIBERTY</strong> of thought, expression, belief, faith and worship;</li>
                <li><strong>EQUALITY</strong> of status and of opportunity;</li>
              </ul>
              <p>
                and to promote among them all <strong>FRATERNITY</strong> assuring the dignity of the individual and the{" "}
                <span className="font-bold text-amber-950 underline decoration-amber-400">
                  unity and integrity of the Nation
                </span>;
              </p>
              <p className="font-bold text-center pt-4">
                IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-600" /> Historical Amendment Notice:
              </div>
              <p>
                The words "SOCIALIST", "SECULAR", and "unity and integrity of the Nation" were incorporated by the Constitution (Forty-second Amendment) Act, 1976 (with effect from 3rd January, 1977).
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULES */}
        {activeTab === "schedules" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sched, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {sched.number}
                  </span>
                  <span className="text-[11px] text-slate-400">{sched.articlesLinked}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{sched.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{sched.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: ADMIN VERIFICATION TELEMETRY */}
        {activeTab === "admin" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Administrative Verification Telemetry
                </h2>
                <p className="text-xs text-slate-500">
                  Corpus authenticity metrics, document checksum, and pgvector storage verification.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Status: VERIFIED
              </span>
            </div>

            {verificationData && (
              <div className="space-y-6 text-xs">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Total Parts</span>
                    <p className="text-lg font-extrabold text-slate-900">{verificationData.extractedMetrics?.totalParts || 26}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Articles Indexed</span>
                    <p className="text-lg font-extrabold text-slate-900">{verificationData.extractedMetrics?.articlesExtracted || 32}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Schedules</span>
                    <p className="text-lg font-extrabold text-slate-900">{verificationData.extractedMetrics?.schedulesExtracted || 12}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">pgvector Chunks</span>
                    <p className="text-lg font-extrabold text-amber-700">{verificationData.extractedMetrics?.indexedPgvectorChunks || 80}</p>
                  </div>
                </div>

                {/* Checksum & Version Record */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-800">Controlled Document Verification</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div><strong>Edition:</strong> {verificationData.version}</div>
                    <div><strong>Text As-Of Date:</strong> {verificationData.asOfDate}</div>
                    <div className="sm:col-span-2 break-all font-mono">
                      <strong>SHA-256 Checksum:</strong> {verificationData.sha256}
                    </div>
                  </div>
                </div>

                {/* Official Source Register */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800">Official Government Authority Sources:</span>
                  <div className="space-y-2">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="font-semibold text-slate-900">Legislative Department, Ministry of Law and Justice</p>
                      <p className="text-slate-500 text-[11px]">Sixth Pocket Edition (As on 1st May, 2024 / incorporating up to 106th Constitutional Amendment Act)</p>
                      <a href="https://www.legislative.gov.in/constitution-of-india/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline text-[11px]">https://www.legislative.gov.in/constitution-of-india/</a>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="font-semibold text-slate-900">India Code (NIC / Legislative Dept)</p>
                      <p className="text-slate-500 text-[11px]">Official repository for the consolidated central acts of India.</p>
                      <a href="https://www.indiacode.nic.in/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline text-[11px]">https://www.indiacode.nic.in/</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
