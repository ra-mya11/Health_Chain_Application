const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const doctorAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'doctor_secret_key');
    
    // Verify role is doctor
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor role required.' });
    }
    
    const doctor = await Doctor.findById(decoded.doctorId).select('-password');
    
    if (!doctor || !doctor.isActive) {
      return res.status(401).json({ error: 'Doctor account not found or inactive' });
    }
    
    req.doctor = doctor;
    req.doctorId = doctor._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = doctorAuth;
