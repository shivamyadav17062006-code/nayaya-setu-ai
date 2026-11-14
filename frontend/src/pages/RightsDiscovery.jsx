import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ShieldCheck,
  Scale,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Lock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  Bookmark,
  Sparkles,
  Clock,
  User,
  Briefcase,
  Home,
  HeartHandshake,
  BookOpen,
  Send,
  Building,
  Check,
} from 'lucide-react';
import { rightsDiscoveryApi } from '../api/rightsDiscovery.js';

export default function RightsDiscovery() {
  const navigate = useNavigate();

  // Guided Steps: 1 = Intro, 2 = Situation, 3 = Context, 4 = Follow-Ups, 5 = Loading, 6 = Results
  const [currentStep, setCurrentStep] = useState(1);

  // Metadata
  const [metadata, setMetadata] = useState({
    beneficiaries: [],
    categories: [],
    states: [],
  });

  // Citizen Inputs
  const [situation, setSituation] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [answers, setAnswers] = useState({});
  const [userConsent, setUserConsent] = useState(true);

  // Dynamic Follow-Up Questions from classification
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [classifying, setClassifying] = useState(false);

  // Discovery Analysis Results
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(1);

  // UI State
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('rights'); // 'rights' | 'remedies' | 'aid'
  const [savedToken, setSavedToken] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Preset Scenarios for Easy Intake
  const PRESET_SCENARIOS = [
    {
      title: 'Delayed Factory Salary',
      text: 'My employer in a private factory has not paid my monthly salary for the past 3 months. When I asked for my pending wages, they threatened to fire me without notice.',
      beneficiary: 'workers',
    },
    {
      title: 'Defective Mobile Phone Refund',
      text: 'I purchased a smartphone online that stopped working within 15 days. The seller and customer service refuse to replace the item or refund my money despite the warranty.',
      beneficiary: 'consumers',
    },
    {
      title: 'Arbitrary Tenant Eviction',
      text: 'My landlord is demanding an immediate 50% rent increase and has threatened to cut electricity and throw my belongings out if I do not vacate within 48 hours without legal notice.',
      beneficiary: 'tenants',
    },
    {
      title: 'Domestic Abuse & Shelter Right',
      text: 'I am facing continuous verbal abuse, threats of physical violence, and financial deprivation from my husband and in-laws, who are threatening to lock me out of the house.',
      beneficiary: 'women',
    },
    {
      title: 'Elderly Maintenance Denial',
      text: 'I am 68 years old and unable to earn. My adult son who took over the family house is refusing to provide food, medicine, and basic maintenance allowance to me.',
      beneficiary: 'seniors',
    },
  ];

  // Load Metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await rightsDiscoveryApi.getMetadata();
        if (res.success) {
          setMetadata(res.data);
        }
      } catch (err) {
        console.error('Failed to load discovery metadata:', err);
      }
    }
    loadMeta();

    // Check if user has an existing saved session token in localStorage
    const cachedToken = localStorage.getItem('nyayasaathi_discovery_token');
    if (cachedToken) {
      setSavedToken(cachedToken);
    }
  }, []);

  // Classify and Move from Step 3 to Step 4 (Follow-Ups)
  const proceedToFollowUps = async () => {
    if (!situation.trim() || situation.trim().length < 10) {
      notify('Please describe your situation in at least 10 characters.', 'error');
      return;
    }

    try {
      setClassifying(true);
      const res = await rightsDiscoveryApi.classifySituation(situation, {
        state: selectedState,
        beneficiaryCategory: selectedBeneficiary,
      });

      if (res.success) {
        setFollowUpQuestions(res.data.followUpQuestions || []);
        if (!selectedBeneficiary && res.data.suggestedBeneficiaries?.length > 0) {
          setSelectedBeneficiary(res.data.suggestedBeneficiaries[0]);
        }
        setCurrentStep(4);
      }
    } catch (err) {
      notify(err.message || 'Classification failed', 'error');
    } finally {
      setClassifying(false);
    }
  };

  // Run Full Rights Discovery (Step 4 -> Step 5 Loading -> Step 6 Results)
  const executeDiscovery = async () => {
    setCurrentStep(5);
    setAnalyzing(true);
    setAnalysisProgress(1);

    // Progress Simulation for Citizen Transparency
    const t1 = setTimeout(() => setAnalysisProgress(2), 600);
    const t2 = setTimeout(() => setAnalysisProgress(3), 1200);
    const t3 = setTimeout(() => setAnalysisProgress(4), 1800);

    try {
      const res = await rightsDiscoveryApi.discoverRights({
        situation,
        context: {
          state: selectedState,
          beneficiaryCategory: selectedBeneficiary,
          answers,
        },
        userConsent,
      });

      if (res.success) {
        setResults(res.data);
        if (res.data.sessionToken && userConsent) {
          setSavedToken(res.data.sessionToken);
          localStorage.setItem('nyayasaathi_discovery_token', res.data.sessionToken);
        }
        setTimeout(() => {
          setAnalyzing(false);
          setCurrentStep(6);
        }, 2200);
      } else {
        notify(res.error || 'Discovery failed', 'error');
        setAnalyzing(false);
        setCurrentStep(3);
      }
    } catch (err) {
      notify(err.message || 'Error evaluating rights', 'error');
      setAnalyzing(false);
      setCurrentStep(3);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    }
  };

  // Resume Saved Discovery
  const resumeSavedSession = async (token) => {
    try {
      const res = await rightsDiscoveryApi.getSavedSession(token);
      if (res.success && res.data) {
        notify('Restored previous discovery session.');
        setCurrentStep(6);
      }
    } catch (err) {
      notify('Saved session not found or expired.', 'error');
      localStorage.removeItem('nyayasaathi_discovery_token');
      setSavedToken(null);
    }
  };

  // Purge Saved Session (User Privacy Right)
  const purgeSavedSession = async () => {
    if (!savedToken) return;
    try {
      await rightsDiscoveryApi.deleteSavedSession(savedToken);
      localStorage.removeItem('nyayasaathi_discovery_token');
      setSavedToken(null);
      notify('Your saved situation data has been completely erased from the system.');
    } catch (err) {
      notify('Failed to purge session', 'error');
    }
  };

  const getConfidenceBadge = (conf) => {
    switch (conf) {
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">High Legal Match</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Probable Legal Match</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Preliminary Guidance</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
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

      {/* Progress Indicator for Guided Discovery */}
      {currentStep > 1 && currentStep < 6 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
            <span>Step {currentStep - 1} of 4</span>
            <span>
              {currentStep === 2 && 'Describe Your Situation'}
              {currentStep === 3 && 'Select Legal Context'}
              {currentStep === 4 && 'Targeted Follow-Ups'}
              {currentStep === 5 && 'Analyzing Statutory Law...'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* SCREEN 1: INTRODUCTION & LANDING */}
      {currentStep === 1 && (
        <div className="space-y-8 py-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Compass className="h-3.5 w-3.5" />
              Personalized Legal Discovery • No Identity Verification Required
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Know Your Rights in Plain Language
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Describe what happened in your own words. NyayaSaathi cross-references verified Indian statutory law,
              identifies relevant Acts and Sections, maps your beneficiary entitlements, and delivers actionable remedies.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2 text-base transition-all"
              >
                Explore My Rights
                <ArrowRight className="h-5 w-5" />
              </button>

              {savedToken && (
                <button
                  onClick={() => resumeSavedSession(savedToken)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Bookmark className="h-4 w-4 text-indigo-600" />
                  Resume Previous Search
                </button>
              )}
            </div>
          </div>

          {/* Privacy & Safeguard Guarantee */}
          <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3 text-xs text-gray-600">
            <Lock className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">Your Privacy is Protected</p>
              <p className="mt-0.5">
                This is a legal awareness engine, not a government identity KYC system. We do not ask for your name,
                Aadhaar, or phone number. You can erase all situation data anytime.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg w-fit mb-3">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Grounded in Indian Statutes</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Every right is backed by official Acts (Payment of Wages, PWDVA, Consumer Protection, Constitution) with zero fabricated citations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Actionable Remedies</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Step-by-step guides on where to file claims (Labour Commissioner, Magistrate, Consumer Forum) with limitation periods.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Free Legal Aid Routing</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Instant connections to NALSA Helpline 15100 and District Legal Services Authorities for free court representation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: SITUATION INTAKE */}
      {currentStep === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">What happened?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Describe your legal grievance or dispute in ordinary language. Be as specific as you can about what occurred.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">Describe Your Situation *</label>
                <span className="text-[11px] text-gray-400 font-mono">{situation.length} characters</span>
              </div>
              <textarea
                rows={6}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Example: I work in a garment unit in Mumbai. My employer has not paid my salary for October and November. When I asked, they threatened to dismiss me immediately without payslips or severance..."
                className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick Scenario Fillers */}
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-2">Or choose a common example:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_SCENARIOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSituation(p.text);
                      setSelectedBeneficiary(p.beneficiary);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-medium text-gray-700 border border-gray-200 transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={situation.trim().length < 10}
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2 shadow-sm"
            >
              Next: Context <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: CONTEXT COLLECTION */}
      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Context</h2>
            <p className="text-sm text-gray-500 mt-1">
              Indian law varies by State jurisdiction and provides special statutory protections for specific beneficiary groups.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* State Jurisdiction Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                State or Union Territory (Optional, but recommended)
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Used to find state-specific rent control, shops & establishments, and public service laws.
              </p>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All-India / Central Jurisdiction</option>
                {metadata.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Beneficiary Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Which category best describes your standing? (Optional)
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Statutes provide affirmative protections (like 100% Free Legal Aid) for specific citizen groups.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { slug: 'workers', label: 'Worker / Employee' },
                  { slug: 'women', label: 'Woman' },
                  { slug: 'consumers', label: 'Consumer' },
                  { slug: 'tenants', label: 'Tenant' },
                  { slug: 'seniors', label: 'Senior Citizen (60+)' },
                  { slug: 'pwd', label: 'Person with Disability' },
                  { slug: 'students', label: 'Student / Parent' },
                  { slug: 'farmers', label: 'Farmer / Cultivator' },
                  { slug: 'sc-st', label: 'SC / ST Community' },
                  { slug: '', label: 'General Citizen' },
                ].map((cat) => {
                  const isSelected = selectedBeneficiary === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSelectedBeneficiary(cat.slug)}
                      className={`p-3 rounded-lg text-xs font-medium text-left border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Consent Checkbox */}
            <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
              <input
                type="checkbox"
                id="consentCheck"
                checked={userConsent}
                onChange={(e) => setUserConsent(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="consentCheck" className="cursor-pointer">
                I consent to anonymously saving this discovery query with a temporary bookmark token so I can review it later. (You can erase it at any time).
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={classifying}
              onClick={proceedToFollowUps}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {classifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Classifying...
                </>
              ) : (
                <>
                  Next: Follow-Up Questions <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: FOLLOW-UP QUESTIONNAIRE */}
      {currentStep === 4 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">A few quick questions</h2>
            <p className="text-sm text-gray-500 mt-1">
              These details help clarify which statutory deadlines, authorities, and exceptions apply to your case.
            </p>
          </div>

          <div className="space-y-4">
            {followUpQuestions.length > 0 ? (
              followUpQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{q.explanation}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                Your situation is clear. Ready to search statutory records.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={executeDiscovery}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
            >
              Analyze & Reveal My Rights <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: ANALYSIS / LOADING STATE */}
      {currentStep === 5 && (
        <div className="max-w-lg mx-auto py-16 text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <Compass className="h-7 w-7 text-indigo-600 absolute inset-0 m-auto" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">Searching Official Statutes</h3>
            <p className="text-xs text-gray-500 mt-1">Evaluating applicable Acts, Sections, and Remedies...</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 text-left text-xs space-y-3 shadow-sm">
            {[
              { step: 1, text: 'Identifying legal issue & jurisdiction...' },
              { step: 2, text: 'Resolving beneficiary entitlements & Free Legal Aid eligibility...' },
              { step: 3, text: 'Querying 384-dimensional pgvector statutory database...' },
              { step: 4, text: 'Synthesizing actionable remedies & limitation periods...' },
            ].map((st) => (
              <div key={st.step} className="flex items-center gap-2.5">
                {analysisProgress > st.step ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : analysisProgress === st.step ? (
                  <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-300" />
                )}
                <span className={analysisProgress >= st.step ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {st.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 6, 7, 8, 9: RESULTS DOSSIER */}
      {currentStep === 6 && results && (
        <div className="space-y-8">
          {/* Top Dossier Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  Know Your Rights Analysis
                </span>
                {getConfidenceBadge(results.confidence)}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Applicable Rights Dossier</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                {results.confidenceExplanation} {results.missingInfoNote}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep(2);
                  setResults(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> New Search
              </button>
              {savedToken && (
                <button
                  onClick={purgeSavedSession}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                  title="Erase saved data"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Erase Data
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation: Rights | Remedies | Legal Aid */}
          <div className="flex border-b border-gray-200 space-x-8">
            {[
              { id: 'rights', label: `Applicable Rights (${results.applicableRights?.length || 0})`, icon: Scale },
              { id: 'remedies', label: `Recommended Remedies (${results.recommendedRemedies?.length || 0})`, icon: ShieldCheck },
              { id: 'aid', label: 'Free Legal Aid & Next Steps', icon: HeartHandshake },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: APPLICABLE RIGHTS & STATUTE DETAILS */}
          {activeTab === 'rights' && (
            <div className="space-y-4">
              {results.applicableRights?.length > 0 ? (
                results.applicableRights.map((r) => {
                  const isExpanded = expandedSection === r.id;
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-all"
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">
                              {r.actTitle} ({r.actYear}) • {r.sectionNumber}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{r.title}</h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 w-fit">
                            {r.jurisdiction} {r.state ? `(${r.state})` : ''}
                          </span>
                        </div>

                        {/* Why Applicable Plain Language */}
                        <div className="mt-3 bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100/60 text-xs text-indigo-950">
                          <span className="font-bold text-indigo-800 block mb-1">Why this applies to you:</span>
                          {r.whyApplicable}
                        </div>

                        {/* Conditions & Exceptions */}
                        {r.conditions?.length > 0 && (
                          <div className="mt-3 text-xs text-gray-600">
                            <span className="font-semibold text-gray-700 block mb-1">Key Legal Conditions:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-gray-500">
                              {r.conditions.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setExpandedSection(isExpanded ? null : r.id)}
                            className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Hide Legal Text <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                View Verbatim Statute Text <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </button>

                          <a
                            href={r.officialSourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            Official India Code Source <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Expandable Verbatim Legal Text */}
                      {isExpanded && (
                        <div className="bg-gray-50 p-5 border-t border-gray-200 space-y-3 text-xs font-mono">
                          <div>
                            <span className="font-bold text-gray-700 block mb-1 font-sans">
                              Verbatim Statutory Text ({r.sectionNumber}):
                            </span>
                            <div className="bg-white p-3 rounded border border-gray-200 text-gray-800 leading-relaxed text-[11px]">
                              {r.originalStatutoryText}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-sans">
                            Verified on {new Date(r.verificationDate).toLocaleDateString()} against official Gazette repository.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                  No specific statutory sections matched this description. Try providing more details.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECOMMENDED REMEDIES */}
          {activeTab === 'remedies' && (
            <div className="space-y-4">
              {results.recommendedRemedies?.length > 0 ? (
                results.recommendedRemedies.map((rem) => (
                  <div key={rem.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rem.remedyType} REMEDY
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-1">{rem.title}</h3>
                        <p className="text-xs text-gray-500">Associated Statute: {rem.associatedAct} ({rem.sectionNumber})</p>
                      </div>
                      {rem.officialUrl && (
                        <a
                          href={rem.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 w-fit shadow-sm"
                        >
                          Official Portal <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">{rem.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-800 block">Designated Authority:</span>
                        {rem.authority}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block">Statutory Time Limit:</span>
                        {rem.timeLimit}
                      </div>
                    </div>

                    {/* Step by Step Action Guide */}
                    {rem.steps?.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-bold text-gray-800 block">Recommended Action Steps:</span>
                        <div className="space-y-1">
                          {rem.steps.map((st, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className="font-bold text-indigo-600 flex-shrink-0">{i + 1}.</span>
                              <span>{st}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                  No specific judicial or tribunal remedies linked to this record.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FREE LEGAL AID & NEXT STEPS */}
          {activeTab === 'aid' && (
            <div className="space-y-6">
              {/* Beneficiary Specific Entitlements */}
              {results.beneficiaryEntitlements?.length > 0 && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Special Beneficiary Entitlements
                  </h3>
                  {results.beneficiaryEntitlements.map((be, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-lg border border-emerald-100 text-xs space-y-1">
                      <p className="font-bold text-gray-900">{be.title}</p>
                      <p className="text-gray-600">{be.description}</p>
                      <div className="pt-2 flex items-center gap-4 text-emerald-800 font-semibold">
                        <span>Helpline: {be.helpline}</span>
                        <a href={be.portalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                          NALSA Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sequential Action Checklist */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">General Citizen Action Checklist</h3>
                <div className="space-y-2">
                  {results.actionSteps?.map((as, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span>{as}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helplines Directory */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-600" />
                  Official 24x7 Emergency & Grievance Helplines
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {results.helplines?.map((hl, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{hl.name}</span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-100 text-indigo-800">
                          {hl.number}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">{hl.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Statutory KYR Legal Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-[11px] text-gray-500 leading-relaxed">
            <span className="font-bold text-gray-700 block mb-0.5">Statutory Legal Awareness Notice:</span>
            {results.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
