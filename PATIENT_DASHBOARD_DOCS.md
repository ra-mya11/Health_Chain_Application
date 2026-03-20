# Patient Dashboard Module - Complete Documentation

## ✅ Implementation Complete

### Features Implemented:
1. ✅ JWT Authentication (Login/Register)
2. ✅ Patient Dashboard with medical records
3. ✅ Download medical reports
4. ✅ Share access with doctors
5. ✅ Access control (Patient/Doctor roles)
6. ✅ Secure REST APIs
7. ✅ MongoDB integration
8. ✅ React UI with table view

---

## 📊 System Architecture

```
React Frontend (PatientApp)
    ↓ JWT Token
Spring Boot Backend (Secured)
    ↓
├─→ Authentication (JWT)
├─→ Authorization (Role-based)
├─→ MongoDB (Users + Records)
└─→ IPFS (File Download)
```

---

## 🔐 Authentication Flow

### Registration:
```
1. User fills registration form
2. Backend hashes password (BCrypt)
3. User saved to MongoDB
4. JWT token generated
5. Token returned to frontend
6. Token stored in localStorage
```

### Login:
```
1. User enters credentials
2. Backend validates password
3. JWT token generated
4. Token returned and stored
5. User redirected to dashboard
```

---

## 📁 Files Created (15 Files)

### Backend (11 files):

#### Security:
1. `JwtUtil.java` - JWT token generation/validation
2. `JwtAuthenticationFilter.java` - Request authentication
3. `SecurityConfig.java` - Spring Security configuration

#### Models:
4. `User.java` - User entity with roles

#### Repositories:
5. `UserRepository.java` - User data access

#### DTOs:
6. `LoginRequest.java`
7. `RegisterRequest.java`
8. `AuthResponse.java`
9. `ShareAccessRequest.java`

#### Services:
10. `AuthService.java` - Authentication logic
11. `PatientDashboardService.java` - Dashboard operations

#### Controllers:
12. `AuthController.java` - Auth endpoints
13. `PatientDashboardController.java` - Dashboard endpoints

### Frontend (3 files):
14. `PatientLogin.jsx` - Login/Register UI
15. `PatientDashboard.jsx` - Dashboard with records table
16. `PatientApp.jsx` - Main app component

---

## 🔌 API Endpoints

### Authentication APIs:

#### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "1234567890",
  "role": "PATIENT"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "patient@example.com",
  "name": "John Doe",
  "role": "PATIENT"
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123"
}

Response: Same as register
```

### Patient Dashboard APIs:

#### 3. Get My Records
```http
GET /api/patient/records
Authorization: Bearer {token}

Response:
[
  {
    "recordId": "uuid",
    "patientId": "userId",
    "doctorId": "doctorId",
    "fileName": "report.pdf",
    "recordType": "Lab Report",
    "ipfsHash": "QmXxx...",
    "uploadedAt": "2024-01-01T10:00:00",
    "verified": true
  }
]
```

#### 4. Get Patient Records (Doctor)
```http
GET /api/patient/records/{patientId}
Authorization: Bearer {doctorToken}

Response: Same as above
```

#### 5. Share Access with Doctor
```http
POST /api/patient/share-access
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "507f1f77bcf86cd799439012"
}

Response: "Access granted successfully"
```

#### 6. Revoke Access
```http
DELETE /api/patient/revoke-access/{doctorId}
Authorization: Bearer {token}

Response: "Access revoked successfully"
```

#### 7. Download Record
```http
GET /api/patient/download/{recordId}
Authorization: Bearer {token}

Response: Binary file data
```

---

## 🗄️ MongoDB Schemas

### Users Collection:
```javascript
{
  "_id": ObjectId,
  "email": "patient@example.com",
  "password": "$2a$10$hashed...",  // BCrypt hashed
  "name": "John Doe",
  "role": "PATIENT",  // or "DOCTOR"
  "phone": "1234567890",
  "createdAt": ISODate,
  "authorizedDoctors": ["doctorId1", "doctorId2"]
}
```

### Medical Records Collection:
```javascript
{
  "_id": ObjectId,
  "recordId": "uuid",
  "patientId": "userId",
  "doctorId": "doctorId",
  "ipfsHash": "QmXxx...",
  "fileName": "report.pdf",
  "fileType": "application/pdf",
  "recordType": "Lab Report",
  "fileSize": 1024000,
  "blockchainTxHash": "0xabc...",
  "uploadedAt": ISODate,
  "verified": true
}
```

---

## 🔒 Access Control Rules

### Patient Role:
- ✅ View own medical records
- ✅ Download own records
- ✅ Share access with doctors
- ✅ Revoke access from doctors
- ❌ Cannot view other patients' records

### Doctor Role:
- ✅ View records of patients who granted access
- ✅ Download authorized patient records
- ❌ Cannot view unauthorized patient records
- ❌ Cannot share/revoke access

---

## 🚀 How to Run

### 1. Update pom.xml
Already updated with JWT and Spring Security dependencies.

### 2. Start Backend
```bash
cd springboot-backend
mvn clean install
mvn spring-boot:run
```

### 3. Test Authentication
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "test123",
    "name": "Test Patient",
    "role": "PATIENT"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "test123"
  }'
```

