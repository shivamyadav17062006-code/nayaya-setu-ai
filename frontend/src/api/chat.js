import apiClient from "./client";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function toCitations(sources = []) {
  return sources.map((source) => ({
    id: newId(),
    actName: source.act ?? "Indian Statute",
    sectionNumber: source.section,
    title: source.title,
    year: source.year,
    url: source.sourceUrl || source.url,
    originalText: source.originalText,
    simplifiedText: source.simplifiedText,
    jurisdiction: source.jurisdiction || "CENTRAL",
    verificationStatus: source.verificationStatus || "VERIFIED",
    relevance: source.relevance,
    similarity: source.similarity,
  }));
}

export const chatApi = {
  /**
   * POST /api/chat
   * Returns the assistant message along with persistence metadata from the backend.
   */
  sendMessage: async (request) => {
    const { data } = await apiClient.post("/chat", request);
    const payload = data.data;

    const message = {
      id: newId(),
      role: "assistant",
      content: payload.answer,
      timestamp: new Date(),
      language: payload.language ?? request.language,
      citations: toCitations(payload.sources),
      nextSteps: payload.nextSteps || [],
      degraded: payload.degraded ?? false,
      actionUrl: payload.actionUrl,
    };

    return {
      sessionId: payload.sessionId ?? request.sessionId ?? "",
      message,
      // Persistence diagnostics surfaced from the backend.
      persisted: payload.persisted ?? false,
      dbStatus: payload.dbStatus ?? "unknown",
      dbWarning: payload.dbWarning ?? null,
    };
  },

  /**
   * GET /api/chat/db-status
   * Check whether the backend can reach PostgreSQL via Prisma.
   */
  getDbStatus: async () => {
    try {
      const { data } = await apiClient.get("/chat/db-status");
      return data.data;
    } catch {
      return { connected: false, status: "unreachable", configStatus: "unknown" };
    }
  },

  getSession: async (sessionId) => {
    const { data } = await apiClient.get(`/chat/sessions/${sessionId}`);
    return data;
  },

  getSessions: async (sessionIds = []) => {
    const params = {};
    if (Array.isArray(sessionIds) && sessionIds.length > 0) {
      params.sessionIds = sessionIds.join(',');
    }
    const { data } = await apiClient.get("/chat/sessions", { params });
    return data;
  },

  syncConversations: async (sessionIds = []) => {
    try {
      const { data } = await apiClient.post("/chat/sync", { sessionIds });
      return data;
    } catch {
      return null;
    }
  },

  deleteSession: async (sessionId) => {
    await apiClient.delete(`/chat/sessions/${sessionId}`);
  },
};
