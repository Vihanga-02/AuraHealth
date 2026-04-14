const API_BASE = "http://localhost:3005";
const APPOINTMENT_API_BASE = "http://localhost:3006";

export const getToken = () => localStorage.getItem("patient_token");

export const setAuth = (payload) => {
  localStorage.setItem("patient_token", payload.token);
  localStorage.setItem("patient_user", JSON.stringify(payload.user));
};

export const clearAuth = () => {
  localStorage.removeItem("patient_token");
  localStorage.removeItem("patient_user");
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("patient_user") || "null");
  } catch {
    return null;
  }
};

const createHeaders = (isJson = true) => {
  const headers = {};
  const token = getToken();
  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function appointmentRequest(path, options = {}) {
  const response = await fetch(`${APPOINTMENT_API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Appointment request failed");
  }

  return data;
}

export const patientApi = {
  getMyProfile: () =>
    apiRequest("/patients/me", {
      headers: createHeaders()
    }),

  createProfile: (payload) =>
    apiRequest("/patients/profile", {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(payload)
    }),

  updateProfile: (patientId, payload) =>
    apiRequest(`/patients/${patientId}`, {
      method: "PUT",
      headers: createHeaders(),
      body: JSON.stringify(payload)
    }),

  getReports: (patientId) =>
    apiRequest(`/patients/${patientId}/reports`, {
      headers: createHeaders(false)
    }),

  getPrescriptions: (patientId) =>
    apiRequest(`/patients/${patientId}/prescriptions`, {
      headers: createHeaders(false)
    }),

  getHistory: (patientId) =>
    apiRequest(`/patients/${patientId}/history`, {
      headers: createHeaders(false)
    }),

  uploadReport: async (patientId, formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/patients/${patientId}/reports`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Report upload failed");
    }

    return data;
  },

  deleteReport: (patientId, reportId) =>
    apiRequest(`/patients/${patientId}/reports/${reportId}`, {
      method: "DELETE",
      headers: createHeaders()
    })
};

export const appointmentApi = {
  getDoctors: ({ specialty = "", search = "", location = "" } = {}) =>
    appointmentRequest(
      `/doctors?specialty=${encodeURIComponent(specialty)}&search=${encodeURIComponent(search)}&location=${encodeURIComponent(location)}`,
      {
        headers: createHeaders(false)
      }
    ),

  createAppointment: (payload) =>
    appointmentRequest("/appointments", {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(payload)
    }),

  bookAppointment: (payload) =>
    appointmentRequest("/appointments", {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(payload)
    }),

  getMyAppointments: (status = "") =>
    appointmentRequest(`/appointments/my${status ? `?status=${encodeURIComponent(status)}` : ""}`, {
      headers: createHeaders(false)
    }),

  updateAppointment: (id, payload) =>
    appointmentRequest(`/appointments/${id}`, {
      method: "PUT",
      headers: createHeaders(),
      body: JSON.stringify(payload)
    }),

  cancelAppointment: (id) =>
    appointmentRequest(`/appointments/${id}/cancel`, {
      method: "PATCH",
      headers: createHeaders()
    })
};
