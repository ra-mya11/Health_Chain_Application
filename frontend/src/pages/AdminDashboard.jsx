import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";
import UserManagement from "../components/admin/UserManagement";
import DepartmentManagement from "../components/admin/DepartmentManagement";
import AppointmentMonitoring from "../components/admin/AppointmentMonitoring";
import NotificationManagement from "../components/admin/NotificationManagement";
import DoctorManagement from "../components/admin/DoctorManagement";
import MedicalRecordsMonitoring from "../components/admin/MedicalRecordsMonitoring";

import {
  fetchAnalytics,
  fetchAllAppointments,
  fetchAllMedicalRecords,
  fetchAllDepartments,
} from "../services/adminApi";

// ── Pure-CSS bar chart ──────────────────────────────────────────────────────
function BarChart({ data, color = "#6366f1" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{d.value}</span>
          <div
            style={{
              width: "100%",
              height: `${(d.value / max) * 90}px`,
              minHeight: 4,
              background: color,
              borderRadius: "4px 4px 0 0",
              transition: "height 0.4s ease",
            }}
          />
          <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pure-CSS donut chart ────────────────────────────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 40, cx = 50, cy = 50, stroke = 14;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ / total}
              style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
          );
          offset += seg.value;
          return el;
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1f2937">
          {total}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#374151" }}>{seg.label}: <b>{seg.value}</b></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, gradient, sub }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 16,
      padding: "20px 18px",
      color: "#fff",
      boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ fontSize: 28, opacity: 0.85 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────
function last7DayLabels() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
}

function bucketByDay(items, dateField) {
  const labels = last7DayLabels();
  const counts = Array(7).fill(0);
  const now = new Date();
  items.forEach((item) => {
    const raw = item[dateField];
    if (!raw) return;
    const d = new Date(raw);
    const diff = Math.floor((now - d) / 86400000);
    if (diff >= 0 && diff < 7) counts[6 - diff]++;
  });
  return labels.map((label, i) => ({ label, value: counts[i] }));
}

