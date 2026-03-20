const mongoose = require("mongoose");

const healthRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recordType: {
    type: String,
    enum: [
      "lab_report",
      "prescription",
      "diagnosis",
      "ai_prediction",
      "vitals",
    ],
    required: true,
  },
  ipfsHash: String,
  blockchainTxHash: String,

  // Vitals
  vitals: {
    glucose: Number,
    bmi: Number,
    bloodPressure: Number,
    cholesterol: Number,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
  },

  // AI Predictions
  predictions: {
    diabetes: {
      prediction: Number,
      probability: Number,
      riskLevel: String,
    },
    heartDisease: {
      prediction: Number,
      probability: Number,
      riskLevel: String,
    },
  },

  // Health Score
  healthScore: {
    overall: Number,
    clinical: Number,
    aiRisk: Number,
    lifestyle: Number,
  },

  // Recommendations
  recommendations: {
    department: String,
    diet: [String],
    exercise: [String],
    medications: [String],
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  notes: String,

  // uploaded document info (filename + path)
  document: {
    filename: String,
    path: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
