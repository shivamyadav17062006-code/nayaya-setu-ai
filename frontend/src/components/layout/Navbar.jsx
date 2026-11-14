import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, MessageSquare, BookOpen, Compass, HeartHandshake, CheckCircle2, Menu, X, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { i18n } = useTranslation();
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940" },
    { code: "mr", label: "\u092E\u0930\u093E\u0920\u0940" },
    { code: "ta", label: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD" },
    { code: "te", label: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41" },
    { code: "bn", label: "\u09AC\u09BE\u0982\u09B2\u09BE" },
    { code: "gu", label: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0" },
    { code: "kn", label: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1" }
  ];
  const navLinks = [
    { path: "/chat", label: "AI Legal Assistant", icon: MessageSquare },
    { path: "/rights", label: "Know Your Rights", icon: BookOpen },
    { path: "/navigator", label: "Action Navigator", icon: Compass },
    { path: "/aid-finder", label: "Legal Aid Finder", icon: HeartHandshake },
    { path: "/eligibility", label: "Eligibility", icon: CheckCircle2 }
  ];
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };
  return <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16">{
    /* Logo */
  }<Link to="/" className="flex items-center gap-3 group"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform"><Scale className="w-6 h-6" /></div><div><div className="flex items-center gap-1.5"><span className="font-bold text-xl tracking-tight text-slate-900">NyayaSaathi</span><span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase">India</span></div><p className="text-[11px] text-slate-500 -mt-0.5">Know Your Rights Companion</p></div></Link>{
    /* Desktop Navigation */
  }<nav className="hidden md:flex items-center gap-1">{navLinks.map((link) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.path;
    return <Link
      key={link.path}
      to={link.path}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
    ><Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />{link.label}</Link>;
  })}</nav>{
    /* Right Controls: Language Dropdown + CTA */
  }<div className="hidden lg:flex items-center gap-3"><div className="relative flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200"><Globe className="w-3.5 h-3.5 text-slate-500" /><select
    value={i18n.language || "en"}
    onChange={(e) => handleLanguageChange(e.target.value)}
    className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
  >{languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div><Link
    to="/chat"
    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
  >
              Ask NyayaSaathi
            </Link></div>{
    /* Mobile hamburger */
  }<div className="flex md:hidden items-center gap-2"><button
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
    aria-label="Toggle navigation"
  >{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button></div></div></div>{
    /* Mobile Drawer */
  }{mobileMenuOpen && <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">{navLinks.map((link) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.path;
    return <Link
      key={link.path}
      to={link.path}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? "bg-amber-50 text-amber-700" : "text-slate-700 hover:bg-slate-50"}`}
    ><Icon className={`w-5 h-5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />{link.label}</Link>;
  })}<div className="pt-3 border-t border-slate-200"><Link
    to="/chat"
    onClick={() => setMobileMenuOpen(false)}
    className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg"
  >
              Start Free Legal Chat
            </Link></div></div>}</header>;
}
