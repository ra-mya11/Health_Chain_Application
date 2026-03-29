import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import HealthScore from "../components/HealthScore";
import MedicalRecords from "../components/MedicalRecords";
import Appointments from "../components/Appointments";
import DoctorBrowsing from "../components/DoctorBrowsing";
import Recommendations from "../components/Recommendations";
import AssessmentSummary from "../components/AssessmentSummary";
import { removeToken } from "../utils/auth";
import { fetchNotificationsForRole } from "../services/adminApi";

function PatientDashboard({ setAuth }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData && userData !== "undefined") {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchNotificationsForRole(parsed.role || "patient")
          .then(res => setNotifications(res.data))
          .catch(() => {});
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("user");
    setAuth(false);
    navigate("/login");
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "summary", label: "Assessment Summary" },
    { id: "health", label: "Health Score" },
    { id: "records", label: "Medical Records" },
    { id: "book-appointment", label: "Book Appointment" },
    { id: "appointments", label: "My Appointments" },
    { id: "recommendations", label: "Recommendations" },
    { id: "notifications", label: `🔔 Notifications${notifications.length > 0 ? ` (${notifications.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-brand-dark to-brand-light text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">HealthChain</h1>
            <p className="text-sm opacity-90">Blockchain Healthcare System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm capitalize opacity-90">{user?.role}</p>
              <p className="text-xs opacity-75">ID: {user?.userId}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-b-2 border-brand-dark text-brand-dark"
                    : "text-gray-600 hover:text-brand-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "summary" && <AssessmentSummary />}
        {activeTab === "health" && <HealthScore />}
        {activeTab === "records" && <MedicalRecords />}
        {activeTab === "book-appointment" && <DoctorBrowsing />}
        {activeTab === "appointments" && <Appointments />}
        {activeTab === "recommendations" && <Recommendations />}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">🔔 Notifications</h2>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{n.title}</h3>
                      <p className="text-gray-600 mt-1">{n.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {n.sentAt ? new Date(n.sentAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <span className="mt-2 inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {n.targetRole === "ALL" ? "All Users" : n.targetRole}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientDashboard;
