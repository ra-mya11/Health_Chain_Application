package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.model.MedicalRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for medical record persistence and queries
 */
@Repository
public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {
    
    /**
     * Find all records for a patient
     */
    List<MedicalRecord> findByPatientId(String patientId);
    
    /**
     * Find all records uploaded by a doctor
     */
    List<MedicalRecord> findByDoctorId(String doctorId);
    
    /**
     * Find a specific record by record ID
     */
    Optional<MedicalRecord> findByRecordId(String recordId);
    
    /**
     * Find records by patient and type
     */
    List<MedicalRecord> findByPatientIdAndRecordType(String patientId, String recordType);
    
    /**
     * Find records by IPFS hash
     */
    Optional<MedicalRecord> findByIpfsHash(String ipfsHash);
    
    /**
     * Find records by blockchain transaction hash
     */
    Optional<MedicalRecord> findByBlockchainTxHash(String blockchainTxHash);
    
    /**
     * Find verified records
     */
    List<MedicalRecord> findByPatientIdAndVerifiedTrue(String patientId);
    
    /**
     * Find records uploaded within a date range
     */
    @Query("{ 'patientId': ?0, 'uploadedAt': { $gte: ?1, $lte: ?2 } }")
    List<MedicalRecord> findRecordsByDateRange(String patientId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Count records for a patient
     */
    long countByPatientId(String patientId);
    
    /**
     * Count verified records for a patient
     */
    long countByPatientIdAndVerifiedTrue(String patientId);
}
