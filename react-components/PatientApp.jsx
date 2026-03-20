import React, { useState, useEffect } from 'react';
import PatientLogin from './PatientLogin';
import PatientDashboard from './PatientDashboard';

const PatientApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? (
        <PatientDashboard />
      ) : (
        <PatientLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default PatientApp;
