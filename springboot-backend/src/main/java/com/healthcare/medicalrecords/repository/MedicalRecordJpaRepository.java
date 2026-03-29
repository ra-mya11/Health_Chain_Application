package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordJpaRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByUploadedAtDesc(Long patientId);

    List<MedicalRecord> findByDoctorIdOrderByUploadedAtDesc(Long doctorId);

    Optional<MedicalRecord> findByRecordId(String recordId);

    List<MedicalRecord> findByPatientIdAndRecordTypeOrderByUploadedAtDesc(Long patientId, String recordType);

    Optional<MedicalRecord> findByIpfsHash(String ipfsHash);
}
