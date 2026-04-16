import api from './axios';

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorApi = {
  // Public
  list: (params) => api.get('/doctors', { params }),
  specialties: () => api.get('/doctors/specialties'),
  getOne: (id) => api.get(`/doctors/${id}`),

  // Doctor own profile
  myProfile: () => api.get('/doctors/me/profile'),
  createProfile: (data) => api.post('/doctors/me/profile', data),
  updateProfile: (data) => api.put('/doctors/me/profile', data),

  // Availability
  myAvailability: () => api.get('/doctors/me/availability'),
  addSlot: (data) => api.post('/doctors/me/availability', data),
  updateSlot: (id, data) => api.put(`/doctors/me/availability/${id}`, data),
  deleteSlot: (id) => api.delete(`/doctors/me/availability/${id}`),

  // Public: availability for a specific doctor (for patient booking)
  publicAvailability: (doctorId) => api.get(`/doctors/${doctorId}/availability`),

  // Rate a doctor (Patient only, authenticated)
  rate: (doctorId, rating) => api.post(`/doctors/${doctorId}/rate`, { rating }),

  // Admin
  adminStats: () => api.get('/doctors/admin/stats'),
  adminAll: (params) => api.get('/doctors/admin/all', { params }),
  adminVerify: (id, verified) => api.patch(`/doctors/admin/${id}/verify`, { verified }),
};

// Convenience named exports for legacy callers
export const fetchDoctors = (params) => api.get('/doctors', { params }).then(r => r.data);
export const fetchMyDoctorProfile = () => api.get('/doctors/me/profile').then(r => r.data);
export const createDoctorProfile = (payload) => api.post('/doctors/me/profile', payload).then(r => r.data);
export const updateDoctorProfile = (payload) => api.put('/doctors/me/profile', payload).then(r => r.data);

export default doctorApi;
