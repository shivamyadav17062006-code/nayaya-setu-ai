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
  const abortRef = useRef(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nyayasaathi_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(restored);
      }
    } catch {
    }
  }, []);
  const persistSessions = useCallback((updated) => {
    setSessions(updated);
    try {
      localStorage.setItem("nyayasaathi_sessions", JSON.stringify(updated));
    } catch {
    }
  }, []);
  const startNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: "New Conversation",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      messages: [],
      language
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
      timestamp: /* @__PURE__ */ new Date(),
      language
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsTyping(true);
    const updatedSessions = sessions.map(
      (s) => s.id === sessionId ? {
        ...s,
        messages: updatedMessages,
        title: s.messages.length === 0 ? content.slice(0, 50) : s.title,
        updatedAt: /* @__PURE__ */ new Date()
      } : s
    );
    persistSessions(updatedSessions);
    try {
      abortRef.current = new AbortController();
      const response = await chatApi.sendMessage({
        message: content.trim(),
        sessionId,
        language
      });
      setIsTyping(false);
      const assistantMessage = {
        ...response.message,
        timestamp: new Date(response.message.timestamp)
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      const finalSessions = updatedSessions.map(
        (s) => s.id === sessionId ? { ...s, messages: finalMessages, updatedAt: /* @__PURE__ */ new Date() } : s
      );
      persistSessions(finalSessions);
    } catch (err) {
      setIsTyping(false);
      if (err instanceof Error && err.name !== "AbortError") {
        const errorMessage = {
          id: generateId(),
          role: "assistant",
          content: "I apologize, I encountered an error processing your request. Please try again.",
          timestamp: /* @__PURE__ */ new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast.error("Failed to send message. Please try again.");
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
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession,
    clearMessages
  };
}
