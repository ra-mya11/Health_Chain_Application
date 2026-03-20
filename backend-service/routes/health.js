const express = require("express");
const axios = require("axios");
const { auth } = require("../middleware/auth");
const HealthRecord = require("../models/HealthRecord");
const {
  calculateHealthScore,
  getDietRecommendations,
  getExerciseRecommendations,
} = require("../controllers/recommendations");

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Get AI prediction
router.post("/predict", auth, async (req, res) => {
  try {
    const {
      Age,
      BMI,
      BloodPressure,
      Cholesterol,
      Glucose,
      Sex,
      Insulin,
      SkinThickness,
      DiabetesPedigreeFunction,
      Pregnancies,
      ChestPainType,
      FastingBS,
      MaxHR,
      ExerciseAngina,
      Oldpeak,
      ST_Slope,
    } = req.body;

    // Validate required fields
    if (!Age || !BMI || !BloodPressure || !Cholesterol || !Glucose) {
      return res.status(400).json({
        error:
          "Missing required fields: Age, BMI, BloodPressure, Cholesterol, Glucose",
      });
    }

    // Call ML service with all required fields
    const mlPayload = {
      Age: parseInt(Age),
      BMI: parseFloat(BMI),
      BloodPressure: parseFloat(BloodPressure),
      Cholesterol: parseFloat(Cholesterol),
      Glucose: parseFloat(Glucose),
      Sex: Sex ? parseInt(Sex) : 0,
      Insulin: Insulin ? parseFloat(Insulin) : 0,
      SkinThickness: SkinThickness ? parseFloat(SkinThickness) : 20,
      DiabetesPedigreeFunction: DiabetesPedigreeFunction
        ? parseFloat(DiabetesPedigreeFunction)
        : 0.5,
      Pregnancies: Pregnancies ? parseInt(Pregnancies) : 0,
      ChestPainType: ChestPainType ? parseInt(ChestPainType) : 0,
      FastingBS: FastingBS ? parseInt(FastingBS) : 0,
      MaxHR: MaxHR ? parseFloat(MaxHR) : 150,
      ExerciseAngina: ExerciseAngina ? parseInt(ExerciseAngina) : 0,
      Oldpeak: Oldpeak ? parseFloat(Oldpeak) : 0,
      ST_Slope: ST_Slope ? parseInt(ST_Slope) : 1,
    };

    console.log("Calling ML service with payload:", mlPayload);
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, mlPayload);

    const predictions = response.data;

    // Calculate health score
    const healthScore = calculateHealthScore(predictions, {
      BMI,
      BloodPressure,
      Cholesterol,
    });

    // Get recommendations
    const dietPlan = getDietRecommendations(predictions);
    const exercisePlan = getExerciseRecommendations(predictions, BMI);

    // Save health record
    const healthRecord = new HealthRecord({
      patient: req.userId,
      recordType: "ai_prediction",
      vitals: {
        glucose: Glucose,
        bmi: BMI,
        bloodPressure: BloodPressure,
        cholesterol: Cholesterol,
      },
      predictions: {
        diabetes: predictions.diabetes,
        heartDisease: predictions.heart_disease,
      },
      healthScore,
      recommendations: {
        department: predictions.recommendations.department,
        diet: dietPlan,
        exercise: exercisePlan,
      },
    });

    await healthRecord.save();

    res.json({
      predictions,
      healthScore,
      recommendations: {
        department: predictions.recommendations.department,
        diet: dietPlan,
        exercise: exercisePlan,
      },
      recordId: healthRecord._id,
    });
  } catch (error) {
    console.error("Prediction error:", error.message);
    console.error("ML Service URL:", ML_SERVICE_URL);
    res
      .status(500)
      .json({ error: "Failed to get prediction", details: error.message });
  }
});

// Get health score
router.get("/score", auth, async (req, res) => {
  try {
    const latestRecord = await HealthRecord.findOne({
      patient: req.userId,
      recordType: "ai_prediction",
    }).sort({ createdAt: -1 });

    if (!latestRecord) {
      return res.status(404).json({ error: "No health data found" });
    }

    res.json({
      healthScore: latestRecord.healthScore,
      predictions: latestRecord.predictions,
      date: latestRecord.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health history
router.get("/history", auth, async (req, res) => {
  try {
    const records = await HealthRecord.find({
      patient: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations
router.get("/recommendations", auth, async (req, res) => {
  try {
    const latestRecord = await HealthRecord.findOne({
      patient: req.userId,
      recordType: "ai_prediction",
    }).sort({ createdAt: -1 });

    if (!latestRecord) {
      return res.status(404).json({ error: "No health data found" });
    }

    res.json(latestRecord.recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
