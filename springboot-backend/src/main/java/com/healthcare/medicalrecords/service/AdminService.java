package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.AnalyticsDto;
import com.healthcare.medicalrecords.dto.DepartmentDto;
import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.dto.UserDto;
import com.healthcare.medicalrecords.entity.*;
import com.healthcare.medicalrecords.model.MedicalRecord;
import com.healthcare.medicalrecords.repository.*;
import com.healthcare.medicalrecords.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private AdminUserRepository userRepository;
    @Autowired
    private UserRepository mongoUserRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private MedicalRecordRepository recordRepository;
    @Autowired
    private PredictionLogRepository predictionLogRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    // ============ USER MANAGEMENT ============

    public List<UserDto> getAllUsers() {
        // Read from MongoDB (source of truth for auth)
        // Cross-reference with MySQL to get numeric IDs for doctor registration
        List<com.healthcare.medicalrecords.model.User> mongoUsers = mongoUserRepository.findAll();
        java.util.concurrent.atomic.AtomicLong index = new java.util.concurrent.atomic.AtomicLong(1);
        return mongoUsers.stream().map(u -> {
            // Try to find matching MySQL user by email to get numeric id
            java.util.Optional<User> mysqlUser = userRepository.findByEmail(u.getEmail());
            if (mysqlUser.isPresent()) {
                UserDto dto = UserDto.from(mysqlUser.get());
                dto.mongoId = u.getId();
                return dto;
            }
            // Fallback: no MySQL record yet, use sequential index
            return UserDto.fromMongo(u, index.getAndIncrement());
        }).collect(Collectors.toList());
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    public User approveUser(Long userId, boolean enable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(enable);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    public UserDto getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDto dto = UserDto.from(user);
        long aptCount = appointmentRepository.findByPatientId(userId).size();
        dto.setAppointmentCount(aptCount);
        return dto;
    }

    public User updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role.toUpperCase());
        return userRepository.save(user);
    }

    public User updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled("ACTIVE".equalsIgnoreCase(status));
        return userRepository.save(user);
    }

    // ============ DEPARTMENT MANAGEMENT ============

    public DepartmentDto createDepartment(Department dept) {
        if (departmentRepository.existsByName(dept.getName())) {
            throw new RuntimeException("Department already exists: " + dept.getName());
        }
        dept.setCreatedAt(LocalDateTime.now());
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);
        return DepartmentDto.from(saved, 0);
    }

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> DepartmentDto.from(d, doctorRepository.countByDepartment(d)))
                .collect(Collectors.toList());
    }

    public Department getDepartment(Long deptId) {
        return departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Department not found"));
    }

    public DepartmentDto updateDepartment(Long deptId, Department updated) {
        Department dept = getDepartment(deptId);
        dept.setName(updated.getName());
        dept.setDescription(updated.getDescription());
        Department saved = departmentRepository.save(dept);
        return DepartmentDto.from(saved, doctorRepository.countByDepartment(saved));
    }

    public void deleteDepartment(Long deptId) {
        Department dept = getDepartment(deptId);
        long count = doctorRepository.countByDepartment(dept);
        if (count > 0) {
            throw new RuntimeException(
                    "Cannot delete department with " + count + " assigned doctor(s). Reassign them first.");
        }
        departmentRepository.deleteById(deptId);
    }

    public DepartmentDto assignDoctors(Long deptId, List<Long> doctorIds) {
        Department dept = getDepartment(deptId);
        // Unassign all current doctors from this dept
        doctorRepository.findByDepartment(dept).forEach(d -> {
            d.setDepartment(null);
            doctorRepository.save(d);
        });
        // Assign selected doctors
        doctorIds.forEach(uid -> doctorRepository.findById(uid).ifPresent(d -> {
            d.setDepartment(dept);
            doctorRepository.save(d);
        }));
        return DepartmentDto.from(dept, doctorIds.size());
    }

    // ============ DOCTOR MANAGEMENT ============

    public Doctor registerDoctor(Long userId, String specialization, Integer yearsExp, Long deptId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"DOCTOR".equalsIgnoreCase(user.getRole() != null ? user.getRole().toString() : "")) {
            throw new RuntimeException("User must have DOCTOR role");
        }

        Department dept = null;
        if (deptId != null) {
            dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
        }

        Doctor doctor = new Doctor(userId, specialization, yearsExp);
        doctor.setDepartment(dept);
        return doctorRepository.save(doctor);
    }

    public Doctor registerDoctorFull(Long userId, String specialization, Integer yearsExp,
            Long deptId, Double consultationFee, String availability) {
        // Ensure user exists in MySQL — sync from MongoDB if needed
        if (!userRepository.existsById(userId)) {
            mongoUserRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null)
                    .forEach(u -> {
                        if (!userRepository.existsByEmail(u.getEmail())) {
                            User mysqlUser = new User();
                            mysqlUser.setEmail(u.getEmail());
                            mysqlUser.setName(u.getName());
                            mysqlUser.setPassword(u.getPassword() != null ? u.getPassword() : "");
                            mysqlUser.setRole(u.getRole() != null ? u.getRole().toUpperCase() : "PATIENT");
                            mysqlUser.setPhone(u.getPhone());
                            mysqlUser.setEnabled(true);
                            mysqlUser.setCreatedAt(
                                    u.getCreatedAt() != null ? u.getCreatedAt() : java.time.LocalDateTime.now());
                            userRepository.save(mysqlUser);
                        }
                    });
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if (!"DOCTOR".equalsIgnoreCase(user.getRole() != null ? user.getRole() : "")) {
            throw new RuntimeException("User must have DOCTOR role");
        }
        Department dept = deptId != null
                ? departmentRepository.findById(deptId).orElseThrow(() -> new RuntimeException("Department not found"))
                : null;
        Doctor doctor = new Doctor(userId, specialization, yearsExp);
        doctor.setDepartment(dept);
        doctor.setConsultationFee(consultationFee);
        doctor.setIsAvailable(true);
        if (availability != null) {
            doctor.setAvailability(availability);
        }
        return doctorRepository.save(doctor);
    }

    public List<DoctorDto> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(doc -> {
                    DoctorDto dto = DoctorDto.from(doc);
                    long count = appointmentRepository.findByDoctorId(doc.getUserId()).size();
                    dto.setAppointmentCount(count);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public DoctorDto getDoctorDetails(Long userId) {
        Doctor doc = doctorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        DoctorDto dto = DoctorDto.from(doc);
        long count = appointmentRepository.findByDoctorId(userId).size();
        dto.setAppointmentCount(count);
        return dto;
    }

    public void deleteDoctor(Long userId) {
        Doctor doc = doctorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctorRepository.delete(doc);
    }

    public List<Doctor> getDoctorsByDepartment(Long deptId) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        return doctorRepository.findByDepartment(dept);
    }

    public Doctor updateDoctor(Long userId, String specialization, Integer yearsExp, Long deptId) {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setSpecialization(specialization);
        doctor.setExperienceYears(yearsExp);
        if (deptId != null) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            doctor.setDepartment(dept);
        }
        return doctorRepository.save(doctor);
    }

    public Doctor updateDoctorFull(Long userId, String specialization, Integer yearsExp,
            Long deptId, Double consultationFee, Boolean isAvailable, String availability) {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (specialization != null)
            doctor.setSpecialization(specialization);
        if (yearsExp != null)
            doctor.setExperienceYears(yearsExp);
        if (consultationFee != null)
            doctor.setConsultationFee(consultationFee);
        if (isAvailable != null)
            doctor.setIsAvailable(isAvailable);
        if (availability != null)
            doctor.setAvailability(availability);
        if (deptId != null) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            doctor.setDepartment(dept);
        }
        return doctorRepository.save(doctor);
    }

    // ============ APPOINTMENT MANAGEMENT ============

    public java.util.List<java.util.Map<String, Object>> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::mapAppointmentWithNames)
                .collect(Collectors.toList());
    }

    public java.util.List<java.util.Map<String, Object>> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status).stream()
                .map(this::mapAppointmentWithNames)
                .collect(Collectors.toList());
    }

    private java.util.Map<String, Object> mapAppointmentWithNames(Appointment apt) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", apt.getId());
        map.put("patientId", apt.getPatientId());
        map.put("doctorId", apt.getDoctorId());
        map.put("scheduledAt", apt.getScheduledAt());
        map.put("status", apt.getStatus());
        map.put("notes", apt.getNotes());
        map.put("department", apt.getDepartment());
        map.put("timeSlot", apt.getTimeSlot());
        map.put("reason", apt.getReason());
        map.put("createdAt", apt.getCreatedAt());

        // Add patient info with nested object for fallback resolution
        if (apt.getPatientId() != null) {
            userRepository.findById(apt.getPatientId()).ifPresent(u -> {
                java.util.Map<String, Object> patientMap = new java.util.LinkedHashMap<>();
                patientMap.put("id", u.getId());
                patientMap.put("name", u.getName());
                patientMap.put("email", u.getEmail());
                map.put("patient", patientMap);
                if (u.getName() != null && !u.getName().isBlank()) {
                    map.put("patientName", u.getName());
                }
            });
        }

        // Use fallback patient name if database lookup failed
        if (!map.containsKey("patientName") && apt.getPatientName() != null && !apt.getPatientName().isBlank()) {
            map.put("patientName", apt.getPatientName());
            // Also put it in patient object when name lookup failed
            if (!map.containsKey("patient")) {
                java.util.Map<String, Object> patientMap = new java.util.LinkedHashMap<>();
                patientMap.put("name", apt.getPatientName());
                if (apt.getPatientEmail() != null)
                    patientMap.put("email", apt.getPatientEmail());
                map.put("patient", patientMap);
            }
        }

        // If still missing patientName, fall back to patientEmail if present
        if (!map.containsKey("patientName") && apt.getPatientEmail() != null && !apt.getPatientEmail().isBlank()) {
            map.put("patientName", apt.getPatientEmail());
            if (!map.containsKey("patient")) {
                java.util.Map<String, Object> patientMap = new java.util.LinkedHashMap<>();
                patientMap.put("email", apt.getPatientEmail());
                map.put("patient", patientMap);
            }
        }

        // Add doctor info with nested object for fallback resolution
        if (apt.getDoctorId() != null) {
            doctorRepository.findById(apt.getDoctorId()).ifPresent(doc -> {
                java.util.Map<String, Object> doctorMap = new java.util.LinkedHashMap<>();
                doctorMap.put("userId", doc.getUserId());
                doctorMap.put("specialization", doc.getSpecialization());
                String doctorName = null;
                if (doc.getUser() != null) {
                    doctorMap.put("name", doc.getUser().getName());
                    doctorMap.put("email", doc.getUser().getEmail());
                    doctorName = doc.getUser().getName();
                }
                map.put("doctor", doctorMap);
                if (doctorName != null && !doctorName.isBlank()) {
                    map.put("doctorName", doctorName);
                }
            });
        }

        // Use fallback doctor name if database lookup failed
        if (!map.containsKey("doctorName") && apt.getDoctorName() != null && !apt.getDoctorName().isBlank()) {
            map.put("doctorName", apt.getDoctorName());
            // Also put it in doctor object when name lookup failed
            if (!map.containsKey("doctor")) {
                java.util.Map<String, Object> doctorMap = new java.util.LinkedHashMap<>();
                doctorMap.put("name", apt.getDoctorName());
                if (apt.getDoctorEmail() != null)
                    doctorMap.put("email", apt.getDoctorEmail());
                map.put("doctor", doctorMap);
            }
        }

        return map;
    }

    public Appointment cancelAppointment(Long appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setStatus("CANCELLED");
        return appointmentRepository.save(apt);
    }

    public Appointment rescheduleAppointment(Long appointmentId, LocalDateTime newTime) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setScheduledAt(newTime);
        apt.setStatus("RESCHEDULED");
        return appointmentRepository.save(apt);
    }

    // ============ MEDICAL RECORD MONITORING ============

    public List<MedicalRecord> getAllRecords() {
        return recordRepository.findAll();
    }

    public List<MedicalRecord> getPatientRecords(Long patientId) {
        return recordRepository.findByPatientId(String.valueOf(patientId));
    }

    public long countRecords() {
        return recordRepository.count();
    }

    // ============ AI PREDICTIONS MONITORING ============

    public List<PredictionLog> getAllPredictionLogs() {
        return predictionLogRepository.findAll();
    }

    public List<PredictionLog> getRecentPredictions(int days) {
        LocalDateTime since = LocalDateTime.now().minus(days, ChronoUnit.DAYS);
        return predictionLogRepository.findRecent(since);
    }

    public long countPredictionsByType(PredictionLog.ModelType type) {
        return predictionLogRepository.countByModelType(type);
    }

    public long countTotalPredictions() {
        return predictionLogRepository.count();
    }

    // ============ NOTIFICATION MANAGEMENT ============

    public Notification createNotification(String title, String message, Notification.TargetRole targetRole) {
        Notification notif = new Notification(title, message, targetRole);
        return notificationRepository.save(notif);
    }

    public List<Notification> getUnsent() {
        return notificationRepository.findBySentAtIsNull();
    }

    public Notification broadcastNotification(Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notif.setSentAt(LocalDateTime.now());
        return notificationRepository.save(notif);
    }

    // ============ ANALYTICS ============

    public AnalyticsDto getSystemAnalytics() {
        long patients = countUsersByRole("PATIENT");
        long doctors = countUsersByRole("DOCTOR");
        long appointments = appointmentRepository.count();
        long records = recordRepository.count();
        long predictions = predictionLogRepository.count();
        long diabetesPred = countPredictionsByType(PredictionLog.ModelType.DIABETES);
        long heartPred = countPredictionsByType(PredictionLog.ModelType.HEART);
        long scheduled = appointmentRepository.countByStatus("SCHEDULED");
        long completed = appointmentRepository.countByStatus("COMPLETED");
        long cancelled = appointmentRepository.countByStatus("CANCELLED");

        return new AnalyticsDto(patients, doctors, appointments, records,
                predictions, diabetesPred, heartPred, scheduled, completed, cancelled);
    }

    private long countUsersByRole(String role) {
        return mongoUserRepository.findAll().stream()
                .filter(u -> role.equalsIgnoreCase(u.getRole()))
                .count();
    }

    // ============ AUDIT LOGGING ============

    public void logAuditAction(Long adminId, String action, String entityType, Long entityId, String details) {
        AuditLog log = new AuditLog(adminId, action, entityType, entityId, details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAuditLog(Long adminId) {
        return auditLogRepository.findByAdminId(adminId);
    }
}
