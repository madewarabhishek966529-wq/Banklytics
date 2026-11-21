import api from './api.js';

export const authService = {
  async register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.token) {
      localStorage.setItem('banklytics_token', res.data.token);
      localStorage.setItem('banklytics_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('banklytics_token', res.data.token);
      localStorage.setItem('banklytics_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('banklytics_token');
      localStorage.removeItem('banklytics_user');
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async loginDemo() {
    const res = await api.post('/auth/demo');
    if (res.data.token) {
      localStorage.setItem('banklytics_token', res.data.token);
      localStorage.setItem('banklytics_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  async deleteAccount() {
    const res = await api.delete('/auth/account');
    localStorage.removeItem('banklytics_token');
    localStorage.removeItem('banklytics_user');
    return res.data;
  },
};
