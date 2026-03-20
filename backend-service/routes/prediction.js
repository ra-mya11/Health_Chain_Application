const express = require("express");
const axios = require("axios");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

const router = express.Router();

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Predict disease based on symptoms
router.post("/predict-disease", auth, async (req, res) => {
  try {
    const { age, gender, symptoms } = req.body;

    // Validate input
    if (!age || !gender || !symptoms) {
      return res
        .status(400)
        .json({ error: "Missing required fields: age, gender, symptoms" });
    }

    // Call AI prediction service
    const response = await axios.post(`${AI_SERVICE_URL}/predict-disease`, {
      age: parseInt(age),
      gender: gender.toLowerCase(),
      symptoms: symptoms,
    });

    res.json({
      success: true,
      prediction: response.data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Prediction error:", error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.detail || "Failed to get prediction",
      message: error.message,
    });
  }
});

// Get available symptoms
router.get("/symptoms", async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/symptoms`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching symptoms:", error.message);
    res.status(500).json({ error: "Failed to fetch symptoms" });
  }
});

// Get available departments
router.get("/departments", async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/departments`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// Get doctors by department
router.get("/doctors/:department", async (req, res) => {
  try {
    const { department } = req.params;

    // Find doctors in the specified department
    const doctors = await User.find({
      role: "doctor",
      specialization: new RegExp(department, "i"),
    }).select("-password -walletAddress");

    res.json({
      department,
      doctor_count: doctors.length,
      doctors: doctors.map((doc) => ({
        id: doc._id,
        name: doc.name,
        specialization: doc.specialization,
        licenseNumber: doc.licenseNumber,
        phone: doc.phone,
        experience_years: doc.experienceYears || 0,
        available_slots: Math.floor(Math.random() * 5) + 1, // Dummy data
      })),
    });
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// Book appointment based on prediction
router.post("/book-appointment", auth, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reasonForVisit } = req.body;
    const patientId = req.userId;

    // Validate input
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate: new Date(date),
      timeSlot,
      reasonForVisit: reasonForVisit || "Based on symptom prediction",
      status: "scheduled",
    });

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        date: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        doctorId: appointment.doctorId,
        status: appointment.status,
      },
    });
  } catch (error) {
    console.error("Appointment booking error:", error.message);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// Get prediction history for logged-in user
router.get("/prediction-history", auth, async (req, res) => {
  try {
    // This would require storing predictions in the database
    // For now, returning empty array
    res.json({
      user_id: req.userId,
      predictions: [],
      message: "Prediction history feature coming soon",
    });
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ error: "Failed to fetch prediction history" });
  }
});

// Health check for AI service
router.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    res.json({
      ai_service_status: response.data.status,
      backend_status: "healthy",
    });
  } catch (error) {
    res.status(500).json({
      ai_service_status: "unavailable",
      backend_status: "healthy",
      error: "AI service not responding",
    });
  }
});

module.exports = router;
