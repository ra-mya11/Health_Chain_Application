import React, { useState, useEffect } from "react";

const SPRING_URL = "http://localhost:8081/api";

const RECORD_ICONS = {
  "Lab Report": "🧪", "lab_report": "🧪",
  "Prescription": "💊", "prescription": "💊",
  "Scan / X-Ray": "🩻", "Blood Test": "🩸",
  "MRI Report": "🧠", "ECG Report": "❤️",
  "Discharge Summary": "🏥", "Vaccination Record": "💉",
  "diagnosis": "🩺", "ai_prediction": "🤖",
};

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(() => fetchRecords(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecords = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const patientId = user.mysqlId || user.userId;

      if (!patientId) {
        setError("Patient ID not found. Please log out and log in again.");
        return;
      }

      const res = await fetch(`${SPRING_URL}/records/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("healthcare_token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      } else {
        setError("Failed to load records.");
      }
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError("Could not connect to server.");
      console.error("Failed to fetch records:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getFileUrl = (record) => {
    const key = record.ipfsHash || record.recordId;
    const name = encodeURIComponent(record.fileName || "record");
    return `${SPRING_URL}/records/download/${key}?fileName=${name}`;
  };

  const handleDownload = async (record) => {
    try {
      const token = localStorage.getItem("healthcare_token");
      const res = await fetch(getFileUrl(record), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = record.fileName || `record-${record.recordId}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  const handleView = async (record) => {
    try {
      const token = localStorage.getItem("healthcare_token");
      const res = await fetch(getFileUrl(record), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load file");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert("View failed: " + err.message);
    }
  };

  const recordTypes = ["all", ...new Set(records.map(r => r.recordType).filter(Boolean))];
  const filtered = filter === "all" ? records : records.filter(r => r.recordType === filter);

  if (loading) return <div className="text-center py-12">Loading records...</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">📋 My Medical Records</h2>
        <button
          onClick={() => { setLoading(true); fetchRecords(); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {lastRefresh && <p className="text-xs text-gray-400">Last updated: {lastRefresh}</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {records.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {recordTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600 font-medium">No medical records found</p>
          <p className="text-sm text-gray-400 mt-2">Your doctor will upload records after consultation</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((record) => (
            <div key={record.recordId}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{RECORD_ICONS[record.recordType] || "📄"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg capitalize">
                        {record.recordType?.replace(/_/g, " ") || "General"}
                      </h3>
                      {record.verified && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        record.storageType === "ipfs" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {record.storageType === "ipfs" ? "⛓️ IPFS" : "💾 Local"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 truncate">{record.fileName}</p>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-2 text-xs text-gray-500">
                      {record.doctorName && <span>👨‍⚕️ Dr. {record.doctorName}</span>}
                      {record.hospitalName && <span>🏥 {record.hospitalName}</span>}
                      {record.dateOfRecord && <span>📅 {record.dateOfRecord}</span>}
                      {record.uploadedAt && <span>⏰ {record.uploadedAt}</span>}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">📝 {record.notes}</p>
                    )}

                    {record.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {record.tags.map(t => (
                          <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleView(record)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-xs"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleDownload(record)}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition text-xs"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">🔐 Secure Medical Records</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-2xl font-bold">{records.length}</p><p className="text-xs opacity-80">Total Records</p></div>
          <div><p className="text-2xl font-bold">{records.filter(r => r.verified).length}</p><p className="text-xs opacity-80">Verified</p></div>
          <div><p className="text-2xl font-bold">{records.filter(r => r.storageType === "ipfs").length}</p><p className="text-xs opacity-80">On IPFS</p></div>
        </div>
      </div>
    </div>
  );
}

export default MedicalRecords;
