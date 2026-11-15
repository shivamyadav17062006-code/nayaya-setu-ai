import client from './client';

export const caseLawApi = {
  /**
   * List judgments with optional court, authority, and text filters
   */
  listJudgments: async (params = {}) => {
    const res = await client.get('/case-law', { params });
    return res.data;
  },

  /**
   * Get full case dossier by ID
   */
  getJudgmentById: async (id) => {
    const res = await client.get(`/case-law/${id}`);
    return res.data;
  },

  /**
   * Find judgments interpreting a specific Act or Constitutional Article
   */
  getJudgmentsByStatute: async (provision) => {
    const res = await client.get(`/case-law/statute/${encodeURIComponent(provision)}`);
    return res.data;
  },

  /**
   * Semantic vector search over case law
   */
  searchCaseLaw: async (query, limit = 5, court = null) => {
    const res = await client.post('/case-law/search', { query, limit, court });
    return res.data;
  },
};

export default caseLawApi;
