// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecords
 * @dev Blockchain-based medical record management with role-based access control
 */
contract MedicalRecords {
    
    enum Role { Patient, Doctor, Admin }
    
    struct User {
        address userAddress;
        Role role;
        string name;
        bool isRegistered;
    }
    
    struct MedicalRecord {
        uint256 recordId;
        address patientAddress;
        string ipfsHash;
        string recordType;
        uint256 timestamp;
        address uploadedBy;
        bool exists;
    }
    
    struct AccessGrant {
        address doctorAddress;
        uint256 grantedAt;
        bool isActive;
    }
    
    // State variables
    mapping(address => User) public users;
    mapping(uint256 => MedicalRecord) public records;
    mapping(address => uint256[]) public patientRecords;
    mapping(uint256 => mapping(address => AccessGrant)) public recordAccess;
    
    uint256 public recordCounter;
    address public admin;
    
    // Events
    event UserRegistered(address indexed userAddress, Role role, string name);
    event RecordUploaded(uint256 indexed recordId, address indexed patient, string ipfsHash);
    event AccessGranted(uint256 indexed recordId, address indexed patient, address indexed doctor);
    event AccessRevoked(uint256 indexed recordId, address indexed patient, address indexed doctor);
    
    // Modifiers
    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyPatient() {
        require(users[msg.sender].role == Role.Patient, "Only patient can perform this action");
        _;
    }
    
    modifier onlyDoctor() {
        require(users[msg.sender].role == Role.Doctor, "Only doctor can perform this action");
        _;
    }
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        users[msg.sender] = User(msg.sender, Role.Admin, "System Admin", true);
    }
    
    /**
     * @dev Register a new user
     */
    function registerUser(address _userAddress, Role _role, string memory _name) public onlyAdmin {
        require(!users[_userAddress].isRegistered, "User already registered");
        
        users[_userAddress] = User(_userAddress, _role, _name, true);
        emit UserRegistered(_userAddress, _role, _name);
    }
    
    /**
     * @dev Upload a new medical record
     */
    function uploadRecord(
        address _patientAddress,
        string memory _ipfsHash,
        string memory _recordType
    ) public onlyRegistered returns (uint256) {
        require(
            users[msg.sender].role == Role.Doctor || 
            users[msg.sender].role == Role.Admin ||
            msg.sender == _patientAddress,
            "Unauthorized to upload record"
        );
        
        recordCounter++;
        
        records[recordCounter] = MedicalRecord(
            recordCounter,
            _patientAddress,
            _ipfsHash,
            _recordType,
            block.timestamp,
            msg.sender,
            true
        );
        
        patientRecords[_patientAddress].push(recordCounter);
        
        emit RecordUploaded(recordCounter, _patientAddress, _ipfsHash);
        return recordCounter;
    }
    
    /**
     * @dev Grant access to a doctor for a specific record
     */
    function grantAccess(uint256 _recordId, address _doctorAddress) public {
        require(records[_recordId].exists, "Record does not exist");
        require(records[_recordId].patientAddress == msg.sender, "Only patient can grant access");
        require(users[_doctorAddress].role == Role.Doctor, "Address is not a doctor");
        
        recordAccess[_recordId][_doctorAddress] = AccessGrant(_doctorAddress, block.timestamp, true);
        
        emit AccessGranted(_recordId, msg.sender, _doctorAddress);
    }
    
    /**
     * @dev Revoke access from a doctor for a specific record
     */
    function revokeAccess(uint256 _recordId, address _doctorAddress) public {
        require(records[_recordId].exists, "Record does not exist");
        require(records[_recordId].patientAddress == msg.sender, "Only patient can revoke access");
        
        recordAccess[_recordId][_doctorAddress].isActive = false;
        
        emit AccessRevoked(_recordId, msg.sender, _doctorAddress);
    }
    
    /**
     * @dev View record hash (with access control)
     */
    function viewRecordHash(uint256 _recordId) public view returns (string memory) {
        require(records[_recordId].exists, "Record does not exist");
        
        MedicalRecord memory record = records[_recordId];
        
        // Patient can view their own records
        if (msg.sender == record.patientAddress) {
            return record.ipfsHash;
        }
        
        // Doctor can view if access granted
        if (users[msg.sender].role == Role.Doctor && recordAccess[_recordId][msg.sender].isActive) {
            return record.ipfsHash;
        }
        
        // Admin can view all records
        if (users[msg.sender].role == Role.Admin) {
            return record.ipfsHash;
        }
        
        revert("Access denied");
    }
    
    /**
     * @dev Get all record IDs for a patient
     */
    function getPatientRecords(address _patientAddress) public view returns (uint256[] memory) {
        require(
            msg.sender == _patientAddress || 
            users[msg.sender].role == Role.Admin,
            "Access denied"
        );
        return patientRecords[_patientAddress];
    }
    
    /**
     * @dev Get record details
     */
    function getRecordDetails(uint256 _recordId) public view returns (
        address patient,
        string memory recordType,
        uint256 timestamp,
        address uploadedBy
    ) {
        require(records[_recordId].exists, "Record does not exist");
        
        MedicalRecord memory record = records[_recordId];
        
        require(
            msg.sender == record.patientAddress ||
            users[msg.sender].role == Role.Admin ||
            (users[msg.sender].role == Role.Doctor && recordAccess[_recordId][msg.sender].isActive),
            "Access denied"
        );
        
        return (
            record.patientAddress,
            record.recordType,
            record.timestamp,
            record.uploadedBy
        );
    }
    
    /**
     * @dev Check if doctor has access to a record
     */
    function hasAccess(uint256 _recordId, address _doctorAddress) public view returns (bool) {
        return recordAccess[_recordId][_doctorAddress].isActive;
    }
    
    /**
     * @dev Get user details
     */
    function getUserDetails(address _userAddress) public view returns (
        Role role,
        string memory name,
        bool isRegistered
    ) {
        User memory user = users[_userAddress];
        return (user.role, user.name, user.isRegistered);
    }
}
