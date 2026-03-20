package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByStatus(String status);

    @Query("SELECT a FROM Appointment a WHERE a.scheduledAt BETWEEN ?1 AND ?2")
    List<Appointment> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(String status);
}
