const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Try to import FormData, fallback if not available
let FormData;
try {
  FormData = require('form-data');
} catch (e) {
  console.warn('form-data not installed, IPFS uploads will be disabled');
}

// IPFS HTTP API endpoint (Kubo)
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

/**
 * Check if IPFS node is running
 * @returns {Promise<boolean>}
 */
async function isIPFSRunning() {
  try {
    const response = await axios.get(`${IPFS_API_URL}/api/v0/version`, {
      timeout: 2000,
    });
    return !!response.data.Version;
  } catch (error) {
    return false;
  }
}

/**
 * Upload a file to IPFS
 * @param {string} filePath - Path to the file to upload
 * @param {string} fileName - Name of the file (optional)
 * @returns {Promise<string>} - IPFS hash (CID) or null if failed
 */
async function uploadFileToIPFS(filePath, fileName = null) {
  try {
    if (!FormData) {
      console.warn('form-data not available, skipping IPFS upload');
      return null;
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ipfsRunning = await isIPFSRunning();
    if (!ipfsRunning) {
      console.warn('IPFS daemon not running, using local storage as fallback');
      return null;
    }

    const fileStream = fs.createReadStream(filePath);
    const form = new FormData();
    form.append('file', fileStream, fileName || path.basename(filePath));

    console.log(`Uploading to IPFS: ${fileName || filePath}`);

    const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const ipfsHash = response.data.Hash;
    console.log(`✓ File uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.warn('IPFS upload failed, will use local storage:', error.message);
    return null;
  }
}

/**
 * Upload file buffer to IPFS
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Name of the file
 * @returns {Promise<string>} - IPFS hash (CID) or null if failed
 */
async function uploadBufferToIPFS(buffer, fileName) {
  try {
    if (!FormData) {
      console.warn('form-data not available, skipping IPFS upload');
      return null;
    }

    const ipfsRunning = await isIPFSRunning();
    if (!ipfsRunning) {
      console.warn('IPFS daemon not running, using local storage as fallback');
      return null;
    }

    const form = new FormData();
    form.append('file', buffer, fileName);

    console.log(`Uploading buffer to IPFS: ${fileName}`);

    const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const ipfsHash = response.data.Hash;
    console.log(`✓ File uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.warn('IPFS upload failed, will use local storage:', error.message);
    return null;
  }
}

/**
 * Get IPFS file content
 * @param {string} hash - IPFS hash (CID)
 * @returns {Promise<Buffer>} - File content as buffer
 */
async function getFileFromIPFS(hash) {
  try {
    console.log(`Fetching from IPFS: ${hash}`);

    const response = await axios.get(`${IPFS_API_URL}/api/v0/cat?arg=${hash}`, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('IPFS fetch error:', error.message);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
}

/**
 * Generate public IPFS gateway URL
 * @param {string} hash - IPFS hash (CID)
 * @param {string} fileName - File name (optional)
 * @returns {string} - Public IPFS gateway URL
 */
function getIPFSGatewayURL(hash, fileName = null) {
  if (!hash) return null;
  
  // Local IPFS gateway
  const localURL = 'http://127.0.0.1:8090/ipfs';
  const url = `${localURL}/${hash}`;
  return fileName ? `${url}/${fileName}` : url;
}

module.exports = {
  uploadFileToIPFS,
  uploadBufferToIPFS,
  getFileFromIPFS,
  getIPFSGatewayURL,
  isIPFSRunning,
};