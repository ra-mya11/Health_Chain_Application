const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const HealthRecord = require("../models/HealthRecord");

const router = express.Router();

// Get system statistics
router.get("/stats", auth, authorize("admin"), async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalAppointments = await Appointment.countDocuments();
    const totalRecords = await HealthRecord.countDocuments();

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/users/:id", auth, authorize("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.patch("/users/:id/role", auth, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;

    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: "User role updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status (enable/disable)
router.patch("/users/:id/status", auth, authorize("admin"), async (req, res) => {
  try {
    const { enabled } = req.query;
    const isEnabled = enabled === 'true';

    await User.findByIdAndUpdate(req.params.id, { enabled: isEnabled });
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by role
router.get("/users/role/:role", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role.toLowerCase() })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
router.get("/analytics", auth, authorize("admin"), async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalAppointments = await Appointment.countDocuments();
    const totalRecords = await HealthRecord.countDocuments();

    // Appointment status counts
    const scheduledAppointments = await Appointment.countDocuments({ status: "scheduled" });
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });

    // AI predictions (mock data for now)
    const totalPredictions = 0;
    const diabetesPredictions = 0;
    const heartPredictions = 0;

    res.json({
      totalPatients,
      totalDoctors,
      totalAdmins,
      totalAppointments,
      totalRecords,
      totalPredictions,
      diabetesPredictions,
      heartPredictions,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all appointments for admin
router.get("/appointments", auth, authorize("admin"), async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments by status
router.get("/appointments/status/:status", auth, authorize("admin"), async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: req.params.status })
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all medical records for admin
router.get("/records", auth, authorize("admin"), async (req, res) => {
  try {
    const records = await HealthRecord.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient medical records
router.get("/records/patient/:patientId", auth, authorize("admin"), async (req, res) => {
  try {
    const records = await HealthRecord.find({ patient: req.params.patientId })
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors
router.get("/doctors", auth, authorize("admin"), async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctors by department
router.get("/doctors/department/:departmentId", auth, authorize("admin"), async (req, res) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      department: req.params.departmentId
    })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI prediction logs (mock data for now)
router.get("/ai/logs", auth, authorize("admin"), async (req, res) => {
  try {
    // Mock AI prediction logs
    const logs = [
      {
        id: 1,
        patientName: "John Doe",
        predictionType: "Diabetes",
        riskLevel: "Low",
        confidence: 85,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        patientName: "Jane Smith",
        predictionType: "Heart Disease",
        riskLevel: "Medium",
        confidence: 72,
        timestamp: new Date().toISOString()
      }
    ];
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent AI predictions
router.get("/ai/logs/recent", auth, authorize("admin"), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    // Mock recent predictions
    const recentPredictions = [
      {
        id: 1,
        patientName: "Alice Johnson",
        predictionType: "Diabetes",
        riskLevel: "High",
        confidence: 91,
        timestamp: new Date().toISOString()
      }
    ];
    res.json(recentPredictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Department management (mock data for now)
router.get("/departments", auth, authorize("admin"), async (req, res) => {
  try {
    const departments = [
      { id: 1, name: "Cardiology", description: "Heart and cardiovascular diseases" },
      { id: 2, name: "Endocrinology", description: "Diabetes and hormonal disorders" },
      { id: 3, name: "General Medicine", description: "General healthcare" },
      { id: 4, name: "Neurology", description: "Brain and nervous system" }
    ];
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification management (mock data for now)
router.get("/notifications/unsent", auth, authorize("admin"), async (req, res) => {
  try {
    const notifications = [
      {
        id: 1,
        title: "System Maintenance",
        message: "Scheduled maintenance on Sunday 2-4 AM",
        targetRole: "ALL",
        createdAt: new Date().toISOString()
      }
    ];
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit logs (mock data for now)
router.get("/audit-logs", auth, authorize("admin"), async (req, res) => {
  try {
    const logs = [
      {
        id: 1,
        action: "User Login",
        user: "admin@example.com",
        timestamp: new Date().toISOString(),
        details: "Admin logged into system"
      },
      {
        id: 2,
        action: "User Created",
        user: "admin@example.com",
        timestamp: new Date().toISOString(),
        details: "New patient registered: patient@example.com"
      }
    ];
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
