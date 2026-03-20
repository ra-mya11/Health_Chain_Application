import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

export default function Navbar({ setAuth }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null") || {};

  const handleLogout = () => {
    removeToken();
    setAuth(false);
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-brand-dark to-brand-light text-white shadow-md">
      <div className="container mx-auto flex items-center p-4">
        {/* navbar is intentionally minimal; details are shown inside dashboards */}
      </div>
    </header>
  );
}
