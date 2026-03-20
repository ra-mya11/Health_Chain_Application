# System Architecture

## Overview

The Blockchain-Enabled Intelligent Healthcare Management System is built using a microservices architecture with four main components:

1. **Frontend** - React.js web application
2. **Backend API** - Node.js/Express REST API
3. **ML Service** - Python/FastAPI for AI predictions
4. **Blockchain Service** - Ethereum smart contracts

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React.js Frontend (Port 3000)                │  │
│  │  - Patient Dashboard  - Health Score  - Appointments     │  │
│  │  - Medical Records    - Recommendations                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST
┌────────────────────────┴────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Backend API    │  │   ML Service    │  │   Blockchain    ││
│  │  (Node.js)      │  │   (FastAPI)     │  │   (Ethereum)    ││
│  │  Port 5000      │  │   Port 8000     │  │   Port 8545     ││
│  │                 │  │                 │  │                 ││
│  │ - Auth          │  │ - Diabetes      │  │ - Smart         ││
│  │ - Records       │  │ - Heart Disease │  │   Contracts     ││
│  │ - Appointments  │  │ - SHAP          │  │ - Access        ││
│  │ - Health Score  │  │ - Predictions   │  │   Control       ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘│
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │                     │                     │
┌───────────┴─────────────────────┴─────────────────────┴─────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │  ML Models   │  │     IPFS     │          │
│  │  (Database)  │  │  (.pkl files)│  │ (File Store) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (React.js)

**Technology Stack:**
- React 18.2
- React Router for navigation
- Axios for HTTP requests
- Tailwind CSS for styling
- Web3.js for blockchain interaction

**Key Features:**
- Responsive design
- JWT authentication
- Real-time health monitoring
- Interactive dashboards
- MetaMask integration

**Pages:**
- Login/Register
- Patient Dashboard
- Health Score
- Medical Records
- Appointments
- Recommendations

### 2. Backend API (Node.js/Express)

**Technology Stack:**
- Node.js v16+
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

**Architecture Pattern:**
- MVC (Model-View-Controller)
- RESTful API design
- Middleware-based authentication
- Role-based access control

**Modules:**
- **Auth Module:** User registration, login, JWT management
- **Health Module:** AI predictions, health score calculation
- **Records Module:** Medical record management
- **Appointments Module:** Booking and scheduling
- **Recommendations Module:** Diet, exercise, department routing

### 3. ML Service (Python/FastAPI)

**Technology Stack:**
- Python 3.9+
- FastAPI
- Scikit-learn
- SHAP for explainability
- Pandas for data processing

**Models:**
- **Diabetes Prediction:** Random Forest Classifier (92% accuracy)
- **Heart Disease Prediction:** Logistic Regression (88% accuracy)

**Features:**
- Real-time predictions
- Feature importance analysis
- SHAP-based explanations
- Risk level classification
- Department recommendations

**Input Features:**
- Age, BMI, Blood Pressure, Cholesterol, Glucose
- Sex, Insulin, Skin Thickness
- Heart rate, Exercise data

### 4. Blockchain Service (Ethereum)

**Technology Stack:**
- Solidity 0.8.19
- Hardhat development framework
- Ethers.js
- IPFS for file storage

**Smart Contract: MedicalRecords.sol**

**Functions:**
- `registerUser()` - Register patient/doctor/admin
- `uploadRecord()` - Store record hash on blockchain
- `grantAccess()` - Patient grants access to doctor
- `revokeAccess()` - Patient revokes access
- `viewRecordHash()` - View record with access control
- `getPatientRecords()` - Get all patient records

**Access Control:**
- Role-based (Patient, Doctor, Admin)
- Patient-centric permissions
- Immutable audit trail

## Data Flow

### 1. User Registration & Login
```
User → Frontend → Backend API → MongoDB
                ↓
            JWT Token
                ↓
            Frontend (Store)
```

### 2. AI Health Prediction
```
User Input → Frontend → Backend API → ML Service
                                    ↓
                              ML Models (Predict)
                                    ↓
                              SHAP (Explain)
                                    ↓
Backend API ← Health Score ← Recommendations
     ↓
  MongoDB (Save)
     ↓
  Frontend (Display)
```

### 3. Medical Record Upload
```
User → Frontend → File → IPFS
                        ↓
                    IPFS Hash
                        ↓
              Backend API → Smart Contract
                        ↓
                  Blockchain (Store Hash)
                        ↓
              Transaction Hash
                        ↓
              MongoDB (Save Metadata)
                        ↓
              Frontend (Confirm)
```

### 4. Appointment Booking
```
User → Frontend → Backend API
                ↓
        Check Doctor Availability
                ↓
        MongoDB (Save Appointment)
                ↓
        Frontend (Confirmation)
```

## Security Architecture

### Authentication & Authorization
- JWT-based stateless authentication
- Token expiration (7 days)
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)

### Data Security
- HTTPS for all communications
- Encrypted data transmission
- Blockchain immutability
- IPFS encrypted storage
- Input validation and sanitization

### Smart Contract Security
- Access control modifiers
- Reentrancy protection
- Integer overflow protection
- Event logging for audit trail

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['patient', 'doctor', 'admin'],
  walletAddress: String,
  phone: String,
  dateOfBirth: Date,
  gender: Enum,
  specialization: String (doctor),
  availability: Array (doctor),
  createdAt: Date
}
```

### HealthRecord Collection
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: User),
  recordType: Enum,
  ipfsHash: String,
  blockchainTxHash: String,
  vitals: {
    glucose: Number,
    bmi: Number,
    bloodPressure: Number,
    cholesterol: Number
  },
  predictions: {
    diabetes: Object,
    heartDisease: Object
  },
  healthScore: Object,
  recommendations: Object,
  uploadedBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Appointment Collection
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  date: Date,
  timeSlot: String,
  department: String,
  reason: String,
  status: Enum ['scheduled', 'completed', 'cancelled'],
  notes: String,
  createdAt: Date
}
```

## Scalability Considerations

### Horizontal Scaling
- Load balancer (Nginx/AWS ELB)
- Multiple backend instances
- Database replication
- Microservices deployment

### Caching Strategy
- Redis for API responses
- ML model prediction caching
- Static asset CDN

### Performance Optimization
- Database indexing
- Query optimization
- Lazy loading in frontend
- API response compression
- Connection pooling

## Deployment Architecture

### Development
- Local Hardhat blockchain
- Local MongoDB
- Development servers

### Production
- Ethereum Mainnet/Testnet
- MongoDB Atlas (Cloud)
- AWS EC2/ECS for services
- CloudFront CDN
- Route 53 DNS
- S3 for static assets

## Monitoring & Logging

### Application Monitoring
- Health check endpoints
- Error tracking
- Performance metrics
- User analytics

### Blockchain Monitoring
- Transaction status
- Gas usage
- Contract events
- Network status

### ML Model Monitoring
- Prediction accuracy
- Response times
- Model drift detection
- Feature distribution

## Disaster Recovery

### Backup Strategy
- Daily MongoDB backups
- Smart contract state snapshots
- ML model versioning
- Configuration backups

### Recovery Plan
- Database restoration
- Contract redeployment
- Service failover
- Data integrity verification
