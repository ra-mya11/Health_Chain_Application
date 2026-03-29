package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.dto.AnalyticsDto;
import com.healthcare.medicalrecords.dto.DepartmentDto;
import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.dto.UserDto;
import com.healthcare.medicalrecords.entity.*;
import com.healthcare.medicalrecords.entity.MedicalRecord;
import com.healthcare.medicalrecords.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.healthcare.medicalrecords.repository.NotificationRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private NotificationRepository notificationRepository;

    // ============ USER MANAGEMENT ============

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> listAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(adminService.getUsersByRole(role));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserDetails(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDetails(id));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        adminService.updateUserRole(id, role);
        adminService.logAuditAction(getCurrentAdminId(), "UPDATE_ROLE", "User", id, "Role changed to " + role);
        return ResponseEntity.ok(adminService.getUserDetails(id));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<User> approveUser(@PathVariable Long id, @RequestParam boolean enabled) {
        User user = adminService.approveUser(id, enabled);
        adminService.logAuditAction(getCurrentAdminId(), "APPROVE_USER", "User", id,
                "User " + (enabled ? "enabled" : "disabled"));
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        adminService.logAuditAction(getCurrentAdminId(), "DELETE_USER", "User", id, "User deleted");
        return ResponseEntity.ok("User deleted successfully");
    }

    // ============ DEPARTMENT MANAGEMENT ============

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDto> createDepartment(@RequestBody Department dept) {
        DepartmentDto created = adminService.createDepartment(dept);
        adminService.logAuditAction(getCurrentAdminId(), "CREATE_DEPARTMENT", "Department",
                created.getId(), "Department created: " + created.getName());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> listDepartments() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<Department> getDepartment(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getDepartment(id));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentDto> updateDepartment(@PathVariable Long id,
            @RequestBody Department updated) {
        DepartmentDto dept = adminService.updateDepartment(id, updated);
        adminService.logAuditAction(getCurrentAdminId(), "UPDATE_DEPARTMENT", "Department", id,
                "Department updated: " + updated.getName());
        return ResponseEntity.ok(dept);
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            adminService.deleteDepartment(id);
            adminService.logAuditAction(getCurrentAdminId(), "DELETE_DEPARTMENT", "Department", id,
                    "Department deleted");
            return ResponseEntity.ok("Department deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/departments/{id}/assign-doctors")
    public ResponseEntity<DepartmentDto> assignDoctors(@PathVariable Long id,
            @RequestBody java.util.List<Long> doctorIds) {
        return ResponseEntity.ok(adminService.assignDoctors(id, doctorIds));
    }

    // ============ DOCTOR MANAGEMENT ============

    @PostMapping("/doctors")
    public ResponseEntity<DoctorDto> registerDoctor(
            @RequestParam Long userId,
            @RequestParam String specialization,
            @RequestParam Integer experienceYears,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Double consultationFee,
            @RequestParam(required = false) String availability) {
        Doctor doc = adminService.registerDoctorFull(userId, specialization, experienceYears, departmentId,
                consultationFee, availability);
        adminService.logAuditAction(getCurrentAdminId(), "REGISTER_DOCTOR", "Doctor", userId,
                "Doctor registered: " + specialization);
        return ResponseEntity.ok(DoctorDto.from(doc));
    }

    @GetMapping("/doctors/{userId}")
    public ResponseEntity<DoctorDto> getDoctorDetails(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getDoctorDetails(userId));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorDto>> listDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    @GetMapping("/doctors/department/{deptId}")
    public ResponseEntity<List<Doctor>> getDoctorsByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(adminService.getDoctorsByDepartment(deptId));
    }

    @PutMapping("/doctors/{userId}")
    public ResponseEntity<DoctorDto> updateDoctor(
            @PathVariable Long userId,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer experienceYears,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Double consultationFee,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) String availability) {
        Doctor doc = adminService.updateDoctorFull(userId, specialization, experienceYears, departmentId,
                consultationFee, isAvailable, availability);
        adminService.logAuditAction(getCurrentAdminId(), "UPDATE_DOCTOR", "Doctor", userId,
                "Doctor updated: " + specialization);
        return ResponseEntity.ok(DoctorDto.from(doc));
    }

    @PatchMapping("/doctors/{userId}/availability")
    public ResponseEntity<DoctorDto> toggleAvailability(@PathVariable Long userId,
            @RequestParam boolean available) {
        Doctor doc = adminService.updateDoctorFull(userId, null, null, null, null, available, null);
        return ResponseEntity.ok(DoctorDto.from(doc));
    }

    @DeleteMapping("/doctors/{userId}")
    public ResponseEntity<String> deleteDoctor(@PathVariable Long userId) {
        adminService.deleteDoctor(userId);
        adminService.logAuditAction(getCurrentAdminId(), "DELETE_DOCTOR", "Doctor", userId, "Doctor deleted");
        return ResponseEntity.ok("Doctor deleted successfully");
    }

    // ============ APPOINTMENT MANAGEMENT ============

    @GetMapping("/appointments")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> listAppointments() {
        return ResponseEntity.ok(adminService.getAllAppointments());
    }

    @GetMapping("/appointments/status/{status}")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getAppointmentsByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(adminService.getAppointmentsByStatus(status));
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id) {
        Appointment apt = adminService.cancelAppointment(id);
        adminService.logAuditAction(getCurrentAdminId(), "CANCEL_APPOINTMENT", "Appointment", id,
                "Appointment cancelled");
        return ResponseEntity.ok(apt);
    }

    @PutMapping("/appointments/{id}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newTime) {
        Appointment apt = adminService.rescheduleAppointment(id, newTime);
        adminService.logAuditAction(getCurrentAdminId(), "RESCHEDULE_APPOINTMENT", "Appointment", id,
                "Appointment rescheduled to " + newTime);
        return ResponseEntity.ok(apt);
    }

    // ============ MEDICAL RECORD MONITORING ============

    @GetMapping("/records")
    public ResponseEntity<List<MedicalRecord>> listRecords() {
        return ResponseEntity.ok(adminService.getAllRecords());
    }

    @GetMapping("/records/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(@PathVariable Long patientId) {
        return ResponseEntity.ok(adminService.getPatientRecords(patientId));
    }
    @GetMapping("/medical-records")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> listMedicalRecords() {
        return ResponseEntity.ok(adminService.getAllMedicalRecords());
    }

    @GetMapping("/medical-records/{patientId}")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getMedicalRecordsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(adminService.getMedicalRecordsByPatient(patientId));
    }
    // ============ AI PREDICTIONS MONITORING ============

    @GetMapping("/ai/logs")
    public ResponseEntity<List<PredictionLog>> getPredictionLogs() {
        return ResponseEntity.ok(adminService.getAllPredictionLogs());
    }

    @GetMapping("/ai/logs/recent")
    public ResponseEntity<List<PredictionLog>> getRecentPredictions(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(adminService.getRecentPredictions(days));
    }

    // ============ NOTIFICATION MANAGEMENT ============

    @PostMapping("/notifications")
    public ResponseEntity<Notification> createNotification(
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(defaultValue = "ALL") String targetRole) {
        Notification.TargetRole role = Notification.TargetRole.valueOf(targetRole);
        Notification notif = adminService.createNotification(title, message, role);
        adminService.logAuditAction(getCurrentAdminId(), "CREATE_NOTIFICATION", "Notification",
                notif.getId(), "Notification created");
        return ResponseEntity.ok(notif);
    }

    @GetMapping("/notifications/unsent")
    public ResponseEntity<List<Notification>> getUnsentNotifications() {
        return ResponseEntity.ok(adminService.getUnsent());
    }

    @PatchMapping("/notifications/{id}/broadcast")
    public ResponseEntity<Notification> broadcastNotification(@PathVariable Long id) {
        Notification notif = adminService.broadcastNotification(id);
        adminService.logAuditAction(getCurrentAdminId(), "BROADCAST_NOTIFICATION", "Notification", id,
                "Notification broadcasted");
        return ResponseEntity.ok(notif);
    }

    // ============ ANALYTICS ============

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(adminService.getSystemAnalytics());
    }

    // ============ AUDIT LOG ============

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLog(getCurrentAdminId()));
    }

    private Long getCurrentAdminId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof String principal) {
                return Long.parseLong(principal);
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
