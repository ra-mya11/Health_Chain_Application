package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.AnalyticsDto;
import com.healthcare.medicalrecords.dto.DepartmentDto;
import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.dto.UserDto;
import com.healthcare.medicalrecords.entity.*;
import com.healthcare.medicalrecords.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired private AdminUserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private MedicalRecordJpaRepository recordRepository;
    @Autowired private PredictionLogRepository predictionLogRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AuditLogRepository auditLogRepository;

    // ============ USER MANAGEMENT ============

    public List<UserDto> getAllUsers() {
        // Get MySQL users
        List<UserDto> mysqlUsers = userRepository.findAll().stream()
                .map(UserDto::from).collect(Collectors.toList());

        // Also fetch from Node.js MongoDB to include users not yet in MySQL
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:3001/api/auth/all-users"))
                    .GET().build();
            java.net.http.HttpResponse<String> resp = client.send(req,
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode arr = mapper.readTree(resp.body());
                java.util.Set<String> mysqlEmails = mysqlUsers.stream()
                        .map(u -> u.email != null ? u.email.toLowerCase() : "")
                        .collect(java.util.stream.Collectors.toSet());
                long idx = mysqlUsers.stream().mapToLong(u -> u.id != null ? u.id : 0).max().orElse(0) + 1;
                for (com.fasterxml.jackson.databind.JsonNode n : arr) {
                    String email = n.path("email").asText("").toLowerCase();
                    if (!mysqlEmails.contains(email)) {
                        UserDto dto = new UserDto();
                        dto.id = idx++;
                        dto.name = n.path("name").asText("");
                        dto.email = email;
                        dto.role = n.path("role").asText("PATIENT").toUpperCase();
                        dto.enabled = true;
                        mysqlUsers.add(dto);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not fetch Node.js users: {}", e.getMessage());
        }
        return mysqlUsers;
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    public User approveUser(Long userId, boolean enable) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(enable);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.delete(userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found")));
    }

    public UserDto getUserDetails(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        UserDto dto = UserDto.from(user);
        dto.setAppointmentCount((long) appointmentRepository.findByPatientId(userId).size());
        return dto;
    }

    public User updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role.toUpperCase());
        return userRepository.save(user);
    }

    public User updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled("ACTIVE".equalsIgnoreCase(status));
        return userRepository.save(user);
    }

    // ============ DEPARTMENT MANAGEMENT ============

    public DepartmentDto createDepartment(Department dept) {
        if (departmentRepository.existsByName(dept.getName()))
            throw new RuntimeException("Department already exists: " + dept.getName());
        dept.setCreatedAt(LocalDateTime.now());
        dept.setUpdatedAt(LocalDateTime.now());
        return DepartmentDto.from(departmentRepository.save(dept), 0);
    }

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> DepartmentDto.from(d, doctorRepository.countByDepartment(d)))
                .collect(Collectors.toList());
    }

    public Department getDepartment(Long deptId) {
        return departmentRepository.findById(deptId).orElseThrow(() -> new RuntimeException("Department not found"));
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
        if (count > 0) throw new RuntimeException("Cannot delete department with " + count + " assigned doctor(s).");
        departmentRepository.deleteById(deptId);
    }

    public DepartmentDto assignDoctors(Long deptId, List<Long> doctorIds) {
        Department dept = getDepartment(deptId);
        doctorRepository.findByDepartment(dept).forEach(d -> { d.setDepartment(null); doctorRepository.save(d); });
        doctorIds.forEach(uid -> doctorRepository.findById(uid).ifPresent(d -> { d.setDepartment(dept); doctorRepository.save(d); }));
        return DepartmentDto.from(dept, doctorIds.size());
    }

    // ============ DOCTOR MANAGEMENT ============

    public Doctor registerDoctor(Long userId, String specialization, Integer yearsExp, Long deptId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (!"DOCTOR".equalsIgnoreCase(user.getRole())) throw new RuntimeException("User must have DOCTOR role");
        Department dept = deptId != null ? departmentRepository.findById(deptId).orElseThrow(() -> new RuntimeException("Department not found")) : null;
        Doctor doctor = new Doctor(userId, specialization, yearsExp);
        doctor.setDepartment(dept);
        return doctorRepository.save(doctor);
    }

    public Doctor registerDoctorFull(Long userId, String specialization, Integer yearsExp,
            Long deptId, Double consultationFee, String availability) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if (!"DOCTOR".equalsIgnoreCase(user.getRole())) throw new RuntimeException("User must have DOCTOR role");
        Department dept = deptId != null ? departmentRepository.findById(deptId).orElseThrow(() -> new RuntimeException("Department not found")) : null;
        Doctor doctor = new Doctor(userId, specialization, yearsExp);
        doctor.setDepartment(dept);
        doctor.setConsultationFee(consultationFee);
        doctor.setIsAvailable(true);
        if (availability != null) doctor.setAvailability(availability);
        return doctorRepository.save(doctor);
    }

    public List<DoctorDto> getAllDoctors() {
        return doctorRepository.findAll().stream().map(doc -> {
            DoctorDto dto = DoctorDto.from(doc);
            dto.setAppointmentCount((long) appointmentRepository.findByDoctorId(doc.getUserId()).size());
            return dto;
        }).collect(Collectors.toList());
    }

    public DoctorDto getDoctorDetails(Long userId) {
        Doctor doc = doctorRepository.findById(userId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        DoctorDto dto = DoctorDto.from(doc);
        dto.setAppointmentCount((long) appointmentRepository.findByDoctorId(userId).size());
        return dto;
    }

    public void deleteDoctor(Long userId) {
        doctorRepository.delete(doctorRepository.findById(userId).orElseThrow(() -> new RuntimeException("Doctor not found")));
    }

    public List<Doctor> getDoctorsByDepartment(Long deptId) {
        return doctorRepository.findByDepartment(getDepartment(deptId));
    }

    public Doctor updateDoctor(Long userId, String specialization, Integer yearsExp, Long deptId) {
        Doctor doctor = doctorRepository.findById(userId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setSpecialization(specialization);
        doctor.setExperienceYears(yearsExp);
        if (deptId != null) doctor.setDepartment(getDepartment(deptId));
        return doctorRepository.save(doctor);
    }

    public Doctor updateDoctorFull(Long userId, String specialization, Integer yearsExp,
            Long deptId, Double consultationFee, Boolean isAvailable, String availability) {
        Doctor doctor = doctorRepository.findById(userId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (specialization != null) doctor.setSpecialization(specialization);
        if (yearsExp != null) doctor.setExperienceYears(yearsExp);
        if (consultationFee != null) doctor.setConsultationFee(consultationFee);
        if (isAvailable != null) doctor.setIsAvailable(isAvailable);
        if (availability != null) doctor.setAvailability(availability);
        if (deptId != null) doctor.setDepartment(getDepartment(deptId));
        return doctorRepository.save(doctor);
    }

    // ============ APPOINTMENT MANAGEMENT ============

    public List<java.util.Map<String, Object>> getAllAppointments() {
        return appointmentRepository.findAll().stream().map(this::mapAppointment).collect(Collectors.toList());
    }

    public List<java.util.Map<String, Object>> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status).stream().map(this::mapAppointment).collect(Collectors.toList());
    }

    private java.util.Map<String, Object> mapAppointment(Appointment apt) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", apt.getId()); map.put("patientId", apt.getPatientId());
        map.put("doctorId", apt.getDoctorId()); map.put("scheduledAt", apt.getScheduledAt());
        map.put("status", apt.getStatus()); map.put("notes", apt.getNotes());
        map.put("department", apt.getDepartment()); map.put("timeSlot", apt.getTimeSlot());
        map.put("reason", apt.getReason()); map.put("createdAt", apt.getCreatedAt());
        if (apt.getPatientId() != null) {
            userRepository.findById(apt.getPatientId()).ifPresent(u -> {
                map.put("patient", java.util.Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail()));
                map.put("patientName", u.getName());
            });
        }
        if (!map.containsKey("patientName") && apt.getPatientName() != null) map.put("patientName", apt.getPatientName());
        if (apt.getDoctorId() != null) {
            doctorRepository.findById(apt.getDoctorId()).ifPresent(doc -> {
                java.util.Map<String, Object> dm = new java.util.LinkedHashMap<>();
                dm.put("userId", doc.getUserId()); dm.put("specialization", doc.getSpecialization());
                if (doc.getUser() != null) { dm.put("name", doc.getUser().getName()); dm.put("email", doc.getUser().getEmail()); map.put("doctorName", doc.getUser().getName()); }
                map.put("doctor", dm);
            });
        }
        if (!map.containsKey("doctorName") && apt.getDoctorName() != null) map.put("doctorName", apt.getDoctorName());
        return map;
    }

    public Appointment cancelAppointment(Long appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId).orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setStatus("CANCELLED");
        return appointmentRepository.save(apt);
    }

    public Appointment rescheduleAppointment(Long appointmentId, LocalDateTime newTime) {
        Appointment apt = appointmentRepository.findById(appointmentId).orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setScheduledAt(newTime); apt.setStatus("RESCHEDULED");
        return appointmentRepository.save(apt);
    }

    // ============ MEDICAL RECORD MONITORING ============

    public List<java.util.Map<String, Object>> getAllMedicalRecords() {
        return recordRepository.findAll().stream().map(this::mapMedicalRecord).collect(Collectors.toList());
    }

    public List<java.util.Map<String, Object>> getMedicalRecordsByPatient(Long patientId) {
        return recordRepository.findByPatientIdOrderByUploadedAtDesc(patientId)
                .stream().map(this::mapMedicalRecord).collect(Collectors.toList());
    }

    private java.util.Map<String, Object> mapMedicalRecord(MedicalRecord r) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("recordId", r.getRecordId());
        map.put("patientId", r.getPatientId());
        map.put("doctorId", r.getDoctorId());
        map.put("ipfsHash", r.getIpfsHash());
        map.put("fileName", r.getFileName());
        map.put("fileType", r.getFileType());
        map.put("recordType", r.getRecordType());
        map.put("fileSize", r.getFileSize());
        map.put("blockchainTxHash", r.getBlockchainTxHash());
        map.put("hospitalName", r.getHospitalName());
        map.put("visibility", r.getVisibility());
        map.put("uploadedAt", r.getUploadedAt());
        map.put("storageType", r.getStorageType());
        map.put("dateOfRecord", r.getDateOfRecord());
        map.put("notes", r.getNotes());
        map.put("tags", r.getTags());
        map.put("verified", r.isVerified());

        if (r.getPatientId() != null) {
            userRepository.findById(r.getPatientId()).ifPresent(u -> map.put("patientName", u.getName()));
        }
        if (!map.containsKey("patientName")) {
            map.put("patientName", "Unknown");
        }

        if (r.getDoctorName() != null) {
            map.put("doctorName", r.getDoctorName());
        } else if (r.getDoctorId() != null) {
            doctorRepository.findById(r.getDoctorId()).ifPresent(d -> {
                map.put("doctorName", d.getUser() != null ? d.getUser().getName() : "(Doctor " + d.getUserId() + ")");
            });
        }

        return map;
    }

    public List<MedicalRecord> getAllRecords() { return recordRepository.findAll(); }

    public List<MedicalRecord> getPatientRecords(Long patientId) {
        return recordRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
    }

    public long countRecords() { return recordRepository.count(); }

    // ============ AI PREDICTIONS MONITORING ============

    public List<PredictionLog> getAllPredictionLogs() { return predictionLogRepository.findAll(); }

    public List<PredictionLog> getRecentPredictions(int days) {
        return predictionLogRepository.findRecent(LocalDateTime.now().minus(days, ChronoUnit.DAYS));
    }

    public long countPredictionsByType(PredictionLog.ModelType type) { return predictionLogRepository.countByModelType(type); }

    // ============ NOTIFICATION MANAGEMENT ============

    public Notification createNotification(String title, String message, Notification.TargetRole targetRole) {
        return notificationRepository.save(new Notification(title, message, targetRole));
    }

    public List<Notification> getUnsent() { return notificationRepository.findBySentAtIsNull(); }

    public Notification broadcastNotification(Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId).orElseThrow(() -> new RuntimeException("Notification not found"));
        notif.setSentAt(LocalDateTime.now());
        return notificationRepository.save(notif);
    }

    // ============ ANALYTICS ============

    public AnalyticsDto getSystemAnalytics() {
        long patients = userRepository.findByRole("PATIENT").size();
        long doctors = userRepository.findByRole("DOCTOR").size();
        long appointments = appointmentRepository.count();
        long records = recordRepository.count();
        long predictions = predictionLogRepository.count();
        long diabetesPred = countPredictionsByType(PredictionLog.ModelType.DIABETES);
        long heartPred = countPredictionsByType(PredictionLog.ModelType.HEART);
        long scheduled = appointmentRepository.countByStatus("SCHEDULED");
        long completed = appointmentRepository.countByStatus("COMPLETED");
        long cancelled = appointmentRepository.countByStatus("CANCELLED");
        return new AnalyticsDto(patients, doctors, appointments, records, predictions, diabetesPred, heartPred, scheduled, completed, cancelled);
    }

    // ============ AUDIT LOGGING ============

    public void logAuditAction(Long adminId, String action, String entityType, Long entityId, String details) {
        auditLogRepository.save(new AuditLog(adminId, action, entityType, entityId, details));
    }

    public List<AuditLog> getAuditLog(Long adminId) { return auditLogRepository.findByAdminId(adminId); }
}
