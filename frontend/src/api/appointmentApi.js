import api from './axios';

export const appointmentApi = {
  // Patient
  create(payload) {
    return api.post('/appointments', payload);
  },
  my({ status } = {}) {
    return api.get('/appointments/my', { params: status ? { status } : undefined });
  },
  update(id, payload) {
    return api.put(`/appointments/${id}`, payload);
  },
  cancel(id) {
    return api.patch(`/appointments/${id}/cancel`);
  },

  // Doctor
  doctorMy({ status } = {}) {
    return api.get('/appointments/doctor/my', { params: status ? { status } : undefined });
  },
  doctorSetStatus(id, status) {
    return api.patch(`/appointments/${id}/doctor-status`, { status });
  },
};

export default appointmentApi;

