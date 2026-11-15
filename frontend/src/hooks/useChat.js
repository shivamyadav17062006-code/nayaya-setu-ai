import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { chatApi, toCitations } from "@/api/chat";

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat({ language = "en" } = {}) {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem("nyayasaathi_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: (s.messages || []).map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
      }
    } catch {
      // Storage corrupted or disabled
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  /**
   * Persistence diagnostics from the backend.
   */
  const [dbPersisted, setDbPersisted] = useState(null);
  const [dbStatus, setDbStatus] = useState("unknown");
  const [dbWarning, setDbWarning] = useState(null);

  const abortRef = useRef(null);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const persistSessions = useCallback((updated) => {
    setSessions(updated);
    try {
      localStorage.setItem("nyayasaathi_sessions", JSON.stringify(updated));
    } catch {
      // Storage quota exceeded — degrade gracefully.
    }
  }, []);

  // ---- Fetch & sync sessions with backend database ----
  const refreshSessions = useCallback(async () => {
    try {
      const local = sessionsRef.current;
      const localIds = local.map((s) => s.id || s.sessionId).filter(Boolean);

      // 1. Sync guest sessions to authenticated user if signed in
      await chatApi.syncConversations(localIds);

      // 2. Fetch all user/guest sessions from PostgreSQL
      const response = await chatApi.getSessions(localIds);
      const remoteList = response?.data || (Array.isArray(response) ? response : []);

      if (Array.isArray(remoteList) && remoteList.length > 0) {
        const mergedMap = new Map();

        // Populate with current local cache first
        for (const s of local) {
          mergedMap.set(s.id, s);
        }

        // Overlay with authoritative remote metadata
        for (const r of remoteList) {
          const sid = r.sessionId || r.id;
          const existing = mergedMap.get(sid);

          if (existing) {
            mergedMap.set(sid, {
              ...existing,
              title: existing.messages?.length > 0 && existing.title !== "New Conversation" 
                ? existing.title 
                : (r.lastMessage?.slice(0, 50) || existing.title || "Legal Consultation"),
              updatedAt: new Date(r.updatedAt || existing.updatedAt),
              language: r.language || existing.language || "en",
            });
          } else {
            // New remote session not in local storage yet
            mergedMap.set(sid, {
              id: sid,
              title: r.lastMessage ? r.lastMessage.slice(0, 50) : "Legal Consultation",
              createdAt: new Date(r.createdAt || Date.now()),
              updatedAt: new Date(r.updatedAt || Date.now()),
              messages: [],
              language: r.language || "en",
            });
          }
        }

        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        persistSessions(sorted);
      }
    } catch (err) {
      console.warn("[useChat] Background sessions sync failed:", err?.message);
    }
  }, [persistSessions]);

  // ---- Check initial DB persistence status & sync sessions on mount ----
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
    refreshSessions();

    const handleAuthChange = () => {
      refreshSessions();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [checkDbConnection, refreshSessions]);

  const startNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: "New Conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      language,
    };
    persistSessions([newSession, ...sessionsRef.current]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    return newSession.id;
  }, [language, persistSessions]);

  const selectSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setActiveSessionId(sessionId);

    // 1. Immediately display local cached messages if present
    const localSession = sessionsRef.current.find((s) => s.id === sessionId);
    if (localSession?.messages?.length > 0) {
      setMessages(localSession.messages);
    } else {
      setMessages([]);
    }

    // 2. Hydrate full message history from PostgreSQL backend
    try {
      const res = await chatApi.getSession(sessionId);
      const conv = res?.data || res;
      if (conv && Array.isArray(conv.messages)) {
        const hydrated = conv.messages.map((m) => ({
          id: m.id || generateId(),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt || Date.now()),
          language: m.language,
          citations: toCitations(m.metadata?.sources || m.metadata?.citations || []),
          nextSteps: m.metadata?.nextSteps || [],
          degraded: m.metadata?.degraded || false,
          actionUrl: m.metadata?.actionUrl || null,
        }));

        setMessages(hydrated);

        // Update local session with hydrated messages
        const updated = sessionsRef.current.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: hydrated,
                title: hydrated.length > 0 && s.title === "New Conversation" 
                  ? hydrated[0].content.slice(0, 50) 
                  : s.title,
                updatedAt: new Date(conv.updatedAt || s.updatedAt),
              }
            : s
        );
        persistSessions(updated);
      }
    } catch (err) {
      console.warn(`[useChat] Failed to hydrate session ${sessionId} from backend:`, err?.message);
    }
  }, [persistSessions]);

  const sendMessage = useCallback(
    async (content) => {
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

      const currentSessions = sessionsRef.current;
      const updatedSessions = currentSessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: updatedMessages,
              title: s.messages.length === 0 || s.title === "New Conversation"
                ? content.slice(0, 50)
                : s.title,
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

        // Update persistence state from backend response
        setDbPersisted(response.persisted ?? false);
        setDbStatus(response.dbStatus ?? "unknown");
        setDbWarning(response.dbWarning ?? null);

        const assistantMessage = {
          ...response.message,
          timestamp: new Date(response.message.timestamp),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        const finalSessions = sessionsRef.current.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: finalMessages,
                title: s.title === "New Conversation" ? content.slice(0, 50) : s.title,
                updatedAt: new Date(),
              }
            : s
        );
        persistSessions(finalSessions);

        // Sync with backend in background
        refreshSessions();
      } catch (err) {
        setIsTyping(false);
        if (err instanceof Error && err.name !== "AbortError") {
          const errorDetail =
            err.response?.data?.error ||
            err.response?.data?.detail ||
            "AI reasoning engine is temporarily unavailable. Please verify your connection or click retry.";
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
    },
    [activeSessionId, isLoading, messages, language, startNewSession, persistSessions, refreshSessions]
  );

  const deleteSession = useCallback(
    async (sessionId) => {
      const updated = sessionsRef.current.filter((s) => s.id !== sessionId);
      persistSessions(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      try {
        await chatApi.deleteSession(sessionId);
      } catch (err) {
        console.warn(`[useChat] Failed to delete session ${sessionId} on backend:`, err?.message);
      }
    },
    [activeSessionId, persistSessions]
  );

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
    dbPersisted,
    dbStatus,
    dbWarning,
    checkDbConnection,
    refreshSessions,
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession,
    clearMessages,
  };
}
