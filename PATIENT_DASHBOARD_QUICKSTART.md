# Patient Dashboard - Quick Start Guide

## ✅ What's Been Created

**16 New Files** for complete Patient Dashboard with JWT authentication!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend
```bash
cd springboot-backend
mvn clean install
mvn spring-boot:run
```

Backend runs on: **http://localhost:8080**

### Step 2: Test APIs

#### Register a Patient:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "test123",
    "name": "John Doe",
    "phone": "1234567890",
    "role": "PATIENT"
  }'
```

**Save the token from response!**

#### Login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "test123"
  }'
```

#### Get Records:
```bash
curl -X GET http://localhost:8080/api/patient/records \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 3: Run React UI

Copy components to your React app:
```bash
cp react-components/Patient*.jsx your-react-app/src/components/
```

Update `App.jsx`:
```jsx
import PatientApp from './components/PatientApp';

function App() {
  return <PatientApp />;
}

export default App;
```

Start React:
```bash
npm start
```

---

## 📋 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Register user |
| `/api/auth/login` | POST | No | Login user |
| `/api/patient/records` | GET | Yes | Get my records |
| `/api/patient/records/{id}` | GET | Yes | Get patient records |
| `/api/patient/share-access` | POST | Yes | Share with doctor |
| `/api/patient/revoke-access/{id}` | DELETE | Yes | Revoke access |
| `/api/patient/download/{id}` | GET | Yes | Download file |

---

## 🔑 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires in: **24 hours**

---

## 👥 User Roles

### PATIENT:
- View own records
- Download own files
- Share access with doctors
- Revoke access

### DOCTOR:
- View authorized patient records
- Download authorized files
- Cannot modify access

---

## 🗄️ MongoDB Collections

### users
- email (unique)
- password (hashed)
- name
- role
- authorizedDoctors[]

### medical_records
- recordId
- patientId
- doctorId
- ipfsHash
- fileName
- recordType

---

## 🎨 React Components

1. **PatientApp.jsx** - Main app with auth check
2. **PatientLogin.jsx** - Login/Register form
3. **PatientDashboard.jsx** - Records table + download

---

## 🧪 Test Flow

```
1. Register → Get token
2. Login → Get token
3. Upload record (use existing upload API)
4. View records in dashboard
5. Download record
6. Share access with doctor
7. Login as doctor
8. View patient records
```

---

## 📦 Dependencies Added

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
```

---

## 🔐 Security Configuration

- JWT secret in `application.properties`
- BCrypt password hashing
- Role-based access control
- Stateless sessions
- CORS enabled

---

## ✅ Features Checklist

- [x] JWT Authentication
- [x] User Registration
- [x] User Login
- [x] View Medical Records
- [x] Download Reports
- [x] Share Access with Doctors
- [x] Access Control (Patient/Doctor)
- [x] React Dashboard UI
- [x] Table View
- [x] Download Buttons
- [x] Secure APIs
- [x] MongoDB Integration

---

## 🎯 Next Steps

1. Start backend
2. Test registration/login
3. Upload some medical records
4. View in dashboard
5. Test download
6. Test share access

---

## 📞 Quick Help

**Backend not starting?**
- Check MongoDB is running
- Check port 8080 is free

**401 Unauthorized?**
- Check token is valid
- Check Authorization header format

**403 Forbidden?**
- Check user role
- Check access permissions

**CORS error?**
- Check `cors.allowed.origins` in properties

---

**Status: ✅ READY TO USE**

All files created and documented. Follow the steps above to get started!