function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusBadge(status) {
  const map = {
    SCHEDULED: { bg: "#dbeafe", color: "#1d4ed8" },
    COMPLETED: { bg: "#dcfce7", color: "#15803d" },
    CANCELLED: { bg: "#fee2e2", color: "#b91c1c" },
    PENDING: { bg: "#fef9c3", color: "#a16207" },
  };
  const s = (status || "").toUpperCase();
  const style = map[s] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>{s}</span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function AdminDashboard({ setAuth }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState({
    totalPatients: 0, totalDoctors: 0, totalAppointments: 0,
    totalRecords: 0, totalPredictions: 0, diabetesPredictions: 0,
    heartPredictions: 0, scheduledAppointments: 0,
    completedAppointments: 0, cancelledAppointments: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const activeTabClass = "border-b-2 border-brand-dark text-brand-dark";
  const inactiveTabClass = "text-gray-600 hover:text-brand-dark";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, aptsRes, recsRes, deptsRes] = await Promise.allSettled([
        fetchAnalytics(),
        fetchAllAppointments(),
        fetchAllMedicalRecords(),
        fetchAllDepartments(),
      ]);

      if (analyticsRes.status === "fulfilled") {
        const d = analyticsRes.value.data || analyticsRes.value;
        setAnalytics({
          totalPatients: d.totalPatients || 0,
          totalDoctors: d.totalDoctors || 0,
          totalAppointments: d.totalAppointments || 0,
          totalRecords: d.totalRecords || 0,
          totalPredictions: d.totalPredictions || 0,
          diabetesPredictions: d.diabetesPredictions || 0,
          heartPredictions: d.heartPredictions || 0,
          scheduledAppointments: d.scheduledAppointments || 0,
          completedAppointments: d.completedAppointments || 0,
          cancelledAppointments: d.cancelledAppointments || 0,
        });
      }
      if (aptsRes.status === "fulfilled") {
        const d = aptsRes.value.data || aptsRes.value;
        setAppointments(Array.isArray(d) ? d : []);
      }
      if (recsRes.status === "fulfilled") {
        const d = recsRes.value.data || recsRes.value;
        setRecords(Array.isArray(d) ? d : []);
      }
      if (deptsRes.status === "fulfilled") {
        const d = deptsRes.value.data || deptsRes.value;
        setDepartments(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      console.error("Failed to load overview data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    loadAll();
  }, [loadAll]);

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("user");
    setAuth(false);
    navigate("/login");
  };

  // ── derived chart data ───────────────────────────────────────────────────
  const aptChartData = bucketByDay(appointments, "appointmentTime");
  const recChartData = bucketByDay(records, "uploadedAt");

  const deptPatientMap = {};
  appointments.forEach((a) => {
    const dept = a.doctor?.department?.name || a.departmentName || "Other";
    deptPatientMap[dept] = (deptPatientMap[dept] || 0) + 1;
  });
  const deptColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];
  const deptSegments = Object.entries(deptPatientMap)
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: deptColors[i % deptColors.length] }));

  const aptStatusSegments = [
    { label: "Scheduled", value: analytics.scheduledAppointments, color: "#3b82f6" },
    { label: "Completed", value: analytics.completedAppointments, color: "#10b981" },
    { label: "Cancelled", value: analytics.cancelledAppointments, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  // ── pending / alerts ─────────────────────────────────────────────────────
  const pendingApts = appointments.filter(
    (a) => (a.status || "").toUpperCase() === "SCHEDULED"
  ).slice(0, 5);

  const recentApts = [...appointments]
    .sort((a, b) => new Date(b.appointmentTime || 0) - new Date(a.appointmentTime || 0))
    .slice(0, 5);

  const recentRecs = [...records]
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
    .slice(0, 5);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-dark to-brand-light text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Admin Portal</h1>
            <p className="text-sm opacity-90">Healthcare System Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name || "Administrator"}</p>
              <p className="text-sm opacity-90">System Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-brand px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              ["overview", "📊 Overview"],
              ["users", "👥 Users"],
              ["doctors", "👨‍⚕️ Doctors"],
              ["departments", "🏥 Departments"],
              ["appointments", "📅 Appointments"],
              ["records", "📋 Records"],
              ["notifications", "🔔 Notifications"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === key ? activeTabClass : inactiveTabClass
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Title row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>System Overview</h2>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                  Live snapshot of your healthcare platform
                </p>
              </div>
              <button
                onClick={loadAll}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "⏳ Loading…" : "🔄 Refresh"}
              </button>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
              <StatCard icon="👥" label="Total Patients" value={analytics.totalPatients}
                gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)" />
              <StatCard icon="👨‍⚕️" label="Total Doctors" value={analytics.totalDoctors}
                gradient="linear-gradient(135deg,#10b981,#047857)" />
              <StatCard icon="📅" label="Appointments" value={analytics.totalAppointments}
                sub={`${analytics.scheduledAppointments} pending`}
                gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
              <StatCard icon="🏥" label="Departments" value={departments.length}
                gradient="linear-gradient(135deg,#f59e0b,#b45309)" />
              <StatCard icon="📋" label="Medical Records" value={analytics.totalRecords}
                gradient="linear-gradient(135deg,#f97316,#c2410c)" />
              <StatCard icon="🤖" label="AI Predictions" value={analytics.totalPredictions}
                sub={`${analytics.diabetesPredictions} diabetes · ${analytics.heartPredictions} heart`}
                gradient="linear-gradient(135deg,#ec4899,#9d174d)" />
            </div>

            {/* ── Charts row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>

              {/* Appointments last 7 days */}
              <div style={card}>
                <h3 style={cardTitle}>📅 Appointments — Last 7 Days</h3>
                <BarChart data={aptChartData} color="#6366f1" />
              </div>

              {/* Records uploaded last 7 days */}
              <div style={card}>
                <h3 style={cardTitle}>📋 Records Uploaded — Last 7 Days</h3>
                <BarChart data={recChartData} color="#10b981" />
              </div>

              {/* Appointment status donut */}
              <div style={card}>
                <h3 style={cardTitle}>📊 Appointment Status</h3>
                {aptStatusSegments.length > 0
                  ? <DonutChart segments={aptStatusSegments} />
                  : <p style={{ color: "#9ca3af", fontSize: 13 }}>No appointment data yet.</p>}
              </div>

              {/* Department distribution donut */}
              <div style={card}>
                <h3 style={cardTitle}>🏥 Dept. Distribution</h3>
                {deptSegments.length > 0
                  ? <DonutChart segments={deptSegments} />
                  : <p style={{ color: "#9ca3af", fontSize: 13 }}>No department data yet.</p>}
              </div>
            </div>

            {/* ── Recent Activity + Alerts ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>

              {/* Recent Appointments */}
              <div style={card}>
                <h3 style={cardTitle}>🕐 Recent Appointments</h3>
                {recentApts.length === 0
                  ? <p style={{ color: "#9ca3af", fontSize: 13 }}>No appointments found.</p>
                  : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <th style={th}>Patient</th>
                          <th style={th}>Doctor</th>
                          <th style={th}>Date</th>
                          <th style={th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApts.map((a, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={td}>{a.patientName || a.patient?.name || `#${a.patientId}`}</td>
                            <td style={td}>{a.doctorName || a.doctor?.user?.name || `#${a.doctorId}`}</td>
                            <td style={td}>{fmtDate(a.appointmentTime)}</td>
                            <td style={td}>{statusBadge(a.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>

              {/* Recent Medical Records */}
              <div style={card}>
                <h3 style={cardTitle}>📁 Recent Medical Records</h3>
                {recentRecs.length === 0
                  ? <p style={{ color: "#9ca3af", fontSize: 13 }}>No records found.</p>
                  : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <th style={th}>Patient</th>
                          <th style={th}>Type</th>
                          <th style={th}>Doctor</th>
                          <th style={th}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRecs.map((r, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={td}>{r.patientName || `#${r.patientId}`}</td>
                            <td style={td}>{r.recordType || r.fileType || "—"}</td>
                            <td style={td}>{r.doctorName || "—"}</td>
                            <td style={td}>{fmtDate(r.uploadedAt || r.dateOfRecord)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>

              {/* Alerts — Pending Appointments */}
              <div style={card}>
                <h3 style={cardTitle}>🚨 Alerts</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* Pending count alert */}
                  {analytics.scheduledAppointments > 0 && (
                    <div style={alertBox("#fef9c3", "#a16207", "#fde68a")}>
                      <span style={{ fontSize: 18 }}>⏳</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {analytics.scheduledAppointments} Pending Appointment{analytics.scheduledAppointments > 1 ? "s" : ""}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Awaiting confirmation or action</div>
                      </div>
                    </div>
                  )}

                  {/* Cancelled alert */}
                  {analytics.cancelledAppointments > 0 && (
                    <div style={alertBox("#fee2e2", "#b91c1c", "#fecaca")}>
                      <span style={{ fontSize: 18 }}>❌</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {analytics.cancelledAppointments} Cancelled Appointment{analytics.cancelledAppointments > 1 ? "s" : ""}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Review and follow up if needed</div>
                      </div>
                    </div>
                  )}

                  {/* Pending appointments list */}
                  {pendingApts.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                        Upcoming Scheduled:
                      </p>
                      {pendingApts.map((a, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "5px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12,
                        }}>
                          <span style={{ color: "#374151" }}>
                            {a.patientName || `Patient #${a.patientId}`}
                          </span>
                          <span style={{ color: "#6b7280" }}>{fmtDate(a.appointmentTime)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {analytics.scheduledAppointments === 0 && analytics.cancelledAppointments === 0 && (
                    <div style={alertBox("#dcfce7", "#15803d", "#bbf7d0")}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>All clear — no active alerts</div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div style={card}>
                <h3 style={cardTitle}>🖥️ System Health</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Backend API", "Spring Boot :8080", true],
                    ["ML Service", "Python :8000", true],
                    ["MongoDB", "Records DB :27017", true],
                    ["MySQL", "Healthcare DB :3306", true],
                    ["IPFS Gateway", "Kubo :8090", true],
                    ["Blockchain", "Hardhat :8545", true],
                  ].map(([name, detail, ok]) => (
                    <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{detail}</div>
                      </div>
                      <span style={{
                        background: ok ? "#dcfce7" : "#fee2e2",
                        color: ok ? "#15803d" : "#b91c1c",
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      }}>
                        {ok ? "✓ Online" : "✗ Down"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "users" && <UserManagement />}
        {activeTab === "doctors" && <DoctorManagement />}
        {activeTab === "departments" && <DepartmentManagement />}
        {activeTab === "appointments" && <AppointmentMonitoring />}
        {activeTab === "records" && <MedicalRecordsMonitoring />}
        {activeTab === "notifications" && <NotificationManagement />}
      </main>
    </div>
  );
}

// ── shared inline styles ─────────────────────────────────────────────────────
const card = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  border: "1px solid #f3f4f6",
};

const cardTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 16,
  margin: "0 0 16px",
};

const th = {
  textAlign: "left",
  padding: "4px 6px",
  color: "#6b7280",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const td = {
  padding: "7px 6px",
  color: "#374151",
  verticalAlign: "middle",
};

const alertBox = (bg, color, border) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  background: bg,
  color,
  border: `1px solid ${border}`,
  borderRadius: 10,
  padding: "10px 12px",
});

export default AdminDashboard;
