const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

const router = express.Router();

// Get available doctors
router.get('/doctors/available', auth, async (req, res) => {
  try {
    const { department, date } = req.query;
    
    let query = { role: 'doctor' };
    if (department) {
      query.specialization = department;
    }
    
    const doctors = await User.find(query).select('-password');
    
    // Get booked slots for the date
    if (date) {
      const appointments = await Appointment.find({
        date: new Date(date),
        status: 'scheduled'
      });
      
      const bookedSlots = {};
      appointments.forEach(apt => {
        if (!bookedSlots[apt.doctor.toString()]) {
          bookedSlots[apt.doctor.toString()] = [];
        }
        bookedSlots[apt.doctor.toString()].push(apt.timeSlot);
      });
      
      // Filter available slots
      doctors.forEach(doctor => {
        if (doctor.availability && doctor.availability.length > 0) {
          const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
          const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
          
          if (dayAvailability) {
            const booked = bookedSlots[doctor._id.toString()] || [];
            doctor.availableSlots = dayAvailability.slots.filter(slot => !booked.includes(slot));
          }
        }
      });
    }
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book appointment
router.post('/book', auth, authorize('patient'), async (req, res) => {
  try {
    const { doctorId, date, timeSlot, department, reason } = req.body;
    
    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      timeSlot,
      status: 'scheduled'
    });
    
    if (existingAppointment) {
      return res.status(400).json({ error: 'Time slot not available' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: req.userId,
      doctor: doctorId,
      date: new Date(date),
      timeSlot,
      department,
      reason
    });
    
    await appointment.save();
    await appointment.populate('doctor', 'name specialization');
    
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.userId
    })
    .populate('doctor', 'name specialization phone')
    .sort({ date: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor appointments
router.get('/doctor-appointments', auth, authorize('doctor'), async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.userId
    })
    .populate('patient', 'name phone email _id')
    .sort({ date: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes, prescription } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check authorization
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;
    
    await appointment.save();
    
    res.json({ message: 'Appointment updated', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel/Clear appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    console.log("Attempting to delete appointment:", appointmentId);
    console.log("Doctor ID from token:", req.userId);
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      console.log("Appointment not found");
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    console.log("Appointment doctor:", appointment.doctor.toString());
    console.log("Appointment patient:", appointment.patient.toString());
    
    // Allow both patient and doctor to delete/clear the appointment
    const isPatient = appointment.patient.toString() === req.userId.toString();
    const isDoctor = appointment.doctor.toString() === req.userId.toString();
    
    console.log("Is Patient:", isPatient, "Is Doctor:", isDoctor);
    
    if (!isPatient && !isDoctor) {
      console.log("Access denied - not patient or doctor");
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Completely delete the appointment record
    await Appointment.findByIdAndDelete(appointmentId);
    console.log("Appointment deleted successfully");
    
    res.json({ message: 'Appointment cleared successfully' });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
