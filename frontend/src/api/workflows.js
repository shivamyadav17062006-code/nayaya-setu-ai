import apiClient from "./client";
export const workflowsApi = {
  getCategories: async () => {
    try {
      const { data } = await apiClient.get("/workflows");
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  },
  getWorkflow: async (categoryId) => {
    const { data } = await apiClient.get(`/workflows/${categoryId}`);
    return data?.data || data;
  },
  getWorkflowByCategory: async (category) => {
    const { data } = await apiClient.get(`/workflows/${category}`);
    return data?.data || data;
  }
};
