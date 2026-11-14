import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/auth";
import AuthModal from "@/components/auth/AuthModal";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Check cached user
    const user = authApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    // Verify fresh profile with server
    authApi.fetchProfile().then((profile) => {
      if (profile) setCurrentUser(profile);
    });
  }, []);

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

  const navLinks = [
    { path: "/chat", label: "AI Legal Assistant", icon: MessageSquare },
    { path: "/constitution", label: "Constitution", icon: Landmark },
    { path: "/legislation", label: "Central Acts & Rules", icon: FileText },
    { path: "/states", label: "State Laws & UTs", icon: MapPin },
    { path: "/case-law", label: "Case Law & Precedents", icon: Gavel },
    { path: "/admin/kms", label: "Legal KMS", icon: Database },
    { path: "/rights/discover", label: "Rights Discovery", icon: Compass },
    { path: "/rights", label: "Know Your Rights", icon: BookOpen },
    { path: "/navigator", label: "Action Navigator", icon: Compass },
    { path: "/aid-finder", label: "Legal Aid Finder", icon: HeartHandshake },
    { path: "/eligibility", label: "Eligibility", icon: CheckCircle2 },
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
  };

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
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight text-slate-900">NyayaSaathi</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase">
                    India
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-0.5">Know Your Rights Companion</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-50 text-amber-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Language Dropdown + Accessibility + Citizen Account + CTA */}
            <div className="hidden lg:flex items-center gap-2.5">
              <AccessibilityToolbar />
              <div className="relative flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
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

              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "C"}
                  </div>
                  <span className="text-xs font-medium text-slate-800 max-w-[100px] truncate">
                    {currentUser.name || currentUser.email || currentUser.phone}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="text-slate-400 hover:text-rose-600 ml-1 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Sign In
                </button>
              )}

              <Link
                to="/chat"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
              >
                Ask NyayaSaathi
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? "bg-amber-50 text-amber-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-200 space-y-2">
              {currentUser ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-800">
                      {currentUser.name || currentUser.email || currentUser.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Citizen Sign In
                </button>
              )}

              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg"
              >
                Start Free Legal Chat
              </Link>
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
