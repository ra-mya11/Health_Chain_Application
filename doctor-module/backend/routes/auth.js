const express = require('express');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const doctorAuth = require('../middleware/doctorAuth');

const router = express.Router();

// Register doctor
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, specialization, licenseNumber, phone, qualification, department } = req.body;
    
    const existingDoctor = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Email or license number already registered' });
    }
    
    const doctor = new Doctor({
      name,
      email,
      password,
      specialization,
      licenseNumber,
      phone,
      qualification,
      department,
      role: 'doctor'
    });
    
    await doctor.save();
    
    const token = jwt.sign(
      { doctorId: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET || 'doctor_secret_key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Doctor registered successfully',
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        role: 'doctor'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login doctor
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const doctor = await Doctor.findOne({ email });
    if (!doctor || !doctor.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }
    
    const isMatch = await doctor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { doctorId: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET || 'doctor_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        department: doctor.department,
        role: 'doctor',
        stats: doctor.stats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor profile
router.get('/profile', doctorAuth, async (req, res) => {
  try {
    res.json(req.doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update wallet address
router.patch('/wallet', doctorAuth, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    await Doctor.findByIdAndUpdate(req.doctorId, { walletAddress });
    res.json({ message: 'Wallet address updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
