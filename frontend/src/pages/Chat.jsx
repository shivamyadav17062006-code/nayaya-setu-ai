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
  Database,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Square,
  History,
  X
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useChat } from "@/hooks/useChat";
import { SUPPORTED_LANGUAGES } from "@/types";

const SPEECH_LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  ur: "ur-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("nyayasaathi_lang") || "en" : "en";
  });
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [expandedCitationId, setExpandedCitationId] = useState(null);

  // Audio Playback State (TTS)
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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

  const sessionParam = searchParams.get("session");

  useEffect(() => {
    if (sessionParam && sessionParam !== activeSessionId) {
      selectSession(sessionParam);
    }
  }, [sessionParam, activeSessionId, selectSession]);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  // 1. Voice Input (Speech Recognition) with language awareness
  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast("Speech Recognition is supported in Chrome, Edge, and modern browsers.", {
        icon: "🎙️",
      });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      const langTag = SPEECH_LANG_MAP[selectedLanguage] || "en-IN";
      recognition.lang = langTag;
      recognition.continuous = false;
      recognition.interimResults = false;

      if (!isListening) {
        recognition.start();
        setIsListening(true);
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
        toast.success(`Listening in ${langObj?.name || selectedLanguage.toUpperCase()} (${langTag})... Speak now.`);

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = (e) => {
          setIsListening(false);
          if (e.error !== "no-speech") {
            toast.error(`Voice input error (${e.error}). Falling back to keyboard.`);
          }
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

  // 2. Read Answer Aloud (Text-to-Speech)
  const handleSpeakMessage = (msgId, text, msgLanguage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    // Toggle pause/resume if same message
    if (speakingMsgId === msgId) {
      if (window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsAudioPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsAudioPaused(true);
        }
        return;
      }
    }

    // Stop existing speech
    window.speechSynthesis.cancel();

    // Clean plain text
    const cleanText = text
      .replace(/[*_#`[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Auto-detect script language so voice accent matches the response text
    let detectedTag = null;
    if (/[\u0900-\u097F]/.test(cleanText)) {
      detectedTag = /(आहे|नाहीत|नाही|झाले|केले|पाहिजे|माझे|कामगार|पगार|करावे|काय)/i.test(cleanText) ? "mr-IN" : "hi-IN";
    } else if (/[\u0980-\u09FF]/.test(cleanText)) {
      detectedTag = "bn-IN";
    } else if (/[\u0B80-\u0BFF]/.test(cleanText)) {
      detectedTag = "ta-IN";
    } else if (/[\u0C00-\u0C7F]/.test(cleanText)) {
      detectedTag = "te-IN";
    } else if (/[\u0C80-\u0CFF]/.test(cleanText)) {
      detectedTag = "kn-IN";
    } else if (/[\u0A80-\u0AFF]/.test(cleanText)) {
      detectedTag = "gu-IN";
    }

    const langTag =
      detectedTag ||
      (msgLanguage ? SPEECH_LANG_MAP[msgLanguage] : null) ||
      SPEECH_LANG_MAP[selectedLanguage] ||
      "en-IN";

    utterance.lang = langTag;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setSpeakingMsgId(msgId);
      setIsAudioPaused(false);
    };

    utterance.onend = () => {
      setSpeakingMsgId(null);
      setIsAudioPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
      setIsAudioPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setIsAudioPaused(false);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar for chat history */}
      <aside
        aria-label="Chat Session History"
        className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={() => startNewSession()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-sm transition-colors focus-visible:outline-2"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Recent Inquiries
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 italic">No past sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  s.id === activeSessionId
                    ? "bg-amber-50 text-amber-900 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <p className="truncate">{s.title || "Legal Inquiry"}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded"
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Legal Aid Hotline Footer */}
        <div className="p-3 bg-slate-900 text-white text-[11px] flex items-center justify-between">
          <span>NALSA Free Help:</span>
          <a href="tel:15100" className="font-bold text-amber-400 hover:underline">
            15100
          </a>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileHistoryOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Inquiries ({sessions.length})</span>
          </button>

          <button
            onClick={() => startNewSession()}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileHistoryOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-600" /> Past Consultations
                </span>
                <button
                  onClick={() => setMobileHistoryOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3">
                <button
                  onClick={() => {
                    startNewSession();
                    setMobileHistoryOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 italic text-center">No past inquiries yet.</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        selectSession(s.id);
                        setMobileHistoryOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer ${
                        s.id === activeSessionId
                          ? "bg-amber-50 text-amber-900 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate pr-2">{s.title || "Legal Inquiry"}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                <span>NALSA Helpline:</span>
                <a href="tel:15100" className="font-bold text-amber-400">15100</a>
              </div>
            </div>

            <div className="flex-1" onClick={() => setMobileHistoryOpen(false)} />
          </div>
        )}
        {/* Database Persistence Offline Warning Banner */}
        {dbPersisted === false && (
          <div
            role="alert"
            className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-amber-950">Stateless Session Mode: </span>
                <span className="text-amber-800">
                  {dbWarning ||
                    "Cloud database sync is unavailable. Responses are active, but history is kept only in your local browser storage."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300 capitalize">
                Status: {dbStatus || "degraded"}
              </span>
              <button
                onClick={handleRetryDb}
                disabled={isCheckingDb}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingDb ? "animate-spin" : ""}`} />
                <span>Retry Sync</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-md">
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  NyayaSaathi AI Legal Assistant
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask any question about Indian law, police rights, workplace salaries, domestic
                  safety, or consumer protection. Available in English, हिन्दी, मराठी, and 8+ Indian
                  languages.
                </p>
              </div>

              {/* Sample Queries */}
              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                <button
                  onClick={() =>
                    sendMessage(
                      "My employer withheld my salary for 2 months. What legal action can I take under Payment of Wages Act?"
                    )
                  }
                  className="text-left text-xs bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 rounded-xl p-3 text-slate-700 transition-colors shadow-2xs"
                >
                  💼 "My employer withheld my salary for 2 months. What legal action can I take?"
                </button>
                <button
                  onClick={() =>
                    sendMessage(
                      "What are the police arrest and bail safeguards under Article 22 of the Constitution?"
                    )
                  }
                  className="text-left text-xs bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 rounded-xl p-3 text-slate-700 transition-colors shadow-2xs"
                >
                  ⚖️ "What are the police arrest and bail safeguards under Article 22 of Constitution?"
                </button>
                <button
                  onClick={() =>
                    sendMessage(
                      "How to file a consumer complaint on eDaakhil for a defective product without a lawyer?"
                    )
                  }
                  className="text-left text-xs bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 rounded-xl p-3 text-slate-700 transition-colors shadow-2xs"
                >
                  🛒 "How to file a consumer complaint on eDaakhil for a defective product without a lawyer?"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-800 shadow-sm space-y-3"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      {msg.role === "user"
                        ? "Citizen Question"
                        : "NyayaSaathi Statutory Response"}
                    </span>

                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5">
                        {/* Audio Read Aloud / Play / Pause Controls */}
                        <button
                          onClick={() => handleSpeakMessage(msg.id, msg.content, msg.language)}
                          className={`p-1 rounded-lg transition-colors ${
                            speakingMsgId === msg.id
                              ? "bg-amber-100 text-amber-900"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          title={
                            speakingMsgId === msg.id
                              ? isAudioPaused
                                ? "Resume reading aloud"
                                : "Pause reading aloud"
                              : "Read answer aloud (Text-to-Speech)"
                          }
                          aria-label={
                            speakingMsgId === msg.id
                              ? isAudioPaused
                                ? "Resume reading aloud"
                                : "Pause reading aloud"
                              : "Read answer aloud"
                          }
                        >
                          {speakingMsgId === msg.id ? (
                            isAudioPaused ? (
                              <Play className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <VolumeX className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                            )
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {speakingMsgId === msg.id && (
                          <button
                            onClick={handleStopSpeech}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Stop reading aloud"
                            aria-label="Stop reading aloud"
                          >
                            <Square className="w-3 h-3 fill-current" />
                          </button>
                        )}

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                          title="Copy text"
                          aria-label="Copy response text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Retry Action if error occurred */}
                  {msg.isError && msg.retryText && (
                    <div className="pt-1">
                      <button
                        onClick={() => sendMessage(msg.retryText)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Question
                      </button>
                    </div>
                  )}

                  {/* Statutory Citations & Legal Cards */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Applicable Indian
                          Statutes & Sections:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Click card to view official text
                        </span>
                      </div>
                      <div className="space-y-2">
                        {msg.citations.map((c, idx) => {
                          const isExpanded = expandedCitationId === (c.id || idx);
                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-2.5 transition-colors"
                            >
                              <div
                                className="flex items-center justify-between cursor-pointer select-none"
                                onClick={() =>
                                  setExpandedCitationId(isExpanded ? null : c.id || idx)
                                }
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-slate-900">
                                    {c.actName}
                                  </span>
                                  {c.sectionNumber && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      §{c.sectionNumber}
                                    </span>
                                  )}
                                  {c.jurisdiction && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-100 text-sky-800">
                                      {c.jurisdiction}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400">
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700 space-y-2">
                                  {c.content && (
                                    <p className="bg-white p-2 rounded border border-slate-100 leading-relaxed font-mono text-[11px]">
                                      {c.content}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>
                                      Status:{" "}
                                      <strong className="text-emerald-700">Verified Law</strong>
                                    </span>
                                    {c.sourceUrl && (
                                      <a
                                        href={c.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                                      >
                                        India Code Gazette <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>NyayaSaathi is analyzing Indian statutes & legal precedents...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Input (Mic) and Language Selector */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shadow-sm">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
            {/* Language Selector in Chat */}
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  localStorage.setItem("nyayasaathi_lang", e.target.value);
                }}
                className="text-xs bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                title="Select Language for Question & Answer"
                aria-label="Select Language for Question and Answer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName || l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Input Box */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isListening
                  ? "Listening to your voice... Speak now."
                  : selectedLanguage === "hi"
                  ? "कानूनी प्रश्न पूछें... (उदा: क्या मुझे मुफ़्त कानूनी सहायता मिल सकती है?)"
                  : selectedLanguage === "mr"
                  ? "कायदेशीर प्रश्न विचारा... (उदा: भाडेकरू म्हणून माझे हक्क काय आहेत?)"
                  : "Ask any Indian legal question (e.g. Unpaid wages, bail, domestic safety)..."
              }
              disabled={isLoading}
              className={`flex-1 text-xs sm:text-sm px-4 py-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all ${
                isListening
                  ? "border-amber-500 ring-2 ring-amber-300 bg-amber-50/40"
                  : "border-slate-200"
              }`}
            />

            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? "Stop voice listening" : "Speak your question (Voice Input)"}
              aria-label={isListening ? "Stop voice listening" : "Speak your question"}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? "bg-amber-600 text-white border-amber-600 animate-pulse shadow-md"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="Send Message"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 mt-2">
            Statutory legal awareness engine. For court representation, contact National Legal
            Helpline <strong>15100</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
