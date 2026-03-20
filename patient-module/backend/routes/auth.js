const express = require('express');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const patientAuth = require('../middleware/patientAuth');

const router = express.Router();

// Register patient
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, bloodGroup } = req.body;
    
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const patient = new Patient({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup
    });
    
    await patient.save();
    
    const token = jwt.sign(
      { patientId: patient._id },
      process.env.JWT_SECRET || 'patient_secret_key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login patient
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { patientId: patient._id },
      process.env.JWT_SECRET || 'patient_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        healthScore: patient.healthScore
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient profile
router.get('/profile', patientAuth, async (req, res) => {
  try {
    res.json(req.patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient profile
router.patch('/profile', patientAuth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'address', 'emergencyContact', 'preferences'];
    const actualUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        actualUpdates[key] = updates[key];
      }
    });
    
    await Patient.findByIdAndUpdate(req.patientId, actualUpdates);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
