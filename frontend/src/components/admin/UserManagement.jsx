import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as adminApi from "../../services/adminApi";

const PAGE_SIZE = 10;

const ROLE_META = {
  PATIENT:  { label: "Patient",  bg: "#dbeafe", color: "#1d4ed8", icon: "🧑‍⚕️" },
  DOCTOR:   { label: "Doctor",   bg: "#dcfce7", color: "#15803d", icon: "👨‍⚕️" },
  ADMIN:    { label: "Admin",    bg: "#fef3c7", color: "#92400e", icon: "⚙️"  },
};

function roleBadge(role) {
  const r = (role || "").toUpperCase();
  const m = ROLE_META[r] || { label: r || "—", bg: "#f3f4f6", color: "#374151", icon: "👤" };
  return (
    <span style={{
      background: m.bg, color: m.color,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function statusBadge(enabled) {
  return (
    <span style={{
      background: enabled ? "#dcfce7" : "#fee2e2",
      color: enabled ? "#15803d" : "#b91c1c",
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>
      {enabled ? "● Active" : "○ Inactive"}
    </span>
  );
}

function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function Avatar({ name }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899"];
  const bg = colors[(name || "").charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", background: bg,
      color: "#fff", fontWeight: 700, fontSize: 13,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── User Detail Modal ────────────────────────────────────────────────────────
function UserModal({ user, onClose, onToggle, onDelete }) {
  if (!user) return null;
  const role = (user.role || "").toUpperCase();
  const m = ROLE_META[role] || { bg: "#f3f4f6", color: "#374151", icon: "👤" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${m.color}22, ${m.color}11)`,
          borderBottom: `3px solid ${m.color}33`,
          padding: "24px 24px 20px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: m.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, flexShrink: 0,
          }}>
            {(user.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{user.name || "—"}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{user.email}</p>
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              {roleBadge(user.role)}
              {statusBadge(user.enabled)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#9ca3af", lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["🆔 User ID", `#${user.id}`],
              ["📞 Phone", user.phone || "Not provided"],
              ["📅 Joined", fmtDate(user.createdAt)],
              ["📋 Appointments", user.appointmentCount != null ? user.appointmentCount : "—"],
            ].map(([label, val]) => (
              <div key={label} style={{
                background: "#f9fafb", borderRadius: 10, padding: "10px 14px",
                border: "1px solid #f3f4f6",
              }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Appointment count bar */}
          {user.appointmentCount > 0 && (
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
                📊 Appointment Activity
              </div>
              <div style={{ background: "#dcfce7", borderRadius: 6, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#16a34a", borderRadius: 6,
                  width: `${Math.min(user.appointmentCount * 10, 100)}%`,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                {user.appointmentCount} total appointment{user.appointmentCount !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #f3f4f6",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={btnStyle("#f3f4f6", "#374151")}>Close</button>
          <button
            onClick={() => { onToggle(user); onClose(); }}
            style={btnStyle(user.enabled ? "#fee2e2" : "#dcfce7", user.enabled ? "#b91c1c" : "#15803d")}
          >
            {user.enabled ? "🚫 Deactivate" : "✅ Activate"}
          </button>
          <button
            onClick={() => { onDelete(user); onClose(); }}
            style={btnStyle("#fee2e2", "#b91c1c")}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = (bg, color) => ({
  background: bg, color, border: "none", borderRadius: 8,
  padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
  transition: "opacity 0.15s",
});

// ── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28, maxWidth: 360, width: "90%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <p style={{ fontSize: 15, color: "#374151", fontWeight: 600, marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={btnStyle("#f3f4f6", "#374151")}>Cancel</button>
          <button onClick={onConfirm} style={btnStyle("#fee2e2", "#b91c1c")}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === "error" ? "#fee2e2" : "#dcfce7";
  const color = type === "error" ? "#b91c1c" : "#15803d";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1200,
      background: bg, color, border: `1px solid ${color}33`,
      borderRadius: 12, padding: "12px 20px", fontWeight: 600, fontSize: 14,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "error" ? "❌" : "✅"} {msg}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]             = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirm, setConfirm]       = useState(null); // { message, onConfirm }
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.fetchAllUsers();
      const data = res.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterRole, filterStatus]);

  // ── filtered + paginated ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);
      const matchRole = !filterRole || (u.role || "").toUpperCase() === filterRole;
      const matchStatus =
        filterStatus === "" ? true :
        filterStatus === "active" ? u.enabled :
        !u.enabled;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── actions ──────────────────────────────────────────────────────────────
  const openUserModal = async (user) => {
    setModalLoading(true);
    setSelectedUser(user); // show modal immediately with basic info
    try {
      const res = await adminApi.getUserDetails(user.id);
      setSelectedUser(res.data || res);
    } catch {
      // keep basic info already set
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = (user) => {
    setConfirm({
      message: `${user.enabled ? "Deactivate" : "Activate"} user "${user.name}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await adminApi.approveUser(user.id, !user.enabled);
          showToast(`User ${user.enabled ? "deactivated" : "activated"} successfully`);
          fetchUsers();
        } catch {
          showToast("Failed to update user status", "error");
        }
      },
    });
  };

  const handleDelete = (user) => {
    setConfirm({
      message: `Permanently delete "${user.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await adminApi.deleteUser(user.id);
          showToast("User deleted successfully");
          fetchUsers();
        } catch {
          showToast("Failed to delete user", "error");
        }
      },
    });
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await adminApi.updateUserRole(user.id, newRole);
      showToast(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      showToast("Failed to update role", "error");
    }
  };

  // ── summary counts ───────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total:    users.length,
    patients: users.filter(u => (u.role || "").toUpperCase() === "PATIENT").length,
    doctors:  users.filter(u => (u.role || "").toUpperCase() === "DOCTOR").length,
    admins:   users.filter(u => (u.role || "").toUpperCase() === "ADMIN").length,
    active:   users.filter(u => u.enabled).length,
    inactive: users.filter(u => !u.enabled).length,
  }), [users]);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
        {[
          ["Total Users",  counts.total,    "#6366f1", "👥"],
          ["Patients",     counts.patients, "#3b82f6", "🧑‍⚕️"],
          ["Doctors",      counts.doctors,  "#10b981", "👨‍⚕️"],
          ["Admins",       counts.admins,   "#f59e0b", "⚙️"],
          ["Active",       counts.active,   "#16a34a", "✅"],
          ["Inactive",     counts.inactive, "#ef4444", "🚫"],
        ].map(([label, val, color, icon]) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${color}22`,
            borderLeft: `4px solid ${color}`,
          }}>
            <div style={{ fontSize: 18 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2 }}>{val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Roles</option>
          <option value="PATIENT">🧑‍⚕️ Patient</option>
          <option value="DOCTOR">👨‍⚕️ Doctor</option>
          <option value="ADMIN">⚙️ Admin</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">🚫 Inactive</option>
        </select>

        <button
          onClick={fetchUsers}
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", border: "none", borderRadius: 9,
            padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13,
          }}
        >
          🔄 Refresh
        </button>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6",
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            Loading users…
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af", fontSize: 15 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            No users match your filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #f3f4f6" }}>
                  {["#", "User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#6b7280",
                      textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((user, idx) => (
                  <tr key={user.id}
                    style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* # */}
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 600 }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* User */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={user.name} />
                        <span style={{ fontWeight: 700, color: "#111827" }}>{user.name || "—"}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{user.email}</td>

                    {/* Role — editable */}
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={(user.role || "").toUpperCase()}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        style={{
                          border: "1.5px solid #e5e7eb", borderRadius: 8,
                          padding: "4px 8px", fontSize: 12, fontWeight: 600,
                          background: "#f9fafb", cursor: "pointer", outline: "none",
                        }}
                      >
                        <option value="PATIENT">🧑‍⚕️ Patient</option>
                        <option value="DOCTOR">👨‍⚕️ Doctor</option>
                        <option value="ADMIN">⚙️ Admin</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>{statusBadge(user.enabled)}</td>

                    {/* Joined */}
                    <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {fmtDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <ActionBtn
                          label="View"
                          bg="#ede9fe" color="#6d28d9"
                          onClick={() => openUserModal(user)}
                        />
                        <ActionBtn
                          label={user.enabled ? "Deactivate" : "Activate"}
                          bg={user.enabled ? "#fee2e2" : "#dcfce7"}
                          color={user.enabled ? "#b91c1c" : "#15803d"}
                          onClick={() => handleToggleStatus(user)}
                        />
                        <ActionBtn
                          label="Delete"
                          bg="#fee2e2" color="#b91c1c"
                          onClick={() => handleDelete(user)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div style={{
            padding: "14px 20px", borderTop: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <PageBtn label="← Prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…"
                    ? <span key={`e${i}`} style={{ padding: "6px 4px", color: "#9ca3af" }}>…</span>
                    : <PageBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />
                )}
              <PageBtn label="Next →" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {/* Modals & overlays */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── small helpers ────────────────────────────────────────────────────────────
function ActionBtn({ label, bg, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg, color, border: "none", borderRadius: 7,
        padding: "5px 10px", cursor: "pointer", fontWeight: 600, fontSize: 11,
        whiteSpace: "nowrap", transition: "opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {label}
    </button>
  );
}

function PageBtn({ label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? "#6366f1" : "#f3f4f6",
        color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
        border: "none", borderRadius: 7,
        padding: "6px 12px", cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600, fontSize: 12, transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );
}

const selectStyle = {
  border: "1.5px solid #e5e7eb", borderRadius: 9,
  padding: "9px 12px", fontSize: 13, background: "#fff",
  cursor: "pointer", outline: "none", fontWeight: 600, color: "#374151",
};
