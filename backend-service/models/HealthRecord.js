const mongoose = require("mongoose");

const healthRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recordType: {
    type: String,
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

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  notes: String,

  // Doctor metadata
  doctorName: String,
  hospitalName: String,
  dateOfRecord: Date,

  // Record metadata
  tags: [String],
  visibility: {
    type: String,
    enum: ["DOCTOR_ONLY", "PATIENT_ONLY", "PUBLIC"],
    default: "PATIENT_ONLY",
  },

  // Appointment linking
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    sparse: true,
  },

  // uploaded document info
  fileName: String,
  patientEmail: String,
  document: {
    filename: String,
    savedFilename: String,
    path: String,
    localAccessPath: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
