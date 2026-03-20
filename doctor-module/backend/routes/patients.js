const express = require('express');
const doctorAuth = require('../middleware/doctorAuth');
const axios = require('axios');

const router = express.Router();

// Get assigned patients
router.get('/my-patients', doctorAuth, async (req, res) => {
  try {
    // Query appointments to find unique patients
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ doctorId: req.doctorId })
      .populate('patientId', 'name email phone dateOfBirth gender bloodGroup latestHealthData latestPredictions healthScore')
      .sort({ appointmentDate: -1 });
    
    // Get unique patients
    const patientsMap = new Map();
    appointments.forEach(apt => {
      if (apt.patientId && !patientsMap.has(apt.patientId._id.toString())) {
        patientsMap.set(apt.patientId._id.toString(), apt.patientId);
      }
    });
    
    const patients = Array.from(patientsMap.values());
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient profile with health data
router.get('/:patientId/profile', doctorAuth, async (req, res) => {
  try {
    // This would query Patient collection
    // For now, return mock data structure
    const patient = {
      id: req.params.patientId,
      demographics: {
        name: 'John Doe',
        age: 45,
        gender: 'male',
        bloodGroup: 'O+',
        phone: '1234567890',
        email: 'john@example.com'
      },
      healthParameters: {
        bmi: 28.5,
        glucose: 120,
        bloodPressure: 130,
        cholesterol: 220,
        heartRate: 75
      },
      aiPredictions: {
        diabetes: {
          risk: 'High',
          probability: 0.75
        },
        heartDisease: {
          risk: 'Medium',
          probability: 0.45
        }
      },
      healthScore: {
        overall: 68,
        clinical: 70,
        aiRisk: 65,
        lifestyle: 70
      }
    };
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's AI prediction results
router.get('/:patientId/predictions', doctorAuth, async (req, res) => {
  try {
    const HealthRecord = require('../models/HealthRecord');
    const predictions = await HealthRecord.find({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's medical history
router.get('/:patientId/history', doctorAuth, async (req, res) => {
  try {
    const MedicalRecord = require('../models/MedicalRecord');
    const records = await MedicalRecord.find({
      patientId: req.params.patientId,
      isVisible: true
    })
    .populate('doctorId', 'name specialization')
    .sort({ uploadTimestamp: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
