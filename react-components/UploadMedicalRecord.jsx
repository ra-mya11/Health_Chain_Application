import React, { useState } from 'react';
import axios from 'axios';

const UploadMedicalRecord = () => {
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [recordType, setRecordType] = useState('Lab Report');
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !patientId || !doctorId) {
      alert('Please fill all fields');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('doctorId', doctorId);
    formData.append('recordType', recordType);

    try {
      const res = await axios.post('http://localhost:8080/api/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResponse(res.data);
      alert('Record uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Medical Record</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient ID
          </label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter patient ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor ID
          </label>
          <input
            type="text"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter doctor ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Record Type
          </label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option>Lab Report</option>
            <option>X-Ray</option>
            <option>MRI Scan</option>
            <option>Prescription</option>
            <option>Discharge Summary</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            accept=".pdf,.jpg,.jpeg,.png,.dcm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Record'}
        </button>
      </form>

      {response && response.success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Upload Successful!</h3>
          <p className="text-sm text-gray-700"><strong>Record ID:</strong> {response.recordId}</p>
          <p className="text-sm text-gray-700"><strong>IPFS Hash:</strong> {response.ipfsHash}</p>
          <p className="text-sm text-gray-700"><strong>Blockchain Tx:</strong> {response.blockchainTxHash}</p>
        </div>
      )}
    </div>
  );
};

export default UploadMedicalRecord;
