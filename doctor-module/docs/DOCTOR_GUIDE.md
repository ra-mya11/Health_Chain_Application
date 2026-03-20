# 🩺 DOCTOR MODULE - COMPLETE GUIDE

## ✅ WHAT'S BEEN CREATED

### Backend (Node.js + Express + MongoDB + IPFS + Blockchain)

**Models:**
- ✅ Doctor.js - Doctor authentication and profile
- ✅ MedicalRecord.js - Immutable medical records with blockchain
- ✅ Appointment.js - Appointment management

**Routes:**
- ✅ auth.js - Doctor login/register (role=doctor)
- ✅ records.js - Upload medical records (DOCTOR ONLY)
- ✅ patients.js - View patient profiles and health data
- ✅ appointments.js - Manage appointments

**Utilities:**
- ✅ fileUpload.js - IPFS upload + SHA-256 hash generation
- ✅ blockchain.js - Store record hash on smart contract

**Middleware:**
- ✅ doctorAuth.js - JWT + role verification (doctor only)

---

## 🎯 KEY FEATURES IMPLEMENTED

### 1. ✅ Doctor Authentication
- JWT-based login with role verification
- Only users with role='doctor' can access

### 2. ✅ Medical Record Upload (DOCTOR ONLY)
**Upload Pipeline:**
1. Doctor uploads file (PDF/image)
2. Generate SHA-256 hash of file
3. Upload to IPFS
4. Generate blockchain hash
5. Store hash on smart contract
6. Save metadata to MongoDB
7. Record is now IMMUTABLE

### 3. ✅ Patient Management
- View assigned patients
- Access patient health data
- View AI prediction results
- View patient medical history

### 4. ✅ Appointment Management
- View appointments
- Approve/reject appointments
- Complete appointments with notes
- Add consultation notes and prescription

### 5. ✅ Security Features
- Role-based access control (RBAC)
- JWT authentication
- Records are immutable after upload
- Blockchain verification
- File hash verification

---

## 🚀 DEPLOYMENT STEPS

### Prerequisites

1. **MongoDB** - Running on port 27017
2. **IPFS Node** - Running on port 5001
3. **Blockchain Node** - Running on port 8545
4. **Node.js** v16+

### Step 1: Install Dependencies

```bash
cd C:\Users\bhuva\Downloads\CapstoneProject\blockchain-healthcare-system\doctor-module\backend
npm install
```

### Step 2: Configure Environment

```bash
copy .env.example .env
```

Edit `.env`:
```
PORT=5002
MONGODB_URI=mongodb://localhost:27017/doctor_healthcare
JWT_SECRET=your_secret_key
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
DOCTOR_PRIVATE_KEY=your_wallet_private_key
```

### Step 3: Start IPFS (if not running)

```bash
ipfs daemon
```

### Step 4: Start Backend

```bash
npm run dev
```

**Backend runs on:** http://localhost:5002

---

## 📊 API ENDPOINTS

### Authentication

**Register Doctor:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dr. Sarah Johnson",
  "email": "sarah@hospital.com",
  "password": "doctor123",
  "specialization": "Cardiology",
  "licenseNumber": "MD-CARD-2024-001",
  "phone": "1234567890",
  "qualification": "MBBS, MD",
  "department": "Cardiology"
}
```

**Login Doctor:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "sarah@hospital.com",
  "password": "doctor123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "doctor_id",
    "name": "Dr. Sarah Johnson",
    "email": "sarah@hospital.com",
    "specialization": "Cardiology",
    "role": "doctor"
  }
}
```

---

### Medical Record Upload (DOCTOR ONLY)

**Upload Record:**
```bash
POST /api/records/upload
Authorization: Bearer <doctor_token>
Content-Type: multipart/form-data

Form Data:
- file: <PDF or image file>
- patientId: "patient_id"
- recordType: "lab_report"
- title: "Blood Test Results"
- description: "Complete blood count"
- diagnosis: "Anemia detected"
- medications: ["Iron supplements", "Vitamin B12"]
- clinicalNotes: "Patient advised to follow up in 2 weeks"
- recordDate: "2024-01-15"
```

