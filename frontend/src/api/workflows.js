import apiClient from "./client";

function getSessionId() {
  if (typeof window === "undefined") return "guest-session";
  let sessionId = localStorage.getItem("nyayasaathi_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("nyayasaathi_session_id", sessionId);
  }
  return sessionId;
}

export const workflowsApi = {
  getWorkflows: async (params = {}) => {
    try {
      const { data } = await apiClient.get("/workflows", { params });
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  },

  getCategories: async () => {
    return workflowsApi.getWorkflows();
  },

  getWorkflow: async (categoryOrId) => {
    const { data } = await apiClient.get(`/workflows/${categoryOrId}`);
    return data?.data || data;
  },

  getWorkflowByCategory: async (category) => {
    const { data } = await apiClient.get(`/workflows/${category}`);
    return data?.data || data;
  },

  getProgress: async (workflowId) => {
    const sessionId = getSessionId();
    try {
      const { data } = await apiClient.get(`/workflows/${workflowId}/progress`, {
        headers: { 'x-session-id': sessionId }
      });
      return data?.data || null;
    } catch {
      return null;
    }
  },

  saveProgress: async (workflowId, progressPayload) => {
    const sessionId = getSessionId();
    const { data } = await apiClient.post(
      `/workflows/${workflowId}/progress`,
      { ...progressPayload, sessionId },
      { headers: { 'x-session-id': sessionId } }
    );
    return data?.data || data;
  },

  resetProgress: async (workflowId) => {
    const sessionId = getSessionId();
    const { data } = await apiClient.delete(`/workflows/${workflowId}/progress`, {
      headers: { 'x-session-id': sessionId }
    });
    return data;
  }
};

export default workflowsApi;
