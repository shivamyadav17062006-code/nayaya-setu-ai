import client from './client';

export const legislationApi = {
  /**
   * List Central Acts with search, pagination, and filters
   */
  listActs: async (params = {}) => {
    const res = await client.get('/api/legislation/acts', { params });
    return res.data;
  },

  /**
   * Get single Act or Rule by ID
   */
  getActById: async (id) => {
    const res = await client.get(`/api/legislation/acts/${id}`);
    return res.data;
  },

  /**
   * List Subordinate Rules, Regulations, and Notifications
   */
  listRules: async (params = {}) => {
    const res = await client.get('/api/legislation/rules', { params });
    return res.data;
  },

  /**
   * Fetch Source Register
   */
  getSourceRegister: async () => {
    const res = await client.get('/api/legislation/source-register');
    return res.data;
  },

  /**
   * Get Verification Queue
   */
  getVerificationQueue: async (params = {}) => {
    const res = await client.get('/api/legislation/verification-queue', { params });
    return res.data;
  },

  /**
   * Update Verification Status (e.g. AWAITING_REVIEW -> VERIFIED -> PUBLISHED)
   */
  updateVerificationStatus: async (id, payload) => {
    const res = await client.patch(`/api/legislation/verify/${id}`, payload);
    return res.data;
  },

  /**
   * Coverage & Telemetry Report
   */
  getCoverageReport: async () => {
    const res = await client.get('/api/legislation/reports/coverage');
    return res.data;
  },
};

export default legislationApi;
