import apiClient from './client.js';

export const kmsApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/kms/dashboard');
    return res.data;
  },

  listActs: async (params = {}) => {
    const res = await apiClient.get('/kms/acts', { params });
    return res.data;
  },

  createAct: async (data) => {
    const res = await apiClient.post('/kms/acts', data);
    return res.data;
  },

  updateAct: async (id, data) => {
    const res = await apiClient.put(`/kms/acts/${id}`, data);
    return res.data;
  },

  listSections: async (actId) => {
    const res = await apiClient.get(`/kms/acts/${actId}/sections`);
    return res.data;
  },

  createSection: async (actId, data) => {
    const res = await apiClient.post(`/kms/acts/${actId}/sections`, data);
    return res.data;
  },

  updateSection: async (sectionId, data) => {
    const res = await apiClient.put(`/kms/sections/${sectionId}`, data);
    return res.data;
  },

  importBatch: async (data) => {
    const res = await apiClient.post('/kms/import', data);
    return res.data;
  },

  getReviewQueue: async () => {
    const res = await apiClient.get('/kms/review-queue');
    return res.data;
  },

  applyReviewAction: async (entityType, id, action, notes = '') => {
    const res = await apiClient.post(`/kms/review/${entityType}/${id}`, { action, notes });
    return res.data;
  },

  getRevisions: async (entityType, id) => {
    const res = await apiClient.get(`/kms/revisions/${entityType}/${id}`);
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/kms/audit-logs', { params });
    return res.data;
  },
};

export default kmsApi;
