const express = require('express');
const patientAuth = require('../middleware/patientAuth');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Get available doctors by department
router.get('/doctors', patientAuth, async (req, res) => {
  try {
    const { department, date } = req.query;
    
    // This would query Doctor collection
    // For now, returning mock data
    const doctors = [
      {
        _id: '1',
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        experience: '15 years',
        rating: 4.8,
        availableSlots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM']
      },
      {
        _id: '2',
        name: 'Dr. Michael Chen',
        specialization: 'Endocrinology',
        experience: '12 years',
        rating: 4.9,
        availableSlots: ['10:00 AM', '11:00 AM', '03:00 PM', '04:00 PM']
      },
      {
        _id: '3',
        name: 'Dr. Emily Rodriguez',
        specialization: 'General Medicine',
        experience: '10 years',
        rating: 4.7,
        availableSlots: ['09:00 AM', '11:00 AM', '01:00 PM', '04:00 PM']
      }
    ];
    
    const filtered = department 
      ? doctors.filter(d => d.specialization === department)
      : doctors;
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book appointment
router.post('/book', patientAuth, async (req, res) => {
  try {
    const { doctorId, department, appointmentDate, timeSlot, reason, symptoms } = req.body;
    
    // Check if slot is already booked
    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: 'scheduled'
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Time slot not available' });
    }
    
    const appointment = new Appointment({
      patient: req.patientId,
      doctor: doctorId,
      department,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      reason,
      symptoms
    });
    
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's appointments
router.get('/my-appointments', patientAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.patientId })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
router.patch('/:id/cancel', patientAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.patientId
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cannot cancel this appointment' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
