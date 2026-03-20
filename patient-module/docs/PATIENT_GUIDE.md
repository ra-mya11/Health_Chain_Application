# 🏥 PATIENT MODULE - COMPLETE GUIDE

## ✅ WHAT'S BEEN CREATED

### Backend (Node.js + Express + MongoDB)
✅ **Models:**
- Patient.js - Patient schema with health data
- MedicalRecord.js - READ-ONLY records (uploaded by doctors)
- Appointment.js - Appointment booking
- HealthRecord.js - AI predictions and health scores

✅ **Routes:**
- auth.js - Login/Register (JWT)
- health.js - AI predictions, health score
- records.js - View/Download records (READ-ONLY, no upload)
- appointments.js - Book appointments, view doctors

✅ **Controllers:**
- recommendations.js - Health score, diet, exercise logic

✅ **Utils:**
- blockchain.js - READ-ONLY blockchain access

✅ **Middleware:**
- patientAuth.js - JWT authentication

### Key Features Implemented:

1. ✅ **Secure JWT Login** - Register and login
2. ✅ **Health Parameters Input** - Age, BMI, BP, Cholesterol, Glucose
3. ✅ **AI Prediction** - Calls ML service
4. ✅ **SHAP Explanation** - Feature importance
5. ✅ **Digital Health Score** - Formula: Clinical(40%) + AI(40%) + Lifestyle(20%)
6. ✅ **Department Recommendation** - Based on risk
7. ✅ **Doctor List** - View recommended doctors
8. ✅ **Appointment Booking** - Book time slots
9. ✅ **View Medical Records** - READ-ONLY access
10. ✅ **Download Reports** - Get file URLs
11. ✅ **Blockchain Hash** - Verify record integrity
12. ✅ **Diet Plan** - Personalized recommendations
13. ✅ **Exercise Plan** - Based on BMI and risk
14. ✅ **Reminders** - Medication, diet, exercise

---

## 🚀 DEPLOYMENT STEPS

### 1. Backend Setup

```bash
cd patient-module/backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

**Backend runs on:** http://localhost:5001

### 2. Frontend Setup (React)

```bash
cd patient-module/frontend
npm install
npm start
```

**Frontend runs on:** http://localhost:3000

### 3. Prerequisites

Ensure these are running:
- ✅ MongoDB (port 27017)
- ✅ ML Service (port 8000) - from main project
- ✅ Blockchain Node (port 8545) - from main project

---

## 📊 API ENDPOINTS

### Authentication
```
POST /api/auth/register  - Register patient
POST /api/auth/login     - Login patient
GET  /api/auth/profile   - Get profile
PATCH /api/auth/profile  - Update profile
```

### Health & AI
```
POST /api/health/predict        - Submit health data, get AI prediction
GET  /api/health/score          - Get health score
GET  /api/health/history        - Get health history
GET  /api/health/recommendations - Get diet/exercise plans
```

### Medical Records (READ-ONLY)
```
GET /api/records              - Get all records
GET /api/records/:id          - Get single record
GET /api/records/:id/blockchain - Get blockchain verification
GET /api/records/:id/download - Download record file
```

**❌ NO UPLOAD/UPDATE/DELETE** - Patients cannot modify records

### Appointments
```
GET  /api/appointments/doctors        - Get available doctors
POST /api/appointments/book           - Book appointment
GET  /api/appointments/my-appointments - Get my appointments
PATCH /api/appointments/:id/cancel    - Cancel appointment
```

---

## 🔐 SECURITY FEATURES

✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcrypt with 10 rounds
✅ **Read-Only Records** - Patients cannot upload/modify
✅ **Blockchain Verification** - Verify record integrity
✅ **Input Validation** - All inputs validated
✅ **CORS Protection** - Configured properly

---

## 📋 PATIENT WORKFLOW

### Step 1: Register/Login
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### Step 2: Submit Health Data
```javascript
POST /api/health/predict
Headers: { Authorization: "Bearer <token>" }
{
  "age": 45,
  "bmi": 28.5,
  "glucose": 120,
  "bloodPressure": 130,
  "cholesterol": 220,
  "heartRate": 75,
  "weight": 80,
  "height": 175
}
```

**Response:**
```javascript
{
  "predictions": {
    "diabetes": {
      "prediction": 1,
      "probability": 0.75,
      "risk_level": "High",
      "feature_importance": {...}
    },
    "heart_disease": {
      "prediction": 0,
      "probability": 0.35,
      "risk_level": "Medium",
      "feature_importance": {...}
    }
  },
  "healthScore": {
    "overall": 68,
    "clinical": 70,
    "aiRisk": 65,
    "lifestyle": 70
  },
  "recommendations": {
    "department": "Endocrinology",
    "priority": "High",
    "diet": ["Low sugar diet", "High fiber foods"],
    "exercise": ["30 min walking", "Resistance training"]
  }
}
```

### Step 3: View Health Score
```javascript
GET /api/health/score
Headers: { Authorization: "Bearer <token>" }
```

### Step 4: Get Recommendations
```javascript
GET /api/health/recommendations
Headers: { Authorization: "Bearer <token>" }
```

### Step 5: View Available Doctors
```javascript
GET /api/appointments/doctors?department=Endocrinology
Headers: { Authorization: "Bearer <token>" }
```

### Step 6: Book Appointment
```javascript
POST /api/appointments/book
Headers: { Authorization: "Bearer <token>" }
{
  "doctorId": "doctor_id",
  "department": "Endocrinology",
  "appointmentDate": "2024-02-01",
  "timeSlot": "10:00 AM",
  "reason": "Diabetes consultation",
  "symptoms": ["High blood sugar", "Fatigue"]
}
```

### Step 7: View Medical Records (READ-ONLY)
```javascript
GET /api/records
Headers: { Authorization: "Bearer <token>" }
```

**Response:**
```javascript
[
  {
    "_id": "record_id",
    "patient": "patient_id",
    "uploadedBy": {
      "name": "Dr. Smith",
      "specialization": "Endocrinology"
    },
    "recordType": "lab_report",
    "title": "Blood Test Results",
    "ipfsHash": "QmHash123...",
    "blockchainTxHash": "0x123...",
    "fileUrl": "https://...",
    "recordDate": "2024-01-15",
    "uploadedAt": "2024-01-15"
  }
]
```

### Step 8: Download Record
```javascript
GET /api/records/:id/download
Headers: { Authorization: "Bearer <token>" }
```

### Step 9: Verify Blockchain Hash
```javascript
GET /api/records/:id/blockchain
Headers: { Authorization: "Bearer <token>" }
```

**Response:**
```javascript
{
  "recordId": "record_id",
  "ipfsHash": "QmHash123...",
  "blockchainTxHash": "0x123...",
  "blockchainData": {
    "patient": "0x...",
    "recordType": "lab_report",
    "timestamp": "2024-01-15",
    "uploadedBy": "0x..."
  },
  "verified": true
}
```

---

## 🧪 TESTING WORKFLOW

### Test 1: Patient Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@patient.com",
    "password": "test123",
    "phone": "1234567890",
    "gender": "male"
  }'
```

