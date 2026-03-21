import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Health APIs
export const getPrediction = async (healthData) => {
  const response = await api.post("/health/predict", healthData);
  return response.data;
};

export const getHealthScore = async () => {
  const response = await api.get("/health/score");
  return response.data;
};

export const getHealthHistory = async () => {
  const response = await api.get("/health/history");
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get("/health/recommendations");
  return response.data;
};

// Medical Records APIs
export const getMedicalRecords = async () => {
  const response = await api.get("/records");
  return response.data;
};

export const uploadRecord = async (recordData) => {
  const response = await api.post("/records/upload", recordData);
  return response.data;
};

export const grantAccess = async (recordId, doctorAddress) => {
  const response = await api.post("/records/grant-access", {
    recordId,
    doctorAddress,
  });
  return response.data;
};

export const revokeAccess = async (recordId, doctorAddress) => {
  const response = await api.post("/records/revoke-access", {
    recordId,
    doctorAddress,
  });
  return response.data;
};

const SPRING_URL = "http://localhost:8080/api";

const getPatientId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    // Try multiple possible field names for patient ID
    return user?.userId || user?.id || user?.patientId || null;
  } catch (e) {
    console.error("Error getting patient ID from localStorage:", e);
    return null;
  }
};

// Appointment APIs
export const getAppointments = async () => {
  const patientId = getPatientId();
  const response = await axios.get(
    `${SPRING_URL}/appointments/my-appointments`,
    { params: { patientId } },
  );
  return response.data;
};

export const getAvailableDoctors = async (department, date) => {
  const params = {};
  if (department) params.specialization = department;
  if (date) params.date = date;
  const response = await axios.get(
    `${SPRING_URL}/appointments/doctors/available`,
    { params },
  );
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const patientId = getPatientId();

  console.log(
    "Booking appointment with patientId:",
    patientId,
    "userEmail:",
    user?.email,
    "appointmentData:",
    appointmentData,
  );

  if (!user || !user.email) {
    throw new Error("User email not found. Please log in again.");
  }

  // Include both patientId (MongoDB) and email (for MySQL lookup)
  const bookingPayload = {
    ...appointmentData,
    patientId: patientId ? String(patientId) : null,
    patientEmail: user.email,
  };

  const response = await axios.post(
    `${SPRING_URL}/appointments/book`,
    bookingPayload,
  );
  console.log("Booking response:", response.data);
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const patientId = getPatientId();
  const response = await axios.delete(
    `${SPRING_URL}/appointments/${appointmentId}`,
    { params: { patientId } },
  );
  return response.data;
};

// Get doctor appointments
export const getDoctorAppointments = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const doctorEmail = user?.email || null;
  if (!doctorEmail) {
    throw new Error("Doctor email not found. Please log in as a doctor.");
  }
  const response = await axios.get(
    `${SPRING_URL}/appointments/doctor-appointments`,
    {
      params: { doctorEmail },
    },
  );
  return response.data;
};

// Get patient records (for doctors)
export const getPatientRecords = async (patientId) => {
  const response = await api.get(`/records?patientId=${patientId}`);
  return response.data;
};

export default api;
