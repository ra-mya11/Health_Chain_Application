import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ViewMedicalRecords = () => {
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(null);

  const fetchRecords = async () => {
    if (!patientId) {
      alert('Please enter patient ID');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/records/patient/${patientId}`);
      setRecords(res.data);
    } catch (error) {
      alert('Failed to fetch records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecord = async (recordId) => {
    setVerifying(recordId);
    try {
      const res = await axios.get(`http://localhost:8080/api/records/verify/${recordId}`);
      alert(res.data.verified ? 'Record verified ✓' : 'Verification failed ✗');
    } catch (error) {
      alert('Verification error: ' + error.message);
    } finally {
      setVerifying(null);
    }
  };

  const downloadRecord = async (ipfsHash, fileName) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/records/download/${ipfsHash}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">View Medical Records</h2>
      
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter patient ID"
        />
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {records.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IPFS Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.recordId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.fileName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.recordType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.doctorId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {record.ipfsHash.substring(0, 10)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => downloadRecord(record.ipfsHash, record.fileName)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => verifyRecord(record.recordId)}
                      disabled={verifying === record.recordId}
                      className="text-green-600 hover:text-green-800 font-medium disabled:text-gray-400"
                    >
                      {verifying === record.recordId ? 'Verifying...' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {records.length === 0 && !loading && patientId && (
        <div className="text-center py-12 text-gray-500">
          No records found for this patient
        </div>
      )}
    </div>
  );
};

export default ViewMedicalRecords;
