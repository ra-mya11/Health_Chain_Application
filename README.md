# Blockchain-Enabled Intelligent Healthcare Management System

## 🏥 System Overview

A comprehensive healthcare management platform combining blockchain security, AI-powered disease prediction, and patient-centric health monitoring.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React.js)                      │
│  - Patient Dashboard  - Medical Records  - Appointments     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             │              │              │              │
┌────────────▼────┐ ┌───────▼──────┐ ┌────▼─────────┐ ┌─▼──────┐
│  Backend API    │ │ ML Service   │ │ Blockchain   │ │ IPFS   │
│  (Node.js)      │ │ (FastAPI)    │ │ (Ethereum)   │ │        │
│  - Auth         │ │ - Diabetes   │ │ - Smart      │ │ - File │
│  - Appointments │ │ - Heart      │ │   Contracts  │ │ Storage│
│  - Health Score │ │ - SHAP       │ │ - Access     │ │        │
└────────┬────────┘ └──────────────┘ └──────────────┘ └────────┘
         │
    ┌────▼────┐
    │ MongoDB │
    └─────────┘
```

## 📁 Project Structure

```
blockchain-healthcare-system/
├── blockchain-service/          # Ethereum smart contracts
│   ├── contracts/
│   │   └── MedicalRecords.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── MedicalRecords.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── ml-service/                  # AI/ML prediction service
│   ├── models/
│   │   ├── diabetes_model.pkl
│   │   └── heart_model.pkl
│   ├── data/
│   │   ├── diabetes_data.csv
│   │   └── heart_data.csv
│   ├── api/
│   │   └── main.py
│   ├── train_models.py
│   ├── requirements.txt
│   └── README.md
│
├── backend-service/             # Node.js REST API
│   ├── routes/
│   │   ├── auth.js
│   │   ├── records.js
│   │   ├── appointments.js
│   │   └── health.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   └── HealthRecord.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── healthScore.js
│   │   ├── recommendations.js
│   │   └── reminders.js
│   ├── utils/
│   │   └── constants.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/                    # React.js application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MedicalRecords.jsx
│   │   │   ├── HealthScore.jsx
│   │   │   ├── Appointments.jsx
│   │   │   └── Recommendations.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── PatientDashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── blockchain.js
│   │   ├── utils/
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   └── API_DOCUMENTATION.md
│
└── README.md
```

## 🚀 Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Web3.js** - Blockchain interaction
- **MetaMask** - Wallet integration

### Backend
- **Node.js + Express** - REST API
- **MongoDB** - Database
- **JWT** - Authentication
- **Mongoose** - ODM

### ML Service
- **Python 3.9+**
- **FastAPI** - API framework
- **Scikit-learn** - ML models
- **SHAP** - Explainable AI
- **Pandas** - Data processing

### Blockchain
- **Solidity** - Smart contracts
- **Hardhat** - Development framework
- **Ethereum** - Blockchain network
- **IPFS** - Decentralized storage

## 📋 Prerequisites

- Node.js v16+
- Python 3.9+
- MongoDB
- MetaMask browser extension
- Git

## 🔧 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd blockchain-healthcare-system
```

### 2. Blockchain Service Setup
```bash
cd blockchain-service
npm install
npx hardhat compile
npx hardhat node  # Start local blockchain
# In new terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### 3. ML Service Setup
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_models.py  # Train ML models
uvicorn api.main:app --reload --port 8000
```

### 4. Backend Service Setup
```bash
cd backend-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔐 Environment Variables

### Backend Service (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=<deployed_contract_address>
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ML_API_URL=http://localhost:8000
REACT_APP_BLOCKCHAIN_RPC=http://localhost:8545
```

## 📊 Features

### 1. Blockchain Medical Records
- Immutable record storage
- Hash-based verification
- Role-based access control
- IPFS integration for files

### 2. AI Disease Prediction
- **Diabetes Prediction**: Random Forest model (92% accuracy)
- **Heart Disease Prediction**: Logistic Regression (88% accuracy)
- SHAP-based explainability
- Real-time risk assessment

### 3. Digital Health Score
```
Health Score = (Clinical Score × 0.4) + (AI Risk Score × 0.4) + (Lifestyle × 0.2)
Range: 0-100
```

### 4. Smart Recommendations
- Department routing based on risk
- Doctor availability matching
- Personalized diet plans
- Exercise recommendations

### 5. Appointment Management
- Real-time slot booking
- Doctor availability tracking
- Automated reminders

### 6. Reminder System
- Medication schedules
- Diet adherence
- Exercise routines

## 🧪 Testing

### Smart Contract Tests
```bash
cd blockchain-service
npx hardhat test
```

### ML Model Tests
```bash
cd ml-service
pytest tests/
```

### Backend API Tests
```bash
cd backend-service
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📖 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Medical Records
- `GET /api/records` - Get all records
- `POST /api/records/upload` - Upload new record
- `POST /api/records/grant-access` - Grant access to doctor
- `DELETE /api/records/revoke-access` - Revoke access

### AI Predictions
- `POST /api/ml/predict` - Get disease prediction
- `GET /api/health/score` - Calculate health score

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/doctors/available` - Get available doctors

### Recommendations
- `GET /api/recommendations/diet` - Get diet plan
- `GET /api/recommendations/exercise` - Get exercise plan
- `GET /api/recommendations/department` - Get department recommendation

## 🔒 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control
- Blockchain immutability
- IPFS encrypted storage
- Input validation
- SQL injection prevention
- XSS protection

## 📈 Performance Optimization

- MongoDB indexing
- API response caching
- Lazy loading in frontend
- Model prediction caching
- Connection pooling

## 🐛 Troubleshooting

### MetaMask Connection Issues
- Ensure MetaMask is installed
- Connect to correct network (localhost:8545)
- Import test accounts from Hardhat

### ML Service Errors
- Verify Python version (3.9+)
- Check model files exist in models/
- Ensure all dependencies installed

### Database Connection
- Verify MongoDB is running
- Check connection string in .env
- Ensure database permissions

## 📝 License

MIT License

## 👥 Contributors

- Development Team
- AI/ML Team
- Blockchain Team
- Security Team

## 📞 Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Email: support@healthcare-system.com

## 🗺️ Roadmap

- [ ] Multi-chain support (Polygon, BSC)
- [ ] Mobile app (React Native)
- [ ] Telemedicine integration
- [ ] IoT device integration
- [ ] Advanced AI models (Deep Learning)
- [ ] Multi-language support
- [ ] Insurance claim automation
"# Health_Chain_Application" 
