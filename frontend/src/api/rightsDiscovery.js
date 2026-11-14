import apiClient from './client.js';

export const rightsDiscoveryApi = {
  getMetadata: async () => {
    const res = await apiClient.get('/rights-discovery/metadata');
    return res.data;
  },

  classifySituation: async (situation, context = {}) => {
    const res = await apiClient.post('/rights-discovery/classify', { situation, context });
    return res.data;
  },

  discoverRights: async (payload) => {
    const res = await apiClient.post('/rights-discovery/discover', payload);
    return res.data;
  },

  getSavedSession: async (token) => {
    const res = await apiClient.get(`/rights-discovery/session/${token}`);
    return res.data;
  },

  deleteSavedSession: async (token) => {
    const res = await apiClient.delete(`/rights-discovery/session/${token}`);
    return res.data;
  },
};

export default rightsDiscoveryApi;
