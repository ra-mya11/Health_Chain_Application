const express = require('express');
const doctorAuth = require('../middleware/doctorAuth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Get doctor's appointments
router.get('/my-appointments', doctorAuth, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    let query = { doctorId: req.doctorId };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .sort({ appointmentDate: 1, timeSlot: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve appointment
router.patch('/:id/approve', doctorAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = 'approved';
    appointment.updatedAt = new Date();
    await appointment.save();
    
    res.json({ message: 'Appointment approved', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject appointment
router.patch('/:id/reject', doctorAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = 'rejected';
    appointment.consultationNotes = reason;
    appointment.updatedAt = new Date();
    await appointment.save();
    
    res.json({ message: 'Appointment rejected', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete appointment with consultation notes
router.patch('/:id/complete', doctorAuth, async (req, res) => {
  try {
    const { consultationNotes, diagnosis, prescription, followUpDate, followUpRequired } = req.body;
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = 'completed';
    appointment.consultationNotes = consultationNotes;
    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription;
    appointment.followUpDate = followUpDate;
    appointment.followUpRequired = followUpRequired;
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    // Update doctor stats
    await Doctor.findByIdAndUpdate(req.doctorId, {
      $inc: { 'stats.totalAppointments': 1 }
    });
    
    res.json({ message: 'Appointment completed', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment details
router.get('/:id', doctorAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.doctorId
    }).populate('patientId', 'name email phone dateOfBirth gender');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
