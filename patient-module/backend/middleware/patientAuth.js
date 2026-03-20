const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const patientAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patient_secret_key');
    const patient = await Patient.findById(decoded.patientId).select('-password');
    
    if (!patient) {
      return res.status(401).json({ error: 'Patient not found' });
    }
    
    req.patient = patient;
    req.patientId = patient._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = patientAuth;
