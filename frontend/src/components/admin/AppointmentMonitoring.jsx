import React, { useState, useEffect, useCallback } from "react";
import * as adminApi from "../../services/adminApi";

export default function AppointmentMonitoring() {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      let res;
      if (filterStatus) {
        res = await adminApi.getAppointmentsByStatus(filterStatus);
      } else {
        res = await adminApi.fetchAllAppointments();
      }
      setAppointments(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelAppointment = async (aptId) => {
    if (window.confirm("Cancel this appointment?")) {
      try {
        await adminApi.cancelAppointment(aptId);
        fetchAppointments();
        alert("Appointment cancelled");
      } catch (err) {
        alert("Failed to cancel appointment");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading appointments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📅 Appointment Monitoring</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Appointments</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-brand">
              {appointments.length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {appointments.filter((a) => a.status === "COMPLETED").length}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-gray-600 text-sm">Scheduled</p>
            <p className="text-3xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === "SCHEDULED").length}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-gray-600 text-sm">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">
              {appointments.filter((a) => a.status === "CANCELLED").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {apt.patientName || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  Dr. {apt.doctorName || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {apt.department || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {apt.scheduledAt
                    ? new Date(apt.scheduledAt).toLocaleString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                  >
                    {apt.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {apt.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 border rounded text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
