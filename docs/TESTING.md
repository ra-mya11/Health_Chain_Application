# Testing Guide

## Smart Contract Testing

```bash
cd blockchain-service
npx hardhat test
```

### Manual Testing

```javascript
// In Hardhat console
npx hardhat console --network localhost

const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
const contract = await MedicalRecords.attach("CONTRACT_ADDRESS");

// Test upload record
await contract.uploadRecord(patientAddress, "QmHash123", "lab_report");

// Test grant access
await contract.grantAccess(1, doctorAddress);

// Test view record
await contract.viewRecordHash(1);
```

## ML Model Testing

```bash
cd ml-service
pytest tests/
```

### API Testing

```bash
# Test diabetes prediction
curl -X POST http://localhost:8000/predict/diabetes \
  -H "Content-Type: application/json" \
  -d '{
    "Glucose": 120,
    "BMI": 28.5,
    "Age": 45,
    "BloodPressure": 130,
    "Insulin": 100,
    "SkinThickness": 25,
    "DiabetesPedigreeFunction": 0.5,
    "Pregnancies": 2
  }'

# Test combined prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Age": 45,
    "BMI": 28.5,
    "BloodPressure": 130,
    "Cholesterol": 220,
    "Glucose": 120,
    "Sex": 1
  }'
```

## Backend API Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "patient"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Prediction (with token)
```bash
curl -X POST http://localhost:5000/api/health/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Age": 45,
    "BMI": 28.5,
    "BloodPressure": 130,
    "Cholesterol": 220,
    "Glucose": 120,
    "Sex": 1
  }'
```

### Get Health Score
```bash
curl http://localhost:5000/api/health/score \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Book Appointment
```bash
curl -X POST http://localhost:5000/api/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "date": "2024-02-01",
    "timeSlot": "10:00 AM",
    "department": "Cardiology",
    "reason": "Checkup"
  }'
```

## Frontend Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads correctly
- [ ] AI prediction form submits
- [ ] Health score displays
- [ ] Medical records list loads
- [ ] Appointment booking works
- [ ] Recommendations display
- [ ] Logout works

### Test User Credentials

**Patient:**
- Email: patient@test.com
- Password: password123

**Doctor:**
- Email: doctor@test.com
- Password: password123

## Integration Testing

### End-to-End Flow

1. Register new patient
2. Login with credentials
3. Submit health data for AI prediction
4. View health score
5. Check recommendations
6. Book appointment with recommended department
7. View medical records
8. Upload new record to blockchain
9. Grant access to doctor
10. Logout

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test backend API
ab -n 1000 -c 10 http://localhost:5000/health

# Test ML API
ab -n 100 -c 5 -p prediction.json -T application/json http://localhost:8000/predict
```

### Expected Performance

- Backend API: < 100ms response time
- ML Prediction: < 500ms response time
- Blockchain transaction: 1-3 seconds
- Frontend load: < 2 seconds

## Security Testing

### Test Cases

1. **Authentication:**
   - Invalid credentials rejected
   - JWT token validation
   - Token expiration handling

2. **Authorization:**
   - Role-based access control
   - Patient can only access own records
   - Doctor can only access granted records

3. **Input Validation:**
   - SQL injection prevention
   - XSS attack prevention
   - Invalid data type handling

4. **Blockchain:**
   - Unauthorized access blocked
   - Access control enforced
   - Transaction verification

## Automated Testing

### Backend Tests
```bash
cd backend-service
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Test Data

### Sample Health Data

```json
{
  "Age": 45,
  "BMI": 28.5,
  "BloodPressure": 130,
  "Cholesterol": 220,
  "Glucose": 120,
  "Sex": 1,
  "Insulin": 100,
  "SkinThickness": 25,
  "DiabetesPedigreeFunction": 0.5,
  "Pregnancies": 0,
  "ChestPainType": 2,
  "FastingBS": 1,
  "MaxHR": 150,
  "ExerciseAngina": 0,
  "Oldpeak": 1.5,
  "ST_Slope": 1
}
```

## Troubleshooting Tests

### Common Issues

**ML Service not responding:**
```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
tail -f ml-service/logs/app.log
```

**Backend connection failed:**
```bash
# Check MongoDB
mongo --eval "db.adminCommand('ping')"

# Check backend
curl http://localhost:5000/health
```

**Smart contract errors:**
```bash
# Check Hardhat node
curl http://localhost:8545

# Redeploy contract
npx hardhat run scripts/deploy.js --network localhost
```

## Test Coverage Goals

- Smart Contracts: > 90%
- Backend API: > 80%
- ML Models: > 85%
- Frontend Components: > 70%

## Continuous Integration

Setup GitHub Actions for automated testing on every commit.
