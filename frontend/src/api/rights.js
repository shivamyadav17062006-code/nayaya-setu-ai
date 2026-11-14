import apiClient from "./client";
export const rightsApi = {
  getCategories: async () => {
    try {
      const { data } = await apiClient.get("/rights");
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  },
  getCategory: async (categoryId) => {
    const { data } = await apiClient.get(`/rights/${categoryId}`);
    return data?.data || data;
  },
  getCategorySections: async (categoryId) => {
    try {
      const { data } = await apiClient.get(`/rights/${categoryId}`);
      const payload = data?.data || data;
      if (payload?.sections) {
        return { category: payload, sections: payload.sections };
      }
      return { sections: Array.isArray(payload) ? payload : [] };
    } catch {
      return { sections: [] };
    }
  },
  getSections: async (params) => {
    const { data } = await apiClient.get("/rights/sections", { params });
    return data;
  },
  getSection: async (sectionId) => {
    const { data } = await apiClient.get(`/rights/sections/${sectionId}`);
    return data.data;
  },
  searchRights: async (query, language) => {
    const { data } = await apiClient.get("/rights/search", {
      params: { q: query, language }
    });
    return data.data;
  }
};
