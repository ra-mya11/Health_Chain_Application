import Web3 from 'web3';

// Contract ABI (simplified - add full ABI after deployment)
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address","name": "_userAddress","type": "address"},{"internalType": "uint8","name": "_role","type": "uint8"},{"internalType": "string","name": "_name","type": "string"}],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "_patientAddress","type": "address"},{"internalType": "string","name": "_ipfsHash","type": "string"},{"internalType": "string","name": "_recordType","type": "string"}],
    "name": "uploadRecord",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_recordId","type": "uint256"},{"internalType": "address","name": "_doctorAddress","type": "address"}],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_recordId","type": "uint256"},{"internalType": "address","name": "_doctorAddress","type": "address"}],
    "name": "revokeAccess",
    "outputs": [],
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

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = process.env.REACT_APP_BLOCKCHAIN_RPC || 'http://localhost:8545';

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
  }

  async init() {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        return true;
      } else {
        // Fallback to local RPC
        this.web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        return false;
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      throw error;
    }
  }

  async uploadRecord(patientAddress, ipfsHash, recordType) {
    try {
      const result = await this.contract.methods
        .uploadRecord(patientAddress, ipfsHash, recordType)
        .send({ from: this.account });
      return result;
    } catch (error) {
      console.error('Upload record error:', error);
      throw error;
    }
  }

  async grantAccess(recordId, doctorAddress) {
    try {
      const result = await this.contract.methods
        .grantAccess(recordId, doctorAddress)
        .send({ from: this.account });
      return result;
    } catch (error) {
      console.error('Grant access error:', error);
      throw error;
    }
  }

  async revokeAccess(recordId, doctorAddress) {
    try {
      const result = await this.contract.methods
        .revokeAccess(recordId, doctorAddress)
        .send({ from: this.account });
      return result;
    } catch (error) {
      console.error('Revoke access error:', error);
      throw error;
    }
  }

  async viewRecordHash(recordId) {
    try {
      const hash = await this.contract.methods
        .viewRecordHash(recordId)
        .call({ from: this.account });
      return hash;
    } catch (error) {
      console.error('View record error:', error);
      throw error;
    }
  }

  async getAccount() {
    if (!this.account) {
      const accounts = await this.web3.eth.getAccounts();
      this.account = accounts[0];
    }
    return this.account;
  }
}

export default new BlockchainService();
