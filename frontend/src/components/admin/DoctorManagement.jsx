import React, { useState, useEffect } from "react";
import {
  fetchAllDoctors,
  registerDoctor,
  updateDoctor,
  fetchAllUsers,
  fetchAllDepartments,
  deleteDoctor,
  toggleDoctorAvailability,
} from "../../services/adminApi";

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const emptySchedule = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };

const emptyForm = {
  userId: "",
  specialization: "",
  experienceYears: "",
  departmentId: "",
  consultationFee: "",
  availability: emptySchedule,
};

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    fetchDoctorsData();
    fetchUsersData();
    fetchDepartmentsData();
  };

  const fetchDoctorsData = async () => {
    setLoading(true);
    try {
      const res = await fetchAllDoctors();
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchDoctors error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async () => {
    try {
      const res = await fetchAllUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const doctorUsers = users.filter((u) => (u.role || "").toUpperCase() === "DOCTOR");

  const fetchDepartmentsData = async () => {
    try {
      const res = await fetchAllDepartments();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchDepartments error:", err);
    }
  };

  const parseAvailability = (val) => {
    if (!val) return { ...emptySchedule };
    if (typeof val === "object") return { ...emptySchedule, ...val };
    try { return { ...emptySchedule, ...JSON.parse(val) }; }
    catch { return { ...emptySchedule }; }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in emptySchedule) {
      setFormData((p) => ({ ...p, availability: { ...p.availability, [name]: value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.specialization.trim()) { alert("Specialization is required."); return; }
    if (formData.experienceYears === "" || Number(formData.experienceYears) < 0) { alert("Experience must be 0 or more."); return; }
    if (!formData.departmentId) { alert("Department is required."); return; }
    if (formData.consultationFee === "" || Number(formData.consultationFee) < 0) { alert("Consultation fee must be 0 or more."); return; }

    const base = {
      specialization: formData.specialization.trim(),
      experienceYears: Number(formData.experienceYears),
      departmentId: Number(formData.departmentId),
      consultationFee: Number(formData.consultationFee),
      availability: JSON.stringify(formData.availability),
    };

    try {
      if (editingId) {
        await updateDoctor(editingId, base);
        alert("Doctor updated successfully");
      } else {
        if (!formData.userId) { alert("Please select a doctor user."); return; }
        await registerDoctor({ ...base, userId: Number(formData.userId) });
        alert("Doctor registered successfully");
      }
      resetForm();
      fetchDoctorsData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message || "Failed to save"));
    }
  };

  const handleEdit = (doc) => {
    setFormData({
      userId: doc.userId,
      specialization: doc.specialization || "",
      experienceYears: doc.experienceYears != null ? String(doc.experienceYears) : "",
      departmentId: doc.departmentId || "",
      consultationFee: doc.consultationFee != null ? String(doc.consultationFee) : "",
      availability: parseAvailability(doc.availability),
    });
    setEditingId(doc.userId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete Dr. ${doc.name || doc.userId}?`)) return;
    try {
      await deleteDoctor(doc.userId);
      setDoctors((prev) => prev.filter((d) => d.userId !== doc.userId));
    } catch {
      alert("Error deleting doctor");
    }
  };

  const handleToggle = async (doc) => {
    try {
      await toggleDoctorAvailability(doc.userId, !doc.isAvailable);
      fetchDoctorsData();
    } catch {
      alert("Error toggling availability");
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const schedulePreview = (val) => {
    const s = parseAvailability(val);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, fontSize: 10 }}>
        {WEEKDAYS.map((d) => (
          <div key={d.key} style={{ textAlign: "center", border: "1px solid #f3f4f6", borderRadius: 4, padding: 2 }}>
            <strong>{d.label}</strong>
            <div style={{ marginTop: 2, wordBreak: "break-all" }}>{s[d.key] || "—"}</div>
          </div>
        ))}
      </div>
    );
  };

  const userName = (uid) => users.find((u) => Number(u.id) === Number(uid))?.name || "Unknown";
  const userEmail = (uid) => users.find((u) => Number(u.id) === Number(uid))?.email || "—";
  const deptName = (did) => departments.find((d) => Number(d.id) === Number(did))?.name || "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Doctor Management</h2>
        <button
          type="button"
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-dark transition"
        >
          {showForm ? "✕ Cancel" : "+ Add Doctor"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Doctor" : "Register New Doctor"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* User select — only for new */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor User</label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                  >
                    <option value="">— Select user —</option>
                    {doctorUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  {doctorUsers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No users with DOCTOR role found. Register a user with DOCTOR role first.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                >
                  <option value="">— Select department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weekly schedule */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Weekly Availability</p>
              <p className="text-xs text-gray-400 mb-2">e.g. 09:00-12:00,14:00-17:00</p>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {WEEKDAYS.map((d) => (
                  <div key={d.key}>
                    <label className="text-xs font-medium text-gray-600">{d.label}</label>
                    <input
                      type="text"
                      name={d.key}
                      value={formData.availability[d.key] || ""}
                      onChange={handleChange}
                      placeholder="slots"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition"
              >
                {editingId ? "Update Doctor" : "Register Doctor"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading doctors…</div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No doctors registered yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Name", "Email", "Specialization", "Exp", "Dept", "Fee", "Status", "Appts", "Schedule", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((doc) => (
                <tr key={doc.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{doc.name || userName(doc.userId)}</td>
                  <td className="px-4 py-3 text-gray-500">{doc.email || userEmail(doc.userId)}</td>
                  <td className="px-4 py-3">{doc.specialization || "—"}</td>
                  <td className="px-4 py-3">{doc.experienceYears ?? "—"} yrs</td>
                  <td className="px-4 py-3">{doc.departmentName || deptName(doc.departmentId)}</td>
                  <td className="px-4 py-3">${doc.consultationFee != null ? Number(doc.consultationFee).toFixed(2) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${doc.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {doc.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{doc.appointmentCount ?? 0}</td>
                  <td className="px-4 py-3" style={{ minWidth: 200 }}>{schedulePreview(doc.availability)}</td>
                  <td className="px-4 py-3 whitespace-nowrap space-x-2">
                    <button onClick={() => handleEdit(doc)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(doc)} className="text-red-500 hover:underline text-xs">Delete</button>
                    <button onClick={() => handleToggle(doc)} className="text-gray-600 hover:underline text-xs">
                      {doc.isAvailable ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DoctorManagement;
