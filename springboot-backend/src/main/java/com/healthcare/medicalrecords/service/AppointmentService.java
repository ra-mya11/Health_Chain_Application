package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.entity.Appointment;
import com.healthcare.medicalrecords.entity.Doctor;
import com.healthcare.medicalrecords.entity.User;
import com.healthcare.medicalrecords.repository.AppointmentRepository;
import com.healthcare.medicalrecords.repository.DoctorRepository;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final AdminUserRepository userRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            AdminUserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    public List<DoctorDto> getAvailableDoctors(String specialization) {
        List<Doctor> doctors = specialization != null && !specialization.isBlank()
                ? doctorRepository.findBySpecialization(specialization)
                : doctorRepository.findAll();
        return doctors.stream().map(DoctorDto::from).collect(Collectors.toList());
    }

    public Map<String, Object> bookAppointment(Long patientId, String patientEmail, String patientName, Long doctorId,
            String date, String timeSlot,
            String department, String reason) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Handle patient lookup and name resolution
        final Long finalPatientId;
        final String finalPatientName;

        if (patientId == null && patientEmail != null && !patientEmail.isEmpty()) {
            var user = userRepository.findByEmail(patientEmail);
            if (user.isPresent()) {
                finalPatientId = user.get().getId();
                finalPatientName = user.get().getName();
            } else {
                // Allow booking without patient ID if email is provided but user not in MySQL
                System.out.println("Patient with email " + patientEmail + " not found in MySQL");
                finalPatientId = null;
                finalPatientName = (patientName != null && !patientName.isBlank())
                        ? patientName
                        : patientEmail;
            }
        } else if (patientId != null) {
            // If patientId exists, try to get the patient name for fallback
            finalPatientId = patientId;
            var userOpt = userRepository.findById(patientId);
            if (userOpt.isPresent()) {
                finalPatientName = userOpt.get().getName();
            } else {
                finalPatientName = (patientName != null && !patientName.isBlank())
                        ? patientName
                        : patientEmail;
            }
        } else {
            finalPatientId = null;
            finalPatientName = (patientName != null && !patientName.isBlank())
                    ? patientName
                    : (patientEmail != null && !patientEmail.isBlank() ? patientEmail : "Unknown Patient");
        }

        // Get doctor name for fallback
        String doctorName = doctor.getUser() != null ? doctor.getUser().getName() : null;
        String doctorEmail = doctor.getUser() != null ? doctor.getUser().getEmail() : null;

        Appointment apt = new Appointment();
        apt.setPatientId(finalPatientId);
        apt.setPatientEmail(patientEmail);
        apt.setPatientName(finalPatientName); // Store as fallback
        apt.setDoctorId(doctorId);
        apt.setDoctorName(doctorName); // Store doctor name for fallback
        apt.setDoctorEmail(doctorEmail); // Store doctor email for fallback
        apt.setDepartment(department != null ? department : doctor.getSpecialization());
        apt.setTimeSlot(timeSlot);
        apt.setReason(reason);
        apt.setScheduledAt(LocalDateTime.of(LocalDate.parse(date), LocalTime.MIDNIGHT));
        apt.setStatus("SCHEDULED");

        return buildAppointmentResponse(appointmentRepository.save(apt));
    }

    public List<Map<String, Object>> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId)
                .stream().map(this::buildAppointmentResponse).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .filter(apt -> apt.getStatus() == null || !"CANCELLED".equalsIgnoreCase(apt.getStatus()))
                .map(this::buildAppointmentResponse)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDoctorAppointmentsByEmail(String doctorEmail) {
        // Find the doctor's MySQL userId from their email
        User doctorUser = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found with email: " + doctorEmail));

        // Find the doctor record to get the doctorId
        Doctor doctor = doctorRepository.findByUserId(doctorUser.getId())
                .orElseThrow(() -> new RuntimeException("Doctor record not found for user: " + doctorUser.getId()));

        return getDoctorAppointments(doctor.getUserId());
    }

    public Map<String, Object> updateStatus(Long appointmentId, String status, String notes) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setStatus(status.toUpperCase());
        if (notes != null)
            apt.setNotes(notes);
        return buildAppointmentResponse(appointmentRepository.save(apt));
    }

    public void cancelAppointment(Long appointmentId, Long patientId) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        if (!apt.getPatientId().equals(patientId))
            throw new RuntimeException("Not authorized");
        apt.setStatus("CANCELLED");
        appointmentRepository.save(apt);
    }

    private Map<String, Object> buildAppointmentResponse(Appointment apt) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", apt.getId());
        map.put("status", apt.getStatus());
        map.put("department", apt.getDepartment());
        map.put("timeSlot", apt.getTimeSlot());
        map.put("reason", apt.getReason());
        map.put("notes", apt.getNotes());
        map.put("scheduledAt", apt.getScheduledAt() != null ? apt.getScheduledAt().toLocalDate().toString() : null);
        map.put("createdAt", apt.getCreatedAt());

        if (apt.getDoctorId() != null) {
            doctorRepository.findById(apt.getDoctorId()).ifPresent(doc -> {
                Map<String, Object> doctorMap = new LinkedHashMap<>();
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
                Map<String, Object> doctorMap = new LinkedHashMap<>();
                doctorMap.put("name", apt.getDoctorName());
                if (apt.getDoctorEmail() != null)
                    doctorMap.put("email", apt.getDoctorEmail());
                map.put("doctor", doctorMap);
            }
        }

        if (apt.getPatientId() != null) {
            userRepository.findById(apt.getPatientId()).ifPresent(u -> {
                Map<String, Object> patientMap = new LinkedHashMap<>();
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

        return map;
    }
}
