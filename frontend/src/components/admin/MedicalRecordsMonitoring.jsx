import React, { useState, useEffect } from "react";
import {
  fetchAllMedicalRecords,
  fetchAllUsers,
  getUsersByRole,
} from "../../services/adminApi";

function MedicalRecordsMonitoring() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [patientFilter, setPatientFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [allPatients, setAllPatients] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);

  useEffect(() => {
    fetchRecordsData();
    fetchUsersData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRecordsData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRecordsData = async () => {
    try {
      setLoading(true);
      const response = await fetchAllMedicalRecords();
      const payload = response?.data ?? [];
      setRecords(Array.isArray(payload) ? payload : []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch medical records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async () => {
    try {
      const [patientsResponse, doctorsResponse] = await Promise.all([
        getUsersByRole('patient'),
        getUsersByRole('doctor')
      ]);
      
      const patients = patientsResponse?.data ?? [];
      const doctors = doctorsResponse?.data ?? [];
      
      setAllPatients(Array.isArray(patients) ? patients : []);
      setAllDoctors(Array.isArray(doctors) ? doctors : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setAllPatients([]);
      setAllDoctors([]);
    }
  };

  // Helper function to get patient/doctor names from records
  const getPatientName = (record) => {
    if (record.patientName) return record.patientName;
    if (record.patient) {
      if (typeof record.patient === 'object' && record.patient.name) return record.patient.name;
      if (typeof record.patient === 'string') return record.patient;
    }
    return record.patientId || 'Unknown';
  };

  const getDoctorName = (record) => {
    if (record.doctorName) return record.doctorName;
    if (record.doctor) {
      if (typeof record.doctor === 'object' && record.doctor.name) return record.doctor.name;
      if (typeof record.doctor === 'string') return record.doctor;
    }
    return record.doctorId || 'Unknown';
  };

  const getPatientId = (record) => record.patientId || (record.patient && record.patient._id) || (record.patient && record.patient) || "N/A";
  const getDoctorId = (record) => record.doctorId || (record.doctor && record.doctor._id) || (record.doctor && record.doctor) || "N/A";
  const handleViewRecord = (record) => {
    if (record.ipfsHash) {
      // Open IPFS link in new tab using local gateway
      const gatewayURL = `http://127.0.0.1:8090/ipfs/${record.ipfsHash}`;
      window.open(gatewayURL, '_blank');
    } else {
      alert('No IPFS hash available for this record');
    }
  };

  const handleDownloadRecord = async (record) => {
    if (!record.ipfsHash) {
      alert('No IPFS hash available for download');
      return;
    }

    try {
      // Use local IPFS gateway for download
      const gatewayURL = `http://127.0.0.1:8090/ipfs/${record.ipfsHash}`;
      const response = await fetch(gatewayURL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file from IPFS');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical-record-${record.recordType || 'unknown'}-${record.id || record._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the record. Please make sure IPFS is running and try again.');
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filterType !== "all" && record.recordType !== filterType) {
      return false;
    }
    if (patientFilter && patientFilter !== "" && getPatientName(record) !== patientFilter) {
      return false;
    }
    if (doctorFilter && doctorFilter !== "" && getDoctorName(record) !== doctorFilter) {
      return false;
    }
    if (dateFrom) {
      const recDate = new Date(record.createdAt || record.uploadedAt || record.dateOfRecord);
      const fromDate = new Date(dateFrom);
      if (isNaN(recDate.getTime()) || recDate < fromDate) return false;
    }
    if (dateTo) {
      const recDate = new Date(record.createdAt || record.uploadedAt || record.dateOfRecord);
      const toDate = new Date(dateTo);
      // include dateTo day
      toDate.setHours(23, 59, 59, 999);
      if (isNaN(recDate.getTime()) || recDate > toDate) return false;
    }
    return true;
  });

  const getRecordTypeColor = (type) => {
    const colors = {
      "Lab Report": "bg-blue-100 text-blue-700",
      "X-Ray": "bg-purple-100 text-purple-700",
      Prescription: "bg-green-100 text-green-700",
      "Test Result": "bg-yellow-100 text-yellow-700",
      "Medical Note": "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const abbreviateHash = (hash) => {
    if (!hash) return "N/A";
    return hash.substring(0, 10) + "..." + hash.substring(hash.length - 8);
  };

  const patientNames = allPatients.map(p => p.name || p.email).filter(name => name && name.trim()).sort();
  const doctorNames = allDoctors.map(d => d.name || d.email).filter(name => name && name.trim()).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📋 Medical Records Monitoring</h2>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={fetchRecordsData}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          {loading ? '⏳ Refreshing...' : '🔄 Refresh Now'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value="">All Patients</option>
              {patientNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Name
            </label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value="">All Doctors</option>
              {doctorNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value="all">All Types</option>
              <option value="Lab Report">Lab Report</option>
              <option value="X-Ray">X-Ray</option>
              <option value="Prescription">Prescription</option>
              <option value="Test Result">Test Result</option>
              <option value="Medical Note">Medical Note</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            />
          </div>

          <div className="lg:col-span-5 mt-2 text-sm text-gray-600">
            <span className="font-bold">Total Records: </span>{filteredRecords.length}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading medical records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div>No medical records found matching current filters</div>
            <div className="text-sm mt-2">
              Total records fetched: {records.length} | Filtered: {filteredRecords.length}
            </div>
            {records.length > 0 && (
              <div className="text-sm mt-2 text-blue-600">
                Try clearing filters to see all records
              </div>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Record</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id || record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{getPatientName(record)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{getPatientId(record)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getDoctorName(record)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getDoctorId(record)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.recordType || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(record.createdAt || record.uploadedAt || record.dateOfRecord)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.hospitalName || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRecord(record)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                        title="View Record"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDownloadRecord(record)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                        title="Download Record"
                        disabled={!record.ipfsHash}
                      >
                        📥 Download
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.visibility || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> Medical records are immutable and stored on
          both IPFS (off-chain) and Blockchain (on-chain). Use the View button to
          preview records and Download button to save them locally. Records with
          blockchain verification are tamper-proof.
        </p>
      </div>
    </div>
  );
}

export default MedicalRecordsMonitoring;
