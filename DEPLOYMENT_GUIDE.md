# 🏥 Blockchain-Based Medical Records System - Setup & Deployment Guide

## Quick Start (Windows)

### Prerequisites
- Java 17+ (JDK)
- Node.js 16+ & npm
- MongoDB (local or Atlas)
- MetaMask wallet
- IPFS Desktop or ipfs daemon
- Git

### Step 1: Clone Repository
```bash
cd blockchain-healthcare-system
```

### Step 2: Start Services (Open terminals in order)

#### Terminal 1: MongoDB
```bash
# Windows - if MongoDB is installed as service
net start MongoDB

# Or run manually
mongod --dbpath "C:\data\db"
```

#### Terminal 2: IPFS Daemon
```bash
# Start IPFS
ipfs daemon

# Or use IPFS Desktop
```

#### Terminal 3: Hardhat Local Blockchain
```bash
cd blockchain-service
npm install
npx hardhat node
```
Keep this running (default: http://localhost:8545)

#### Terminal 4: Deploy Smart Contract
```bash
cd blockchain-service
npx hardhat run scripts/deployMedicalRecordManager.js --network localhost
```
**Note:** Copy the deployed contract address

#### Terminal 5: Spring Boot Backend
```bash
cd springboot-backend

# Update contract address in application.properties if needed
# server.port=8080

mvn spring-boot:run
```
Backend runs on: http://localhost:8080

#### Terminal 6: React Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on: http://localhost:3000

---

## Configuration

### Spring Boot (springboot-backend/src/main/resources/application.properties)

```properties
# Server
server.port=8080

# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/medical_records
spring.data.mongodb.auto-index-creation=true

# File Upload
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

# IPFS
ipfs.host=localhost
ipfs.port=5001

# Blockchain
blockchain.rpc.url=http://localhost:8545
blockchain.contract.address=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
blockchain.private.key=<YOUR_ACCOUNT_PRIVATE_KEY>

# CORS
cors.allowed.origins=http://localhost:3000

# Optional: Security
jwt.secret=<YOUR_JWT_SECRET>
jwt.expiration=86400000
```

### React Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8080/api/records
REACT_APP_BLOCKCHAIN_RPC=http://localhost:8545
```

---

## API Endpoints

### Upload Record
```http
POST /api/records/upload
Content-Type: multipart/form-data

Parameters:
- file: Medical document (PDF, JPG, PNG)
- patientId: Patient ID
- doctorId: Doctor ID
- recordType: lab_report | prescription | diagnosis | imaging | vitals
```

### Get Patient Records
```http
GET /api/records/patient/{patientId}
```

### Get Doctor Records
```http
GET /api/records/doctor/{doctorId}
```

### Get Record by Type
```http
GET /api/records/patient/{patientId}/type/{recordType}
```

### Get Records by Date Range
```http
GET /api/records/patient/{patientId}/date-range
?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59
```

### Verify Record
```http
GET /api/records/verify/{recordId}
```

### Download Record
```http
GET /api/records/download/{ipfsHash}
```

### Delete Record
```http
DELETE /api/records/{recordId}
```

### Health Check
```http
GET /api/records/health
```

---

## Testing

### Using cURL

#### Upload a Record
```bash
curl -X POST \
  -F "file=@test.pdf" \
  -F "patientId=P12345" \
  -F "doctorId=D12345" \
  -F "recordType=lab_report" \
  http://localhost:8080/api/records/upload
```

#### Get Patient Records
```bash
curl http://localhost:8080/api/records/patient/P12345
```

#### Verify Record
```bash
curl http://localhost:8080/api/records/verify/{recordId}
```

### Using Postman
1. Import [Medical_Records_API.postman_collection.json](./Medical_Records_API.postman_collection.json)
2. Set environment variables:
   - `base_url`: http://localhost:8080
3. Run requests from collection

---

## Blockchain Details

### Smart Contract: MedicalRecordManager.sol

**Key Functions:**
- `addRecord()` - Store medical record on blockchain
- `getRecord()` - Retrieve record details
- `verifyRecord()` - Verify file integrity
- `getPatientRecords()` - Get all records for patient
- `archiveRecord()` - Archive a record
- `revokeRecord()` - Revoke a record

**Events:**
- `RecordAdded` - Emitted when record is uploaded
- `RecordVerified` - Emitted when record is verified
- `RecordArchived` - Emitted when record is archived
- `AuditLogCreated` - Emitted for audit trail

---

## IPFS Integration

### How It Works
1. File uploaded to React frontend
2. File sent to Spring Boot backend
3. Backend uploads to IPFS via java-ipfs-http-client
4. IPFS returns hash (QmXxxx...)
5. Hash stored on blockchain
6. Metadata stored in MongoDB

### IPFS API
```bash
# Check IPFS connectivity
curl http://localhost:5001/api/v0/version

# Get file from IPFS
curl http://localhost:5001/api/v0/cat?arg=QmXxxx...
```

---

## Database Schema

### MongoDB Collections

#### medical_records
```json
{
  "_id": "ObjectId",
  "recordId": "UUID",
  "patientId": "string",
  "doctorId": "string",
  "ipfsHash": "string (QmXxxx...)",
  "fileName": "string",
  "fileType": "string (application/pdf, image/jpeg)",
  "recordType": "enum (lab_report, prescription, diagnosis, imaging, vitals)",
  "fileSize": "long",
  "blockchainTxHash": "string (0x...)",
  "uploadedAt": "LocalDateTime",
  "verified": "boolean"
}
```

---

## Troubleshooting

### Issue: Contract Address Error
**Solution:**
1. Deploy contract: `npx hardhat run scripts/deployMedicalRecordManager.js --network localhost`
2. Copy address from output
3. Update `blockchain.contract.address` in application.properties

### Issue: IPFS Connection Failed
**Solution:**
1. Start IPFS: `ipfs daemon`
2. Verify running on port 5001: `curl http://localhost:5001/api/v0/version`
3. Check `ipfs.host` and `ipfs.port` in application.properties

### Issue: MongoDB Connection Error
**Solution:**
1. Start MongoDB: `net start MongoDB` or `mongod`
2. Verify on port 27017
3. Check `spring.data.mongodb.uri` in application.properties

### Issue: React Cannot Reach Backend
**Solution:**
1. Backend must be running on 8080
2. Update `REACT_APP_API_URL` in React .env
3. Check CORS settings in `cors.allowed.origins`

---

## Production Deployment

### For Production:

#### 1. Backend (Spring Boot)
```bash
# Build JAR
mvn clean package

# Run
java -jar target/medical-records-1.0.0.jar \
  --spring.data.mongodb.uri=mongodb+srv://user:pass@cluster.mongodb.net/db \
  --blockchain.rpc.url=https://mainnet.infura.io/v3/YOUR_KEY \
  --blockchain.contract.address=0x...
```

#### 2. Smart Contract
```bash
# Deploy to mainnet or testnet
npx hardhat run scripts/deployMedicalRecordManager.js --network mainnet
```

#### 3. Frontend
```bash
# Build
npm run build

# Deploy to service (Vercel, Netlify, AWS S3, etc.)
npm install -g vercel
vercel --prod
```

#### 4. MongoDB
Use MongoDB Atlas (cloud) or managed database service

#### 5. IPFS
Use Infura or Pinata for IPFS hosting

---

## Security Considerations

1. **Private Keys**: Never commit to Git, use environment variables
2. **JWT Secrets**: Use strong, random secrets in production
3. **CORS**: Restrict to your domain in production
4. **File Size**: Limit upload sizes appropriately
5. **Authentication**: Implement proper JWT validation
6. **HTTPS**: Use SSL/TLS in production
7. **Blockchain**: Use testnet for development

---

## Performance Optimization

- **Caching**: Implement Redis for frequently accessed records
- **Database Indexing**: Ensure indexes on patientId, doctorId, recordType
- **IPFS Pinning**: Use pinning services for file redundancy
- **CDN**: Use CloudFlare or similar for frontend
- **Load Balancing**: Scale backend with multiple instances

---

## Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Web3j Documentation](https://web3j.io/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ethereum Development](https://ethereum.org/en/developers/)
- [Hardhat Documentation](https://hardhat.org/)

---

## Support

For issues or questions:
1. Check logs: `tail -f logs/spring-boot.log`
2. Verify all services running
3. Check configuration files
4. Review error messages carefully

---

**Version:** 1.0.0  
**Last Updated:** March 2024  
**Status:** Production Ready ✅
