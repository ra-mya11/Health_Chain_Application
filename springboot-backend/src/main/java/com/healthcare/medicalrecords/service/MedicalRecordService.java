package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.*;
import com.healthcare.medicalrecords.model.MedicalRecord;
import com.healthcare.medicalrecords.repository.MedicalRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private static final Logger log = LoggerFactory.getLogger(MedicalRecordService.class);
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MedicalRecordRepository repository;
    private final IPFSService ipfsService;
    private final BlockchainService blockchainService;

    public MedicalRecordService(MedicalRecordRepository repository, IPFSService ipfsService, BlockchainService blockchainService) {
        this.repository = repository;
        this.ipfsService = ipfsService;
        this.blockchainService = blockchainService;
    }
    
    /**
     * Upload a new medical record to IPFS and blockchain
     */
    public UploadResponse uploadRecord(MultipartFile file, String patientId,
                                      String doctorId, String recordType,
                                      String doctorName, String hospitalName,
                                      String dateOfRecord, String notes,
                                      String tags, String visibility, String uploadedBy) {
        try {
            if (file.isEmpty()) {
                log.warn("Attempted upload with empty file for patient: {}", patientId);
                return new UploadResponse(null, null, null, "File is empty", false);
            }
            
            String recordId = UUID.randomUUID().toString();
            log.info("Starting upload for record: {}, patient: {}, doctor: {}", recordId, patientId, doctorId);
            
            String ipfsHash = ipfsService.uploadFile(file);
            log.info("File uploaded to IPFS with hash: {}", ipfsHash);
            
            String txHash = blockchainService.addRecord(recordId, ipfsHash, patientId, doctorId, recordType);
            log.info("Record added to blockchain with transaction: {}", txHash);
            
            MedicalRecord record = new MedicalRecord();
            record.setRecordId(recordId);
            record.setPatientId(patientId);
            record.setDoctorId(doctorId);
            record.setIpfsHash(ipfsHash);
            record.setFileName(file.getOriginalFilename());
            record.setFileType(file.getContentType());
            record.setRecordType(recordType);
            record.setFileSize(file.getSize());
            record.setBlockchainTxHash(txHash);
            record.setVerified(true);
            record.setDoctorName(doctorName);
            record.setHospitalName(hospitalName);
            record.setDateOfRecord(dateOfRecord);
            record.setNotes(notes);
            record.setVisibility(visibility != null ? visibility : "DOCTOR_ONLY");
            record.setUploadedBy(uploadedBy);
            if (tags != null && !tags.isBlank()) {
                record.setTags(java.util.Arrays.asList(tags.split(",")));
            }
            
            MedicalRecord savedRecord = repository.save(record);
            log.info("Record metadata saved to MongoDB: {}", savedRecord.getId());
            
            return UploadResponse.builder()
                .recordId(recordId)
                .ipfsHash(ipfsHash)
                .blockchainTxHash(txHash)
                .message("Record uploaded successfully")
                .success(true)
                .build();
            
        } catch (Exception e) {
            log.error("Error uploading record", e);
            return UploadResponse.builder()
                .message("Upload failed: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Get all records for a patient
     */
    public PatientRecordsResponse getRecordsByPatientId(String patientId) {
        try {
            List<MedicalRecord> records = repository.findByPatientId(patientId);
            
            List<RecordDetailsResponse> recordDetails = records.stream()
                .map(this::mapToRecordDetails)
                .collect(Collectors.toList());
            
            return PatientRecordsResponse.builder()
                .patientId(patientId)
                .records(recordDetails)
                .totalRecords(recordDetails.size())
                .message("Records retrieved successfully")
                .success(true)
                .build();
                
        } catch (Exception e) {
            log.error("Error retrieving records for patient: {}", patientId, e);
            return PatientRecordsResponse.builder()
                .patientId(patientId)
                .message("Error retrieving records: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Get records by doctor ID
     */
    public PatientRecordsResponse getRecordsByDoctorId(String doctorId) {
        try {
            List<MedicalRecord> records = repository.findByDoctorId(doctorId);
            
            List<RecordDetailsResponse> recordDetails = records.stream()
                .map(this::mapToRecordDetails)
                .collect(Collectors.toList());
            
            return PatientRecordsResponse.builder()
                .patientId(doctorId)  // Using patientId field for doctorId
                .records(recordDetails)
                .totalRecords(recordDetails.size())
                .message("Doctor records retrieved successfully")
                .success(true)
                .build();
                
        } catch (Exception e) {
            log.error("Error retrieving records for doctor: {}", doctorId, e);
            return PatientRecordsResponse.builder()
                .message("Error retrieving records: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Get a specific record by record ID
     */
    public RecordDetailsResponse getRecordById(String recordId) {
        try {
            return repository.findByRecordId(recordId)
                .map(this::mapToRecordDetails)
                .orElse(RecordDetailsResponse.builder()
                    .recordId(recordId)
                    .message("Record not found")
                    .success(false)
                    .build());
                    
        } catch (Exception e) {
            log.error("Error retrieving record: {}", recordId, e);
            return RecordDetailsResponse.builder()
                .recordId(recordId)
                .message("Error retrieving record: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Download a file from IPFS
     */
    public byte[] downloadRecord(String ipfsHash) throws Exception {
        log.info("Downloading record from IPFS: {}", ipfsHash);
        return ipfsService.downloadFile(ipfsHash);
    }

    public List<MedicalRecord> getAllRecords() {
        return repository.findAll();
    }

    public PatientRecordsResponse getAllRecordsMapped() {
        List<RecordDetailsResponse> records = repository.findAll().stream()
            .map(this::mapToRecordDetails)
            .collect(Collectors.toList());
        return PatientRecordsResponse.builder()
            .records(records)
            .totalRecords(records.size())
            .message("All records retrieved")
            .success(true)
            .build();
    }
    
    /**
     * Verify record integrity using blockchain
     */
    public VerificationResponse verifyRecord(String recordId) {
        try {
            MedicalRecord record = repository.findByRecordId(recordId).orElse(null);
            
            if (record == null) {
                log.warn("Record not found for verification: {}", recordId);
                return VerificationResponse.builder()
                    .recordId(recordId)
                    .verified(false)
                    .message("Record not found in database")
                    .build();
            }
            
            // Verify with blockchain
            boolean isValid = blockchainService.verifyRecord(recordId, record.getIpfsHash());
            
            log.info("Record {} verification result: {}", recordId, isValid);
            
            return VerificationResponse.builder()
                .recordId(recordId)
                .verified(isValid)
                .ipfsHash(record.getIpfsHash())
                .message(isValid ? "Record verified successfully" : "Record verification failed")
                .build();
            
        } catch (Exception e) {
            log.error("Error verifying record: {}", recordId, e);
            return VerificationResponse.builder()
                .recordId(recordId)
                .verified(false)
                .message("Verification error: " + e.getMessage())
                .build();
        }
    }
    
    /**
     * Delete a record (soft delete if on blockchain)
     */
    public UploadResponse deleteRecord(String recordId) {
        try {
            MedicalRecord record = repository.findByRecordId(recordId).orElse(null);
            
            if (record == null) {
                return UploadResponse.builder()
                    .recordId(recordId)
                    .message("Record not found")
                    .success(false)
                    .build();
            }
            
            repository.delete(record);
            log.info("Record deleted: {}", recordId);
            
            return UploadResponse.builder()
                .recordId(recordId)
                .message("Record deleted successfully")
                .success(true)
                .build();
                
        } catch (Exception e) {
            log.error("Error deleting record: {}", recordId, e);
            return UploadResponse.builder()
                .message("Delete failed: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Get records by type for a patient
     */
    public PatientRecordsResponse getRecordsByType(String patientId, String recordType) {
        try {
            List<MedicalRecord> records = repository.findByPatientIdAndRecordType(patientId, recordType);
            
            List<RecordDetailsResponse> recordDetails = records.stream()
                .map(this::mapToRecordDetails)
                .collect(Collectors.toList());
            
            return PatientRecordsResponse.builder()
                .patientId(patientId)
                .records(recordDetails)
                .totalRecords(recordDetails.size())
                .message("Records retrieved successfully")
                .success(true)
                .build();
                
        } catch (Exception e) {
            log.error("Error retrieving records by type", e);
            return PatientRecordsResponse.builder()
                .message("Error retrieving records: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Get records within a date range
     */
    public PatientRecordsResponse getRecordsByDateRange(String patientId, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            List<MedicalRecord> records = repository.findRecordsByDateRange(patientId, startDate, endDate);
            
            List<RecordDetailsResponse> recordDetails = records.stream()
                .map(this::mapToRecordDetails)
                .collect(Collectors.toList());
            
            return PatientRecordsResponse.builder()
                .patientId(patientId)
                .records(recordDetails)
                .totalRecords(recordDetails.size())
                .message("Records retrieved successfully")
                .success(true)
                .build();
                
        } catch (Exception e) {
            log.error("Error retrieving records by date range", e);
            return PatientRecordsResponse.builder()
                .message("Error retrieving records: " + e.getMessage())
                .success(false)
                .build();
        }
    }
    
    /**
     * Map MedicalRecord to RecordDetailsResponse
     */
    private RecordDetailsResponse mapToRecordDetails(MedicalRecord record) {
        return RecordDetailsResponse.builder()
            .recordId(record.getRecordId())
            .patientId(record.getPatientId())
            .doctorId(record.getDoctorId())
            .ipfsHash(record.getIpfsHash())
            .fileName(record.getFileName())
            .fileType(record.getFileType())
            .recordType(record.getRecordType())
            .fileSize(record.getFileSize())
            .blockchainTxHash(record.getBlockchainTxHash())
            .uploadedAt(record.getUploadedAt().format(dateFormatter))
            .verified(record.isVerified())
            .status("ACTIVE")
            .expiresAt("2031-01-01 00:00:00")
            .doctorName(record.getDoctorName())
            .hospitalName(record.getHospitalName())
            .dateOfRecord(record.getDateOfRecord())
            .notes(record.getNotes())
            .tags(record.getTags())
            .visibility(record.getVisibility())
            .uploadedBy(record.getUploadedBy())
            .message("Success")
            .success(true)
            .build();
    }
}
