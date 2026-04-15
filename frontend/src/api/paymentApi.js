import api from './axios';

export const paymentApi = {
  checkout(payload) {
    return api.post('/payments/checkout', payload);
  },
  confirm(payload) {
    return api.post('/payments/confirm', payload);
  },
  transactions(params) {
    return api.get('/payments/transactions', { params });
  },
  transactionStats() {
    return api.get('/payments/transactions/stats');
  },
  refund(id, payload) {
    return api.post(`/payments/transactions/${id}/refund`, payload);
  }
};

export default paymentApi;

