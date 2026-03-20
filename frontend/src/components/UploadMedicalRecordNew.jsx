import React, { useState } from 'react';
import { uploadMedicalRecord } from '../services/medicalRecordsApi';
import './UploadMedicalRecord.css';

/**
 * Component for uploading medical records
 * Supports: PDF, Images (JPG, PNG)
 * Features: Drag-drop, validation, progress tracking
 */
function UploadMedicalRecord() {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    recordType: 'lab_report',
    file: null
  });

  const [uploadStatus, setUploadStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const recordTypes = [
    { value: 'lab_report', label: '🧪 Lab Report' },
    { value: 'prescription', label: '💊 Prescription' },
    { value: 'diagnosis', label: '🩺 Diagnosis' },
    { value: 'imaging', label: '📊 Imaging' },
    { value: 'vitals', label: '❤️ Vitals' },
    { value: 'other', label: '📄 Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!file) {
      setUploadStatus({
        success: false,
        message: 'No file selected'
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({
        success: false,
        message: 'Invalid file type. Please upload PDF or image (JPG, PNG)'
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setUploadStatus({
        success: false,
        message: 'File size exceeds 50MB limit'
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      file: file
    }));
    setUploadStatus(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId.trim()) {
      setUploadStatus({ success: false, message: 'Patient ID is required' });
      return;
    }

    if (!formData.doctorId.trim()) {
      setUploadStatus({ success: false, message: 'Doctor ID is required' });
      return;
    }

    if (!formData.file) {
      setUploadStatus({ success: false, message: 'Please select a file' });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      // Create FormData
      const data = new FormData();
      data.append('file', formData.file);
      data.append('patientId', formData.patientId);
      data.append('doctorId', formData.doctorId);
      data.append('recordType', formData.recordType);

      // Upload
      const response = await uploadMedicalRecord(data);

      if (response.success) {
        setUploadStatus({
          success: true,
          message: 'Record uploaded successfully!',
          recordId: response.recordId,
          ipfsHash: response.ipfsHash,
          blockchainTxHash: response.blockchainTxHash
        });

        // Reset form
        setFormData({
          patientId: '',
          doctorId: '',
          recordType: 'lab_report',
          file: null
        });
        setUploadProgress(100);

        // Clear status after 5 seconds
        setTimeout(() => {
          setUploadStatus(null);
          setUploadProgress(0);
        }, 5000);
      } else {
        setUploadStatus({
          success: false,
          message: response.message || 'Upload failed'
        });
      }
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.message || 'Error uploading file'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-medical-record">
      <div className="container">
        <div className="upload-card">
          {/* Header */}
          <div className="upload-header">
            <h2>📤 Upload Medical Record</h2>
            <p className="subtitle">Upload your medical documents securely to IPFS and blockchain</p>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`status-message ${uploadStatus.success ? 'success' : 'error'}`}>
              <div className="status-icon">
                {uploadStatus.success ? '✅' : '❌'}
              </div>
              <div className="status-content">
                <p className="status-title">
                  {uploadStatus.success ? 'Upload Successful!' : 'Upload Failed'}
                </p>
                <p className="status-message-text">{uploadStatus.message}</p>
                {uploadStatus.success && (
                  <div className="status-details">
                    <p>
                      <strong>Record ID:</strong>{' '}
                      <code>{uploadStatus.recordId?.substring(0, 12)}...</code>
                    </p>
                    <p>
                      <strong>IPFS Hash:</strong>{' '}
                      <code>{uploadStatus.ipfsHash?.substring(0, 20)}...</code>
                    </p>
                    <p>
                      <strong>Blockchain TX:</strong>{' '}
                      <code>{uploadStatus.blockchainTxHash?.substring(0, 12)}...</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="upload-form">
            {/* Patient ID */}
            <div className="form-group">
              <label htmlFor="patientId">
                👤 Patient ID <span className="required">*</span>
              </label>
              <input
                type="text"
                id="patientId"
                name="patientId"
                placeholder="Enter patient ID (e.g., P12345)"
                value={formData.patientId}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* Doctor ID */}
            <div className="form-group">
              <label htmlFor="doctorId">
                👨‍⚕️ Doctor ID <span className="required">*</span>
              </label>
              <input
                type="text"
                id="doctorId"
                name="doctorId"
                placeholder="Enter doctor ID (e.g., D12345)"
                value={formData.doctorId}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* Record Type */}
            <div className="form-group">
              <label htmlFor="recordType">
                📋 Record Type <span className="required">*</span>
              </label>
              <select
                id="recordType"
                name="recordType"
                value={formData.recordType}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                {recordTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="form-group">
              <label>📁 Medical Document <span className="required">*</span></label>
              <div
                className={`drop-zone ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="file-selected">
                    <div className="file-icon">📄</div>
                    <p className="file-name">{formData.file.name}</p>
                    <p className="file-size">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      className="clear-file-btn"
                      onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                      disabled={isLoading}
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <div className="drop-icon">📥</div>
                    <p className="drop-text">Drag and drop your file here</p>
                    <p className="drop-subtext">or click to browse</p>
                    <p className="file-types">Supported: PDF, JPG, PNG (max 50MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || !formData.file}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                '🚀 Upload Record'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="info-box">
            <h4>🔒 Secure Upload Process</h4>
            <ul>
              <li>File is uploaded to IPFS (InterPlanetary File System)</li>
              <li>IPFS hash is stored on Ethereum blockchain</li>
              <li>Metadata is saved to MongoDB for fast retrieval</li>
              <li>All data is encrypted and tamper-proof</li>
              <li>You receive a transaction hash for verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadMedicalRecord;
