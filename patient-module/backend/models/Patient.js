const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: String,
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  // Latest health metrics
  latestHealthData: {
    age: Number,
    bmi: Number,
    glucose: Number,
    bloodPressure: Number,
    cholesterol: Number,
    heartRate: Number,
    weight: Number,
    height: Number
  },
  // Latest AI predictions
  latestPredictions: {
    diabetes: {
      risk: String,
      probability: Number,
      date: Date
    },
    heartDisease: {
      risk: String,
      probability: Number,
      date: Date
    }
  },
  // Health score
  healthScore: {
    overall: Number,
    clinical: Number,
    aiRisk: Number,
    lifestyle: Number,
    lastUpdated: Date
  },
  // Preferences
  preferences: {
    dietaryRestrictions: [String],
    exerciseLevel: String,
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Patient', patientSchema);
