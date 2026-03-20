const { ethers } = require('ethers');

// Smart contract ABI for record upload
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "_patientAddress","type": "address"},
      {"internalType": "string","name": "_ipfsHash","type": "string"},
      {"internalType": "string","name": "_recordType","type": "string"}
    ],
    "name": "uploadRecord",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_recordId","type": "uint256"}],
    "name": "viewRecordHash",
    "outputs": [{"internalType": "string","name": "","type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

/**
 * Store record hash on blockchain
 */
async function storeRecordOnBlockchain(patientAddress, ipfsHash, recordType, doctorPrivateKey) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(doctorPrivateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Call smart contract to upload record
    const tx = await contract.uploadRecord(patientAddress, ipfsHash, recordType);
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('Blockchain storage error:', error);
    throw new Error('Failed to store record on blockchain');
  }
}

/**
 * Verify record on blockchain
 */
async function verifyRecordOnBlockchain(recordId) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const hash = await contract.viewRecordHash(recordId);
    return hash;
  } catch (error) {
    console.error('Blockchain verification error:', error);
    throw new Error('Failed to verify record on blockchain');
  }
}

module.exports = {
  storeRecordOnBlockchain,
  verifyRecordOnBlockchain
};
