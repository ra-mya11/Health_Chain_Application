/**
 * Medical Records API Service
 * Handles all HTTP calls to the Spring Boot backend for medical record management
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/records';

/**
 * Upload a medical record
 */
export const uploadMedicalRecord = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading medical record:', error);
    throw error;
  }
};

/**
 * Get all medical records for a patient
 */
export const getMedicalRecords = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patient/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
};

/**
 * Get medical records for a doctor
 */
export const getDoctorRecords = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch doctor records: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching doctor records:', error);
    throw error;
  }
};

/**
 * Get a specific record by ID
 */
export const getRecordById = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${recordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch record: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching record by ID:', error);
    throw error;
  }
};

/**
 * Verify a medical record's integrity
 */
export const verifyMedicalRecord = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/${recordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying record:', error);
    throw error;
  }
};

/**
 * Download a medical record file from IPFS
 */
export const downloadRecord = async (ipfsHash, fileName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/download/${ipfsHash}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create a temporary URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'medical-record';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Error downloading record:', error);
    throw error;
  }
};

/**
 * Get records by type for a patient
 */
export const getRecordsByType = async (patientId, recordType) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/patient/${patientId}/type/${recordType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch records by type: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching records by type:', error);
    throw error;
  }
};

/**
 * Get records by date range
 */
export const getRecordsByDateRange = async (patientId, startDate, endDate) => {
  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const response = await fetch(
      `${API_BASE_URL}/patient/${patientId}/date-range?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch records by date: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching records by date:', error);
    throw error;
  }
};

/**
 * Delete a medical record
 */
export const deleteRecord = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking health:', error);
    return false;
  }
};

export default {
  uploadMedicalRecord,
  getMedicalRecords,
  getDoctorRecords,
  getRecordById,
  verifyMedicalRecord,
  downloadRecord,
  getRecordsByType,
  getRecordsByDateRange,
  deleteRecord,
  healthCheck
};
