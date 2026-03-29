import axios from "axios";
import { getToken, removeToken } from "../utils/auth";

const SPRING_URL = "http://localhost:8081/api";
const NODE_URL = "http://localhost:8080/api";

const springApi = axios.create({
  baseURL: SPRING_URL,
  headers: { "Content-Type": "application/json" },
});

const nodeApi = axios.create({
  baseURL: NODE_URL,
  headers: { "Content-Type": "application/json" },
});

[nodeApi, springApi].forEach(api => {
  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        removeToken();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  );
});

// Use Node.js backend for health-related endpoints
export const getPrediction = async (healthData) => {
  const response = await nodeApi.post("/health/predict", healthData);
  return response.data;
};

export const getHealthScore = async () => {
  const response = await nodeApi.get("/health/score");
  return response.data;
};

export const getHealthHistory = async () => {
  const response = await nodeApi.get("/health/history");
  return response.data;
};

export const getRecommendations = async () => {
  const response = await nodeApi.get("/health/recommendations");
  return response.data;
};

// Use Node backend for auth (fallback to Spring for compatibility)
export const login = async (email, password) => {
  try {
    const response = await nodeApi.post("/auth/login", { email, password });
    return response.data;
  } catch (nodeError) {
    // fall back to Spring auth if Node is not available
    const response = await springApi.post("/auth/login", { email, password });
    return response.data;
  }
};

export const register = async (userData) => {
  try {
    const response = await nodeApi.post("/auth/register", userData);
    return response.data;
  } catch (nodeError) {
    const response = await springApi.post("/auth/register", userData);
    return response.data;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await nodeApi.get("/auth/me");
    return response.data;
  } catch (nodeError) {
    const response = await springApi.get("/auth/me");
    return response.data;
  }
};

// Default api instance for other endpoints
const api = springApi;

export const getMedicalRecords = async () => {
  const response = await api.get("/records");
  return response.data;
};

export const uploadRecord = async (recordData) => {
  const response = await api.post("/records/upload", recordData);
  return response.data;
};

export const grantAccess = async (recordId, doctorAddress) => {
  const response = await api.post("/records/grant-access", { recordId, doctorAddress });
  return response.data;
};

export const revokeAccess = async (recordId, doctorAddress) => {
  const response = await api.post("/records/revoke-access", { recordId, doctorAddress });
  return response.data;
};

export const getAppointments = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const params = {};
  if (user?.mysqlId) params.patientId = user.mysqlId;
  if (user?.email) params.patientEmail = user.email;
  const response = await springApi.get("/appointments/my-appointments", { params });
  return response.data;
};

export const getAvailableDoctors = async (department, date) => {
  const params = {};
  if (department) params.specialization = department;
  if (date) params.date = date;
  const response = await springApi.get("/appointments/doctors/available", { params });
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const response = await springApi.post("/appointments/book", appointmentData);
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await springApi.delete(`/appointments/${appointmentId}`);
  return response.data;
};

export const getDoctorAppointments = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.email) throw new Error("Doctor email not found. Please log in as a doctor.");
  const response = await springApi.get("/appointments/doctor-appointments", {
    params: { doctorEmail: user.email },
  });
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status, notes) => {
  const response = await springApi.patch(`/appointments/${appointmentId}/status`, { status, notes });
  return response.data;
};

export const clearAppointment = async (appointmentId) => {
  const response = await springApi.delete(`/appointments/${appointmentId}`);
  return response.data;
};

export const getPatientRecords = async (patientId) => {
  const response = await api.get(`/records?patientId=${patientId}`);
  return response.data;
};

export default api;
