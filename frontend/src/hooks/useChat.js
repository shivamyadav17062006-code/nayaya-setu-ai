import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { chatApi } from "@/api/chat";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat({ language = "en" } = {}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  /**
   * Persistence state from the backend.
   * - `dbPersisted`: last exchange was confirmed written to PostgreSQL.
   * - `dbStatus`:    'connected' | 'placeholder' | 'missing' | 'unreachable' | 'unknown'
   * - `dbWarning`:   human-readable explanation when not persisted.
   */
  const [dbPersisted, setDbPersisted] = useState(null);
  const [dbStatus, setDbStatus] = useState("unknown");
  const [dbWarning, setDbWarning] = useState(null);

  const abortRef = useRef(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // ---- Restore sessions from localStorage on mount ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nyayasaathi_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
        setSessions(restored);
      }
    } catch {
      // localStorage unavailable or corrupted — ignore silently.
    }
  }, []);

  // ---- Check initial DB persistence status on mount ----
  const checkDbConnection = useCallback(async () => {
    try {
      const status = await chatApi.getDbStatus();
      if (status) {
        setDbPersisted(status.connected);
        setDbStatus(status.configStatus || (status.connected ? "connected" : "unreachable"));
        if (!status.connected) {
          setDbWarning(status.message);
        } else {
          setDbWarning(null);
        }
      }
    } catch {
      setDbPersisted(false);
      setDbStatus("unreachable");
      setDbWarning("Unable to connect to database service.");
    }
  }, []);

  useEffect(() => {
    checkDbConnection();
  }, [checkDbConnection]);

  const persistSessions = useCallback((updated) => {
    setSessions(updated);
    try {
      localStorage.setItem("nyayasaathi_sessions", JSON.stringify(updated));
    } catch {
      // Storage quota exceeded — degrade gracefully.
    }
  }, []);

  const startNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: "New Conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      language,
    };
    persistSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    return newSession.id;
  }, [sessions, language, persistSessions]);

  const selectSession = useCallback((sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages);
    }
  }, [sessions]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = startNewSession();
    }

    const userMessage = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      language,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsTyping(true);

    const updatedSessions = sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            messages: updatedMessages,
            title: s.messages.length === 0 ? content.slice(0, 50) : s.title,
            updatedAt: new Date(),
          }
        : s
    );
    persistSessions(updatedSessions);

    try {
      abortRef.current = new AbortController();

      const response = await chatApi.sendMessage({
        message: content.trim(),
        sessionId,
        language,
      });

      setIsTyping(false);

      // ---- Update persistence state from backend response ----
      setDbPersisted(response.persisted ?? false);
      setDbStatus(response.dbStatus ?? "unknown");
      setDbWarning(response.dbWarning ?? null);

      const assistantMessage = {
        ...response.message,
        timestamp: new Date(response.message.timestamp),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      const finalSessions = updatedSessions.map((s) =>
        s.id === sessionId ? { ...s, messages: finalMessages, updatedAt: new Date() } : s
      );
      persistSessions(finalSessions);
    } catch (err) {
      setIsTyping(false);
      if (err instanceof Error && err.name !== "AbortError") {
        const errorDetail = err.response?.data?.error || err.response?.data?.detail || "AI reasoning engine is temporarily unavailable. Please verify your connection or click retry.";
        const errorMessage = {
          id: generateId(),
          role: "assistant",
          content: errorDetail,
          timestamp: new Date(),
          isError: true,
          retryText: content.trim(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast.error("AI reasoning failure. You can retry your query.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, isLoading, messages, sessions, language, startNewSession, persistSessions]);

  const deleteSession = useCallback((sessionId) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    persistSessions(updated);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [sessions, activeSessionId, persistSessions]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    isTyping,
    // Persistence diagnostics (for UI warning banner)
    dbPersisted,
    dbStatus,
    dbWarning,
    checkDbConnection,
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession,
    clearMessages,
  };
}
