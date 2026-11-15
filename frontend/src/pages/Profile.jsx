import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Save,
  LogOut,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";

export default function Profile() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [state, setState] = useState("Delhi");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "bn", label: "বাংলা (Bengali)" },
    { code: "gu", label: "ગુજરાતી (Gujarati)" },
    { code: "kn", label: "ಕನ್ನಡ (Kannada)" }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let currentUser = authApi.getCurrentUser();
      const freshUser = await authApi.fetchProfile();
      if (freshUser) currentUser = freshUser;

      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || "");
        setState(currentUser.state || "Delhi");
        setLanguage(currentUser.language || "en");
      }
    } catch {
      // Profile load failed
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name, state, language });
      if (updated) {
        setUser(updated);
        i18n.changeLanguage(language);
        localStorage.setItem("nyayasaathi_lang", language);
        toast.success("Profile and jurisdiction preferences updated successfully!");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } catch {
      toast.error("Network error while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    toast.success("Signed out successfully.");
    navigate("/");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your locally cached legal search and conversation sessions?")) {
      localStorage.removeItem("nyayasaathi_sessions");
      localStorage.removeItem("nyayasaathi_saved_rights");
      toast.success("Local search and conversation history cleared.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Toaster position="top-right" />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Citizen Dashboard
        </Link>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
          Role: {user?.role || "CITIZEN"}
        </span>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-amber-500/20">
            {user?.name ? user.name[0].toUpperCase() : <User className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user?.name || "Citizen Account"}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{user?.email || user?.phone || "Guest Session"}</span>
              {user?.id && <span className="text-[10px] text-slate-400">ID: {user.id.slice(0, 8)}...</span>}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              {/* State of Residence */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> State / UT (For Jurisdiction Rules)
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Controls state-level statutory thresholds (e.g., Delhi ₹3 Lakh vs Bihar ₹1.5 Lakh).
                </p>
              </div>

              {/* Primary Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Preferred Legal Reading Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Identifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" /> Sign In Identifier
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || user?.phone || "Anonymous Session"}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-400" />}
                Save Preferences
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Privacy & Local Data Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" /> Privacy & Local Data Protection
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          NyayaSaathi adheres to data minimization under the Digital Personal Data Protection Act, 2023. You can clear your cached legal search history and local device session tokens at any time.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" /> Clear Local Device History
          </button>
        </div>
      </div>
    </div>
  );
}
