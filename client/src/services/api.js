import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Users API
export const usersAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Doctors API
export const doctorsAPI = {
  getAll: () => api.get("/doctors"),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post("/doctors", data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Patients API
export const patientsAPI = {
  getAll: () => api.get("/patients"),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post("/patients", data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: () => api.get("/appointments"),
  getById: (id) => api.get(`/appointments/${id}`),
  getByDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  getByPatient: (patientId, params = {}) =>
    api.get(`/appointments/patient/${patientId}`, { params }),
  create: (data) => api.post("/appointments", data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Hospitals API
export const hospitalsAPI = {
  getAll: () => api.get("/hospitals"),
  getById: (id) => api.get(`/hospitals/${id}`),
  getDoctors: (id) => api.get(`/hospitals/${id}/doctors`),
  create: (data) => api.post("/hospitals", data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  delete: (id) => api.delete(`/hospitals/${id}`),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: () => api.get("/prescriptions"),
  getById: (id) => api.get(`/prescriptions/${id}`),
  getByAppointment: (appointmentId) =>
    api.get(`/prescriptions/appointment/${appointmentId}`),
  create: (data) => api.post("/prescriptions", data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
};

// Medical History API
export const medicalHistoryAPI = {
  getAll: () => api.get("/medical-history"),
  getByPatient: (patientId) => api.get(`/medical-history/patient/${patientId}`),
  create: (data) => api.post("/medical-history", data),
  update: (id, data) => api.put(`/medical-history/${id}`, data),
  delete: (id) => api.delete(`/medical-history/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get("/departments"),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Specializations API
export const specializationsAPI = {
  getAll: () => api.get("/specializations"),
  getById: (id) => api.get(`/specializations/${id}`),
  create: (data) => api.post("/specializations", data),
  update: (id, data) => api.put(`/specializations/${id}`, data),
  delete: (id) => api.delete(`/specializations/${id}`),
};

// Chambers API
export const chambersAPI = {
  getAll: () => api.get("/chambers"),
  getById: (id) => api.get(`/chambers/${id}`),
  create: (data) => api.post("/chambers", data),
  update: (id, data) => api.put(`/chambers/${id}`, data),
  delete: (id) => api.delete(`/chambers/${id}`),
};

// Search API
export const searchAPI = {
  searchDoctors: (params) => api.get("/search/doctors", { params }),
  getLocations: (params) => api.get("/search/locations", { params }),
  getFacilities: (params) => api.get("/search/facilities", { params }),
};

// Schedules API
export const schedulesAPI = {
  getDoctorSchedules: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
  createSchedule: (data) => api.post("/schedules", data),
  getAvailableSlots: (doctorId, params) =>
    api.get(`/schedules/slots/${doctorId}`, { params }),
  generateSlots: (scheduleId) =>
    api.post(`/schedules/${scheduleId}/generate-slots`),
  bookSlot: (data) => api.post("/schedules/book-slot", data),
  updateSlotStatus: (slotId, data) =>
    api.put(`/schedules/slot/${slotId}`, data),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (userId) => api.get(`/notifications/${userId}`),
  getUnreadCount: (userId) => api.get(`/notifications/unread-count/${userId}`),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/${userId}/read-all`),
};

export default api;
