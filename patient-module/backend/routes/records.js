const express = require('express');
const patientAuth = require('../middleware/patientAuth');
const MedicalRecord = require('../models/MedicalRecord');
const { getBlockchainRecordHash } = require('../utils/blockchain');

const router = express.Router();

// Get all medical records (READ-ONLY)
router.get('/', patientAuth, async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patient: req.patientId,
      isVisible: true
    })
    .populate('uploadedBy', 'name specialization')
    .sort({ recordDate: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single record (READ-ONLY)
router.get('/:id', patientAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patient: req.patientId
    }).populate('uploadedBy', 'name specialization');
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockchain hash for record verification
router.get('/:id/blockchain', patientAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patient: req.patientId
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Get blockchain verification
    const blockchainData = await getBlockchainRecordHash(record.blockchainTxHash);
    
    res.json({
      recordId: record._id,
      ipfsHash: record.ipfsHash,
      blockchainTxHash: record.blockchainTxHash,
      blockchainData,
      uploadedBy: record.uploadedBy,
      uploadedAt: record.uploadedAt,
      verified: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download record file
router.get('/:id/download', patientAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patient: req.patientId
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Return file URL for download
    res.json({
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      ipfsHash: record.ipfsHash,
      mimeType: record.mimeType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTE: NO UPLOAD, UPDATE, OR DELETE ROUTES
// Patients can only VIEW and DOWNLOAD records
// Only doctors can upload records

module.exports = router;
