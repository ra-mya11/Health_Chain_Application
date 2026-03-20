# Blockchain-Based Secure Medical Record Management System

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────┐      ┌────────────┐
│  Spring Boot    │─────▶│   IPFS   │      │  Ethereum  │
│     Backend     │      │ Storage  │      │ Blockchain │
└────────┬────────┘      └──────────┘      └────────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

## Tech Stack

- **Backend**: Spring Boot 3.2.0 (Java 17)
- **Frontend**: React.js with Tailwind CSS
- **Database**: MongoDB
- **Blockchain**: Ethereum (Hardhat local network)
- **Storage**: IPFS
- **Smart Contract**: Solidity

## Features

1. ✅ Upload medical records (PDF, images, reports)
2. ✅ Store files in IPFS and get hash
3. ✅ Store IPFS hash on blockchain (immutable)
4. ✅ Save metadata in MongoDB
5. ✅ Retrieve records by patient ID
6. ✅ Verify record integrity using blockchain
7. ✅ Download medical files
8. ✅ React UI for upload and viewing

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 16+
- MongoDB
- IPFS Desktop or IPFS daemon

## Setup Instructions

### 1. Start MongoDB
```bash
net start MongoDB
```

### 2. Start IPFS
Download IPFS Desktop from https://docs.ipfs.tech/install/ipfs-desktop/
Or run IPFS daemon:
```bash
ipfs daemon
```

### 3. Start Blockchain (Hardhat)
```bash
cd blockchain-service
npm install
npx hardhat node
```

### 4. Deploy Smart Contract (New Terminal)
```bash
cd blockchain-service
npx hardhat run scripts/deployMedicalRecordManager.js --network localhost
```
Copy the contract address and update in `application.properties`

### 5. Start Spring Boot Backend
```bash
cd springboot-backend
mvn clean install
mvn spring-boot:run
```

Backend will run on: http://localhost:8080

### 6. Integrate React Components

Copy the React components to your frontend:
```bash
cp react-components/*.jsx frontend/src/components/
```

Update your main App.jsx:
```jsx
import MedicalRecordsApp from './components/MedicalRecordsApp';

function App() {
  return <MedicalRecordsApp />;
}
```

## API Endpoints

### Upload Record
```http
POST /api/records/upload
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile
- patientId: String
- doctorId: String
- recordType: String
```

### Get Records by Patient
```http
GET /api/records/patient/{patientId}
```

### Get Record by ID
```http
GET /api/records/{recordId}
```

### Download Record
```http
GET /api/records/download/{ipfsHash}
```

### Verify Record
```http
GET /api/records/verify/{recordId}
```

### Get Records by Doctor
```http
GET /api/records/doctor/{doctorId}
```

## MongoDB Schema

```javascript
{
  "_id": ObjectId,
  "recordId": "uuid",
  "patientId": "string",
  "doctorId": "string",
  "ipfsHash": "QmXxx...",
  "fileName": "report.pdf",
  "fileType": "application/pdf",
  "recordType": "Lab Report",
  "fileSize": 1024000,
  "blockchainTxHash": "0xabc...",
  "uploadedAt": ISODate,
  "verified": true
}
```

## Smart Contract Functions

```solidity
addRecord(recordId, ipfsHash, patientId, doctorId, recordType)
getRecord(recordId) returns (ipfsHash, patientId, doctorId, timestamp, recordType)
verifyRecord(recordId, ipfsHash) returns (bool)
getPatientRecords(patientId) returns (recordIds[])
```

## Testing

### Test Upload
```bash
curl -X POST http://localhost:8080/api/records/upload \
  -F "file=@test.pdf" \
  -F "patientId=P001" \
  -F "doctorId=D001" \
  -F "recordType=Lab Report"
```

### Test Retrieve
```bash
curl http://localhost:8080/api/records/patient/P001
```

### Test Verify
```bash
curl http://localhost:8080/api/records/verify/{recordId}
```

## Project Structure

```
springboot-backend/
├── src/main/java/com/healthcare/medicalrecords/
│   ├── MedicalRecordsApplication.java
│   ├── controller/
│   │   └── MedicalRecordController.java
│   ├── service/
│   │   ├── MedicalRecordService.java
│   │   ├── IPFSService.java
│   │   └── BlockchainService.java
│   ├── repository/
│   │   └── MedicalRecordRepository.java
│   ├── model/
│   │   └── MedicalRecord.java
│   ├── dto/
│   │   ├── UploadResponse.java
│   │   └── VerificationResponse.java
│   └── config/
│       └── CorsConfig.java
├── src/main/resources/
│   └── application.properties
└── pom.xml

blockchain-service/
├── contracts/
│   └── MedicalRecordManager.sol
└── scripts/
    └── deployMedicalRecordManager.js

react-components/
├── MedicalRecordsApp.jsx
├── UploadMedicalRecord.jsx
└── ViewMedicalRecords.jsx
```

## Security Features

- ✅ Immutable blockchain storage
- ✅ Decentralized IPFS storage
- ✅ Hash-based verification
- ✅ Tamper-proof records
- ✅ Audit trail on blockchain

## Troubleshooting

**IPFS Connection Error:**
- Ensure IPFS daemon is running on port 5001
- Check IPFS Desktop is active

**Blockchain Connection Error:**
- Verify Hardhat node is running on port 8545
- Check contract address in application.properties

**MongoDB Connection Error:**
- Ensure MongoDB service is running
- Check connection string in application.properties

**File Upload Error:**
- Check file size limit (50MB max)
- Verify multipart configuration

## Future Enhancements

- [ ] Role-based access control
- [ ] Encryption for sensitive files
- [ ] Multi-signature approval
- [ ] Integration with EHR systems
- [ ] Mobile app support

## License

MIT License
