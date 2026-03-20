# 🚀 Quick Reference Card - Medical Records System

## ⚡ Quick Start Commands

```bash
# 1. Start MongoDB
net start MongoDB

# 2. Start IPFS (in IPFS Desktop or)
ipfs daemon

# 3. Start Blockchain
cd blockchain-service
npx hardhat node

# 4. Deploy Contract (new terminal)
cd blockchain-service
npx hardhat run scripts\deployMedicalRecordManager.js --network localhost

# 5. Start Backend (new terminal)
cd springboot-backend
mvn spring-boot:run

# 6. Test
curl http://localhost:8080/api/records/health
```

## 📡 API Endpoints Cheat Sheet

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/records/upload` | Upload medical record |
| GET | `/api/records/patient/{id}` | Get patient records |
| GET | `/api/records/doctor/{id}` | Get doctor records |
| GET | `/api/records/{recordId}` | Get specific record |
| GET | `/api/records/verify/{id}` | Verify on blockchain |
| GET | `/api/records/download/{hash}` | Download file |
| GET | `/api/records/health` | Health check |

## 🔧 Configuration Quick Edit

**File:** `springboot-backend/src/main/resources/application.properties`

```properties
# Change these:
blockchain.contract.address=YOUR_CONTRACT_ADDRESS
blockchain.private.key=YOUR_PRIVATE_KEY
cors.allowed.origins=http://localhost:3000
```

## 📦 Dependencies

```xml
<!-- Add to pom.xml if missing -->
<dependency>
    <groupId>org.web3j</groupId>
    <artifactId>core</artifactId>
    <version>4.10.3</version>
</dependency>
<dependency>
    <groupId>io.ipfs</groupId>
    <artifactId>java-ipfs-http-client</artifactId>
    <version>1.4.4</version>
</dependency>
```

## 🧪 Test Commands

```bash
# Upload
curl -X POST http://localhost:8080/api/records/upload \
  -F "file=@test.pdf" \
  -F "patientId=P001" \
  -F "doctorId=D001" \
  -F "recordType=Lab Report"

# Retrieve
curl http://localhost:8080/api/records/patient/P001

# Verify
curl http://localhost:8080/api/records/verify/{recordId}
```

## 🎯 Port Numbers

| Service | Port |
|---------|------|
| Spring Boot | 8080 |
| React | 3000 |
| MongoDB | 27017 |
| IPFS | 5001 |
| Hardhat | 8545 |

## 📁 Important Files

| File | Location |
|------|----------|
| Smart Contract | `blockchain-service/contracts/MedicalRecordManager.sol` |
| Main Controller | `springboot-backend/.../controller/MedicalRecordController.java` |
| Configuration | `springboot-backend/src/main/resources/application.properties` |
| React App | `react-components/MedicalRecordsApp.jsx` |

## 🔍 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Port 8080 in use | Change `server.port` in application.properties |
| IPFS connection failed | Start IPFS Desktop or `ipfs daemon` |
| Contract not found | Deploy contract and update address |
| MongoDB error | Run `net start MongoDB` |
| CORS error | Check `cors.allowed.origins` |

## 💡 Common Tasks

### Change Upload Size Limit
```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

### Add New Record Type
Edit `UploadMedicalRecord.jsx`:
```jsx
<option>Your New Type</option>
```

### Change Database Name
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/your_db_name
```

## 🎨 React Integration

```jsx
// In your App.jsx
import MedicalRecordsApp from './components/MedicalRecordsApp';

function App() {
  return <MedicalRecordsApp />;
}
```

## 🔐 Security Checklist

- [ ] Change default private key
- [ ] Update JWT secret (if added)
- [ ] Configure CORS properly
- [ ] Add authentication
- [ ] Validate file types
- [ ] Limit file sizes
- [ ] Use HTTPS in production

## 📊 Response Formats

### Upload Success
```json
{
  "recordId": "uuid",
  "ipfsHash": "QmXxx...",
  "blockchainTxHash": "0xabc...",
  "message": "Record uploaded successfully",
  "success": true
}
```

### Verification
```json
{
  "recordId": "uuid",
  "verified": true,
  "ipfsHash": "QmXxx...",
  "message": "Record verified successfully"
}
```

## 🛠️ Build Commands

```bash
# Clean build
mvn clean install

# Skip tests
mvn clean install -DskipTests

# Run specific class
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# Package JAR
mvn package
```

## 📱 Frontend Commands

```bash
# Install dependencies
npm install axios

# Start dev server
npm start

# Build for production
npm run build
```

## 🔄 Update Smart Contract

```bash
# 1. Edit contract
# 2. Compile
npx hardhat compile

# 3. Deploy
npx hardhat run scripts/deployMedicalRecordManager.js --network localhost

# 4. Update application.properties with new address
```

## 📈 Monitoring

```bash
# Check backend logs
# Look for:
✓ MongoDB connected
✓ Medical Records Management System Started
✓ Server running on http://localhost:8080

# Check IPFS
http://localhost:5001/webui

# Check Hardhat
# Should show account addresses and "Started HTTP and WebSocket JSON-RPC server"
```

## 🎯 Success Indicators

✅ Backend responds to `/health`
✅ Can upload file
✅ File appears in IPFS
✅ Transaction on blockchain
✅ Record in MongoDB
✅ Can retrieve records
✅ Verification returns true
✅ Can download file

## 📞 Quick Help

| Issue | Check |
|-------|-------|
| 500 Error | Backend logs |
| 404 Error | URL and port |
| CORS Error | application.properties |
| Upload fails | IPFS running? |
| Verify fails | Contract deployed? |

## 🚀 Production Deployment

```bash
# 1. Build JAR
mvn clean package

# 2. Run JAR
java -jar target/medical-records-1.0.0.jar

# 3. Use production IPFS node
# 4. Use mainnet/testnet Ethereum
# 5. Secure MongoDB with auth
```

## 📚 Documentation Links

- Setup: `SETUP_GUIDE.md`
- Architecture: `ARCHITECTURE_DIAGRAM.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`
- Full Docs: `springboot-backend/README.md`
- File List: `FILE_INDEX.md`

---

**Keep this card handy for quick reference!**

Print or bookmark this page for instant access to common commands and configurations.
