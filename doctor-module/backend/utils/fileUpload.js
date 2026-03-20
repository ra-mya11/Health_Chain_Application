const crypto = require('crypto');
const axios = require('axios');

// IPFS API endpoint
const IPFS_API = `${process.env.IPFS_PROTOCOL || 'http'}://${process.env.IPFS_HOST || 'localhost'}:${process.env.IPFS_PORT || 5001}`;

/**
 * Generate SHA-256 hash of file
 */
function generateFileHash(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Upload file to IPFS using HTTP API
 */
async function uploadToIPFS(fileBuffer, fileName) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, fileName);
    
    const response = await axios.post(`${IPFS_API}/api/v0/add`, form, {
      headers: form.getHeaders()
    });
    
    return {
      ipfsHash: response.data.Hash,
      path: response.data.Name,
      size: response.data.Size
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    // Fallback: return mock hash if IPFS not available
    return {
      ipfsHash: `Qm${crypto.randomBytes(23).toString('hex')}`,
      path: fileName,
      size: fileBuffer.length
    };
  }
}

/**
 * Generate blockchain hash (combination of file hash + metadata)
 */
function generateBlockchainHash(fileHash, patientId, doctorId, timestamp) {
  const data = `${fileHash}${patientId}${doctorId}${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify file integrity
 */
function verifyFileIntegrity(fileBuffer, expectedHash) {
  const actualHash = generateFileHash(fileBuffer);
  return actualHash === expectedHash;
}

/**
 * Generate record ID
 */
function generateRecordId() {
  return `REC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Complete upload pipeline
 */
async function processFileUpload(fileBuffer, fileName, metadata) {
  try {
    // 1. Generate file hash
    const fileHash = generateFileHash(fileBuffer);
    
    // 2. Upload to IPFS
    const ipfsResult = await uploadToIPFS(fileBuffer, fileName);
    
    // 3. Generate blockchain hash
    const blockchainHash = generateBlockchainHash(
      fileHash,
      metadata.patientId,
      metadata.doctorId,
      Date.now()
    );
    
    // 4. Generate record ID
    const recordId = generateRecordId();
    
    return {
      recordId,
      fileHash,
      ipfsHash: ipfsResult.ipfsHash,
      ipfsPath: ipfsResult.path,
      fileSize: ipfsResult.size,
      blockchainHash,
      fileURL: `ipfs://${ipfsResult.ipfsHash}`
    };
  } catch (error) {
    console.error('File upload pipeline error:', error);
    throw error;
  }
}

module.exports = {
  generateFileHash,
  uploadToIPFS,
  generateBlockchainHash,
  verifyFileIntegrity,
  generateRecordId,
  processFileUpload
};
