import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorAppointments } from "../services/api";
import { removeToken } from "../utils/auth";

const RECORD_TYPES = [
  "Lab Report", "Prescription", "Scan / X-Ray", "MRI Report",
  "Blood Test", "ECG Report", "Discharge Summary", "Vaccination Record", "Other",
];

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "🔒 Private", desc: "Only you" },
  { value: "DOCTOR_ONLY", label: "👨‍⚕️ Doctor Only", desc: "You + treating doctors" },
  { value: "PUBLIC", label: "🌐 Public", desc: "All authorized staff" },
];

const FILE_ICONS = {
  "application/pdf": "📄",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🖼️",
  default: "📎",
};

const RECORD_TYPE_ICONS = {
  "Lab Report": "🧪", "Prescription": "💊", "Scan / X-Ray": "🩻",
  "MRI Report": "🧠", "Blood Test": "🩸", "ECG Report": "❤️",
  "Discharge Summary": "🏥", "Vaccination Record": "💉", "Other": "📄",
  "ai_prediction": "🤖", default: "📋",
};

const emptyUpload = {
  patientId: "", patientName: "", recordType: "", doctorName: "",
  hospitalName: "", dateOfRecord: "", notes: "", tags: [],
  tagInput: "", visibility: "DOCTOR_ONLY", files: [],
};

