// Frontend Admin API Service
// src/services/adminApi.js

import axios from "axios";
import { getToken } from "../utils/auth";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

// Add authorization header to all requests
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User Management APIs
export const fetchAllUsers = (role) =>
  role
    ? axios.get(`${BASE_URL}/admin/users/role/${role}`)
    : axios.get(`${BASE_URL}/admin/users`);
export const getUsersByRole = (role) =>
  axios.get(`${BASE_URL}/admin/users/role/${role}`);
export const approveUser = (userId, enabled) =>
  axios.patch(`${BASE_URL}/admin/users/${userId}/status`, null, { params: { enabled } });
export const updateUserRole = (userId, role) =>
  axios.patch(`${BASE_URL}/admin/users/${userId}/role`, null, { params: { role } });
export const getUserDetails = (userId) =>
  axios.get(`${BASE_URL}/admin/users/${userId}`);
export const deleteUser = (userId) =>
  axios.delete(`${BASE_URL}/admin/users/${userId}`);

// Department Management APIs
export const fetchAllDepartments = () =>
  axios.get(`${BASE_URL}/admin/departments`);
export const createDepartment = (dept) =>
  axios.post(`${BASE_URL}/admin/departments`, dept);
export const getDepartment = (deptId) =>
  axios.get(`${BASE_URL}/admin/departments/${deptId}`);
export const updateDepartment = (deptId, dept) =>
  axios.put(`${BASE_URL}/admin/departments/${deptId}`, dept);
export const deleteDepartment = (deptId) =>
  axios.delete(`${BASE_URL}/admin/departments/${deptId}`);
export const assignDoctorsToDepartment = (deptId, doctorIds) =>
  axios.put(`${BASE_URL}/admin/departments/${deptId}/assign-doctors`, doctorIds);

// Doctor Management APIs
export const registerDoctor = (doctor) =>
  axios.post(`${BASE_URL}/admin/doctors`, null, { params: doctor });
export const fetchAllDoctors = () => axios.get(`${BASE_URL}/admin/doctors`);
export const getDoctorDetails = (userId) => axios.get(`${BASE_URL}/admin/doctors/${userId}`);
export const getDoctorsInDepartment = (deptId) =>
  axios.get(`${BASE_URL}/admin/doctors/department/${deptId}`);
export const updateDoctor = (userId, doctor) =>
  axios.put(`${BASE_URL}/admin/doctors/${userId}`, null, { params: doctor });
export const toggleDoctorAvailability = (userId, available) =>
  axios.patch(`${BASE_URL}/admin/doctors/${userId}/availability`, null, { params: { available } });
export const deleteDoctor = (userId) =>
  axios.delete(`${BASE_URL}/admin/doctors/${userId}`);

// Appointment Management APIs
export const fetchAllAppointments = () =>
  axios.get(`${BASE_URL}/admin/appointments`);
export const getAppointmentsByStatus = (status) =>
  axios.get(`${BASE_URL}/admin/appointments/status/${status}`);
export const cancelAppointment = (appointmentId) =>
  axios.patch(`${BASE_URL}/admin/appointments/${appointmentId}/cancel`);
export const rescheduleAppointment = (appointmentId, newTime) =>
  axios.put(
    `${BASE_URL}/admin/appointments/${appointmentId}/reschedule`,
    null,
    {
      params: { newTime },
    },
  );

// Medical Records APIs (read-only for admin)
export const fetchAllMedicalRecords = () =>
  axios.get(`${BASE_URL}/admin/records`);
export const getPatientMedicalRecords = (patientId) =>
  axios.get(`${BASE_URL}/admin/records/patient/${patientId}`);

// AI Prediction Logs APIs
export const fetchPredictionLogs = () => axios.get(`${BASE_URL}/admin/ai/logs`);
export const fetchRecentPredictions = (days = 7) =>
  axios.get(`${BASE_URL}/admin/ai/logs/recent`, { params: { days } });

// Notification Management APIs
export const createNotification = (title, message, targetRole = "ALL") =>
  axios.post(`${BASE_URL}/admin/notifications`, null, {
    params: { title, message, targetRole },
  });
export const fetchUnsentNotifications = () =>
  axios.get(`${BASE_URL}/admin/notifications/unsent`);
export const broadcastNotification = (notificationId) =>
  axios.patch(`${BASE_URL}/admin/notifications/${notificationId}/broadcast`);

// Analytics APIs
export const fetchAnalytics = () => axios.get(`${BASE_URL}/admin/analytics`);

// Audit Log APIs
export const fetchAuditLogs = () => axios.get(`${BASE_URL}/admin/audit-logs`);
