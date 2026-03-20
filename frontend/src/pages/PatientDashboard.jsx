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

function PatientDashboard({ setAuth }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData && userData !== "undefined") {
      try {
        setUser(JSON.parse(userData));
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
      </main>
    </div>
  );
}

export default PatientDashboard;
