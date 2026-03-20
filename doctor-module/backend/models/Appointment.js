const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  department: String,
  reason: String,
  symptoms: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  // Doctor's consultation
  consultationNotes: String,
  diagnosis: String,
  prescription: String,
  followUpDate: Date,
  followUpRequired: Boolean,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
