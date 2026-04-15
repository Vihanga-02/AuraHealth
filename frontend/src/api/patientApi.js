import api from './axios';

export const patientApi = {
  createProfile(payload) {
    return api.post('/patients/profile', payload);
  },
  me() {
    return api.get('/patients/me');
  },
  update(id, payload) {
    return api.put(`/patients/${id}`, payload);
  },
  getById(id) {
    return api.get(`/patients/${id}`);
  },
  history(id) {
    return api.get(`/patients/${id}/history`);
  },
  list() {
    return api.get('/patients');
  },
  reports(id) {
    return api.get(`/patients/${id}/reports`);
  },
  uploadReport(id, { reportTitle, reportType, file }) {
    const form = new FormData();
    form.append('reportTitle', reportTitle);
    if (reportType) form.append('reportType', reportType);
    form.append('reportFile', file);
    return api.post(`/patients/${id}/reports`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteReport(id, reportId) {
    return api.delete(`/patients/${id}/reports/${reportId}`);
  },
  prescriptions(id) {
    return api.get(`/patients/${id}/prescriptions`);
  },
  /** Find patient profile by their auth user ID (Doctor / Admin use) */
  getByUserId(userId) {
    return api.get(`/patients/by-user/${userId}`);
  },
  /** Add a prescription for a patient identified by their auth user ID */
  addPrescriptionForUser(userId, data) {
    return api.post(`/patients/by-user/${userId}/prescriptions`, data);
  },
};

export default patientApi;

