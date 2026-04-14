import api from './axios';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (data)       => api.post('/auth/register', data),
  login:          (data)       => api.post('/auth/login', data),
  me:             ()           => api.get('/auth/me'),
  updateMe:       (data)       => api.put('/auth/me', data),
  changePassword: (data)       => api.post('/auth/change-password', data),

  // Admin endpoints
  adminStats:       ()                  => api.get('/auth/admin/stats'),
  adminLogs:        ()                  => api.get('/auth/admin/logs'),
  adminUsers:       (params)            => api.get('/auth/admin/users', { params }),
  adminGetUser:     (id)               => api.get(`/auth/admin/users/${id}`),
  adminToggleActive:(id, is_active)    => api.patch(`/auth/admin/users/${id}/activate`, { is_active }),
  adminDeleteUser:  (id)               => api.delete(`/auth/admin/users/${id}`),
};

// Convenience named exports for legacy callers
export const loginUser       = (payload) => api.post('/auth/login', payload).then(r => r.data);
export const registerUser    = (payload) => api.post('/auth/register', payload).then(r => r.data);
export const getCurrentUser  = ()        => api.get('/auth/me').then(r => r.data);

export default authApi;
