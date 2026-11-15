import client from './client';

export const statesApi = {
  /**
   * List all 36 jurisdictions (28 States, 8 UTs) with filters
   */
  listStates: async (params = {}) => {
    const res = await client.get('/states', { params });
    return res.data;
  },

  /**
   * Get single State or UT by code (e.g. 'MH', 'DL', 'KA')
   */
  getStateByCode: async (stateCode) => {
    const res = await client.get(`/states/${stateCode}`);
    return res.data;
  },

  /**
   * Get active Acts, Rules, and Sections for a specific State
   */
  getStateActs: async (stateCode, params = {}) => {
    const res = await client.get(`/states/${stateCode}/acts`, { params });
    return res.data;
  },

  /**
   * Fetch live honest coverage tracker audit report
   */
  getCoverageTracker: async () => {
    const res = await client.get('/states/coverage/tracker');
    return res.data;
  },
};

export default statesApi;
