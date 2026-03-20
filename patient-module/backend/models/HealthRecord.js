const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  // Health parameters
  vitals: {
    age: Number,
    bmi: Number,
    glucose: Number,
    bloodPressure: Number,
    cholesterol: Number,
    heartRate: Number,
    weight: Number,
    height: Number,
    temperature: Number
  },
  // AI predictions
  predictions: {
    diabetes: {
      prediction: Number,
      probability: Number,
      riskLevel: String,
      featureImportance: Object
    },
    heartDisease: {
      prediction: Number,
      probability: Number,
      riskLevel: String,
      featureImportance: Object
    }
  },
  // Health score
  healthScore: {
    overall: Number,
    clinical: Number,
    aiRisk: Number,
    lifestyle: Number
  },
  // Recommendations
  recommendations: {
    department: String,
    priority: String,
    diet: [String],
    exercise: [String],
    lifestyle: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
