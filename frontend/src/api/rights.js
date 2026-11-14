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

  getCategory: async (slug) => {
    const { data } = await apiClient.get(`/rights/${slug}`);
    return data?.data || data;
  },

  getCategorySections: async (slug) => {
    try {
      const { data } = await apiClient.get(`/rights/${slug}`);
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
    return data?.data || data;
  },

  getSection: async (sectionId) => {
    const { data } = await apiClient.get(`/rights/sections/${sectionId}`);
    return data?.data || data;
  },

  getActs: async (params) => {
    const { data } = await apiClient.get("/rights/acts", { params });
    return data?.data || data;
  },

  getAct: async (actId) => {
    const { data } = await apiClient.get(`/rights/acts/${actId}`);
    return data?.data || data;
  },

  getBeneficiaries: async () => {
    const { data } = await apiClient.get("/rights/beneficiaries");
    return data?.data || data;
  },

  searchRights: async (query, language) => {
    const { data } = await apiClient.get("/rights/search", {
      params: { q: query, language }
    });
    return data?.data || data;
  }
};

export default rightsApi;
