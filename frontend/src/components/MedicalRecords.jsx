import React, { useState, useEffect } from "react";

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("healthcare_token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const patientId = String(user.userId || user.id || "");

      if (!patientId) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/records/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // PatientRecordsResponse wraps records in a "records" array
        const recs = Array.isArray(data.records) ? data.records
          : Array.isArray(data) ? data
          : [];

        if (recs.length > 0) {
          setRecords(recs);
          setLoading(false);
          return;
        }
      }

      // Fallback: fetch all and filter by patientId (string comparison)
      const res2 = await fetch("/api/records/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const all = Array.isArray(data2) ? data2 : [];
        setRecords(all.filter((r) => String(r.patientId) === patientId));
      }
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const token = localStorage.getItem("healthcare_token");
      const res = await fetch(`/api/records/download/${record.ipfsHash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.fileName || `record-${record.recordId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  const getRecordIcon = (type) => {
    const icons = {
      "Lab Report": "🧪", "lab_report": "🧪",
      "Prescription": "💊", "prescription": "💊",
      "Scan / X-Ray": "🩻", "scan": "🩻",
      "MRI Report": "🧠", "mri_report": "🧠",
      "Blood Test": "🩸", "blood_test": "🩸",
      "ECG Report": "❤️", "ecg_report": "❤️",
      "Discharge Summary": "🏥", "discharge_summary": "🏥",
      "Vaccination Record": "💉", "vaccination_record": "💉",
      "diagnosis": "🩺", "ai_prediction": "🤖", "vitals": "❤️",
    };
    return icons[type] || "📄";
  };

  if (loading) {
    return <div className="text-center py-12">Loading records...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📋 Medical Records</h2>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
          ℹ️ Records uploaded by your doctor
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600">No medical records found</p>
          <p className="text-sm text-gray-500 mt-2">Your doctor will upload records after consultation</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div
              key={record.recordId || record.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-transform transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{getRecordIcon(record.recordType)}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg capitalize">
                        {record.recordType ? record.recordType.replace(/_/g, " ") : "General"}
                      </h3>
                      {record.verified && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                      )}
                      {record.visibility && (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {record.visibility === "PRIVATE" ? "🔒" : record.visibility === "DOCTOR_ONLY" ? "👨⚕️" : "🌐"} {record.visibility}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">{record.fileName || "Medical Document"}</p>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-2 text-xs text-gray-500">
                      {record.doctorName && <span>👨⚕️ {record.doctorName}</span>}
                      {record.hospitalName && <span>🏥 {record.hospitalName}</span>}
                      {record.dateOfRecord && <span>📅 {record.dateOfRecord}</span>}
                      {(record.uploadedAt || record.createdAt) && (
                        <span>⏰ {record.uploadedAt || record.createdAt}</span>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">📝 {record.notes}</p>
                    )}

                    {record.tags && record.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {record.tags.map((t) => (
                          <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}

                    {record.ipfsHash && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-purple-600 font-medium">🔗 IPFS:</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{record.ipfsHash.substring(0, 24)}...</code>
                      </div>
                    )}
                    {record.blockchainTxHash && (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-blue-600 font-medium">⛓️ Blockchain:</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{record.blockchainTxHash.substring(0, 24)}...</code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4 shrink-0">
                  {record.ipfsHash && (
                    <a
                      href={`http://127.0.0.1:8090/ipfs/${record.ipfsHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-xs text-center"
                    >
                      👁️ View
                    </a>
                  )}
                  {record.ipfsHash && (
                    <button
                      onClick={() => handleDownload(record)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition text-xs"
                    >
                      ⬇️ Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2">🔐 Blockchain Security</h3>
        <p className="text-sm opacity-90">All your medical records are secured on the Ethereum blockchain. Records are uploaded by your doctor and cannot be modified.</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><p className="text-2xl font-bold">{records.length}</p><p className="text-xs opacity-90">Total Records</p></div>
          <div><p className="text-2xl font-bold">100%</p><p className="text-xs opacity-90">Encrypted</p></div>
          <div><p className="text-2xl font-bold">∞</p><p className="text-xs opacity-90">Immutable</p></div>
        </div>
      </div>
    </div>
  );
}

export default MedicalRecords;
