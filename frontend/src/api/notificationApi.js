import api from './axios';

export const notificationApi = {
  list(params) {
    return api.get('/notifications', { params });
  },
  stats(params) {
    return api.get('/notifications', { params });
  },
  notify(payload) {
    return api.post('/notify', payload);
  }
};

export default notificationApi;

