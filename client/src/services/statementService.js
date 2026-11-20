import api from './api.js';

export const statementService = {
  async previewStatement(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/statements/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async confirmStatement(payload) {
    const res = await api.post('/statements/confirm', payload);
    return res.data;
  },

  async getStatements(page = 1, limit = 20) {
    const res = await api.get(`/statements?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getStatementById(id) {
    const res = await api.get(`/statements/${id}`);
    return res.data;
  },

  async deleteStatement(id) {
    const res = await api.delete(`/statements/${id}`);
    return res.data;
  },

  async getStatementTransactions(id, page = 1, limit = 50) {
    const res = await api.get(`/statements/${id}/transactions?page=${page}&limit=${limit}`);
    return res.data;
  },
};
