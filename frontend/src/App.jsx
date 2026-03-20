import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { getToken } from "./utils/auth";

function getInitialAuth() {
  try {
    const token = getToken();
    const raw = localStorage.getItem("user");
    if (token && raw) {
      const user = JSON.parse(raw);
      return { isAuthenticated: true, role: user.role };
    }
  } catch {
    localStorage.removeItem("user");
  }
  return { isAuthenticated: false, role: null };
}

function App() {
  const initial = getInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const [userRole, setUserRole] = useState(initial.role);

  const getDashboard = () => {
    switch (userRole) {
      case "patient": return <PatientDashboard setAuth={setIsAuthenticated} />;
      case "doctor":  return <DoctorDashboard setAuth={setIsAuthenticated} />;
      case "admin":   return <AdminDashboard setAuth={setIsAuthenticated} />;
      default:        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated
              ? <Login setAuth={setIsAuthenticated} setRole={setUserRole} />
              : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? getDashboard() : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
