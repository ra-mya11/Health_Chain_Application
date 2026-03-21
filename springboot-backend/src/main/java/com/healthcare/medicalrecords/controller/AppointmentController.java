package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
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
    public ResponseEntity<List<Map<String, Object>>> getMyAppointments(@RequestParam Long patientId) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
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
    public ResponseEntity<Void> cancelAppointment(
            @PathVariable Long id, @RequestParam Long patientId) {
        appointmentService.cancelAppointment(id, patientId);
        return ResponseEntity.noContent().build();
    }
}
