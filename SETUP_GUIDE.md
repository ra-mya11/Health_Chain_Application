# Complete Setup Guide - Blockchain Medical Records System

## 🚀 Quick Start (5 Steps)

### Step 1: Install IPFS
1. Download IPFS Desktop: https://docs.ipfs.tech/install/ipfs-desktop/
2. Install and start IPFS Desktop
3. Verify it's running on http://localhost:5001

### Step 2: Start Blockchain
Open Terminal 1:
```bash
cd C:\Users\bhuva\Downloads\CapstoneProject\blockchain-healthcare-system\blockchain-service
npx hardhat node
```

### Step 3: Deploy Smart Contract
Open Terminal 2:
```bash
cd C:\Users\bhuva\Downloads\CapstoneProject\blockchain-healthcare-system\blockchain-service
npx hardhat run scripts\deployMedicalRecordManager.js --network localhost
```

**IMPORTANT:** Copy the contract address from output!

Example output:
```
✓ MedicalRecordManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 4: Update Configuration
Edit `springboot-backend/src/main/resources/application.properties`:
```properties
blockchain.contract.address=YOUR_CONTRACT_ADDRESS_HERE
```

### Step 5: Start Spring Boot Backend
Open Terminal 3:
```bash
cd C:\Users\bhuva\Downloads\CapstoneProject\blockchain-healthcare-system\springboot-backend
mvn clean install
mvn spring-boot:run
```

## ✅ Verify Installation

### Test Backend Health
```bash
curl http://localhost:8080/api/records/health
```

Expected: `Medical Records Service is running`

### Test Upload (Using Postman or curl)
```bash
curl -X POST http://localhost:8080/api/records/upload ^
  -F "file=@C:\path\to\test.pdf" ^
  -F "patientId=P001" ^
  -F "doctorId=D001" ^
  -F "recordType=Lab Report"
```

Expected Response:
```json
{
  "recordId": "uuid-here",
  "ipfsHash": "QmXxx...",
  "blockchainTxHash": "0xabc...",
  "message": "Record uploaded successfully",
  "success": true
}
```

### Test Retrieve
```bash
curl http://localhost:8080/api/records/patient/P001
```

## 🎨 Frontend Integration

### Option 1: Use Provided React Components
Copy components to your React project:
```bash
copy react-components\*.jsx frontend\src\components\
```

### Option 2: Create New React App
```bash
npx create-react-app medical-records-ui
cd medical-records-ui
npm install axios
```

Copy the components:
- MedicalRecordsApp.jsx
- UploadMedicalRecord.jsx
- ViewMedicalRecords.jsx

Update src/App.js:
```jsx
import MedicalRecordsApp from './components/MedicalRecordsApp';

function App() {
  return <MedicalRecordsApp />;
}

export default App;
```

Start React app:
```bash
npm start
```

## 📊 System Architecture

```
User Browser
     ↓
React Frontend (Port 3000)
     ↓
Spring Boot API (Port 8080)
     ↓
