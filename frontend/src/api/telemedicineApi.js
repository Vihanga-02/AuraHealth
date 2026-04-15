import api from './axios';

// Gateway maps /api/telemedicine/* -> telemedicine-service /api/*
export const telemedicineApi = {
  createSchedule(payload) {
    return api.post('/telemedicine/schedules', payload);
  },
  listSchedules() {
    return api.get('/telemedicine/schedules');
  },
  getSchedule(id) {
    return api.get(`/telemedicine/schedules/${id}`);
  },
  generateSession(id, payload) {
    return api.post(`/telemedicine/schedules/${id}/session`, payload);
  },
  /** Generate a token for any channel name without needing a DB schedule.
   *  Used for appointment-based telemedicine joins. */
  generateToken(channelName, uid) {
    return api.post('/telemedicine/schedules/token', { channelName, uid, role: 'publisher' });
  },
  complete(id) {
    return api.patch(`/telemedicine/schedules/${id}/complete`);
  },
  cancel(id) {
    return api.patch(`/telemedicine/schedules/${id}/cancel`);
  },
  extend(id, minutes) {
    return api.patch(`/telemedicine/schedules/${id}/extend`, { minutes });
  }
};

export default telemedicineApi;

