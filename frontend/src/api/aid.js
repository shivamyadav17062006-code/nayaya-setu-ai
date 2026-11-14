import apiClient from "./client";

export const aidApi = {
  getProviders: async (params = {}) => {
    try {
      const { data } = await apiClient.get("/aid", { params });
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  },

  getProvider: async (id) => {
    const { data } = await apiClient.get(`/aid/${id}`);
    return data?.data || data;
  },

  checkNalsaEligibility: async (params) => {
    const { data } = await apiClient.post("/aid/nalsa-eligibility", params);
    return data?.data || data;
  },

  getDistricts: async (state) => {
    if (!state) return [];
    try {
      const { data } = await apiClient.get(`/aid/districts/${encodeURIComponent(state)}`);
      return data?.data || [];
    } catch {
      return [];
    }
  },
};

export default aidApi;
