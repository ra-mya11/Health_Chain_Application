import React, { useState, useEffect } from 'react';
import { getMedicalRecords, verifyMedicalRecord, downloadRecord } from '../services/medicalRecordsApi';
import './ViewMedicalRecordsNew.css';

/**
 * Component for viewing and verifying medical records
 * Features: Search, filter, verify integrity, download, blockchain verification
 */
function ViewMedicalRecordsNew() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [verificationResults, setVerificationResults] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);

  const recordTypes = [
    { value: 'all', label: 'All Records' },
    { value: 'lab_report', label: '🧪 Lab Reports' },
    { value: 'prescription', label: '💊 Prescriptions' },
    { value: 'diagnosis', label: '🩺 Diagnosis' },
    { value: 'imaging', label: '📊 Imaging' },
    { value: 'vitals', label: '❤️ Vitals' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!patientId.trim()) {
      alert('Please enter a patient ID');
      return;
    }

    try {
      setIsLoading(true);
      setSearchPerformed(true);
      const response = await getMedicalRecords(patientId);

      if (response.success && response.records) {
        setRecords(response.records);
        setSelectedRecords(new Set());
        setVerificationResults({});
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      alert('Error fetching records: ' + error.message);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRecord = async (record) => {
    try {
      const result = await verifyMedicalRecord(record.recordId);
      setVerificationResults(prev => ({
        ...prev,
        [record.recordId]: result
      }));
    } catch (error) {
      console.error('Error verifying record:', error);
      alert('Error verifying record: ' + error.message);
    }
  };

  const handleDownload = async (record) => {
    try {
      setIsLoading(true);
      await downloadRecord(record.ipfsHash, record.fileName);
    } catch (error) {
      console.error('Error downloading record:', error);
      alert('Error downloading record: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecordSelection = (recordId) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const filteredRecords = records.filter(record => {
    if (filterType === 'all') return true;
    return record.recordType === filterType;
  });

  const getRecordIcon = (type) => {
    const icons = {
      'lab_report': '🧪',
      'prescription': '💊',
      'diagnosis': '🩺',
      'imaging': '📊',
      'vitals': '❤️',
      'other': '📄'
    };
    return icons[type] || '📄';
  };

  const getStatusColor = (verified) => {
    return verified ? 'status-verified' : 'status-unverified';
  };

  const renderVerificationStatus = (record) => {
    const result = verificationResults[record.recordId];

    if (!result) {
      return (
        <button
          className="verify-btn"
          onClick={() => handleVerifyRecord(record)}
          disabled={isLoading}
        >
          🔍 Verify
        </button>
      );
    }

    return (
      <div className={`verification-result ${result.verified ? 'verified' : 'failed'}`}>
        <span className="verification-icon">
          {result.verified ? '✅' : '❌'}
        </span>
        <span className="verification-text">
          {result.verified ? 'Verified' : 'Not Valid'}
        </span>
      </div>
    );
  };

  return (
    <div className="view-medical-records">
      <div className="container">
        {/* Header */}
        <div className="records-header">
          <h2>📋 Medical Records</h2>
          <p className="subtitle">View, verify, and manage your medical records</p>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Enter patient ID (e.g., P12345)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !patientId.trim()}>
                {isLoading ? '🔄 Searching...' : '🔍 Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Filter Section */}
        {searchPerformed && records.length > 0 && (
          <div className="filter-section">
            <label>Filter by type:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {recordTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span className="record-count">
              Showing {filteredRecords.length} of {records.length} records
            </span>
          </div>
        )}

        {/* Records List */}
        {searchPerformed && (
          <>
            {filteredRecords.length === 0 ? (
              <div className="no-records">
                <div className="no-records-icon">📭</div>
                <h3>No records found</h3>
                <p>
                  {records.length === 0
                    ? 'No medical records found for this patient ID'
                    : 'No records match the selected filter'}
                </p>
              </div>
            ) : (
              <div className="records-grid">
                {filteredRecords.map((record) => (
                  <div
                    key={record.recordId}
                    className={`record-card ${expandedRecord === record.recordId ? 'expanded' : ''}`}
                  >
                    {/* Card Header */}
                    <div
                      className="record-card-header"
                      onClick={() =>
                        setExpandedRecord(
                          expandedRecord === record.recordId ? null : record.recordId
                        )
                      }
                    >
                      <div className="record-title-section">
                        <div className="record-type-icon">
                          {getRecordIcon(record.recordType)}
                        </div>
                        <div className="record-title-info">
                          <h4 className="record-title">
                            {record.recordType.replace(/_/g, ' ').toUpperCase()}
                          </h4>
                          <p className="record-date">
                            {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="record-status-section">
                        <span className={`status-badge ${getStatusColor(record.verified)}`}>
                          {record.verified ? '✓ Verified' : '○ Unverified'}
                        </span>
                        <span className="expand-icon">
                          {expandedRecord === record.recordId ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content (Expandable) */}
                    {expandedRecord === record.recordId && (
                      <div className="record-card-content">
                        {/* Record Details */}
                        <div className="record-details">
                          <div className="detail-row">
                            <span className="detail-label">Record ID:</span>
                            <code className="detail-value">{record.recordId}</code>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">File Name:</span>
                            <span className="detail-value">{record.fileName}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">File Size:</span>
                            <span className="detail-value">
                              {(record.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Doctor ID:</span>
                            <span className="detail-value">{record.doctorId}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">IPFS Hash:</span>
                            <code className="detail-value hash">
                              {record.ipfsHash.substring(0, 16)}...
                            </code>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Blockchain TX:</span>
                            <code className="detail-value hash">
                              {record.blockchainTxHash.substring(0, 16)}...
                            </code>
                          </div>
                        </div>

                        {/* Verification Result */}
                        {verificationResults[record.recordId] && (
                          <div className={`verification-box ${verificationResults[record.recordId].verified ? 'verified' : 'failed'}`}>
                            <div className="verification-header">
                              <span className="verification-icon">
                                {verificationResults[record.recordId].verified ? '✅' : '❌'}
                              </span>
                              <span className="verification-label">
                                {verificationResults[record.recordId].verified
                                  ? 'Record Integrity Verified'
                                  : 'Record Verification Failed'}
                              </span>
                            </div>
                            <p className="verification-message">
                              {verificationResults[record.recordId].message}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="record-actions">
                          <button
                            className="action-btn verify-btn"
                            onClick={() => handleVerifyRecord(record)}
                            disabled={isLoading || verificationResults[record.recordId]}
                          >
                            {verificationResults[record.recordId] ? '✅ Verified' : '🔍 Verify Integrity'}
                          </button>
                          <button
                            className="action-btn download-btn"
                            onClick={() => handleDownload(record)}
                            disabled={isLoading}
                          >
                            📥 Download
                          </button>
                          <button
                            className={`action-btn share-btn ${selectedRecords.has(record.recordId) ? 'selected' : ''}`}
                            onClick={() => toggleRecordSelection(record.recordId)}
                          >
                            {selectedRecords.has(record.recordId) ? '✓ Selected' : '↗️ Share'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        {!searchPerformed && (
          <div className="welcome-box">
            <h3>🔒 Secure Medical Records Storage</h3>
            <ul>
              <li>All records are stored on IPFS (decentralized storage)</li>
              <li>Hashes are immutably stored on Ethereum blockchain</li>
              <li>Verify integrity using blockchain verification</li>
              <li>Download records securely to your device</li>
              <li>Share access with authorized healthcare providers</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewMedicalRecordsNew;
