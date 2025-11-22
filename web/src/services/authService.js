import api from './api';

export const authService = {
  login: async (email) => {
    const response = await api.post('/auth/login', { email });
    return response.data;
  },

  signup: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};
