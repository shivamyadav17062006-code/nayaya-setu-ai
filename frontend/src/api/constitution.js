import apiClient from './client';

export const constitutionApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/constitution');
    return data.data;
  },

  listArticles: async (params = {}) => {
    const { data } = await apiClient.get('/constitution/articles', { params });
    return data.data;
  },

  getArticle: async (articleNumber) => {
    const { data } = await apiClient.get(`/constitution/articles/${encodeURIComponent(articleNumber)}`);
    return data.data;
  },

  listSchedules: async () => {
    const { data } = await apiClient.get('/constitution/schedules');
    return data.data;
  },

  getAdminVerification: async () => {
    const { data } = await apiClient.get('/constitution/admin/verification');
    return data.data;
  },
};

export default constitutionApi;
