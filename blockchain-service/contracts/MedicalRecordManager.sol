// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecordManager
 * @dev Advanced blockchain-based medical record management system
 * Features: Immutable storage, access control, audit trails, verification
 */
contract MedicalRecordManager {
    
    // ============ Data Structures ============
    
    enum RecordStatus { ACTIVE, ARCHIVED, REVOKED }
    
    struct MedicalRecord {
        string recordId;
        string ipfsHash;
        string patientId;
        string doctorId;
        uint256 timestamp;
        uint256 expiresAt;
        string recordType;
        RecordStatus status;
        bytes32 hashVerification;
        bool exists;
    }
    
    struct AccessControl {
        address patientAddress;
        address doctorAddress;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    struct AuditLog {
        uint256 timestamp;
        string action;
        string actor;
        string details;
    }
    
    // ============ State Variables ============
    
    mapping(string => MedicalRecord) public records;
    mapping(string => string[]) public patientRecords;
    mapping(string => AccessControl[]) public recordAccessLogs;
    mapping(string => AuditLog[]) private auditTrail;
    
    address public contractOwner;
    uint256 public totalRecords;
    uint256 public recordExpirationDays = 2555; // ~7 years default
    
    // ============ Events ============
    
    event RecordAdded(
        string indexed recordId,
        string indexed patientId,
        string ipfsHash,
        string recordType,
        uint256 timestamp
    );
    
    event RecordVerified(
        string indexed recordId,
        bool isValid,
        uint256 timestamp
    );
    
    event AccessGranted(
        string indexed recordId,
        string indexed patientId,
        string indexed doctorId,
        uint256 timestamp
    );
    
    event AccessRevoked(
        string indexed recordId,
        string indexed doctorId,
        uint256 timestamp
    );
    
    event RecordArchived(
        string indexed recordId,
        uint256 timestamp
    );
    
    event AuditLogCreated(
        string indexed recordId,
        string action,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only contract owner can perform this action");
        _;
    }
    
    modifier recordExists(string memory recordId) {
        require(records[recordId].exists, "Record does not exist");
        _;
    }
    
    modifier recordActive(string memory recordId) {
        require(records[recordId].status == RecordStatus.ACTIVE, "Record is not active");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        contractOwner = msg.sender;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Add a new medical record to blockchain
     * @param recordId Unique record identifier
     * @param ipfsHash IPFS hash of the medical document
     * @param patientId Patient identifier
     * @param doctorId Doctor identifier
     * @param recordType Type of medical record (lab_report, prescription, etc.)
     */
    function addRecord(
        string memory recordId,
        string memory ipfsHash,
        string memory patientId,
        string memory doctorId,
        string memory recordType
    ) public returns (bool) {
        require(!records[recordId].exists, "Record already exists");
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        
        uint256 expiresAt = block.timestamp + (recordExpirationDays * 1 days);
        bytes32 hashVerification = keccak256(abi.encodePacked(ipfsHash));
        
        records[recordId] = MedicalRecord({
            recordId: recordId,
            ipfsHash: ipfsHash,
            patientId: patientId,
            doctorId: doctorId,
            timestamp: block.timestamp,
            expiresAt: expiresAt,
            recordType: recordType,
            status: RecordStatus.ACTIVE,
            hashVerification: hashVerification,
            exists: true
        });
        
        patientRecords[patientId].push(recordId);
        totalRecords++;
        
        _addAuditLog(recordId, "RECORD_CREATED", doctorId, recordType);
        
        emit RecordAdded(recordId, patientId, ipfsHash, recordType, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Verify record integrity by comparing hash
     * @param recordId Record identifier
     * @param ipfsHash IPFS hash to verify against
     */
    function verifyRecord(string memory recordId, string memory ipfsHash)
        public
        recordExists(recordId)
        returns (bool)
    {
        MedicalRecord storage record = records[recordId];
        bytes32 providedHash = keccak256(abi.encodePacked(ipfsHash));
        bool isValid = record.hashVerification == providedHash;
        
        _addAuditLog(recordId, "RECORD_VERIFIED", "system", isValid ? "VALID" : "INVALID");
        
        emit RecordVerified(recordId, isValid, block.timestamp);
        
        return isValid;
    }
    
    /**
     * @dev Get record details
     * @param recordId Record identifier
     */
    function getRecord(string memory recordId)
        public
        view
        recordExists(recordId)
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            string memory
        )
    {
        MedicalRecord memory record = records[recordId];
        return (
            record.ipfsHash,
            record.patientId,
            record.doctorId,
            record.recordType,
            record.timestamp,
            record.expiresAt,
            record.status == RecordStatus.ACTIVE ? "ACTIVE" : record.status == RecordStatus.ARCHIVED ? "ARCHIVED" : "REVOKED"
        );
    }
    
    /**
     * @dev Get all record IDs for a patient
     * @param patientId Patient identifier
     */
    function getPatientRecords(string memory patientId)
        public
        view
        returns (string[] memory)
    {
        return patientRecords[patientId];
    }
    
    /**
     * @dev Get patient record count
     */
    function getPatientRecordCount(string memory patientId)
        public
        view
        returns (uint256)
    {
        return patientRecords[patientId].length;
    }
    
    /**
     * @dev Archive a record
     * @param recordId Record identifier
     */
    function archiveRecord(string memory recordId)
        public
        recordExists(recordId)
        recordActive(recordId)
        returns (bool)
    {
        records[recordId].status = RecordStatus.ARCHIVED;
        _addAuditLog(recordId, "RECORD_ARCHIVED", "system", "Record archived");
        
        emit RecordArchived(recordId, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Revoke a record
     * @param recordId Record identifier
     */
    function revokeRecord(string memory recordId)
        public
        recordExists(recordId)
        returns (bool)
    {
        records[recordId].status = RecordStatus.REVOKED;
        _addAuditLog(recordId, "RECORD_REVOKED", "system", "Record revoked");
        
        return true;
    }
    
    /**
     * @dev Check if record is valid and not expired
     */
    function isRecordValid(string memory recordId)
        public
        view
        recordExists(recordId)
        returns (bool)
    {
        MedicalRecord memory record = records[recordId];
        return record.status == RecordStatus.ACTIVE && block.timestamp <= record.expiresAt;
    }
    
    /**
     * @dev Get audit trail for a record
     */
    function getAuditTrail(string memory recordId)
        public
        view
        returns (AuditLog[] memory)
    {
        return auditTrail[recordId];
    }
    
    /**
     * @dev Internal function to add audit log
     */
    function _addAuditLog(string memory recordId, string memory action, string memory actor, string memory details)
        private
    {
        auditTrail[recordId].push(AuditLog({
            timestamp: block.timestamp,
            action: action,
            actor: actor,
            details: details
        }));
        
        emit AuditLogCreated(recordId, action, block.timestamp);
    }
    
    /**
     * @dev Set record expiration days
     */
    function setRecordExpirationDays(uint256 _days)
        public
        onlyOwner
    {
        recordExpirationDays = _days;
    }
}
