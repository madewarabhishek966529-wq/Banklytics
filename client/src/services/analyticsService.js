import api from './api.js';

export const analyticsService = {
  async getSummary(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/summary?${params.toString()}`);
    return res.data;
  },

  async getMonthly(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/monthly?${params.toString()}`);
    return res.data;
  },

  async getCategories(direction = 'DEBIT', from, to) {
    const params = new URLSearchParams();
    params.append('direction', direction);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/categories?${params.toString()}`);
    return res.data;
  },

  async getTopTransactions(direction = 'DEBIT', limit = 10, from, to) {
    const params = new URLSearchParams();
    params.append('direction', direction);
    params.append('limit', limit);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/top-transactions?${params.toString()}`);
    return res.data;
  },
};
