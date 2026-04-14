import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

export const fetchSchedules = async () => {
  const { data } = await api.get('/schedules');
  return data;
};

export const fetchScheduleById = async (scheduleId) => {
  const { data } = await api.get(`/schedules/${scheduleId}`);
  return data;
};

export const createSchedule = async (payload) => {
  const { data } = await api.post('/schedules', payload);
  return data;
};

export const generateSession = async (scheduleId, uid = 0) => {
  const { data } = await api.post(`/schedules/${scheduleId}/session`, { uid });
  return data;
};

export const completeSession = async (scheduleId) => {
  const { data } = await api.patch(`/schedules/${scheduleId}/complete`);
  return data;
};

export const cancelSession = async (scheduleId) => {
  const { data } = await api.patch(`/schedules/${scheduleId}/cancel`);
  return data;
};

export const extendSession = async (scheduleId, minutes = 5) => {
  const { data } = await api.patch(`/schedules/${scheduleId}/extend`, { minutes });
  return data;
};

export default api;
