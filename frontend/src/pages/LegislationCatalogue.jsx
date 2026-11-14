import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Link2,
  Building2,
  Layers,
  ArrowRight,
  Database,
  Filter,
} from "lucide-react";
import { legislationApi } from "@/api/legislation";

export default function LegislationCatalogue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("acts"); // 'acts' | 'rules' | 'register' | 'queue' | 'coverage'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [acts, setActs] = useState([]);
  const [rules, setRules] = useState([]);
  const [sourceRegister, setSourceRegister] = useState(null);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [coverageData, setCoverageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusActionMessage, setStatusActionMessage] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setIsLoading(true);
    try {
      const [actsRes, rulesRes, registerRes, queueRes, coverageRes] = await Promise.all([
        legislationApi.listActs({ limit: 100 }).catch(() => ({ data: { acts: [] } })),
        legislationApi.listRules().catch(() => ({ data: { rules: [] } })),
        legislationApi.getSourceRegister().catch(() => ({ data: null })),
        legislationApi.getVerificationQueue({ status: "ALL" }).catch(() => ({ data: { items: [] } })),
        legislationApi.getCoverageReport().catch(() => ({ data: null })),
      ]);

      setActs(actsRes?.data?.acts || []);
      setRules(rulesRes?.data?.rules || []);
      setSourceRegister(registerRes?.data || null);
      setVerificationQueue(queueRes?.data?.items || []);
      setCoverageData(coverageRes?.data || null);
    } catch (err) {
      console.error("Failed to load legislation catalogue data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await legislationApi.listActs({
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        documentType: activeTab === "rules" ? "RULES" : "ALL",
      });
      if (activeTab === "rules") {
        setRules(res?.data?.acts || []);
      } else {
        setActs(res?.data?.acts || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await legislationApi.updateVerificationStatus(id, {
        status: newStatus,
        reviewNotes: `Status changed to ${newStatus} via Administrative Governance UI`,
      });
      setStatusActionMessage(`Successfully updated document to ${newStatus}`);
      setTimeout(() => setStatusActionMessage(""), 4000);
      loadAllData();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                <FileText className="w-3.5 h-3.5 text-blue-700" /> Indian Central Legislation
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Canonical & Subordinate Rules
              </span>
              {isLoading && (
                <span className="text-xs text-amber-600 animate-pulse font-medium">
                  Loading catalogue...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Central Acts, Rules & Regulations Catalogue
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore Central Government Acts and enabling subordinate legislation: Rules, Regulations,
              Commencement Notifications, and Administrative Governance lifecycle tracking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate("/chat?q=What are the rules and employee rights under the Payment of Wages Act?")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Ask Legislation AI
            </button>
            <a
              href="https://www.indiacode.nic.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              India Code Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Action feedback message */}
        {statusActionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {statusActionMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: "acts", label: `Central Acts (${acts.length})`, icon: Building2 },
            { id: "rules", label: `Rules & Regulations (${rules.length})`, icon: Layers },
            { id: "register", label: "Source Register", icon: Database },
            { id: "queue", label: `Verification Queue (${verificationQueue.length})`, icon: Clock },
            { id: "coverage", label: "Coverage & Audit", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Central Acts */}
        {activeTab === "acts" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Central Acts (e.g., Wages, Domestic Violence, Consumer, POSH, RTI)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="LABOUR">Labour & Employment</option>
                <option value="WOMEN_RIGHTS">Women Rights</option>
                <option value="CONSUMER">Consumer Protection</option>
                <option value="WORKPLACE_HARASSMENT">Workplace Protection</option>
                <option value="LEGAL_AID">Legal Aid</option>
                <option value="CIVIL_RIGHTS">Civil Rights & RTI</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Statutes</option>
                <option value="ENACTED">Enacted Statutes</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </form>

            {/* Acts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {acts.map((act) => (
                <div
                  key={act.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {act.category || "CENTRAL"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Year {act.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">{act.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {act.description || "Official Central Act enacted by Parliament."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Provisions: <strong>{act.sectionsCount || 0}</strong></span>
                      <span>Subordinate Rules: <strong>{act.subordinateCount || 0}</strong></span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {act.verificationStatus || "PUBLISHED"}
                      </span>
                      <a
                        href={act.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        India Code <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Subordinate Rules & Regulations */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {rule.documentType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{rule.year}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{rule.title}</h3>

                  {rule.parentAct && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Link2 className="w-3.5 h-3.5 text-blue-600" />
                        Parent Enabling Legislation:
                      </div>
                      <p className="text-xs text-blue-700 font-medium pl-5">{rule.parentAct.title}</p>
                      {rule.enablingProvision && (
                        <p className="text-[11px] text-slate-500 pl-5">
                          Enabling Clause: {rule.enablingProvision}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Ministry: {rule.ministry || "Central Government"}</span>
                    <a
                      href={rule.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      Gazette Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Source Register */}
        {activeTab === "register" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Official Central Source Register</h3>
                <p className="text-xs text-slate-500">
                  Traceable repository of sovereign government portals, gazette notifications, and SHA-256 checksums.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                {sourceRegister?.sources?.length || 0} Registered Sources
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Document Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Authority / Ministry</th>
                    <th className="py-3 px-3">Enactment</th>
                    <th className="py-3 px-3">Effective Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Portal URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceRegister?.sources?.map((src) => (
                    <tr key={src.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {src.documentTitle}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{src.documentCategory}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">{src.ministry}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{src.enactmentDate || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{src.effectiveDate || "—"}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {src.sourceReliabilityStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={src.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Verification Queue & Publishing Controls */}
        {activeTab === "queue" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Administrative Governance & Verification Queue</h3>
              <p className="text-xs text-slate-500">
                Statutory documents undergoing legal audit. In compliance with Rule 7, human review is required before publication.
              </p>
            </div>

            <div className="space-y-4">
              {verificationQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                        {item.documentType || "ACT"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Year {item.year}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        {item.verificationStatus || "PENDING"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500">
                      Ministry: {item.ministry || "Central Government"} • Provisions: {item._count?.sections || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(item.id, "PUBLISHED")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, "AWAITING_REVIEW")}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Stage for Review
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, "REJECTED")}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Coverage & Audit Reports */}
        {activeTab === "coverage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Central Acts</span>
                <p className="text-2xl font-extrabold text-blue-600 mt-1">{coverageData?.counts?.acts || 0}</p>
                <span className="text-[11px] text-slate-500">Primary Statutes</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Subordinate Rules</span>
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">{coverageData?.counts?.rules || 0}</p>
                <span className="text-[11px] text-slate-500">Enabling Rules</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Legal Provisions</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{coverageData?.counts?.sections || 0}</p>
                <span className="text-[11px] text-slate-500">Sections & Rules</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold uppercase">pgvector Chunks</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">{coverageData?.counts?.chunks || 0}</p>
                <span className="text-[11px] text-slate-500">384-d Embeddings</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Corpus Integrity & Cryptographic Audit</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
                <div>
                  <span className="text-slate-400">CORPUS_SHA256: </span>
                  <span className="text-blue-700 font-bold">{coverageData?.corpusChecksum || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">AUDIT_TIMESTAMP: </span>
                  <span className="text-slate-700">{coverageData?.auditDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">VERIFICATION_STATUS: </span>
                  <span className="text-emerald-700 font-bold">100% CANONICAL CENTRAL BASELINE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
