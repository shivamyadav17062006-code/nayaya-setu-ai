import apiClient from './client';

export const authApi = {
  /**
   * Log in user with email/phone and password.
   * Stores received JWT token into localStorage.
   */
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    if (data?.data?.token) {
      localStorage.setItem('nyayasaathi_token', data.data.token);
      localStorage.setItem('nyayasaathi_user', JSON.stringify(data.data.user));
    }
    return data?.data;
  },

  /**
   * Register a new citizen account.
   */
  register: async (userData) => {
    const { data } = await apiClient.post('/auth/register', userData);
    if (data?.data?.token) {
      localStorage.setItem('nyayasaathi_token', data.data.token);
      localStorage.setItem('nyayasaathi_user', JSON.stringify(data.data.user));
    }
    return data?.data;
  },

  /**
   * Fetch latest profile from backend /api/auth/me
   */
  fetchProfile: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      if (data?.data?.user) {
        localStorage.setItem('nyayasaathi_user', JSON.stringify(data.data.user));
        return data.data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Get cached active user profile from local storage.
   */
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem('nyayasaathi_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Log out active user and clear session tokens.
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('nyayasaathi_token');
      localStorage.removeItem('nyayasaathi_user');
    }
  },
};

export default authApi;
