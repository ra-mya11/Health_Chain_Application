const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  // Uploaded by doctor only
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  recordType: {
    type: String,
    enum: ['lab_report', 'prescription', 'diagnosis', 'scan', 'consultation_notes'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  // Blockchain integration
  ipfsHash: {
    type: String,
    required: true
  },
  blockchainTxHash: {
    type: String,
    required: true
  },
  // File metadata
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  // Medical data
  diagnosis: String,
  medications: [String],
  notes: String,
  // Timestamps
  recordDate: {
    type: Date,
    default: Date.now
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // Access control - patient can only view
  isVisible: {
    type: Boolean,
    default: true
  }
});

// Index for faster queries
medicalRecordSchema.index({ patient: 1, recordDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
