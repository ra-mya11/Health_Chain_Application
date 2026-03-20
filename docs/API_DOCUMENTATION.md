# API Documentation

## Base URLs

- **Backend API:** `http://localhost:5000/api`
- **ML API:** `http://localhost:8000`

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### POST /auth/login
Login user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### GET /auth/me
Get current user (Protected)

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "phone": "1234567890"
}
```

---

## Health Endpoints

### POST /health/predict
Get AI disease prediction (Protected)

**Request:**
```json
{
  "Age": 45,
  "BMI": 28.5,
  "BloodPressure": 130,
  "Cholesterol": 220,
  "Glucose": 120,
  "Sex": 1
}
```

**Response:**
```json
{
  "predictions": {
    "diabetes": {
      "prediction": 1,
      "probability": 0.75,
      "risk_level": "High",
      "feature_importance": {
        "Glucose": 0.35,
        "BMI": 0.25,
        "Age": 0.20
      }
    },
    "heart_disease": {
      "prediction": 0,
      "probability": 0.35,
      "risk_level": "Medium",
      "feature_importance": {
        "Age": 0.30,
        "Cholesterol": 0.28,
        "BloodPressure": 0.22
      }
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
    "diet": ["Low sugar diet", "High fiber foods"],
    "exercise": ["30 min walking daily", "Resistance training"]
  }
}
```

### GET /health/score
Get health score (Protected)

**Response:**
```json
{
  "healthScore": {
    "overall": 68,
    "clinical": 70,
    "aiRisk": 65,
    "lifestyle": 70
  },
  "predictions": {
    "diabetes": {...},
    "heartDisease": {...}
  },
  "date": "2024-01-15T10:30:00Z"
}
```

### GET /health/history
Get health history (Protected)

**Response:**
```json
[
  {
    "_id": "record_id",
    "recordType": "ai_prediction",
    "vitals": {...},
    "predictions": {...},
    "healthScore": {...},
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### GET /health/recommendations
Get personalized recommendations (Protected)

**Response:**
```json
{
  "department": "Endocrinology",
  "diet": ["Low sugar diet", "High fiber foods"],
  "exercise": ["30 min walking", "Resistance training"]
}
```

---

## Medical Records Endpoints

### GET /records
Get all medical records (Protected)

**Response:**
```json
[
  {
    "_id": "record_id",
    "patient": "patient_id",
    "recordType": "lab_report",
    "ipfsHash": "QmHash123...",
    "blockchainTxHash": "0x123...",
    "vitals": {...},
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /records/upload
Upload medical record (Protected)

**Request:**
```json
{
  "recordType": "lab_report",
  "ipfsHash": "QmHash123...",
  "blockchainTxHash": "0x123...",
  "vitals": {
    "glucose": 120,
    "bmi": 28.5,
    "bloodPressure": 130,
    "cholesterol": 220
  },
  "notes": "Annual checkup"
}
```

**Response:**
```json
{
  "message": "Record uploaded successfully",
  "record": {...}
}
```

### POST /records/grant-access
Grant access to doctor (Protected, Patient only)

**Request:**
```json
{
  "recordId": "record_id",
  "doctorAddress": "0x123..."
}
```

### POST /records/revoke-access
Revoke access from doctor (Protected, Patient only)

**Request:**
```json
{
  "recordId": "record_id",
  "doctorAddress": "0x123..."
}
```

---

## Appointment Endpoints

### GET /appointments/my-appointments
Get patient appointments (Protected)

**Response:**
```json
[
  {
    "_id": "appointment_id",
    "patient": "patient_id",
    "doctor": {
      "name": "Dr. Smith",
      "specialization": "Cardiology"
    },
    "date": "2024-02-01T00:00:00Z",
    "timeSlot": "10:00 AM",
    "department": "Cardiology",
    "status": "scheduled",
    "reason": "Checkup"
  }
]
```

### GET /appointments/doctors/available
Get available doctors

**Query Params:**
- `department` (optional): Filter by department
- `date` (optional): Check availability for date

**Response:**
```json
[
  {
    "_id": "doctor_id",
    "name": "Dr. Smith",
    "specialization": "Cardiology",
    "availability": [
      {
        "day": "Monday",
        "slots": ["09:00 AM", "10:00 AM", "11:00 AM"]
      }
    ],
    "availableSlots": ["09:00 AM", "11:00 AM"]
  }
]
```

### POST /appointments/book
Book appointment (Protected, Patient only)

**Request:**
```json
{
  "doctorId": "doctor_id",
  "date": "2024-02-01",
  "timeSlot": "10:00 AM",
  "department": "Cardiology",
  "reason": "Routine checkup"
}
```

**Response:**
```json
{
  "message": "Appointment booked successfully",
  "appointment": {...}
}
```

### DELETE /appointments/:id
Cancel appointment (Protected)

**Response:**
```json
{
  "message": "Appointment cancelled"
}
```

---

## ML Service Endpoints

### GET /
Service info

**Response:**
```json
{
  "service": "Healthcare AI Prediction Service",
  "version": "1.0.0",
  "endpoints": ["/predict", "/predict/diabetes", "/predict/heart"]
}
```

### GET /health
Health check

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### POST /predict
Combined prediction

**Request:**
```json
{
  "Age": 45,
  "BMI": 28.5,
  "BloodPressure": 130,
  "Cholesterol": 220,
  "Glucose": 120,
  "Sex": 1
}
```

**Response:**
```json
{
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
  },
  "recommendations": {
    "department": "Endocrinology",
    "priority": "High"
  }
}
```

### POST /predict/diabetes
Diabetes prediction only

### POST /predict/heart
Heart disease prediction only

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:
```
GET /records?page=1&limit=10
```

## Filtering

```
GET /appointments?status=scheduled&date=2024-02-01
```

## Sorting

```
GET /records?sort=-createdAt
```
