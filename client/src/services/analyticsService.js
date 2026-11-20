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

  async getMerchants(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/merchants?${params.toString()}`);
    return res.data;
  },

  async getTransfers(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await api.get(`/analytics/transfers?${params.toString()}`);
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

  // AI Assistant APIs
  async getAIStatus() {
    const res = await api.get('/ai/status');
    return res.data;
  },

  async chatWithAI(message, model) {
    const res = await api.post('/ai/chat', { message, model });
    return res.data;
  },

  async getFinancialInsights() {
    const res = await api.get('/ai/insights');
    return res.data;
  },

  // Report Download URLs
  getPDFReportUrl() {
    return '/api/v1/analytics/report/pdf';
  },

  getExcelReportUrl() {
    return '/api/v1/analytics/report/excel';
  },
};
