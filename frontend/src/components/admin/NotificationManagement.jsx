import React, { useState, useEffect } from "react";
import * as adminApi from "../../services/adminApi";

export default function NotificationManagement() {
  const [showForm, setShowForm] = useState(false);
  const [unsentNotifications, setUnsentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetRole: "ALL",
  });

  useEffect(() => {
    fetchUnsentNotifications();
  }, []);

  const fetchUnsentNotifications = async () => {
    try {
      const res = await adminApi.fetchUnsentNotifications();
      setUnsentNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createNotification(
        formData.title,
        formData.message,
        formData.targetRole,
      );
      setFormData({ title: "", message: "", targetRole: "ALL" });
      setShowForm(false);
      fetchUnsentNotifications();
      alert("Notification created successfully!");
    } catch (err) {
      alert("Failed to create notification");
    }
  };

  const handleBroadcast = async (notifId) => {
    try {
      await adminApi.broadcastNotification(notifId);
      fetchUnsentNotifications();
      alert("Notification broadcasted!");
    } catch (err) {
      alert("Failed to broadcast notification");
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📢 Notification Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-dark transition"
        >
          {showForm ? "Cancel" : "+ Send Announcement"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand outline-none"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Notification title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand outline-none"
                rows="4"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Notification message"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Audience
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand outline-none"
                value={formData.targetRole}
                onChange={(e) =>
                  setFormData({ ...formData, targetRole: e.target.value })
                }
              >
                <option value="ALL">All Users</option>
                <option value="PATIENT">Patients Only</option>
                <option value="DOCTOR">Doctors Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-brand text-white py-2 rounded-lg hover:bg-brand-dark transition"
            >
              Create & Send Notification
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {unsentNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600">No unsent notifications</p>
          </div>
        ) : (
          unsentNotifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{notif.title}</h3>
                  <p className="text-gray-600 mt-2">{notif.message}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {notif.targetRole}
                    </span>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                      Unsent
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleBroadcast(notif.id)}
                  className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition whitespace-nowrap ml-4"
                >
                  Send Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
