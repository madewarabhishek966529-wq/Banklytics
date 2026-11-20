import api from './api.js';

export const transactionService = {
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const res = await api.get(`/transactions?${query.toString()}`);
    return res.data;
  },

  async updateTransaction(id, updates) {
    const res = await api.patch(`/transactions/${id}`, updates);
    return res.data;
  },

  async deleteTransaction(id) {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },

  getExportUrl(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return `/api/v1/transactions/export?${query.toString()}`;
  },
};
