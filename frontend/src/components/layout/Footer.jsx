import { Link } from "react-router-dom";
import { Scale, Heart, Shield, ExternalLink } from "lucide-react";
export default function Footer() {
  return <footer className="bg-slate-900 text-slate-300 border-t border-slate-800"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{
    /* Brand info */
  }<div className="space-y-4 md:col-span-1"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold"><Scale className="w-5 h-5" /></div><span className="font-bold text-lg text-white">NyayaSaathi</span></div><p className="text-xs text-slate-400 leading-relaxed">
              An AI-powered Know Your Rights companion making Indian law accessible, understandable, and actionable for every citizen in their native language.
            </p><div className="flex items-center gap-2 text-xs text-amber-400 font-medium"><Shield className="w-4 h-4" /> Grounded in Verified Indian Statutes
            </div></div>{
    /* Core Modules */
  }<div><h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h3><ul className="space-y-2 text-xs"><li><Link to="/chat" className="hover:text-amber-400 transition-colors">AI Legal Assistant</Link></li><li><Link to="/rights" className="hover:text-amber-400 transition-colors">Know Your Rights Catalog</Link></li><li><Link to="/navigator" className="hover:text-amber-400 transition-colors">Complaint Navigator</Link></li><li><Link to="/aid-finder" className="hover:text-amber-400 transition-colors">Free Legal Aid Directory</Link></li><li><Link to="/eligibility" className="hover:text-amber-400 transition-colors">NALSA Eligibility Checker</Link></li></ul></div>{
    /* Official Portals */
  }<div><h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Government Portals</h3><ul className="space-y-2 text-xs"><li><a href="https://www.indiacode.nic.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber-400">
                  India Code <ExternalLink className="w-3 h-3 text-slate-500" /></a></li><li><a href="https://nalsa.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber-400">
                  NALSA Free Legal Aid <ExternalLink className="w-3 h-3 text-slate-500" /></a></li><li><a href="https://bhashini.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber-400">
                  Digital India BHASHINI <ExternalLink className="w-3 h-3 text-slate-500" /></a></li><li><a href="https://edaakhil.nic.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber-400">
                  e-Daakhil Consumer Grievance <ExternalLink className="w-3 h-3 text-slate-500" /></a></li></ul></div>{
    /* Emergency & Disclaimers */
  }<div className="space-y-3"><h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">National Helplines</h3><div className="text-xs space-y-1.5 text-slate-400"><p><span className="text-white font-medium">NALSA Legal Aid:</span> 15100</p><p><span className="text-white font-medium">National Emergency:</span> 112</p><p><span className="text-white font-medium">Women in Distress:</span> 181</p><p><span className="text-white font-medium">Child Helpline:</span> 1098</p><p><span className="text-white font-medium">Consumer Helpline:</span> 1915</p></div></div></div>{
    /* Legal Disclaimer Box */
  }<div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-500 text-center space-y-2"><p className="max-w-4xl mx-auto"><strong className="text-slate-400">Important Disclaimer:</strong> NyayaSaathi is an educational and legal awareness tool designed to simplify statutory rights under Indian law. It does not constitute formal legal counsel or create an advocate-client relationship. In cases of legal disputes, please consult an empanelled NALSA legal aid advocate or certified lawyer.
          </p><p className="flex items-center justify-center gap-1 text-slate-500">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Indian Citizens · Open Social Impact Tech
          </p></div></div></footer>;
}
