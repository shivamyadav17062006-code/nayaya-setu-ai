import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Bookmark,
  Compass,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  User,
  Sparkles,
  RefreshCw,
  FolderOpen,
  BookOpen
} from "lucide-react";
import { authApi } from "@/api/auth";
import { chatApi } from "@/api/chat";
import { workflowsApi } from "@/api/workflows";
import { eligibilityApi } from "@/api/eligibility";
import AuthModal from "@/components/auth/AuthModal";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [savedRights, setSavedRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);

      // Load recent conversations
      const savedLocal = (() => {
        try {
          return JSON.parse(localStorage.getItem("nyayasaathi_sessions") || "[]");
        } catch {
          return [];
        }
      })();
      const localIds = savedLocal.map((s) => s.id || s.sessionId).filter(Boolean);
      if (currentUser && localIds.length > 0) {
        await chatApi.syncConversations(localIds);
      }
      const convData = await chatApi.getSessions(localIds);
      if (Array.isArray(convData?.data)) {
        setConversations(convData.data.slice(0, 5));
      } else if (Array.isArray(convData)) {
        setConversations(convData.slice(0, 5));
      }

      // Load user workflow progress
      const wfProgress = await workflowsApi.getAllProgress();
      if (Array.isArray(wfProgress)) {
        setWorkflows(wfProgress);
      }

      // Load saved legal aid assessments
      const assessData = await eligibilityApi.getSavedAssessments();
      if (Array.isArray(assessData)) {
        setAssessments(assessData.slice(0, 4));
      }

      // Load saved bookmarks from localStorage
      try {
        const bookmarks = JSON.parse(localStorage.getItem("nyayasaathi_saved_rights") || "[]");
        setSavedRights(bookmarks);
      } catch {
        setSavedRights([]);
      }
    } catch (err) {
      console.error("Failed to load citizen dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Profile Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <ShieldCheck className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Citizen Legal Empowerment Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.name ? `Namaste, ${user.name}` : "Namaste, Citizen"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Track your ongoing legal inquiries, saved rights, active grievance workflows, and official legal aid eligibility assessments in one secure, private portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10"
              >
                <User className="w-4 h-4 text-amber-400" /> View Profile & Settings
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <User className="w-4 h-4" /> Sign In to Sync Account
              </button>
            )}
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4 text-amber-600" /> New Legal Question
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI Queries</span>
            <p className="text-2xl font-bold text-slate-900">{conversations.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Workflows</span>
            <p className="text-2xl font-bold text-slate-900">{workflows.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aid Assessments</span>
            <p className="text-2xl font-bold text-slate-900">{assessments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bookmarked Rights</span>
            <p className="text-2xl font-bold text-slate-900">{savedRights.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Workflows & Recent Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Workflows & Saved Assessments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Workflows Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Ongoing Complaint Workflows</h2>
                  <p className="text-xs text-slate-500">Track your verified steps and required documents</p>
                </div>
              </div>
              <Link
                to="/navigator"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Explore All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600">No active grievance workflows started yet.</p>
                <Link
                  to="/navigator"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50"
                >
                  Start Salary Recovery or Consumer Workflow
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf) => {
                  const title = wf.workflow?.title || "Grievance Workflow";
                  const authority = wf.workflow?.responsibleAuthority || "Competent Authority";
                  const currentStep = wf.currentStep || 1;
                  const isDone = wf.isCompleted;

                  return (
                    <div
                      key={wf.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authority: {authority}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isDone ? "Completed" : `Step ${currentStep} Active`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-500">
                          {wf.checkedDocuments?.length || 0} documents verified
                        </span>
                        <Link
                          to={`/navigator?workflow=${wf.workflowId}`}
                          className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          Continue Steps <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legal Aid Assessments Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Legal Aid Eligibility Records</h2>
                  <p className="text-xs text-slate-500">Statutory evaluations under Section 12 of LSA Act, 1987</p>
                </div>
              </div>
              <Link
                to="/eligibility"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                New Assessment <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600">No eligibility assessments saved yet.</p>
                <Link
                  to="/eligibility"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50"
                >
                  Check Free Lawyer Qualification
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assessments.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">{item.state || "India"}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.eligible ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.eligible ? "Eligible (Sec 12)" : "Income-Review"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.statutoryClause ? `Grounds: ${item.statutoryClause}` : "Evaluated against state income ceiling"}
                    </p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Saved"}
                      </span>
                      <Link to="/aid-finder" className="text-purple-700 font-semibold text-xs hover:underline">
                        Find DLSA Office
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Inquiries & Bookmarks */}
        <div className="space-y-8">
          {/* Recent AI Inquiries */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" /> Recent Consultations
              </h3>
              <Link to="/chat" className="text-xs font-semibold text-amber-600 hover:underline">
                Chat
              </Link>
            </div>

            {conversations.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent conversations stored.</p>
            ) : (
              <div className="space-y-2.5">
                {conversations.map((c) => (
                  <Link
                    key={c.id || c.sessionId}
                    to={`/chat?session=${c.sessionId || c.id}`}
                    className="block p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {c.messages?.[0]?.content || "Legal Consultation Session"}
                    </p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Active"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked Rights */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" /> Saved Legal Rights
              </h3>
              <Link to="/rights" className="text-xs font-semibold text-blue-600 hover:underline">
                Browse
              </Link>
            </div>

            {savedRights.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No rights bookmarked yet. Tap the bookmark icon while browsing statutory sections.</p>
            ) : (
              <div className="space-y-2">
                {savedRights.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{r.title || r.actName}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{r.simplifiedText || r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency 24x7 Helpline Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <PhoneCall className="w-4 h-4" /> 24x7 Free Legal Aid
            </div>
            <h4 className="text-xl font-extrabold">Helpline 15100</h4>
            <p className="text-xs text-white/90 leading-relaxed">
              Dial toll-free to connect directly with the National Legal Services Authority (NALSA) for immediate panel advocate allocation.
            </p>
            <a
              href="tel:15100"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-md hover:bg-slate-100 transition-colors"
            >
              Call 15100 Now
            </a>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