### Test 2: Patient Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@patient.com",
    "password": "test123"
  }'
```

### Test 3: AI Prediction
```bash
curl -X POST http://localhost:5001/api/health/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "age": 45,
    "bmi": 28.5,
    "glucose": 120,
    "bloodPressure": 130,
    "cholesterol": 220,
    "heartRate": 75
  }'
```

### Test 4: View Records
```bash
curl http://localhost:5001/api/records \
  -H "Authorization: Bearer <token>"
```

---

## 📁 COMPLETE FILE STRUCTURE

```
patient-module/
├── backend/
│   ├── models/
│   │   ├── Patient.js              ✅
│   │   ├── MedicalRecord.js        ✅
│   │   ├── Appointment.js          ✅
│   │   └── HealthRecord.js         ✅
│   ├── routes/
│   │   ├── auth.js                 ✅
│   │   ├── health.js               ✅
│   │   ├── records.js              ✅ (READ-ONLY)
│   │   └── appointments.js         ✅
│   ├── middleware/
│   │   └── patientAuth.js          ✅
│   ├── controllers/
│   │   └── recommendations.js      ✅
│   ├── utils/
│   │   └── blockchain.js           ✅ (READ-ONLY)
│   ├── server.js                   ✅
│   ├── package.json                ✅
│   └── .env.example                ✅
└── docs/
    └── PATIENT_GUIDE.md            ✅ (This file)
```

---

## ✅ VERIFICATION CHECKLIST

Patient Module Features:
- [x] JWT Authentication
- [x] Health Parameter Input
- [x] AI Prediction (Diabetes + Heart)
- [x] SHAP Explanation
- [x] Digital Health Score (0-100)
- [x] Department Recommendation
- [x] Doctor List
- [x] Appointment Booking
- [x] View Medical Records (READ-ONLY)
- [x] Download Reports
- [x] Blockchain Hash Verification
- [x] Diet Plan
- [x] Exercise Plan
- [x] Reminders

Security:
- [x] No upload functionality for patients
- [x] Read-only record access
- [x] JWT authentication
- [x] Password hashing
- [x] Blockchain verification

---

## 🎯 KEY POINTS

✅ **Patients CANNOT upload records** - Only doctors can
✅ **Read-only access** - View and download only
✅ **Blockchain verification** - Verify record integrity
✅ **Complete AI integration** - Predictions + SHAP
✅ **Health score calculation** - Formula implemented
✅ **Appointment booking** - Full workflow
✅ **Recommendations** - Diet, exercise, reminders

---

## 🚀 QUICK START

```bash
# 1. Start MongoDB
mongod

# 2. Start ML Service (from main project)
cd ml-service && uvicorn api.main:app --port 8000

# 3. Start Blockchain (from main project)
cd blockchain-service && npx hardhat node

# 4. Start Patient Backend
cd patient-module/backend
npm install && npm run dev

# 5. Test API
curl http://localhost:5001/health
```

**Patient Module is now ready for use!** 🎉
