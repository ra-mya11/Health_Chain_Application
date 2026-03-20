const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  // Record identification
  recordId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Patient and Doctor linkage
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  
  // Record metadata
  recordType: {
    type: String,
    enum: ['lab_report', 'prescription', 'diagnosis', 'scan', 'consultation_notes', 'discharge_summary'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // File storage
  fileURL: {
    type: String,
    required: true
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  
  // Blockchain integration
  ipfsHash: String,
  blockchainHash: {
    type: String,
    required: true,
    unique: true
  },
  blockchainTxHash: String,
  
  // Security
  fileHash: {
    type: String,
    required: true // SHA-256 hash of file
  },
  doctorSignature: String,
  
  // Medical details
  diagnosis: String,
  medications: [String],
  labResults: Object,
  clinicalNotes: String,
  
  // Timestamps
  uploadTimestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  recordDate: Date,
  
  // Immutability flag
  isImmutable: {
    type: Boolean,
    default: true
  },
  
  // Visibility
  isVisible: {
    type: Boolean,
    default: true
  }
});

// Prevent updates after creation (immutable)
medicalRecordSchema.pre('save', function(next) {
  if (!this.isNew && this.isImmutable) {
    return next(new Error('Medical records are immutable and cannot be modified'));
  }
  next();
});

// Index for faster queries
medicalRecordSchema.index({ patientId: 1, uploadTimestamp: -1 });
medicalRecordSchema.index({ doctorId: 1, uploadTimestamp: -1 });
medicalRecordSchema.index({ blockchainHash: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
