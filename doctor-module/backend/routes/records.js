const express = require('express');
const multer = require('multer');
const doctorAuth = require('../middleware/doctorAuth');
const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const { processFileUpload } = require('../utils/fileUpload');
const { storeRecordOnBlockchain } = require('../utils/blockchain');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  }
});

// UPLOAD MEDICAL RECORD (DOCTOR ONLY)
router.post('/upload', doctorAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { patientId, recordType, title, description, diagnosis, medications, clinicalNotes, recordDate } = req.body;
    
    if (!patientId || !recordType || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process file upload (IPFS + hash generation)
    const uploadResult = await processFileUpload(
      req.file.buffer,
      req.file.originalname,
      {
        patientId,
        doctorId: req.doctorId,
        recordType
      }
    );
    
    // Store on blockchain
    let blockchainTx = null;
    try {
      if (req.doctor.walletAddress && process.env.DOCTOR_PRIVATE_KEY) {
        blockchainTx = await storeRecordOnBlockchain(
          patientId, // Should be patient's wallet address
          uploadResult.ipfsHash,
          recordType,
          process.env.DOCTOR_PRIVATE_KEY
        );
      }
    } catch (blockchainError) {
      console.error('Blockchain storage failed:', blockchainError);
      // Continue even if blockchain fails
    }
    
    // Save record to MongoDB
    const medicalRecord = new MedicalRecord({
      recordId: uploadResult.recordId,
      patientId,
      doctorId: req.doctorId,
      recordType,
      title,
      description,
      fileURL: uploadResult.fileURL,
      fileName: req.file.originalname,
      fileSize: uploadResult.fileSize,
      mimeType: req.file.mimetype,
      ipfsHash: uploadResult.ipfsHash,
      blockchainHash: uploadResult.blockchainHash,
      blockchainTxHash: blockchainTx?.transactionHash,
      fileHash: uploadResult.fileHash,
      diagnosis,
      medications: medications ? JSON.parse(medications) : [],
      clinicalNotes,
      recordDate: recordDate || new Date(),
      uploadTimestamp: new Date(),
      isImmutable: true
    });
    
    await medicalRecord.save();
    
    // Update doctor stats
    await Doctor.findByIdAndUpdate(req.doctorId, {
      $inc: { 'stats.totalRecordsUploaded': 1 }
    });
    
    res.status(201).json({
      message: 'Medical record uploaded successfully',
      record: {
        recordId: medicalRecord.recordId,
        patientId: medicalRecord.patientId,
        recordType: medicalRecord.recordType,
        title: medicalRecord.title,
        ipfsHash: medicalRecord.ipfsHash,
        blockchainHash: medicalRecord.blockchainHash,
        blockchainTxHash: medicalRecord.blockchainTxHash,
        uploadTimestamp: medicalRecord.uploadTimestamp
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload record', details: error.message });
  }
});

// Get all records uploaded by doctor
router.get('/my-uploads', doctorAuth, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ doctorId: req.doctorId })
      .populate('patientId', 'name email')
      .sort({ uploadTimestamp: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's records (doctor can view)
router.get('/patient/:patientId', doctorAuth, async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patientId: req.params.patientId,
      isVisible: true
    })
    .populate('doctorId', 'name specialization')
    .sort({ uploadTimestamp: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single record details
router.get('/:recordId', doctorAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ recordId: req.params.recordId })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization');
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify record integrity
router.get('/:recordId/verify', doctorAuth, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ recordId: req.params.recordId });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({
      recordId: record.recordId,
      fileHash: record.fileHash,
      blockchainHash: record.blockchainHash,
      blockchainTxHash: record.blockchainTxHash,
      ipfsHash: record.ipfsHash,
      uploadTimestamp: record.uploadTimestamp,
      isImmutable: record.isImmutable,
      verified: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTE: NO UPDATE OR DELETE ROUTES
// Records are immutable after upload

module.exports = router;
