import { useState } from "react";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { CitationBadge } from "./CitationBadge";
export function ChatBubble({ message, onActionClick }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  return <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}><div
    className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all ${isUser ? "bg-amber-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-800 shadow-sm space-y-3"}`}
  >{
    /* Header row */
  }<div className="flex items-center justify-between gap-4 pb-1"><span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{isUser ? "You" : "NyayaSaathi Statutory Response"}</span>{!isUser && <button
    onClick={handleCopy}
    className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
    title="Copy answer"
    aria-label="Copy message"
  >{copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}</button>}</div>{
    /* Content body */
  }<div className="whitespace-pre-line leading-relaxed font-sans">{message.content}</div>{
    /* Citations */
  }{!isUser && message.citations && message.citations.length > 0 && <div className="pt-2 border-t border-slate-100 space-y-1.5"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Verified Legal Authority:
            </span><div className="flex flex-wrap gap-1.5">{message.citations.map((c) => <CitationBadge key={c.id || `${c.actName}-${c.sectionNumber}`} citation={c} />)}</div></div>}{
    /* Official action link */
  }{!isUser && message.actionUrl && <div className="pt-2"><a
    href={message.actionUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => onActionClick && onActionClick(message.actionUrl)}
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
  ><span>Access Official Grievance Channel</span><ExternalLink className="w-3 h-3 text-emerald-600" /></a></div>}</div></div>;
}