function DoctorDashboard({ setAuth }) {
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [user, setUser] = useState(null);
  const [uploadData, setUploadData] = useState(emptyUpload);
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', msg }
  const [filePreviews, setFilePreviews] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      setUploadData((prev) => ({ ...prev, doctorName: u.name || "" }));
    }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments");
    }
  };

  const viewPatientRecords = async (patientId) => {
    try {
      setRecordsLoading(true);
      const token = localStorage.getItem("healthcare_token");
      const res = await fetch(`/api/records/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPatientRecords(data.records || []);
      setActiveTab("records");
    } catch (error) {
      console.error("Failed to fetch patient records");
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("user");
    setAuth(false);
    navigate("/login");
  };

  const updateAppointmentStatus = async (appointmentId, status, notes) => {
    try {
      await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("healthcare_token")}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      fetchAppointments();
    } catch (error) {
      console.error("Failed to update appointment");
    }
  };

  // Patient auto-suggest from appointments list
  const handlePatientSearch = (val) => {
    setUploadData((prev) => ({ ...prev, patientId: val, patientName: val }));
    if (!val.trim()) { setPatientSuggestions([]); return; }
    const q = val.toLowerCase();
    const matches = appointments
      .filter((a) => a.patient?.name?.toLowerCase().includes(q) || a.patient?.id?.toLowerCase().includes(q))
      .map((a) => ({ id: a.patient?.id, name: a.patient?.name }))
      .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
    setPatientSuggestions(matches);
  };

  const selectPatient = (p) => {
    setUploadData((prev) => ({ ...prev, patientId: p.id, patientName: p.name }));
    setPatientSuggestions([]);
  };

  // File handling
  const processFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (f.size > 5 * 1024 * 1024) { alert(`${f.name} exceeds 5MB limit.`); return false; }
      return true;
    });
    setUploadData((prev) => ({ ...prev, files: [...prev.files, ...valid] }));
    valid.forEach((f) => {
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreviews((prev) => [...prev, { name: f.name, url: e.target.result, type: f.type }]);
        reader.readAsDataURL(f);
      } else {
        setFilePreviews((prev) => [...prev, { name: f.name, url: null, type: f.type }]);
      }
    });
  }, []);

  const removeFile = (idx) => {
    setUploadData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  // Tags
  const addTag = () => {
    const t = uploadData.tagInput.trim();
    if (t && !uploadData.tags.includes(t)) {
      setUploadData((prev) => ({ ...prev, tags: [...prev.tags, t], tagInput: "" }));
    }
  };

  const removeTag = (t) => setUploadData((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));

  // Upload with XHR for progress
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.patientId) { setUploadStatus({ type: "error", msg: "Please select a patient." }); return; }
    if (!uploadData.recordType) { setUploadStatus({ type: "error", msg: "Please select a record type." }); return; }
    if (uploadData.files.length === 0) { setUploadStatus({ type: "error", msg: "Please attach at least one file." }); return; }

    const token = localStorage.getItem("healthcare_token");
    const userData = localStorage.getItem("user");
    const doctorId = userData ? JSON.parse(userData).userId || JSON.parse(userData).id || "" : "";

    setUploading(true); setUploadProgress(0); setUploadStatus(null);

    // Upload files one by one
    for (let i = 0; i < uploadData.files.length; i++) {
      const form = new FormData();
      form.append("file", uploadData.files[i]);
      form.append("patientId", uploadData.patientId);
      form.append("doctorId", doctorId);
      form.append("recordType", uploadData.recordType);
      form.append("doctorName", uploadData.doctorName);
      form.append("hospitalName", uploadData.hospitalName);
      form.append("dateOfRecord", uploadData.dateOfRecord);
      form.append("notes", uploadData.notes);
      form.append("tags", uploadData.tags.join(","));
      form.append("visibility", uploadData.visibility);
      form.append("uploadedBy", doctorId);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/records/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const fileProgress = ((i + ev.loaded / ev.total) / uploadData.files.length) * 100;
            setUploadProgress(Math.round(fileProgress));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(form);
      }).catch((err) => {
        setUploadStatus({ type: "error", msg: `Failed to upload ${uploadData.files[i].name}: ${err.message}` });
      });
    }

    setUploading(false); setUploadProgress(100);
    setUploadStatus({ type: "success", msg: `${uploadData.files.length} file(s) uploaded successfully to IPFS!` });
    setUploadData({ ...emptyUpload, doctorName: user?.name || "" });
    setFilePreviews([]);
  };

  const deleteRecord = async (recordId) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      const token = localStorage.getItem("healthcare_token");
      await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatientRecords((prev) => prev.filter((r) => (r.recordId || r.id) !== recordId));
    } catch { alert("Delete failed."); }
  };

  const downloadRecord = async (ipfsHash, fileName) => {
    try {
      const token = localStorage.getItem("healthcare_token");
      const res = await fetch(`/api/records/download/${ipfsHash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName || "medical-record";
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Download failed."); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-dark to-brand-light text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🏥 Doctor Portal</h1>
            <p className="text-sm opacity-90">Healthcare Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">Dr. {user?.name}</p>
              <p className="text-sm opacity-90">{user?.specialization}</p>
            </div>
            <button onClick={handleLogout} className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            {["appointments", "records", "upload", "schedule"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === tab ? "border-b-2 border-brand-dark text-brand-dark" : "text-gray-600 hover:text-brand-dark"
                }`}
              >
                {tab === "appointments" ? "📅 My Appointments"
                  : tab === "records" ? "📋 Patient Records"
                  : tab === "upload" ? "📤 Upload Record"
                  : "🕐 My Schedule"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Appointments</h2>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-600">No appointments scheduled</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👤</div>
                          <div>
                            <h3 className="font-semibold text-lg">{apt.patient?.name}</h3>
                            <p className="text-sm text-gray-600">{apt.patient?.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Date</p>
                            <p className="font-medium">{apt.scheduledAt}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time</p>
                            <p className="font-medium">{apt.timeSlot}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Department</p>
                            <p className="font-medium">{apt.department}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              apt.status === "SCHEDULED" ? "bg-blue-100 text-blue-700"
                              : apt.status === "COMPLETED" ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>

                        {apt.reason && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-700">Reason:</p>
                            <p className="text-sm text-gray-600">{apt.reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => viewPatientRecords(apt.patient?.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                        >
                          View Records
                        </button>
                        {apt.status === "SCHEDULED" && (
                          <>
                            <button
                              onClick={() => {
                                const notes = prompt("Enter consultation notes:");
                                if (notes) updateAppointmentStatus(apt.id, "completed", notes);
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, "cancelled")}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "records" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Patient Medical Records</h2>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-3">🔍 Search Patient Records</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter Patient ID (shown in patient's dashboard header)"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  id="patientIdSearch"
                />
                <button
                  onClick={() => {
                    const id = document.getElementById("patientIdSearch").value.trim();
                    if (id) viewPatientRecords(id);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Search
                </button>
                <button
                  onClick={async () => {
                    try {
                      setRecordsLoading(true);
                      const token = localStorage.getItem("healthcare_token");
                      const res = await fetch("/api/records/all", {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();
                      setPatientRecords(Array.isArray(data) ? data : []);
                    } catch { setPatientRecords([]); }
                    finally { setRecordsLoading(false); }
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  All Records
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Ask the patient to share their User ID visible in their dashboard header.</p>
            </div>

            {recordsLoading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-4xl mb-3 animate-spin">⌛</div>
                <p className="text-gray-500">Loading records...</p>
              </div>
            ) : patientRecords.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600">No records found</p>
                <p className="text-sm text-gray-400 mt-2">Search by Patient ID or click All Records</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {patientRecords.map((record) => {
                  const rId = record.recordId || record.id;
                  const icon = RECORD_TYPE_ICONS[record.recordType] || RECORD_TYPE_ICONS.default;
                  return (
                    <div key={rId} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl w-12 text-center">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg capitalize">
                              {record.recordType ? record.recordType.replace(/_/g, " ") : "General"}
                            </h3>
                            {record.verified && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✓ Verified</span>
                            )}
                            {record.visibility && (
                              <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
                                {record.visibility === "PRIVATE" ? "🔒" : record.visibility === "DOCTOR_ONLY" ? "👨⚕️" : "🌐"} {record.visibility}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{record.fileName || "Medical Document"}</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-gray-500">
                            {record.doctorName && <span>👨⚕️ {record.doctorName}</span>}
                            {record.hospitalName && <span>🏥 {record.hospitalName}</span>}
                            {record.dateOfRecord && <span>📅 {record.dateOfRecord}</span>}
                            <span>⏰ {record.uploadedAt || ""}</span>
                          </div>
                          {record.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic truncate">📝 {record.notes}</p>
                          )}
                          {record.tags && record.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {record.tags.map((t) => (
                                <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          )}
                          {record.ipfsHash && (
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className="text-purple-600 font-medium">🔗 IPFS:</span>
                              <code className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-xs">{record.ipfsHash}</code>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {record.ipfsHash && (
                            <a
                              href={`http://127.0.0.1:8090/ipfs/${record.ipfsHash}`}
                              target="_blank" rel="noreferrer"
                              className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-xs text-center"
                            >
                              👁️ View
                            </a>
                          )}
                          {record.ipfsHash && (
                            <button
                              onClick={() => downloadRecord(record.ipfsHash, record.fileName)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition text-xs"
                            >
                              ⬇️ Download
                            </button>
                          )}
                          <button
                            onClick={() => deleteRecord(rId)}
                            className="bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition text-xs"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">📤 Upload Medical Record</h2>

            {/* Status Banner */}
            {uploadStatus && (
              <div className={`rounded-xl px-5 py-4 flex items-center gap-3 ${
                uploadStatus.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                <span className="text-xl">{uploadStatus.type === "success" ? "✅" : "❌"}</span>
                <span className="font-medium">{uploadStatus.msg}</span>
                <button onClick={() => setUploadStatus(null)} className="ml-auto text-lg opacity-60 hover:opacity-100">×</button>
              </div>
            )}

            <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT COLUMN */}
              <div className="space-y-5">

                {/* Patient Search */}
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">👤 Patient</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={uploadData.patientName || uploadData.patientId}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    {patientSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {patientSuggestions.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => selectPatient(p)}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-gray-400">{p.id}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {uploadData.patientId && uploadData.patientName && uploadData.patientName !== uploadData.patientId && (
                    <p className="text-xs text-green-600 mt-1">✓ Selected: {uploadData.patientName} ({uploadData.patientId})</p>
                  )}
                </div>

                {/* Record Details */}
                <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                  <h3 className="font-semibold text-gray-700">📋 Record Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Record Type *</label>
                    <select
                      value={uploadData.recordType}
                      onChange={(e) => setUploadData((p) => ({ ...p, recordType: e.target.value }))}
                      className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select type...</option>
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>{RECORD_TYPE_ICONS[t] || "📋"} {t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Doctor Name</label>
                      <input
                        value={uploadData.doctorName}
                        onChange={(e) => setUploadData((p) => ({ ...p, doctorName: e.target.value }))}
                        placeholder="Dr. Name"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Hospital Name</label>
                      <input
                        value={uploadData.hospitalName}
                        onChange={(e) => setUploadData((p) => ({ ...p, hospitalName: e.target.value }))}
                        placeholder="Hospital / Clinic"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Record</label>
                    <input
                      type="date"
                      value={uploadData.dateOfRecord}
                      onChange={(e) => setUploadData((p) => ({ ...p, dateOfRecord: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                    <textarea
                      value={uploadData.notes}
                      onChange={(e) => setUploadData((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      placeholder="Clinical notes, observations..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tags</label>
                    <div className="flex gap-2">
                      <input
                        value={uploadData.tagInput}
                        onChange={(e) => setUploadData((p) => ({ ...p, tagInput: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag + Enter"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button type="button" onClick={addTag} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium">
                        + Add
                      </button>
                    </div>
                    {uploadData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uploadData.tags.map((t) => (
                          <span key={t} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            {t}
                            <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Visibility</label>
                    <div className="grid grid-cols-3 gap-2">
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setUploadData((p) => ({ ...p, visibility: opt.value }))}
                          className={`p-2.5 rounded-lg border-2 text-center transition ${
                            uploadData.visibility === opt.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-blue-300 text-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{opt.label}</div>
                          <div className="text-xs opacity-70">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — File Upload */}
              <div className="space-y-5">
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">📎 Files <span className="text-xs font-normal text-gray-400">(max 5MB each)</span></h3>

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                      dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-4xl mb-2">📥</div>
                    <p className="font-medium text-gray-700">Drag & drop files here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG — up to 5MB each</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => processFiles(e.target.files)}
                    />
                  </div>

                  {/* File Previews */}
                  {filePreviews.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {filePreviews.map((fp, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                          {fp.url ? (
                            <img src={fp.url} alt={fp.name} className="w-12 h-12 object-cover rounded border" />
                          ) : (
                            <div className="w-12 h-12 bg-red-50 rounded border flex items-center justify-center text-2xl">
                              {FILE_ICONS[fp.type] || FILE_ICONS.default}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fp.name}</p>
                            <p className="text-xs text-gray-400">{fp.type}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-red-400 hover:text-red-600 text-lg font-bold shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* IPFS Info */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔗</span>
                    <span className="font-semibold text-purple-800">IPFS Storage</span>
                  </div>
                  <p className="text-xs text-purple-700">Files are uploaded to IPFS. Only the CID hash is stored in the database — your files are decentralized and tamper-proof.</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                    <span>⛓️</span><span>CID logged on blockchain for integrity verification</span>
                  </div>
                </div>

                {/* Progress + Submit */}
                {uploading && (
                  <div className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Uploading to IPFS...</span>
                      <span className="font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white transition ${
                    uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : "🚀 Upload to IPFS"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">My Weekly Schedule</h2>
            <div className="grid grid-cols-7 gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{day}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">09:00 AM</div>
                    <div className="bg-blue-50 p-2 rounded">10:00 AM</div>
                    <div className="bg-blue-50 p-2 rounded">11:00 AM</div>
                    <div className="bg-gray-100 p-2 rounded text-gray-500">Lunch</div>
                    <div className="bg-blue-50 p-2 rounded">02:00 PM</div>
                    <div className="bg-blue-50 p-2 rounded">03:00 PM</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorDashboard;
