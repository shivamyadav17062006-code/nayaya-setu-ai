import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Scale,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Languages,
  AlertTriangle,
  RefreshCw,
  Database
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useChat } from "@/hooks/useChat";
import { SUPPORTED_LANGUAGES } from "@/types";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    sessions,
    activeSessionId,
    messages,
    isLoading,
    isTyping,
    dbPersisted,
    dbStatus,
    dbWarning,
    checkDbConnection,
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession
  } = useChat({ language: selectedLanguage });

  const handleRetryDb = async () => {
    setIsCheckingDb(true);
    await checkDbConnection();
    setIsCheckingDb(false);
    toast.success("Database status refreshed");
  };
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [initialQuery]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };
  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast("Speech Recognition is supported in Chrome/Edge. Voice STT via BHASHINI will activate automatically when microphone access is granted.", {
        icon: "\u{1F399}\uFE0F"
      });
      return;
    }
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      if (!isListening) {
        recognition.start();
        setIsListening(true);
        toast.success(`Listening in ${selectedLanguage.toUpperCase()}... Speak now.`);
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage((prev) => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
        };
        recognition.onerror = () => {
          setIsListening(false);
          toast.error("Voice input cancelled or unavailable");
        };
        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } catch {
      setIsListening(false);
      toast.error("Could not initialize speech recognition");
    }
  };
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2e3);
  };
  return <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden"><Toaster position="top-right" />{
    /* Sidebar for chat history */
  }<aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200"><div className="p-4 border-b border-slate-100 flex items-center justify-between"><button
    onClick={() => startNewSession()}
    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-sm transition-colors"
  ><Plus className="w-4 h-4" />
            New Conversation
          </button></div><div className="flex-1 overflow-y-auto p-3 space-y-1"><div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Recent Inquiries
          </div>{sessions.length === 0 ? <p className="text-xs text-slate-400 p-2 italic">No past sessions yet.</p> : sessions.map((s) => <div
    key={s.id}
    onClick={() => selectSession(s.id)}
    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${s.id === activeSessionId ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
  ><div className="truncate flex-1 pr-2"><p className="truncate">{s.title || "Legal Inquiry"}</p><span className="text-[10px] text-slate-400">{new Date(s.updatedAt).toLocaleDateString()}</span></div><button
    onClick={(e) => {
      e.stopPropagation();
      deleteSession(s.id);
    }}
    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded"
    title="Delete chat"
  ><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>{
    /* Legal Aid Hotline Footer */
  }<div className="p-3 bg-slate-900 text-white text-[11px] flex items-center justify-between"><span>NALSA Free Help:</span><a href="tel:15100" className="font-bold text-amber-400 hover:underline">
            15100
          </a></div></aside>{
    /* Main Chat Area */
  }<div className="flex-1 flex flex-col h-full bg-slate-50">{
    /* Database Persistence Offline Warning Banner */
    dbPersisted === false && (
      <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-amber-950">Stateless Session Mode: </span>
            <span className="text-amber-800">
              {dbWarning || "Cloud database sync is unavailable. Responses are active, but history is kept only in your local browser storage."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300 capitalize"
            title={`Database status: ${dbStatus}`}
          >
            Local Mode ({dbStatus})
          </span>
          <button
            onClick={handleRetryDb}
            disabled={isCheckingDb}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 transition-colors cursor-pointer"
            title="Retry PostgreSQL connection check"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingDb ? "animate-spin text-amber-600" : ""}`} />
            <span className="hidden md:inline">Retry</span>
          </button>
        </div>
      </div>
    )
  }{
    /* Messages Container */
  }<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">{messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4"><div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm"><Scale className="w-8 h-8" /></div><div className="space-y-1"><h3 className="text-xl font-bold text-slate-900">NyayaSaathi Legal Assistant</h3><p className="text-xs text-slate-500">
                  Grounded in the Constitution of India, Bharatiya Nyaya Sanhita, Labour Codes, and Consumer Protection statutes.
                </p></div><div className="w-full pt-4 space-y-2"><p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Try asking:</p><div className="grid grid-cols-1 gap-2 text-left"><button
    onClick={() => sendMessage("My employer has withheld my salary for 3 months. What legal steps can I take in Maharashtra?")}
    className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
  >
                    💼 "My employer has withheld my salary for 3 months. What legal steps can I take?"
                  </button><button
    onClick={() => sendMessage("Where can a woman get immediate protection against domestic violence under PWDVA 2005?")}
    className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
  >
                    🛡️ "Where can a woman get immediate protection against domestic abuse under PWDVA 2005?"
                  </button><button
    onClick={() => sendMessage("How to file an e-complaint on eDaakhil for a defective product without hiring a lawyer?")}
    className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
  >
                    🛒 "How to file a consumer complaint on eDaakhil for a defective product without a lawyer?"
                  </button></div></div></div> : messages.map((msg) => <div
    key={msg.id}
    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
  ><div
    className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${msg.role === "user" ? "bg-amber-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-800 shadow-sm space-y-3"}`}
  ><div className="flex items-center justify-between gap-4 pb-1"><span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{msg.role === "user" ? "Citizen Question" : "NyayaSaathi Statutory Response"}</span>{msg.role === "assistant" && <button
    onClick={() => handleCopy(msg.id, msg.content)}
    className="text-slate-400 hover:text-slate-600 p-0.5"
    title="Copy text"
  >{copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}</button>}</div>{
    /* Body Content */
  }<div className="whitespace-pre-line">{msg.content}</div>{
    /* Retry Action if error occurred */
    msg.isError && msg.retryText && (
      <div className="pt-1">
        <button
          onClick={() => sendMessage(msg.retryText)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Question
        </button>
      </div>
    )
  }{
    /* Statutory Citations */
  }{msg.citations && msg.citations.length > 0 && <div className="pt-2 border-t border-slate-100 space-y-1"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3 h-3 text-amber-600" /> Applicable Indian Law:
                      </span><div className="flex flex-wrap gap-1.5">{msg.citations.map((c, idx) => <span
    key={idx}
    className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
  ><span>{c.actName}</span>{c.sectionNumber && <span className="font-bold">§{c.sectionNumber}</span>}</span>)}</div></div>}{
    /* Action Navigation Link if available */
  }{msg.actionUrl && <div className="pt-2"><a
    href={msg.actionUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
  >
                        Official Grievance Channel <ExternalLink className="w-3 h-3" /></a></div>}</div></div>)}{
    /* Typing Indicator */
  }{isTyping && <div className="flex justify-start"><div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" /><div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" /><span className="text-xs text-slate-500 ml-1">Analyzing statutory provisions & jurisdiction...</span></div></div>}<div ref={messagesEndRef} /></div>{
    /* Input Bar */
  }<div className="bg-white border-t border-slate-200 p-4"><form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-2"><div className="flex items-center gap-2 bg-slate-100 rounded-2xl border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition-all">{
    /* Language Selector */
  }<div className="flex items-center pl-2 pr-1 text-slate-500"><Languages className="w-4 h-4 mr-1 text-slate-400" /><select
    value={selectedLanguage}
    onChange={(e) => setSelectedLanguage(e.target.value)}
    className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
  >{SUPPORTED_LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.code.toUpperCase()})
                    </option>)}</select></div>{
    /* Text Input */
  }<input
    type="text"
    value={inputMessage}
    onChange={(e) => setInputMessage(e.target.value)}
    placeholder="Ask your legal question in Hindi, English, Marathi, Tamil..."
    className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
    disabled={isLoading}
  />{
    /* Voice Input Button */
  }<button
    type="button"
    onClick={handleVoiceToggle}
    className={`p-2 rounded-xl transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"}`}
    title="Voice input (STT via BHASHINI / Web Speech)"
  >{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>{
    /* Submit Button */
  }<button
    type="submit"
    disabled={!inputMessage.trim() || isLoading}
    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white transition-colors shadow-sm"
  ><Send className="w-4 h-4" /></button></div><p className="text-[10px] text-center text-slate-400">
              NyayaSaathi provides simplified statutory information, not legal advice. In judicial disputes, contact NALSA at 15100.
            </p></form></div></div></div>;
}
