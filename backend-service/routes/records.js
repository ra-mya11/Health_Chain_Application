const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { auth, authorize } = require("../middleware/auth");
const HealthRecord = require("../models/HealthRecord");
const User = require("../models/User");
const { uploadBufferToIPFS, getIPFSGatewayURL, getFileFromIPFS } = require("../utils/ipfs");

const router = express.Router();

// Helper to enrich a record with file access URLs
function enrichRecord(record) {
  const obj = record.toObject ? record.toObject() : record;
  if (obj.ipfsHash) {
    obj.fileAccessURL = getIPFSGatewayURL(obj.ipfsHash);
    obj.storageType = "ipfs";
  } else if (obj.document?.localAccessPath) {
    obj.fileAccessURL = `/api/records/file/${obj.document.savedFilename}`;
    obj.storageType = "local";
  } else {
    obj.fileAccessURL = null;
    obj.storageType = "none";
  }
  obj.fileName = obj.fileName || obj.document?.filename || null;
  obj.uploadedAt = obj.uploadedAt || obj.createdAt || null;
  obj.recordId = obj.recordId || String(obj._id);
  return obj;
}

// ensure upload folder exists (for fallback if IPFS fails)
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// configure multer to store in memory first (will try IPFS, then fallback to disk)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept common medical document formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Upload medical record (with optional file)
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const { 
      patientId, 
      patientEmail,
      doctorId,
      recordType, 
      blockchainTxHash, 
      vitals, 
      notes,
      doctorName,
      hospitalName,
      dateOfRecord,
      tags,
      visibility,
      appointmentId
    } = req.body;
    
    let ipfsHash = null;
    let fileInfo = null;
    let storageMethod = "none";

    // Resolve patient MongoDB _id by email (most reliable cross-system identifier)
    let resolvedPatientId = null;
    if (patientEmail) {
      const patientUser = await User.findOne({ email: patientEmail.toLowerCase().trim() });
      if (patientUser) {
        resolvedPatientId = patientUser._id;
        console.log(`✓ Resolved patient by email: ${patientEmail} -> ${resolvedPatientId}`);
      } else {
        console.warn(`Patient email not found in MongoDB: ${patientEmail}`);
      }
    }
    if (!resolvedPatientId && patientId) {
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        resolvedPatientId = patientId;
      } else {
        const patientUser = await User.findOne({ $or: [{ userId: patientId }, { _id: patientId }] }).catch(() => null);
        if (patientUser) resolvedPatientId = patientUser._id;
        else resolvedPatientId = patientId;
      }
    }
    console.log(`Upload: patientEmail=${patientEmail}, patientId=${patientId}, resolved=${resolvedPatientId}`);

    // Handle file upload
    if (req.file) {
      try {
        // Try IPFS first
        console.log(`Attempting to upload to IPFS: ${req.file.originalname}`);
        ipfsHash = await uploadBufferToIPFS(req.file.buffer, req.file.originalname);
        
        if (ipfsHash) {
          // Successfully uploaded to IPFS
          storageMethod = "ipfs";
          fileInfo = {
            filename: req.file.originalname,
          };
          console.log(`✓ File uploaded to IPFS: ${ipfsHash}`);
        } else {
          // IPFS not available, save to local disk
          console.log(`IPFS unavailable, saving to local storage: ${req.file.originalname}`);
          const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(req.file.originalname);
          const filePath = path.join(uploadDir, uniqueFilename);
          
          fs.writeFileSync(filePath, req.file.buffer);
          
          storageMethod = "local";
          fileInfo = {
            filename: req.file.originalname,
            savedFilename: uniqueFilename,
            path: filePath,
            localAccessPath: `/uploads/${uniqueFilename}`,
          };
          console.log(`✓ File saved locally: ${uniqueFilename}`);
        }
      } catch (error) {
        console.error("Upload error:", error.message);
        // Save locally as ultimate fallback
        const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(req.file.originalname);
        const filePath = path.join(uploadDir, uniqueFilename);
        
        fs.writeFileSync(filePath, req.file.buffer);
        
        storageMethod = "local-fallback";
        fileInfo = {
          filename: req.file.originalname,
          savedFilename: uniqueFilename,
          path: filePath,
          localAccessPath: `/uploads/${uniqueFilename}`,
        };
      }
    }

    const record = new HealthRecord({
      patient: resolvedPatientId ? new mongoose.Types.ObjectId(String(resolvedPatientId)) : req.userId,
      patientEmail: patientEmail ? patientEmail.toLowerCase().trim() : null,
      doctor: doctorId,
      recordType: recordType || "Other",
      ipfsHash: ipfsHash,
      blockchainTxHash,
      vitals,
      notes,
      doctorName,
      hospitalName,
      dateOfRecord,
      tags: tags ? tags.split(",").filter(Boolean) : [],
      visibility: visibility || "PATIENT_ONLY",
      uploadedBy: req.userId,
      fileName: req.file ? req.file.originalname : null,
      document: fileInfo,
      appointmentId: appointmentId || null,
      createdAt: new Date(),
    });

    await record.save();

    res.status(201).json({
      message: `Record uploaded successfully & synced with patient portal (${storageMethod === 'ipfs' ? 'IPFS' : 'Local Storage'})`,
      record: {
        id: record._id,
        ipfsHash: ipfsHash,
        gatewayURL: ipfsHash ? getIPFSGatewayURL(ipfsHash) : null,
        localAccessPath: fileInfo?.localAccessPath || null,
        recordType: record.recordType,
        doctorName: record.doctorName,
        storageMethod: storageMethod,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve locally stored files
router.get("/file/:filename", auth, (req, res) => {
  try {
    const filename = req.params.filename;
    // Prevent directory traversal attacks
    if (filename.includes("..") || filename.includes("/")) {
      return res.status(403).json({ error: "Invalid file" });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all records (doctor/admin use)
router.get("/all", auth, async (req, res) => {
  try {
    const records = await HealthRecord.find()
      .populate("uploadedBy", "name role")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    const enriched = records.map((r) => enrichRecord(r));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get records for a specific patient (doctor view)
router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const query = mongoose.Types.ObjectId.isValid(patientId)
      ? { patient: patientId }
      : { patient: patientId };
    const records = await HealthRecord.find(query)
      .populate("uploadedBy", "name role")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    const enriched = records.map((r) => enrichRecord(r));
    res.json({ records: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download a record file (IPFS or local fallback)
router.get("/download/:hash", auth, async (req, res) => {
  try {
    const { hash } = req.params;
    const fileName = req.query.fileName || "medical-record";

    if (hash.startsWith("Qm") || hash.startsWith("bafy")) {
      try {
        const buffer = await getFileFromIPFS(hash);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/octet-stream");
        return res.send(buffer);
      } catch (e) {
        console.warn("IPFS fetch failed, trying local:", e.message);
      }
    }

    const record = await HealthRecord.findOne({
      $or: [
        { ipfsHash: hash },
        ...(mongoose.Types.ObjectId.isValid(hash) ? [{ _id: hash }] : [])
      ]
    });

    if (record?.document?.savedFilename) {
      const filePath = path.join(uploadDir, record.document.savedFilename);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, record.fileName || fileName);
      }
    }

    res.status(404).json({ error: "File not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient records
router.get("/", auth, async (req, res) => {
  try {
    let records;
    if (req.user.role === "patient") {
      const userId = req.userId;
      const email = req.user.email;
      console.log("Patient query - userId:", userId, "email:", email);

      // Query by patient ObjectId OR patientEmail — covers all upload paths
      records = await HealthRecord.find({
        $or: [
          { patient: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(String(userId)) : userId },
          { patientEmail: { $regex: new RegExp(`^${email}$`, "i") } }
        ]
      })
        .populate("uploadedBy", "name role")
        .populate("doctor", "name specialization")
        .sort({ createdAt: -1 });
    } else if (req.query.patientId) {
      records = await HealthRecord.find({ patient: req.query.patientId })
        .populate("uploadedBy", "name role")
        .populate("doctor", "name specialization")
        .sort({ createdAt: -1 });
    } else {
      records = await HealthRecord.find()
        .populate("uploadedBy", "name role")
        .populate("doctor", "name specialization")
        .sort({ createdAt: -1 });
    }

    const enrichedRecords = records.map((record) => enrichRecord(record));
    console.log("Found records:", enrichedRecords.length);
    res.json(enrichedRecords);
  } catch (error) {
    console.error("Records fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single record
router.get("/:id", auth, async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate("patient", "name email")
      .populate("doctor", "name specialization")
      .populate("uploadedBy", "name role")
      .populate("appointmentId");

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Check access
    if (
      req.user.role === "patient" &&
      record.patient._id.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Add file access URLs
    const enrichedRecord = enrichRecord(record);
    res.json(enrichedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint: Get doctor's uploaded records for a specific patient
router.get("/doctor/uploads/:patientId", auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Convert to ObjectId if valid
    let query = { doctor: req.userId };
    
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      query.patient = patientId;
    } else {
      // Try to match as string in case patientId is not a valid ObjectId
      query.$or = [
        { patient: patientId },
        { patientId: patientId }
      ];
    }
    
    const records = await HealthRecord.find(query)
      .populate("patient", "name email id userId")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    
    res.json({
      message: `Found ${records.length} records for patient ${ patientId}`,
      recordCount: records.length,
      records: records.map(r => ({
        id: r._id,
        patient: {
          id: r.patient?._id,
          name: r.patient?.name,
          email: r.patient?.email,
        },
        doctorName: r.doctorName,
        recordType: r.recordType,
        createdAt: r.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grant access (placeholder - actual implementation in smart contract)
router.post("/grant-access", auth, authorize("patient"), async (req, res) => {
  try {
    const { recordId, doctorAddress } = req.body;

    // This would interact with the blockchain smart contract
    // For now, just return success

    res.json({
      message: "Access granted successfully",
      recordId,
      doctorAddress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revoke access (placeholder - actual implementation in smart contract)
router.post("/revoke-access", auth, authorize("patient"), async (req, res) => {
  try {
    const { recordId, doctorAddress } = req.body;

    // This would interact with the blockchain smart contract

    res.json({
      message: "Access revoked successfully",
      recordId,
      doctorAddress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG endpoint: Get all records with patient info (for testing only, remove in production)
router.get("/test/all-records-debug", auth, async (req, res) => {
  try {
    const records = await HealthRecord.find()
      .populate("patient", "name email _id userId")
      .populate("doctor", "name")
      .select("patient doctor recordType doctorName createdAt")
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      total: records.length,
      records: records.map(r => ({
        id: r._id,
        patientId: r.patient?._id,
        patientName: r.patient?.name,
        patientEmail: r.patient?.email,
        doctorName: r.doctorName,
        recordType: r.recordType,
        createdAt: r.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: show all records with their patient field and patientEmail
router.get("/debug/all", async (req, res) => {
  try {
    const records = await HealthRecord.find().sort({ createdAt: -1 }).limit(20);
    res.json(records.map(r => ({
      id: r._id,
      patient: r.patient,
      patientEmail: r.patientEmail,
      visibility: r.visibility,
      recordType: r.recordType,
      doctorName: r.doctorName,
      createdAt: r.createdAt,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// One-time migration: fix all existing records — resolve patient by patientEmail
router.post("/migrate-patient-ids", async (req, res) => {
  try {
    const records = await HealthRecord.find();
    let fixed = 0;
    for (const record of records) {
      if (record.patientEmail) {
        const user = await User.findOne({ email: record.patientEmail.toLowerCase().trim() });
        if (user && String(record.patient) !== String(user._id)) {
          record.patient = user._id;
          await record.save();
          fixed++;
          console.log(`Fixed record ${record._id}: patient -> ${user._id} (${user.email})`);
        }
      }
    }
    res.json({ message: `Migration complete. Fixed ${fixed} of ${records.length} records.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
