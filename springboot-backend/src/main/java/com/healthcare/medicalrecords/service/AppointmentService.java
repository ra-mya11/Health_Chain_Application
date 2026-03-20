package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.DoctorDto;
import com.healthcare.medicalrecords.entity.Appointment;
import com.healthcare.medicalrecords.entity.Doctor;
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

    public Map<String, Object> bookAppointment(Long patientId, Long doctorId,
                                               String date, String timeSlot,
                                               String department, String reason) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment apt = new Appointment();
        apt.setPatientId(patientId);
        apt.setDoctorId(doctorId);
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
                .stream().map(this::buildAppointmentResponse).collect(Collectors.toList());
    }

    public Map<String, Object> updateStatus(Long appointmentId, String status, String notes) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        apt.setStatus(status.toUpperCase());
        if (notes != null) apt.setNotes(notes);
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
                if (doc.getUser() != null) {
                    doctorMap.put("name", doc.getUser().getName());
                    doctorMap.put("email", doc.getUser().getEmail());
                }
                map.put("doctor", doctorMap);
            });
        }

        if (apt.getPatientId() != null) {
            userRepository.findById(apt.getPatientId()).ifPresent(u -> {
                Map<String, Object> patientMap = new LinkedHashMap<>();
                patientMap.put("id", u.getId());
                patientMap.put("name", u.getName());
                patientMap.put("email", u.getEmail());
                map.put("patient", patientMap);
            });
        }

        return map;
    }
}
