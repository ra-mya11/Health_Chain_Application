package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.repository.AdminUserRepository;
import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.entity.Notification;
import com.healthcare.medicalrecords.repository.NotificationRepository;
import com.healthcare.medicalrecords.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final NotificationRepository notificationRepository;
    private final AdminUserRepository userRepository;

    public AppointmentController(AppointmentService appointmentService,
            NotificationRepository notificationRepository,
            AdminUserRepository userRepository) {
        this.appointmentService = appointmentService;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // Resolve MySQL numeric id by email — called after login
    @GetMapping("/resolve-id")
    public ResponseEntity<Map<String, Object>> resolveId(@RequestParam String email) {
        return userRepository.findByEmail(email)
            .map(u -> ResponseEntity.ok(Map.<String, Object>of("mysqlId", u.getId(), "name", u.getName())))
            .orElse(ResponseEntity.ok(Map.of()));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotificationsForRole(@RequestParam String role) {
        List<Notification.TargetRole> roles = Arrays.asList(
            Notification.TargetRole.ALL,
            Notification.TargetRole.valueOf(role.toUpperCase())
        );
        return ResponseEntity.ok(notificationRepository.findByTargetRoleInAndSentAtIsNotNull(roles));
    }

    @GetMapping("/doctors/available")
    public ResponseEntity<List<DoctorDto>> getAvailableDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String department) {
        String filter = specialization != null ? specialization : department;
        return ResponseEntity.ok(appointmentService.getAvailableDoctors(filter));
    }

    @PostMapping("/book")
    public ResponseEntity<Map<String, Object>> bookAppointment(
            @RequestBody Map<String, String> body) {
        Long patientId = null;
        String patientEmail = body.get("patientEmail");
        String patientName = body.get("patientName");

        // Try to parse patientId if provided
        if (body.get("patientId") != null && !body.get("patientId").isEmpty()) {
            try {
                patientId = Long.parseLong(body.get("patientId"));
            } catch (NumberFormatException e) {
                // patientId is a MongoDB ObjectId or invalid, will use email to look up
                patientId = null;
            }
        }

        Long doctorId = Long.parseLong(body.get("doctorId"));
        return ResponseEntity.ok(appointmentService.bookAppointment(
                patientId, patientEmail, patientName, doctorId,
                body.get("date"), body.get("timeSlot"),
                body.get("department"), body.get("reason")));
    }

    @GetMapping("/my-appointments")
    public ResponseEntity<List<Map<String, Object>>> getMyAppointments(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String patientEmail) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId, patientEmail));
    }

    @GetMapping("/doctor-appointments")
    public ResponseEntity<List<Map<String, Object>>> getDoctorAppointments(
            @RequestParam(value = "doctorId", required = false) Long doctorId,
            @RequestParam(value = "doctorEmail", required = false) String doctorEmail) {
        if (doctorId != null) {
            return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
        } else if (doctorEmail != null) {
            return ResponseEntity.ok(appointmentService.getDoctorAppointmentsByEmail(doctorEmail));
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(appointmentService.updateStatus(
                id, body.get("status"), body.get("notes")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> cancelAppointment(@PathVariable Long id) {
        // No parameters needed - authorization is handled in service layer
        appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully"));
    }
}
