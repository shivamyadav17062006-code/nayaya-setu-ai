import apiClient from "./client";
function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function toCitations(sources = []) {
  return sources.map((source) => ({
    id: newId(),
    actName: source.act ?? "Indian Statute",
    sectionNumber: source.section,
    year: source.year,
    url: source.sourceUrl
  }));
}
export const chatApi = {
  sendMessage: async (request) => {
    const { data } = await apiClient.post("/chat", request);
    const payload = data.data;
    const message = {
      id: newId(),
      role: "assistant",
      content: payload.answer,
      timestamp: /* @__PURE__ */ new Date(),
      language: payload.language ?? request.language,
      citations: toCitations(payload.sources)
    };
    return {
      sessionId: payload.sessionId ?? request.sessionId ?? "",
      message
    };
  },
  getSession: async (sessionId) => {
    const { data } = await apiClient.get(`/chat/sessions/${sessionId}`);
    return data;
  },
  getSessions: async () => {
    const { data } = await apiClient.get("/chat/sessions");
    return data;
  },
  deleteSession: async (sessionId) => {
    await apiClient.delete(`/chat/sessions/${sessionId}`);
  }
};