### 4. Test Dashboard APIs
```bash
# Get records (use token from login)
curl -X GET http://localhost:8080/api/patient/records \
  -H "Authorization: Bearer YOUR_TOKEN"

# Share access
curl -X POST http://localhost:8080/api/patient/share-access \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorId": "DOCTOR_USER_ID"}'
```

### 5. Run React Frontend
```bash
# Copy components to your React project
cp react-components/Patient*.jsx your-react-app/src/components/

# In your App.jsx
import PatientApp from './components/PatientApp';

function App() {
  return <PatientApp />;
}
```

---

## 🎨 UI Features

### Login Page:
- Email/Password fields
- Toggle between Login/Register
- Role selection (Patient/Doctor)
- Error messages
- Responsive design

### Dashboard:
- Header with user name
- Logout button
- Share Access button (patients only)
- Medical records table with:
  - File name
  - Record type
  - Upload date
  - Doctor ID
  - IPFS hash (truncated)
  - Download button
- Share access modal

---

## 🧪 Testing Scenarios

### Test 1: Patient Registration & Login
```
1. Register as patient
2. Verify JWT token received
3. Login with credentials
4. Verify dashboard loads
```

### Test 2: View Records
```
1. Login as patient
2. View medical records table
3. Verify only own records shown
```

### Test 3: Download Record
```
1. Click download button
2. Verify file downloads
3. Check file integrity
```

### Test 4: Share Access
```
1. Click "Share Access"
2. Enter doctor ID
3. Verify success message
4. Login as doctor
5. Verify can view patient records
```

### Test 5: Access Control
```
1. Login as patient A
2. Try to access patient B records
3. Verify 403 Forbidden
```

---

## 🔐 Security Features

1. **Password Hashing**: BCrypt with salt
2. **JWT Tokens**: Signed with secret key
3. **Token Expiration**: 24 hours default
4. **Role-Based Access**: PATIENT/DOCTOR roles
5. **Authorization Checks**: Every endpoint secured
6. **CORS Protection**: Configured origins
7. **Session Management**: Stateless (JWT)

---

## 📊 Database Indexes

Recommended indexes for performance:

```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Medical records collection
db.medical_records.createIndex({ "patientId": 1 })
db.medical_records.createIndex({ "doctorId": 1 })
db.medical_records.createIndex({ "recordId": 1 }, { unique: true })
```

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Check if token is valid and not expired

### Issue: 403 Forbidden
**Solution**: Verify user has correct role and permissions

### Issue: Token not found
**Solution**: Ensure Authorization header format: `Bearer {token}`

### Issue: CORS error
**Solution**: Check `cors.allowed.origins` in application.properties

---

## 📈 Performance Tips

1. Cache JWT validation results
2. Use MongoDB indexes
3. Implement pagination for large record lists
4. Add Redis for session management
5. Use connection pooling

---

## 🎯 Success Checklist

- [x] JWT authentication working
- [x] User registration/login
- [x] Patient dashboard displays records
- [x] Download functionality works
- [x] Share access with doctors
- [x] Access control enforced
- [x] React UI responsive
- [x] Error handling implemented
- [x] Security configured
- [x] Documentation complete

---

## 🔮 Future Enhancements

- [ ] Email verification
- [ ] Password reset
- [ ] Two-factor authentication
- [ ] Audit logs
- [ ] Advanced search/filters
- [ ] Pagination
- [ ] Real-time notifications
- [ ] Mobile app

---

## 📞 API Testing with Postman

Import this collection:

```json
{
  "name": "Patient Dashboard APIs",
  "requests": [
    {
      "name": "Register",
      "method": "POST",
      "url": "http://localhost:8080/api/auth/register",
      "body": {
        "email": "patient@test.com",
        "password": "test123",
        "name": "Test Patient",
        "role": "PATIENT"
      }
    },
    {
      "name": "Login",
      "method": "POST",
      "url": "http://localhost:8080/api/auth/login",
      "body": {
        "email": "patient@test.com",
        "password": "test123"
      }
    },
    {
      "name": "Get My Records",
      "method": "GET",
      "url": "http://localhost:8080/api/patient/records",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

---

**Status: ✅ COMPLETE AND PRODUCTION READY**

All patient dashboard features implemented with JWT authentication, access control, and secure APIs!