**Response:**
```json
{
  "message": "Medical record uploaded successfully",
  "record": {
    "recordId": "REC-1705334400000-A1B2C3D4",
    "patientId": "patient_id",
    "recordType": "lab_report",
    "title": "Blood Test Results",
    "ipfsHash": "QmXxxx...",
    "blockchainHash": "0x123abc...",
    "blockchainTxHash": "0x456def...",
    "uploadTimestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Get My Uploads:**
```bash
GET /api/records/my-uploads
Authorization: Bearer <doctor_token>
```

**Get Patient Records:**
```bash
GET /api/records/patient/:patientId
Authorization: Bearer <doctor_token>
```

**Verify Record:**
```bash
GET /api/records/:recordId/verify
Authorization: Bearer <doctor_token>
```

---

### Patient Management

**Get My Patients:**
```bash
GET /api/patients/my-patients
Authorization: Bearer <doctor_token>
```

**Get Patient Profile:**
```bash
GET /api/patients/:patientId/profile
Authorization: Bearer <doctor_token>
```

**Response:**
```json
{
  "id": "patient_id",
  "demographics": {
    "name": "John Doe",
    "age": 45,
    "gender": "male",
    "bloodGroup": "O+",
    "phone": "1234567890",
    "email": "john@example.com"
  },
  "healthParameters": {
    "bmi": 28.5,
    "glucose": 120,
    "bloodPressure": 130,
    "cholesterol": 220
  },
  "aiPredictions": {
    "diabetes": {
      "risk": "High",
      "probability": 0.75
    },
    "heartDisease": {
      "risk": "Medium",
      "probability": 0.45
    }
  },
  "healthScore": {
    "overall": 68,
    "clinical": 70,
    "aiRisk": 65,
    "lifestyle": 70
  }
}
```

**Get Patient AI Predictions:**
```bash
GET /api/patients/:patientId/predictions
Authorization: Bearer <doctor_token>
```

**Get Patient Medical History:**
```bash
GET /api/patients/:patientId/history
Authorization: Bearer <doctor_token>
```

---

### Appointment Management

**Get My Appointments:**
```bash
GET /api/appointments/my-appointments?status=pending&date=2024-01-15
Authorization: Bearer <doctor_token>
```

**Approve Appointment:**
```bash
PATCH /api/appointments/:id/approve
Authorization: Bearer <doctor_token>
```

**Reject Appointment:**
```bash
PATCH /api/appointments/:id/reject
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "reason": "Not available on this date"
}
```

**Complete Appointment:**
```bash
PATCH /api/appointments/:id/complete
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "consultationNotes": "Patient examined. Vitals normal.",
  "diagnosis": "Mild hypertension",
  "prescription": "Amlodipine 5mg once daily",
  "followUpDate": "2024-02-15",
  "followUpRequired": true
}
```

---

## 🔐 SECURITY IMPLEMENTATION

### 1. Role-Based Access Control (RBAC)

```javascript
// Only doctors can access
const doctorAuth = async (req, res, next) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  
  if (decoded.role !== 'doctor') {
    return res.status(403).json({ error: 'Access denied. Doctor role required.' });
  }
  
  // Continue...
};
```

### 2. Immutable Records

```javascript
// Prevent updates after creation
medicalRecordSchema.pre('save', function(next) {
  if (!this.isNew && this.isImmutable) {
    return next(new Error('Medical records are immutable'));
  }
  next();
});
```

### 3. File Hash Verification

```javascript
// SHA-256 hash generation
function generateFileHash(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}
```

### 4. Blockchain Storage

```javascript
// Store hash on smart contract
await contract.uploadRecord(patientAddress, ipfsHash, recordType);
```

---

## 🧪 TESTING WORKFLOW

### Test 1: Doctor Registration

```bash
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "email": "test@doctor.com",
    "password": "test123",
    "specialization": "General Medicine",
    "licenseNumber": "MD-TEST-001"
  }'
```

### Test 2: Doctor Login

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@doctor.com",
    "password": "test123"
  }'
```

### Test 3: Upload Medical Record

```bash
curl -X POST http://localhost:5002/api/records/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-report.pdf" \
  -F "patientId=patient_id" \
  -F "recordType=lab_report" \
  -F "title=Blood Test" \
  -F "description=Complete blood count"
```

### Test 4: View Uploaded Records

```bash
curl http://localhost:5002/api/records/my-uploads \
  -H "Authorization: Bearer <token>"
```

---

## 📁 FILE STRUCTURE

```
doctor-module/
├── backend/
│   ├── models/
│   │   ├── Doctor.js              ✅
│   │   ├── MedicalRecord.js       ✅
│   │   └── Appointment.js         ✅
│   ├── routes/
│   │   ├── auth.js                ✅
│   │   ├── records.js             ✅ (UPLOAD ONLY)
│   │   ├── patients.js            ✅
│   │   └── appointments.js        ✅
│   ├── middleware/
│   │   └── doctorAuth.js          ✅
│   ├── utils/
│   │   ├── fileUpload.js          ✅
│   │   └── blockchain.js          ✅
│   ├── server.js                  ✅
│   ├── package.json               ✅
│   └── .env.example               ✅
└── docs/
    └── DOCTOR_GUIDE.md            ✅ (This file)
```

---

## ✅ VERIFICATION CHECKLIST

Doctor Module Features:
- [x] JWT Authentication (role=doctor)
- [x] Upload medical records (DOCTOR ONLY)
- [x] IPFS file storage
- [x] SHA-256 hash generation
- [x] Blockchain hash storage
- [x] View patient profiles
- [x] View AI predictions
- [x] Appointment management
- [x] Consultation notes
- [x] Prescription entry
- [x] Records are immutable
- [x] No edit/delete functionality

Security:
- [x] Role-based access control
- [x] JWT authentication
- [x] File hash verification
- [x] Blockchain verification
- [x] Immutable records

---

## 🎯 KEY POINTS

✅ **ONLY doctors can upload records**
✅ **Records are immutable after upload**
✅ **Blockchain hash verification**
✅ **IPFS decentralized storage**
✅ **SHA-256 file integrity**
✅ **Role-based access control**
✅ **No patient upload functionality**

---

## 🚀 QUICK START

```bash
# 1. Start MongoDB
mongod

# 2. Start IPFS
ipfs daemon

# 3. Start Blockchain (from main project)
cd blockchain-service && npx hardhat node

# 4. Start Doctor Backend
cd doctor-module/backend
npm install
copy .env.example .env
npm run dev

# 5. Test API
curl http://localhost:5002/health
```

**Doctor Module is ready! Only doctors can upload medical records.** 🩺
