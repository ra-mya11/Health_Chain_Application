const express = require('express');
const axios = require('axios');
const patientAuth = require('../middleware/patientAuth');
const HealthRecord = require('../models/HealthRecord');
const Patient = require('../models/Patient');
const { calculateHealthScore, getDietPlan, getExercisePlan } = require('../controllers/recommendations');

const router = express.Router();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Submit health data and get AI prediction
router.post('/predict', patientAuth, async (req, res) => {
  try {
    const { age, bmi, glucose, bloodPressure, cholesterol, heartRate, weight, height } = req.body;
    
    // Call ML service
    const mlResponse = await axios.post(`${ML_API_URL}/predict`, {
      Age: age,
      BMI: bmi,
      BloodPressure: bloodPressure,
      Cholesterol: cholesterol,
      Glucose: glucose,
      Sex: req.patient.gender === 'male' ? 1 : 0
    });
    
    const predictions = mlResponse.data;
    
    // Calculate health score
    const healthScore = calculateHealthScore(predictions, { bmi, bloodPressure, cholesterol });
    
    // Get recommendations
    const dietPlan = getDietPlan(predictions);
    const exercisePlan = getExercisePlan(predictions, bmi);
    
    // Save health record
    const healthRecord = new HealthRecord({
      patient: req.patientId,
      vitals: { age, bmi, glucose, bloodPressure, cholesterol, heartRate, weight, height },
      predictions: {
        diabetes: predictions.diabetes,
        heartDisease: predictions.heart_disease
      },
      healthScore,
      recommendations: {
        department: predictions.recommendations.department,
        priority: predictions.recommendations.priority,
        diet: dietPlan,
        exercise: exercisePlan
      }
    });
    
    await healthRecord.save();
    
    // Update patient's latest data
    await Patient.findByIdAndUpdate(req.patientId, {
      latestHealthData: { age, bmi, glucose, bloodPressure, cholesterol, heartRate, weight, height },
      latestPredictions: {
        diabetes: {
          risk: predictions.diabetes.risk_level,
          probability: predictions.diabetes.probability,
          date: new Date()
        },
        heartDisease: {
          risk: predictions.heart_disease.risk_level,
          probability: predictions.heart_disease.probability,
          date: new Date()
        }
      },
      healthScore: {
        ...healthScore,
        lastUpdated: new Date()
      }
    });
    
    res.json({
      predictions,
      healthScore,
      recommendations: {
        department: predictions.recommendations.department,
        priority: predictions.recommendations.priority,
        diet: dietPlan,
        exercise: exercisePlan
      },
      recordId: healthRecord._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Prediction failed', details: error.message });
  }
});

// Get health score
router.get('/score', patientAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId);
    
    if (!patient.healthScore || !patient.healthScore.overall) {
      return res.status(404).json({ error: 'No health score available. Please submit health data first.' });
    }
    
    res.json({
      healthScore: patient.healthScore,
      predictions: patient.latestPredictions,
      lastUpdated: patient.healthScore.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health history
router.get('/history', patientAuth, async (req, res) => {
  try {
    const records = await HealthRecord.find({ patient: req.patientId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations
router.get('/recommendations', patientAuth, async (req, res) => {
  try {
    const latestRecord = await HealthRecord.findOne({ patient: req.patientId })
      .sort({ createdAt: -1 });
    
    if (!latestRecord) {
      return res.status(404).json({ error: 'No recommendations available' });
    }
    
    res.json(latestRecord.recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
