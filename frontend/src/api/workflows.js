import apiClient from "./client";

export const workflowsApi = {
  getWorkflows: async () => {
    try {
      const { data } = await apiClient.get("/workflows");
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
  }
};

export default workflowsApi;
