import React, { useState, useEffect } from "react";
import {
  fetchAllMedicalRecords,
  getPatientMedicalRecords,
} from "../../services/adminApi";

function MedicalRecordsMonitoring() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchPatient, setSearchPatient] = useState("");

  useEffect(() => {
    fetchRecordsData();
  }, []);

  const fetchRecordsData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllMedicalRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch medical records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = async (e) => {
    const patientId = e.target.value;
    setSearchPatient(patientId);

    if (patientId.trim()) {
      try {
        const data = await getPatientMedicalRecords(patientId);
        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch patient records:", error);
      }
    } else {
      fetchRecordsData();
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filterType !== "all" && record.recordType !== filterType) {
      return false;
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const abbreviateHash = (hash) => {
    if (!hash) return "N/A";
    return hash.substring(0, 10) + "..." + hash.substring(hash.length - 8);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📋 Medical Records Monitoring</h2>
        <button
          onClick={fetchRecordsData}
          className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Patient ID
            </label>
            <input
              type="text"
              value={searchPatient}
              onChange={handleSearchPatient}
              placeholder="Enter patient ID..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Record Type
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

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Total Records:{" "}
              <span className="font-bold text-lg">
                {filteredRecords.length}
              </span>
            </div>
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
            No medical records found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Doctor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Record Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uploaded Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IPFS Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Blockchain TX
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {record.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.doctorId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.recordType)}`}
                    >
                      {record.recordType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(record.uploadedAt || record.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      title={record.ipfsHash}
                    >
                      {abbreviateHash(record.ipfsHash)}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-600">
                    {record.blockchainTx ? (
                      <a
                        href={`https://etherscan.io/tx/${record.blockchainTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        title={record.blockchainTx}
                      >
                        {abbreviateHash(record.blockchainTx)}
                      </a>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.blockchainTx
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {record.blockchainTx ? "✓ Verified" : "⏳ Processing"}
                    </span>
                  </td>
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
          both IPFS (off-chain) and Blockchain (on-chain). Click on the IPFS
          Hash or TX ID to view details. Records with a blockchain transaction
          hash are verified and tamper-proof.
        </p>
      </div>
    </div>
  );
}

export default MedicalRecordsMonitoring;
