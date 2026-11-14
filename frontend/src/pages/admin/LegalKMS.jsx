import { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  FileText,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  Plus,
  ExternalLink,
  Eye,
  Filter,
  History,
  Archive,
  ArrowRight,
  BookOpen,
  X,
  FileCode,
  Tag,
} from 'lucide-react';
import { kmsApi } from '../../api/kms.js';

export default function LegalKMS() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'acts' | 'review' | 'import' | 'audit'

  // Dashboard state
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Acts list state
  const [acts, setActs] = useState([]);
  const [actFilters, setActFilters] = useState({
    status: 'ALL',
    jurisdiction: 'ALL',
    q: '',
  });
  const [loadingActs, setLoadingActs] = useState(false);

  // Selected Act & Sections
  const [selectedAct, setSelectedAct] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Review Queue state
  const [reviewQueue, setReviewQueue] = useState({ acts: [], sections: [] });
  const [loadingReview, setLoadingReview] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Modals & Action States
  const [showCreateActModal, setShowCreateActModal] = useState(false);
  const [showCreateSecModal, setShowCreateSecModal] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { entityType, id, title, currentStatus }
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Import form state
  const [importMode, setImportMode] = useState('RAW_TEXT'); // 'RAW_TEXT' | 'JSON'
  const [rawTextPayload, setRawTextPayload] = useState({
    title: '',
    year: new Date().getFullYear(),
    jurisdiction: 'CENTRAL',
    state: '',
    sourceUrl: 'https://www.indiacode.nic.in',
    rawText: '',
  });
  const [jsonPayload, setJsonPayload] = useState('{\n  "sourceName": "India Code Gazette",\n  "documents": []\n}');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // New Act Form State
  const [newActForm, setNewActForm] = useState({
    title: '',
    actNumber: '',
    year: new Date().getFullYear(),
    jurisdiction: 'CENTRAL',
    state: '',
    category: 'GENERAL',
    documentType: 'ACT',
    sourceUrl: '',
    description: '',
  });

  // New Section Form State
  const [newSecForm, setNewSecForm] = useState({
    sectionNumber: '',
    title: '',
    originalText: '',
    simplifiedText: '',
  });

  // Notifications
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Dashboard
  const fetchDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await kmsApi.getDashboard();
      if (res.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch Acts
  const fetchActs = async () => {
    try {
      setLoadingActs(true);
      const params = {};
      if (actFilters.status !== 'ALL') params.status = actFilters.status;
      if (actFilters.jurisdiction !== 'ALL') params.jurisdiction = actFilters.jurisdiction;
      if (actFilters.q) params.q = actFilters.q;

      const res = await kmsApi.listActs(params);
      if (res.success) {
        setActs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActs(false);
    }
  };

  // Fetch Review Queue
  const fetchReviewQueue = async () => {
    try {
      setLoadingReview(true);
      const res = await kmsApi.getReviewQueue();
      if (res.success) {
        setReviewQueue(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReview(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await kmsApi.getAuditLogs({ limit: 50 });
      if (res.success) {
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Fetch Sections for an Act
  const openActDetails = async (act) => {
    setSelectedAct(act);
    try {
      setLoadingSections(true);
      const res = await kmsApi.listSections(act.id);
      if (res.success) {
        setSections(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'acts') fetchActs();
    if (activeTab === 'review') fetchReviewQueue();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Handle Review Action (VERIFY, PUBLISH, REJECT, SUPERSEDE, SUBMIT_REVIEW)
  const triggerReviewAction = async (actionType) => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      const res = await kmsApi.applyReviewAction(
        actionModal.entityType,
        actionModal.id,
        actionType,
        actionNotes
      );
      if (res.success) {
        notify(`Successfully executed ${actionType} for ${actionModal.entityType}!`);
        setActionModal(null);
        setActionNotes('');
        fetchDashboard();
        if (activeTab === 'review') fetchReviewQueue();
        if (activeTab === 'acts') fetchActs();
        if (selectedAct) openActDetails(selectedAct);
      }
    } catch (err) {
      notify(err.message || 'Workflow transition failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit New Act
  const handleCreateAct = async (e) => {
    e.preventDefault();
    try {
      const res = await kmsApi.createAct(newActForm);
      if (res.success) {
        notify('Act created in DRAFT status.');
        setShowCreateActModal(false);
        setNewActForm({
          title: '',
          actNumber: '',
          year: new Date().getFullYear(),
          jurisdiction: 'CENTRAL',
          state: '',
          category: 'GENERAL',
          documentType: 'ACT',
          sourceUrl: '',
          description: '',
        });
        fetchActs();
        fetchDashboard();
      }
    } catch (err) {
      notify(err.message || 'Failed to create act', 'error');
    }
  };

  // Submit New Section
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!selectedAct) return;
    try {
      const res = await kmsApi.createSection(selectedAct.id, newSecForm);
      if (res.success) {
        notify('Section added in DRAFT status.');
        setShowCreateSecModal(false);
        setNewSecForm({ sectionNumber: '', title: '', originalText: '', simplifiedText: '' });
        openActDetails(selectedAct);
        fetchDashboard();
      }
    } catch (err) {
      notify(err.message || 'Failed to create section', 'error');
    }
  };

  // Run Batch Import
  const handleImport = async () => {
    try {
      setImporting(true);
      setImportResult(null);

      let payload = {};
      if (importMode === 'RAW_TEXT') {
        payload = { ...rawTextPayload };
      } else {
        payload = JSON.parse(jsonPayload);
      }

      const res = await kmsApi.importBatch(payload);
      setImportResult(res.data);
      notify(`Import batch complete: ${res.data.importedRecords} imported, ${res.data.rejectedRecords} rejected.`);
      fetchDashboard();
    } catch (err) {
      notify(err.message || 'Import failed. Check JSON format.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">PUBLISHED</span>;
      case 'VERIFIED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">VERIFIED</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">UNDER REVIEW</span>;
      case 'SUPERSEDED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">SUPERSEDED</span>;
      case 'DRAFT':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">DRAFT</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Administrative Console
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              Phase 11 KMS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-600" />
            Legal Knowledge Management System (KMS)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Official India-wide statutory ingestion, 5-stage verification governance, and RAG vector indexing.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={() => {
              fetchDashboard();
              if (activeTab === 'acts') fetchActs();
              if (activeTab === 'review') fetchReviewQueue();
              if (activeTab === 'audit') fetchAuditLogs();
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateActModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Legal Act
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mt-6 space-x-8">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Layers },
          { id: 'acts', label: 'Statutes & Sections', icon: BookOpen },
          { id: 'review', label: 'Review Queue', icon: Clock, count: dashboard?.summary?.pendingReviewQueue },
          { id: 'import', label: 'Batch Ingestion', icon: Upload },
          { id: 'audit', label: 'Audit Trail & Diff', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="mt-8 space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Statutory Acts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingDashboard ? '...' : dashboard?.summary?.totalActs || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Legal Sections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingDashboard ? '...' : dashboard?.summary?.totalSections || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Database className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Indexed RAG Vectors (384-d)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingDashboard ? '...' : dashboard?.summary?.totalIndexedChunks || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Review Queue</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {loadingDashboard ? '...' : dashboard?.summary?.pendingReviewQueue || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown & Traceability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Verification Status Distribution
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Only PUBLISHED statutes are synced to citizen search embeddings.
              </p>
              <div className="mt-4 space-y-3">
                {['PUBLISHED', 'VERIFIED', 'UNDER_REVIEW', 'DRAFT', 'SUPERSEDED'].map((st) => {
                  const count = dashboard?.actStatuses?.[st] || 0;
                  const total = dashboard?.summary?.totalActs || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={st} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(st)}
                        <span className="text-gray-700 font-medium">{st}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              st === 'PUBLISHED'
                                ? 'bg-emerald-500'
                                : st === 'VERIFIED'
                                ? 'bg-blue-500'
                                : st === 'UNDER_REVIEW'
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-gray-900 font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-600" />
                Recent Import Batches
              </h2>
              <p className="text-xs text-gray-500 mt-1">Traceability back to India Code & State Gazettes.</p>
              <div className="mt-4 divide-y divide-gray-100">
                {dashboard?.recentBatches?.length > 0 ? (
                  dashboard.recentBatches.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{b.source_name}</p>
                        <p className="text-gray-500">{new Date(b.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
                          {b.import_type}
                        </span>
                        <span className="text-emerald-700 font-semibold">+{b.imported_records}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No recent batches logged</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTS & SECTIONS EXPLORER */}
      {activeTab === 'acts' && (
        <div className="mt-8 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Act title or number..."
                value={actFilters.q}
                onChange={(e) => setActFilters({ ...actFilters, q: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchActs()}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={actFilters.jurisdiction}
                onChange={(e) => {
                  setActFilters({ ...actFilters, jurisdiction: e.target.value });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              >
                <option value="ALL">All Jurisdictions</option>
                <option value="CENTRAL">Central</option>
                <option value="STATE">State</option>
              </select>

              <select
                value={actFilters.status}
                onChange={(e) => {
                  setActFilters({ ...actFilters, status: e.target.value });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="SUPERSEDED">SUPERSEDED</option>
              </select>

              <button
                onClick={fetchActs}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Acts Table */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Act Title & Enactment</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Jurisdiction</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Sections</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Verification Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loadingActs ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading Acts...
                    </td>
                  </tr>
                ) : acts.length > 0 ? (
                  acts.map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{act.title}</p>
                        <p className="text-xs text-gray-500">
                          {act.actNumber || 'Act'} • Year {act.year}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                          {act.jurisdiction} {act.state ? `(${act.state})` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{act._count?.sections || 0}</td>
                      <td className="px-6 py-4">{getStatusBadge(act.verificationStatus)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openActDetails(act)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100"
                        >
                          View Sections
                        </button>
                        <button
                          onClick={() =>
                            setActionModal({
                              entityType: 'ACT',
                              id: act.id,
                              title: act.title,
                              currentStatus: act.verificationStatus,
                            })
                          }
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          Workflow
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      No statutes found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Drawer / Modal for Act Sections */}
          {selectedAct && (
            <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 mt-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <span className="text-xs font-semibold text-indigo-600">SECTIONS EXPLORER</span>
                  <h3 className="text-lg font-bold text-gray-900">{selectedAct.title}</h3>
                  <a
                    href={selectedAct.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5 hover:underline"
                  >
                    Official Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateSecModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                  >
                    + Add Section
                  </button>
                  <button
                    onClick={() => setSelectedAct(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                {loadingSections ? (
                  <p className="text-center py-6 text-sm text-gray-400">Loading sections...</p>
                ) : sections.length > 0 ? (
                  sections.map((sec) => (
                    <div key={sec.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">
                          {sec.sectionNumber} — {sec.title || 'Untitled'}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(sec.verificationStatus)}
                          <button
                            onClick={() =>
                              setActionModal({
                                entityType: 'SECTION',
                                id: sec.id,
                                title: `${selectedAct.title} (${sec.sectionNumber})`,
                                currentStatus: sec.verificationStatus,
                              })
                            }
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                          >
                            Action
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 space-y-2">
                        <div className="bg-white p-2.5 rounded border border-gray-200 font-mono text-[11px] leading-relaxed">
                          <span className="font-bold text-gray-500 block mb-1">Original Statutory Text:</span>
                          {sec.originalText}
                        </div>
                        {sec.simplifiedText && (
                          <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100">
                            <span className="font-bold text-blue-700 block mb-1">Simplified Explanation:</span>
                            {sec.simplifiedText}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-sm text-gray-400">No sections added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="mt-8 space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-amber-800">
                  Verification State Governance: Items in DRAFT or UNDER_REVIEW require senior verification before publication.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Publishing an Act automatically embeds 384-dimensional dense vectors into the citizen RAG pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Acts */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center justify-between">
                <span>Acts Pending Review ({reviewQueue.acts?.length || 0})</span>
              </h3>
              <div className="space-y-3">
                {reviewQueue.acts?.length > 0 ? (
                  reviewQueue.acts.map((act) => (
                    <div key={act.id} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900">{act.title}</p>
                        {getStatusBadge(act.verificationStatus)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {act.jurisdiction} • {act.year} • Sections: {act._count?.sections || 0}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            setActionModal({
                              entityType: 'ACT',
                              id: act.id,
                              title: act.title,
                              currentStatus: act.verificationStatus,
                            })
                          }
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                        >
                          Review & Publish
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-gray-400">No Acts pending in queue.</p>
                )}
              </div>
            </div>

            {/* Pending Sections */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center justify-between">
                <span>Sections Pending Review ({reviewQueue.sections?.length || 0})</span>
              </h3>
              <div className="space-y-3">
                {reviewQueue.sections?.length > 0 ? (
                  reviewQueue.sections.map((sec) => (
                    <div key={sec.id} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900">
                          {sec.act?.title} — {sec.sectionNumber}
                        </p>
                        {getStatusBadge(sec.verificationStatus)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{sec.originalText}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            setActionModal({
                              entityType: 'SECTION',
                              id: sec.id,
                              title: `${sec.act?.title} (${sec.sectionNumber})`,
                              currentStatus: sec.verificationStatus,
                            })
                          }
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                        >
                          Review Section
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-gray-400">No Sections pending in queue.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BATCH INGESTION */}
      {activeTab === 'import' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-6">
              <button
                onClick={() => setImportMode('RAW_TEXT')}
                className={`text-sm font-semibold pb-2 border-b-2 ${
                  importMode === 'RAW_TEXT'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw Legal Text / Gazette Extractor
              </button>
              <button
                onClick={() => setImportMode('JSON')}
                className={`text-sm font-semibold pb-2 border-b-2 ${
                  importMode === 'JSON'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Structured JSON Batch Ingestion
              </button>
            </div>

            {importMode === 'RAW_TEXT' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Act Title</label>
                    <input
                      type="text"
                      value={rawTextPayload.title}
                      onChange={(e) => setRawTextPayload({ ...rawTextPayload, title: e.target.value })}
                      placeholder="e.g. Legal Services Authorities Act, 1987"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Enactment Year</label>
                    <input
                      type="number"
                      value={rawTextPayload.year}
                      onChange={(e) => setRawTextPayload({ ...rawTextPayload, year: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction</label>
                    <select
                      value={rawTextPayload.jurisdiction}
                      onChange={(e) => setRawTextPayload({ ...rawTextPayload, jurisdiction: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="CENTRAL">CENTRAL</option>
                      <option value="STATE">STATE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Paste Raw Gazette / India Code Text
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Our parser automatically parses sections starting with `Section 1...`, `Article 21...`, etc.
                  </p>
                  <textarea
                    rows={8}
                    value={rawTextPayload.rawText}
                    onChange={(e) => setRawTextPayload({ ...rawTextPayload, rawText: e.target.value })}
                    placeholder="Section 1. Short title, extent and commencement. (1) This Act may be called the...\n\nSection 2. Definitions. In this Act, unless the context otherwise requires..."
                    className="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">JSON Payload</label>
                <textarea
                  rows={10}
                  value={jsonPayload}
                  onChange={(e) => setJsonPayload(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Ingest as DRAFT
              </button>
            </div>

            {importResult && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Ingestion Batch Result:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Batch ID: <span className="font-mono">{importResult.batchId}</span></p>
                  <p>Imported Records: <span className="text-emerald-600 font-bold">{importResult.importedRecords}</span></p>
                  <p>Rejected Records: <span className="text-red-600 font-bold">{importResult.rejectedRecords}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-base">Immutable Legal Audit Trail</h3>
              <p className="text-xs text-gray-500">Every state transition, review note, and revision snapshot is logged.</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Timestamp</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Action</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Entity</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Actor</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Review Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-xs">
                {loadingAudit ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading audit logs...</td>
                  </tr>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-semibold text-gray-900">{log.action}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 font-mono">
                        {log.entity_type}:{log.entity_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{log.actor_email}</td>
                      <td className="px-6 py-3 text-gray-600 italic">
                        {log.review_notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No audit logs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ACT */}
      {showCreateActModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Legal Act (DRAFT)</h3>
            <form onSubmit={handleCreateAct} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Act Title *</label>
                <input
                  type="text"
                  required
                  value={newActForm.title}
                  onChange={(e) => setNewActForm({ ...newActForm, title: e.target.value })}
                  placeholder="e.g. Consumer Protection Act, 2019"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Act Number</label>
                  <input
                    type="text"
                    value={newActForm.actNumber}
                    onChange={(e) => setNewActForm({ ...newActForm, actNumber: e.target.value })}
                    placeholder="Act No. 35 of 2019"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    value={newActForm.year}
                    onChange={(e) => setNewActForm({ ...newActForm, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Jurisdiction *</label>
                  <select
                    value={newActForm.jurisdiction}
                    onChange={(e) => setNewActForm({ ...newActForm, jurisdiction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="CENTRAL">CENTRAL</option>
                    <option value="STATE">STATE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">State (if applicable)</label>
                  <input
                    type="text"
                    value={newActForm.state}
                    onChange={(e) => setNewActForm({ ...newActForm, state: e.target.value })}
                    placeholder="e.g. MAHARASHTRA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Official Source URL *</label>
                <input
                  type="url"
                  required
                  value={newActForm.sourceUrl}
                  onChange={(e) => setNewActForm({ ...newActForm, sourceUrl: e.target.value })}
                  placeholder="https://www.indiacode.nic.in/handle/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateActModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Save Act
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SECTION */}
      {showCreateSecModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Section to {selectedAct?.title}</h3>
            <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Section Number *</label>
                  <input
                    type="text"
                    required
                    value={newSecForm.sectionNumber}
                    onChange={(e) => setNewSecForm({ ...newSecForm, sectionNumber: e.target.value })}
                    placeholder="e.g. Section 12 or Article 21"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={newSecForm.title}
                    onChange={(e) => setNewSecForm({ ...newSecForm, title: e.target.value })}
                    placeholder="Short title / heading"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Original Statutory Text *</label>
                <textarea
                  rows={4}
                  required
                  value={newSecForm.originalText}
                  onChange={(e) => setNewSecForm({ ...newSecForm, originalText: e.target.value })}
                  className="w-full font-mono text-xs p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Simplified Citizen Explanation</label>
                <textarea
                  rows={2}
                  value={newSecForm.simplifiedText}
                  onChange={(e) => setNewSecForm({ ...newSecForm, simplifiedText: e.target.value })}
                  placeholder="Plain-language explanation for citizens"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateSecModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WORKFLOW ACTIONS */}
      {actionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Verification Action</h3>
            <p className="text-xs text-gray-600 mb-4">
              Entity: <span className="font-semibold">{actionModal.title}</span> ({actionModal.entityType})
              <br />
              Current Status: {getStatusBadge(actionModal.currentStatus)}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Review Notes / Reason *</label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Provide notes or verification comments..."
                className="w-full p-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                disabled={actionLoading}
                onClick={() => triggerReviewAction('SUBMIT_REVIEW')}
                className="py-2 px-3 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 border border-amber-200"
              >
                Submit Review
              </button>
              <button
                disabled={actionLoading}
                onClick={() => triggerReviewAction('APPROVE_VERIFY')}
                className="py-2 px-3 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 border border-blue-200"
              >
                Approve & Verify
              </button>
              <button
                disabled={actionLoading}
                onClick={() => triggerReviewAction('PUBLISH')}
                className="py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Publish (Sync RAG)
              </button>
              <button
                disabled={actionLoading}
                onClick={() => triggerReviewAction('REJECT')}
                className="py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200"
              >
                Reject to Draft
              </button>
              <button
                disabled={actionLoading}
                onClick={() => triggerReviewAction('SUPERSEDE')}
                className="col-span-2 py-2 px-3 bg-purple-50 text-purple-800 rounded-lg hover:bg-purple-100 border border-purple-200 mt-1"
              >
                Supersede & Purge Vectors
              </button>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
