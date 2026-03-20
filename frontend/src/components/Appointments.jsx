import React, { useState, useEffect } from "react";
import {
  getAppointments,
  getAvailableDoctors,
  bookAppointment,
  cancelAppointment,
} from "../services/api";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    doctorId: "",
    date: "",
    timeSlot: "",
    department: "",
    reason: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAvailableDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Failed to fetch doctors");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      await bookAppointment(bookingData);
      setShowBooking(false);
      setBookingData({ doctorId: "", date: "", timeSlot: "", department: "", reason: "" });
      fetchAppointments();
      alert("Appointment booked successfully!");
    } catch (error) {
      alert("Failed to book appointment");
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(appointmentId);
      fetchAppointments();
    } catch (error) {
      alert("Failed to cancel appointment");
    }
  };

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredDoctors = doctors.filter(
    (d) => !bookingData.department || d.specialization === bookingData.department
  );

  if (loading) {
    return <div className="text-center py-12">Loading appointments...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📅 My Appointments</h2>
        <button
          onClick={() => setShowBooking(!showBooking)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showBooking ? "Cancel" : "+ Book Appointment"}
        </button>
      </div>

      {showBooking && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Book New Appointment</h3>
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingData.department}
                  onChange={(e) => setBookingData({ ...bookingData, department: e.target.value, doctorId: "" })}
                  required
                >
                  <option value="">Select Department</option>
                  {[...new Set(doctors.map((d) => d.specialization))].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Doctor</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                  required
                >
                  <option value="">Select Doctor</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.userId} value={String(doctor.userId)}>
                      Dr. {doctor.name} — {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Slot</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingData.timeSlot}
                  onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                  required
                >
                  <option value="">Select Time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason for Visit</label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                value={bookingData.reason}
                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                placeholder="Describe your symptoms or reason for consultation"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Confirm Booking
            </button>
          </form>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600">No appointments scheduled</p>
          <p className="text-sm text-gray-500 mt-2">Book your first appointment to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-transform transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">Dr. {appointment.doctor?.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>🏥 {appointment.department} — {appointment.doctor?.specialization}</p>
                    <p>📅 {appointment.scheduledAt}</p>
                    <p>🕐 {appointment.timeSlot}</p>
                    {appointment.reason && <p>📝 {appointment.reason}</p>}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Doctor's Notes:</p>
                      <p className="text-sm text-blue-800 mt-1">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                {appointment.status === "SCHEDULED" && (
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Appointments;
