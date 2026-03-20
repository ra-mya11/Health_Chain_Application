const { ethers } = require('ethers');

// Smart contract ABI (read-only functions)
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256","name": "_recordId","type": "uint256"}],
    "name": "viewRecordHash",
    "outputs": [{"internalType": "string","name": "","type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "_patientAddress","type": "address"}],
    "name": "getPatientRecords",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_recordId","type": "uint256"}],
    "name": "getRecordDetails",
    "outputs": [
      {"internalType": "address","name": "patient","type": "address"},
      {"internalType": "string","name": "recordType","type": "string"},
      {"internalType": "uint256","name": "timestamp","type": "uint256"},
      {"internalType": "address","name": "uploadedBy","type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

// Initialize provider and contract (read-only)
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Get blockchain record hash
async function getBlockchainRecordHash(recordId) {
  try {
    const hash = await contract.viewRecordHash(recordId);
    return hash;
  } catch (error) {
    console.error('Blockchain read error:', error);
    throw new Error('Failed to read from blockchain');
  }
}

// Get patient's record IDs from blockchain
async function getPatientRecordIds(patientAddress) {
  try {
    const recordIds = await contract.getPatientRecords(patientAddress);
    return recordIds.map(id => id.toString());
  } catch (error) {
    console.error('Blockchain read error:', error);
    throw new Error('Failed to read patient records from blockchain');
  }
}

// Get record details from blockchain
async function getRecordDetails(recordId) {
  try {
    const details = await contract.getRecordDetails(recordId);
    return {
      patient: details[0],
      recordType: details[1],
      timestamp: new Date(Number(details[2]) * 1000),
      uploadedBy: details[3]
    };
  } catch (error) {
    console.error('Blockchain read error:', error);
    throw new Error('Failed to read record details from blockchain');
  }
}

// Verify record integrity
async function verifyRecordIntegrity(recordId, expectedHash) {
  try {
    const blockchainHash = await getBlockchainRecordHash(recordId);
    return blockchainHash === expectedHash;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

module.exports = {
  getBlockchainRecordHash,
  getPatientRecordIds,
  getRecordDetails,
  verifyRecordIntegrity
};
