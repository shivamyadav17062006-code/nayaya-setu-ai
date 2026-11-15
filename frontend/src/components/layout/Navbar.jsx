import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Scale,
  Gavel,
  MessageSquare,
  BookOpen,
  Compass,
  HeartHandshake,
  CheckCircle2,
  Landmark,
  FileText,
  MapPin,
  Menu,
  X,
  Globe,
  User,
  LogOut,
  Database,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  PhoneCall
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import AuthModal from "@/components/auth/AuthModal";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [rightsDropdownOpen, setRightsDropdownOpen] = useState(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const rightsRef = useRef(null);
  const actionsRef = useRef(null);
  const userRef = useRef(null);

  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user) setCurrentUser(user);

    authApi.fetchProfile().then((profile) => {
      if (profile) setCurrentUser(profile);
    });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (rightsRef.current && !rightsRef.current.contains(event.target)) {
        setRightsDropdownOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setActionsDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setRightsDropdownOpen(false);
    setActionsDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
    { code: "ta", label: "தமிழ்" },
    { code: "te", label: "తెలుగు" },
    { code: "bn", label: "বাংলা" },
    { code: "gu", label: "ગુજરાતી" },
    { code: "kn", label: "ಕನ್ನಡ" },
  ];

  const rightsMenu = [
    { path: "/rights", label: "Know Your Rights Library", desc: "Explore statutory rights simplified into plain language", icon: BookOpen },
    { path: "/rights/discover", label: "Guided Rights Discovery", desc: "Discover applicable laws based on your life situation", icon: Compass },
    { path: "/constitution", label: "Constitution of India", desc: "Articles, Fundamental Rights, and Writs", icon: Landmark },
    { path: "/legislation", label: "Central Acts & Rules", desc: "India Code verified Union legislation", icon: FileText },
    { path: "/states", label: "State Laws & UTs", desc: "State-specific Acts and local notifications", icon: MapPin },
    { path: "/case-law", label: "Case Law & Precedents", desc: "Supreme Court & High Court landmark ratios", icon: Gavel },
  ];

  const actionsMenu = [
    { path: "/navigator", label: "Legal Action Navigator", desc: "Step-by-step grievance procedures and checklists", icon: Compass },
    { path: "/aid-finder", label: "Free Legal Aid Finder", desc: "Locate your nearest DLSA and NALSA front office", icon: HeartHandshake },
    { path: "/eligibility", label: "NALSA Eligibility Checker", desc: "Verify qualification for free court representation", icon: CheckCircle2 },
    { path: "/documents", label: "Statutory Document Assistant", desc: "Generate verified legal notices and applications", icon: FileText },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("nyayasaathi_lang", langCode);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  const isRightsActive = rightsMenu.some((m) => location.pathname.startsWith(m.path));
  const isActionsActive = actionsMenu.some((m) => location.pathname.startsWith(m.path));

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-slate-900 text-white px-4 py-2 rounded-xl z-50 text-xs font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900">NyayaSaathi</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full uppercase">
                    India
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 -mt-0.5">Know Your Rights Companion</p>
              </div>
            </Link>

            {/* Desktop Navigation Groups */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Rights & Laws Dropdown */}
              <div className="relative" ref={rightsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setRightsDropdownOpen(!rightsDropdownOpen);
                    setActionsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isRightsActive
                      ? "bg-amber-50 text-amber-800"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-expanded={rightsDropdownOpen}
                >
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Rights & Statutes</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${rightsDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {rightsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                    {rightsMenu.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setRightsDropdownOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            active ? "bg-amber-50 text-amber-800" : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{item.label}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remedies & Aid Dropdown */}
              <div className="relative" ref={actionsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setActionsDropdownOpen(!actionsDropdownOpen);
                    setRightsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActionsActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-expanded={actionsDropdownOpen}
                >
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Action & Legal Aid</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${actionsDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {actionsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                    {actionsMenu.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setActionsDropdownOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            active ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{item.label}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Assistant Direct Link */}
              <Link
                to="/chat"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  location.pathname === "/chat"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>AI Assistant</span>
              </Link>

              {/* Citizen Dashboard Direct Link */}
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  location.pathname === "/dashboard"
                    ? "bg-amber-50 text-amber-800"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-600" />
                <span>My Dashboard</span>
              </Link>

              {/* Admin KMS (Only rendered for ADMIN role) */}
              {currentUser?.role === "ADMIN" && (
                <Link
                  to="/admin/kms"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    location.pathname === "/admin/kms"
                      ? "bg-purple-100 text-purple-900 font-bold"
                      : "text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Admin KMS</span>
                </Link>
              )}
            </nav>

            {/* Right Controls: Accessibility + Language + Account + Ask CTA */}
            <div className="hidden lg:flex items-center gap-2">
              <AccessibilityToolbar />

              {/* Language Selector */}
              <div className="relative flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={i18n.language || "en"}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                  aria-label="Interface Language"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Citizen Account Dropdown / Sign In */}
              {currentUser ? (
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : "C"}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 max-w-[80px] truncate">
                      {currentUser.name || "Citizen"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name || "Citizen"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email || currentUser.phone}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" /> My Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" /> Profile & Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" /> Sign In
                </button>
              )}

              {/* Main CTA */}
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ask NyayaSaathi</span>
              </Link>
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Quick Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <AccessibilityToolbar />
              <div className="relative flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                <Globe className="w-3 h-3 text-slate-500" />
                <select
                  value={i18n.language || "en"}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary Direct Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" /> AI Assistant
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-600" /> My Dashboard
              </Link>
            </div>

            {/* Rights & Statutes */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Rights & Statutes</p>
              {rightsMenu.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.path}
                    to={m.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4 text-slate-400" /> {m.label}
                  </Link>
                );
              })}
            </div>

            {/* Action & Remedies */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Action & Legal Aid</p>
              {actionsMenu.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.path}
                    to={m.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4 text-slate-400" /> {m.label}
                  </Link>
                );
              })}
            </div>

            {/* Admin link if role is ADMIN */}
            {currentUser?.role === "ADMIN" && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/admin/kms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50"
                >
                  <Database className="w-4 h-4" /> Admin Legal KMS
                </Link>
              </div>
            )}

            {/* Auth / Account Controls */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              {currentUser ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{currentUser.name || "Citizen"}</p>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[10px] text-amber-600 font-semibold hover:underline"
                      >
                        Profile Settings
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
                >
                  Citizen Sign In
                </button>
              )}

              {/* 24x7 Helpline Call Button */}
              <a
                href="tel:15100"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-amber-900 bg-amber-100 rounded-xl"
              >
                <PhoneCall className="w-4 h-4 text-amber-600" /> NALSA Helpline: 15100
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </>
  );
}
