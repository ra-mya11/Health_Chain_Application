import React, { useState, useEffect, useCallback } from "react";
import * as adminApi from "../../services/adminApi";

const ITEMS_PER_PAGE = 8;

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = { success: "#16a34a", error: "#dc2626", info: "#2563eb" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: colors[type] || colors.info, color: "#fff",
      padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      maxWidth: 360, fontSize: 14
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 12, background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>✕</button>
    </div>
  );
}

function DeptModal({ dept, onSave, onClose }) {
  const [form, setForm] = useState({ name: dept?.name || "", description: dept?.description || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (dept) {
        await adminApi.updateDepartment(dept.id, form);
      } else {
        await adminApi.createDepartment(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>
          {dept ? "Edit Department" : "Add Department"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Department Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cardiology"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              rows={3}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 20px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : dept ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignDoctorsModal({ dept, allDoctors, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getDoctorsInDepartment(dept.id)
      .then(res => {
        const ids = (res.data || []).map(d => d.userId);
        setDeptDoctors(ids);
        setSelected(new Set(ids));
      })
      .catch(() => {});
  }, [dept.id]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminApi.assignDoctorsToDepartment(dept.id, Array.from(selected));
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign doctors");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Assign Doctors</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>{dept.name}</p>
        <div style={{ overflowY: "auto", flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 16 }}>
          {allDoctors.length === 0
            ? <p style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>No doctors available</p>
            : allDoctors.map(doc => (
              <label key={doc.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                <input type="checkbox" checked={selected.has(doc.userId)} onChange={() => toggle(doc.userId)} />
                <span style={{ fontSize: 14 }}>{doc.name || `Doctor #${doc.userId}`}</span>
                {doc.specialization && <span style={{ fontSize: 12, color: "#6b7280" }}>— {doc.specialization}</span>}
              </label>
            ))
          }
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <p style={{ margin: "0 0 20px", fontSize: 15 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 20px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "9px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalDept, setModalDept] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [assignDept, setAssignDept] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        adminApi.fetchAllDepartments(),
        adminApi.fetchAllDoctors(),
      ]);
      setDepartments(deptRes.data || []);
      setAllDoctors(docRes.data || []);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const handleSaveModal = () => {
    setModalDept(undefined);
    showToast(modalDept ? "Department updated" : "Department created");
    load();
  };

  const handleSaveAssign = () => {
    setAssignDept(null);
    showToast("Doctors assigned successfully");
    load();
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await adminApi.deleteDepartment(id);
      showToast("Department deleted");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot delete department", "error");
    }
  };

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🏥 Department Management</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>{departments.length} departments total</p>
        </div>
        <button
          onClick={() => setModalDept(null)}
          style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          + Add Department
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 280 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>Loading departments...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
          {search ? "No departments match your search." : "No departments yet. Add one to get started."}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Department", "Description", "Doctors", "Created", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((dept, i) => (
                <tr key={dept.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14 }}>{dept.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", maxWidth: 240 }}>
                    {dept.description || <span style={{ fontStyle: "italic" }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {dept.doctorCount ?? 0} doctors
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                    {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setModalDept(dept)}
                        style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12 }}
                      >Edit</button>
                      <button
                        onClick={() => setAssignDept(dept)}
                        style={{ padding: "5px 12px", border: "1px solid #a5b4fc", borderRadius: 6, background: "#eef2ff", color: "#4338ca", cursor: "pointer", fontSize: 12 }}
                      >Assign Doctors</button>
                      <button
                        onClick={() => setConfirmDelete(dept.id)}
                        style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12 }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "5px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "#374151", cursor: "pointer", fontSize: 13 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modalDept !== undefined && (
        <DeptModal dept={modalDept} onSave={handleSaveModal} onClose={() => setModalDept(undefined)} />
      )}
      {assignDept && (
        <AssignDoctorsModal dept={assignDept} allDoctors={allDoctors} onSave={handleSaveAssign} onClose={() => setAssignDept(null)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Delete this department? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
