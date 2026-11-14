import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Compass,
  Briefcase,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  Clock,
  Building,
  Printer,
  AlertCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  HelpCircle,
  Lock,
} from "lucide-react";
import { workflowsApi } from "@/api/workflows";

const CATEGORY_TABS = [
  { id: "ALL", label: "All Procedures", icon: Compass },
  { id: "LABOUR", label: "Labour & Wages", icon: Briefcase },
  { id: "DOMESTIC_VIOLENCE", label: "Domestic Abuse & Safety", icon: ShieldAlert },
  { id: "CONSUMER", label: "Consumer Redressal", icon: ShoppingBag },
  { id: "CYBERCRIME", label: "Cybercrime & Fraud", icon: Shield },
  { id: "WORKPLACE_HARASSMENT", label: "POSH / Workplace Harassment", icon: ShieldAlert },
  { id: "RTI", label: "Right to Information", icon: FileText },
  { id: "SENIOR_CITIZENS", label: "Senior Citizen Maintenance", icon: HelpCircle },
];

export default function Navigator() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Active workflow state
  const [workflow, setWorkflow] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [checkedDocs, setCheckedDocs] = useState({});
  const [branchChoices, setBranchChoices] = useState({});
  const [notes, setNotes] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error

  // Accordion & UI states
  const [showStatuteDetails, setShowStatuteDetails] = useState(false);
  const [safetyModalUrl, setSafetyModalUrl] = useState(null);
  const [safetyModalTitle, setSafetyModalTitle] = useState("");

  // 1. Fetch all workflows on mount
  useEffect(() => {
    async function fetchList() {
      setLoading(true);
      try {
        const list = await workflowsApi.getWorkflows();
        setWorkflows(list);
        if (list && list.length > 0) {
          setSelectedWorkflowId(list[0].id || list[0].category);
        }
      } catch (err) {
        console.error("Failed to load workflows list:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, []);

  // 2. Fetch selected workflow details and user progress
  useEffect(() => {
    if (!selectedWorkflowId) return;

    let isMounted = true;
    async function loadWorkflowAndProgress() {
      try {
        const wfData = await workflowsApi.getWorkflow(selectedWorkflowId);
        if (!isMounted) return;
        setWorkflow(wfData);

        // Load existing saved progress
        const progress = await workflowsApi.getProgress(wfData.id || selectedWorkflowId);
        if (progress && isMounted) {
          setCurrentStepIndex(Math.max(0, (progress.currentStep || 1) - 1));
          setCompletedSteps(new Set(progress.completedSteps || []));
          const docMap = {};
          (progress.checkedDocuments || []).forEach((d) => (docMap[d] = true));
          setCheckedDocs(docMap);
          setBranchChoices(progress.branchChoices || {});
          setNotes(progress.notes || "");
          setIsCompleted(!!progress.isCompleted);
        } else if (isMounted) {
          // Reset tracker for new workflow selection
          setCurrentStepIndex(0);
          setCompletedSteps(new Set());
          setCheckedDocs({});
          setBranchChoices({});
          setNotes("");
          setIsCompleted(false);
        }
      } catch (err) {
        console.error("Error loading workflow details:", err);
      }
    }
    loadWorkflowAndProgress();
    return () => {
      isMounted = false;
    };
  }, [selectedWorkflowId]);

  // 3. Save progress helper
  const saveCurrentProgress = useCallback(
    async (overrides = {}) => {
      if (!workflow) return;
      setSaveStatus("saving");
      try {
        const payload = {
          currentStep: (overrides.currentStepIndex ?? currentStepIndex) + 1,
          completedSteps: Array.from(overrides.completedSteps ?? completedSteps),
          checkedDocuments: Object.keys(overrides.checkedDocs ?? checkedDocs).filter(
            (k) => (overrides.checkedDocs ?? checkedDocs)[k]
          ),
          branchChoices: overrides.branchChoices ?? branchChoices,
          notes: overrides.notes ?? notes,
          isCompleted: overrides.isCompleted ?? isCompleted,
        };
        await workflowsApi.saveProgress(workflow.id, payload);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Failed to save workflow progress:", err);
        setSaveStatus("error");
      }
    },
    [workflow, currentStepIndex, completedSteps, checkedDocs, branchChoices, notes, isCompleted]
  );

  // Toggle document checked state
  const toggleDoc = (doc) => {
    const updated = { ...checkedDocs, [doc]: !checkedDocs[doc] };
    setCheckedDocs(updated);
    saveCurrentProgress({ checkedDocs: updated });
  };

  // Toggle step completion
  const toggleStepCompletion = (stepNum) => {
    const updated = new Set(completedSteps);
    if (updated.has(stepNum)) {
      updated.delete(stepNum);
    } else {
      updated.add(stepNum);
    }
    setCompletedSteps(updated);

    const allStepsCount = workflow?.steps?.length || 0;
    const isNowAllCompleted = updated.size >= allStepsCount && allStepsCount > 0;
    setIsCompleted(isNowAllCompleted);

    saveCurrentProgress({
      completedSteps: updated,
      isCompleted: isNowAllCompleted,
    });
  };

  // Handle conditional branch decision
  const handleBranchChoice = (stepNum, choice) => {
    const updatedChoices = { ...branchChoices, [stepNum]: choice };
    setBranchChoices(updatedChoices);
    saveCurrentProgress({ branchChoices: updatedChoices });
  };

  // Reset progress
  const handleResetProgress = async () => {
    if (!workflow) return;
    const confirmed = window.confirm(
      "Are you sure you want to reset your progress on this procedure? All checked documents and completed steps will be cleared."
    );
    if (!confirmed) return;

    try {
      await workflowsApi.resetProgress(workflow.id);
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      setCheckedDocs({});
      setBranchChoices({});
      setNotes("");
      setIsCompleted(false);
      setSaveStatus("idle");
    } catch (err) {
      console.error("Failed to reset progress:", err);
    }
  };

  // Safe external navigation prompt
  const openExternalSafely = (url, title) => {
    setSafetyModalUrl(url);
    setSafetyModalTitle(title || "Official Government Portal");
  };

  const confirmNavigation = () => {
    if (safetyModalUrl) {
      window.open(safetyModalUrl, "_blank", "noopener,noreferrer");
      setSafetyModalUrl(null);
    }
  };

  // Filtered workflows directory
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      const matchCat =
        activeCategory === "ALL" ||
        w.category === activeCategory ||
        w.categoryId === activeCategory.toLowerCase();
      const matchQuery =
        !searchQuery.trim() ||
        w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.targetAuthority?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [workflows, activeCategory, searchQuery]);

  const totalSteps = workflow?.steps?.length || 0;
  const completedCount = completedSteps.size;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" /> Legal Action Navigator
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Verified Procedural Complaint Engine
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Step-by-step statutory workflows under Indian law. Track your document readiness,
            procedural deadlines, and competent authorities before filing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print Action Plan
          </button>
        </div>
      </div>

      {/* Main Grid: Procedures Directory (Left) + Active Stepper (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Procedure Search & Catalog */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Statutory Procedures ({filteredWorkflows.length})
            </h2>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by topic, law, or authority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List of Procedure Cards */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading procedures...</div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">No workflows found.</div>
              ) : (
                filteredWorkflows.map((w) => {
                  const isSelected = selectedWorkflowId === w.id || selectedWorkflowId === w.category;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkflowId(w.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {w.title}
                        </span>
                        <span className="shrink-0 text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {w.steps?.length || w.totalSteps || 0} steps
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {w.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-slate-600">
                        <span className="truncate text-emerald-800">
                          {w.targetAuthority || "Competent Authority"}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{w.estimatedDays || 30} days</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Statutory Helplines Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Statutory Emergency Helplines
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">Free Legal Aid (NALSA)</span>
                <span className="font-bold text-amber-300 text-sm">15100</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">National Emergency</span>
                <span className="font-bold text-amber-300 text-sm">112</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">National Cybercrime</span>
                <span className="font-bold text-amber-300 text-sm">1930</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">Consumer Helpline</span>
                <span className="font-bold text-amber-300 text-sm">1915</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Statutory helpline assistance is free, confidential, and mandated under Union legislation.
            </p>
          </div>
        </div>

        {/* Right Area: Interactive Workflow Detail & Stepper */}
        <div className="lg:col-span-8 space-y-6">
          {workflow ? (
            <>
              {/* Workflow Banner & Overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Statutory Procedure
                  </span>

                  <div className="flex items-center gap-2">
                    {saveStatus === "saving" && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" /> Autosaving...
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Progress saved
                      </span>
                    )}
                    <button
                      onClick={handleResetProgress}
                      title="Reset progress for this procedure"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {workflow.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {workflow.description}
                  </p>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Target Authority
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {workflow.targetAuthority}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Statutory Timelines
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {workflow.verifiedTimelines || `${workflow.estimatedDays || 30} days`}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Prescribed Fee
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {workflow.fees || "Free of Cost / Statutory Nominal"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Progress: {completedCount} of {totalSteps} steps completed
                    </span>
                    <span className="text-emerald-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Collapsible: Statutory Laws, Eligibility & Appellate Route */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setShowStatuteDetails(!showStatuteDetails)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>View Eligibility, Statutory Laws & Escalation Route</span>
                    {showStatuteDetails ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showStatuteDetails && (
                    <div className="mt-3 space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
                      {workflow.eligibilityConditions?.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">
                            Eligibility Conditions:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {workflow.eligibilityConditions.map((cond, idx) => (
                              <li key={idx}>{cond}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {workflow.applicableLaws?.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">
                            Applicable Enactments:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {workflow.applicableLaws.map((law, idx) => (
                              <li key={idx}>{law}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {workflow.escalationRoute && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-0.5">
                            Escalation Route:
                          </span>
                          <p className="text-slate-600 leading-relaxed">
                            {workflow.escalationRoute}
                          </p>
                        </div>
                      )}

                      {workflow.appealMechanism && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-0.5">
                            Statutory Appeal Mechanism:
                          </span>
                          <p className="text-slate-600 leading-relaxed">
                            {workflow.appealMechanism}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
                {workflow.steps?.map((step, idx) => {
                  const stepNum = step.stepNumber || idx + 1;
                  const isDone = completedSteps.has(stepNum);
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.id || idx} className="relative flex items-start gap-4 group">
                      {/* Step Number Circle */}
                      <button
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-md ring-4 ring-white z-10 transition-transform ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-slate-900 text-white scale-110"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                      </button>

                      {/* Step Card */}
                      <div
                        className={`flex-1 bg-white border rounded-2xl p-6 shadow-sm space-y-4 transition-all ${
                          isCurrent
                            ? "border-emerald-300 ring-1 ring-emerald-200"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Header: Title & Time Limit */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                              Step {stepNum}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {step.timeLimit && (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {step.timeLimit}
                              </span>
                            )}
                            {step.fees && (
                              <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                                {step.fees}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Instructions */}
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {step.instructions || step.description}
                        </p>

                        {/* Document Checklist */}
                        {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Required Documents for this step:
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Check off as prepared
                              </span>
                            </div>
                            <div className="space-y-2">
                              {step.requiredDocuments.map((doc, docIdx) => {
                                const isDocChecked = !!checkedDocs[doc];
                                return (
                                  <label
                                    key={docIdx}
                                    onClick={() => toggleDoc(doc)}
                                    className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isDocChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span
                                      className={
                                        isDocChecked ? "line-through text-slate-400" : ""
                                      }
                                    >
                                      {doc}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Conditional Branching Decision (if present) */}
                        {step.conditionalBranch && (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Decision Point: {step.conditionalBranch.question}</span>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {step.conditionalBranch.options?.map((opt, optIdx) => {
                                const isSelected = branchChoices[stepNum] === opt.label;
                                return (
                                  <label
                                    key={optIdx}
                                    onClick={() => handleBranchChoice(stepNum, opt.label)}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                      isSelected
                                        ? "bg-white border border-amber-300 font-semibold text-amber-950 shadow-xs"
                                        : "hover:bg-amber-100/50 text-amber-900"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`branch_${stepNum}`}
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="w-4 h-4 mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                    <div>
                                      <span>{opt.label}</span>
                                      {isSelected && opt.nextAction && (
                                        <p className="text-[11px] text-emerald-800 font-medium mt-1">
                                          Recommended action: {opt.nextAction}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tips */}
                        {step.tips && step.tips.length > 0 && (
                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>{step.tips[0]}</span>
                          </div>
                        )}

                        {/* Authority & Safe Portal Link */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Building className="w-3.5 h-3.5 text-amber-600" />
                            Authority: {step.authorityName}
                          </span>

                          <div className="flex items-center gap-3">
                            {step.officialLink && (
                              <button
                                onClick={() =>
                                  openExternalSafely(
                                    step.officialLink,
                                    `${step.authorityName} Official Portal`
                                  )
                                }
                                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                              >
                                Official Government Portal <ExternalLink className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleStepCompletion(stepNum)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isDone
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                              }`}
                            >
                              {isDone ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Step Completed
                                </>
                              ) : (
                                "Mark Complete"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion Banner */}
              {isCompleted && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950">
                    All Procedural Steps Completed!
                  </h3>
                  <p className="text-xs text-emerald-900 max-w-lg mx-auto">
                    You have verified all prerequisite proofs and statutory documents. If you have
                    not received redressal, call DLSA National Legal Helpline at{" "}
                    <strong>15100</strong> for free advocate assignment before the relevant tribunal.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              Select a procedure from the left catalog to start tracking your action plan.
            </div>
          )}
        </div>
      </div>

      {/* External Portal Safety Interstitial Modal */}
      {safetyModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  External Government Portal Notice
                </h3>
                <span className="text-xs text-slate-500 font-medium">{safetyModalTitle}</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
              <p>
                You are navigating to an official Government of India electronic portal:
              </p>
              <div className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 break-all text-slate-700">
                {safetyModalUrl}
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                <strong>Statutory Notice:</strong> NyayaSaathi does not file petitions or store
                your official portal credentials. You will directly submit your documents on the
                designated government portal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSafetyModalUrl(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Stay on NyayaSaathi
              </button>
              <button
                onClick={confirmNavigation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
              >
                Proceed to Portal <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