├─→ IPFS (Port 5001) - File Storage
├─→ Ethereum (Port 8545) - Blockchain
└─→ MongoDB (Port 27017) - Metadata
```

## 🔧 Configuration Files

### application.properties
```properties
server.port=8080
spring.data.mongodb.uri=mongodb://localhost:27017/medical_records
spring.servlet.multipart.max-file-size=50MB
ipfs.host=localhost
ipfs.port=5001
blockchain.rpc.url=http://localhost:8545
blockchain.contract.address=YOUR_CONTRACT_ADDRESS
blockchain.private.key=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
cors.allowed.origins=http://localhost:3000
```

## 📝 API Documentation

### 1. Upload Medical Record
**Endpoint:** `POST /api/records/upload`

**Request:**
- Content-Type: multipart/form-data
- file: File (PDF, JPG, PNG)
- patientId: String
- doctorId: String
- recordType: String

**Response:**
```json
{
  "recordId": "uuid",
  "ipfsHash": "QmHash",
  "blockchainTxHash": "0xHash",
  "message": "Record uploaded successfully",
  "success": true
}
```

### 2. Get Patient Records
**Endpoint:** `GET /api/records/patient/{patientId}`

**Response:**
```json
[
  {
    "recordId": "uuid",
    "patientId": "P001",
    "doctorId": "D001",
    "ipfsHash": "QmHash",
    "fileName": "report.pdf",
    "fileType": "application/pdf",
    "recordType": "Lab Report",
    "fileSize": 1024000,
    "blockchainTxHash": "0xHash",
    "uploadedAt": "2024-01-01T10:00:00",
    "verified": true
  }
]
```

### 3. Verify Record
**Endpoint:** `GET /api/records/verify/{recordId}`

**Response:**
```json
{
  "recordId": "uuid",
  "verified": true,
  "ipfsHash": "QmHash",
  "message": "Record verified successfully"
}
```

### 4. Download Record
**Endpoint:** `GET /api/records/download/{ipfsHash}`

**Response:** Binary file data

### 5. Get Doctor Records
**Endpoint:** `GET /api/records/doctor/{doctorId}`

## 🧪 Testing Workflow

1. **Upload a test file:**
   - Use Postman or React UI
   - Upload a PDF/image
   - Note the recordId and ipfsHash

2. **Verify on blockchain:**
   - Call verify endpoint
   - Should return verified: true

3. **Retrieve records:**
   - Get by patientId
   - Check all metadata is correct

4. **Download file:**
   - Use ipfsHash to download
   - Verify file integrity

## 🐛 Common Issues

### Issue: IPFS Connection Failed
**Solution:**
- Start IPFS Desktop or run `ipfs daemon`
- Check http://localhost:5001/webui

### Issue: Blockchain Connection Failed
**Solution:**
- Ensure Hardhat node is running
- Check port 8545 is not blocked

### Issue: Contract Address Not Found
**Solution:**
- Deploy contract first
- Update address in application.properties
- Restart Spring Boot

### Issue: MongoDB Connection Failed
**Solution:**
```bash
net start MongoDB
```

### Issue: File Upload Too Large
**Solution:**
- Check spring.servlet.multipart.max-file-size
- Default is 50MB

## 📦 Dependencies

### Spring Boot (pom.xml)
- spring-boot-starter-web
- spring-boot-starter-data-mongodb
- web3j-core (4.10.3)
- java-ipfs-http-client (1.4.4)
- lombok

### React
- axios
- tailwindcss (optional)

## 🔐 Security Notes

1. **Private Key:** Change the default private key in production
2. **CORS:** Update allowed origins for production
3. **File Validation:** Add file type and size validation
4. **Authentication:** Add JWT/OAuth for production
5. **Encryption:** Consider encrypting files before IPFS upload

## 📈 Performance Tips

1. Use connection pooling for MongoDB
2. Cache IPFS hashes
3. Implement pagination for large record lists
4. Use async processing for file uploads
5. Add Redis for caching

## 🎯 Next Steps

1. ✅ System is running
2. Test all endpoints
3. Integrate with existing frontend
4. Add authentication
5. Deploy to production

## 📞 Support

For issues:
1. Check logs in terminal
2. Verify all services are running
3. Check configuration files
4. Review error messages

## 🎉 Success Checklist

- [ ] MongoDB running
- [ ] IPFS running
- [ ] Hardhat node running
- [ ] Smart contract deployed
- [ ] Spring Boot backend running
- [ ] Can upload files
- [ ] Can retrieve records
- [ ] Can verify on blockchain
- [ ] Can download files
- [ ] React UI working

---

**System Ready! 🚀**

Access:
- Backend API: http://localhost:8080
- React UI: http://localhost:3000
- IPFS: http://localhost:5001/webui
- Blockchain: http://localhost:8545
