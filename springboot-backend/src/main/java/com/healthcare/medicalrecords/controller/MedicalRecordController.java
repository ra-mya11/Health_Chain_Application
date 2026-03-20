package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.dto.*;
import com.healthcare.medicalrecords.service.MedicalRecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller for medical record management
 * Endpoints for upload, retrieve, verify, and manage medical records
 */
@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class MedicalRecordController {

    private static final Logger log = LoggerFactory.getLogger(MedicalRecordController.class);

    private final MedicalRecordService service;

    public MedicalRecordController(MedicalRecordService service) {
        this.service = service;
    }
    
    /**
     * Upload a new medical record
     * @param file Medical document file
     * @param patientId Patient identifier
     * @param doctorId Doctor identifier
     * @param recordType Type of medical record
     * @return Upload response with IPFS hash and blockchain transaction
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadRecord(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") String patientId,
            @RequestParam("doctorId") String doctorId,
            @RequestParam("recordType") String recordType,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "hospitalName", required = false) String hospitalName,
            @RequestParam(value = "dateOfRecord", required = false) String dateOfRecord,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "visibility", defaultValue = "DOCTOR_ONLY") String visibility,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy) {
        
        log.info("Uploading record for patient: {}", patientId);
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(UploadResponse.builder().recordId(null).ipfsHash(null).blockchainTxHash(null).message("File is empty").success(false).build());
        }
        
        UploadResponse response = service.uploadRecord(
            file, patientId, doctorId, recordType,
            doctorName, hospitalName, dateOfRecord, notes, tags, visibility, uploadedBy
        );
        return response.isSuccess() ? 
            ResponseEntity.ok(response) : 
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    /**
     * Retrieve all records for a patient
     * @param patientId Patient identifier
     * @return List of patient's medical records
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<PatientRecordsResponse> getRecordsByPatient(
            @PathVariable String patientId) {
        
        log.info("Retrieving records for patient: {}", patientId);
        PatientRecordsResponse response = service.getRecordsByPatientId(patientId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Retrieve all records for a doctor
     * @param doctorId Doctor identifier
     * @return List of doctor's uploaded records
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<PatientRecordsResponse> getRecordsByDoctor(
            @PathVariable String doctorId) {
        
        log.info("Retrieving records for doctor: {}", doctorId);
        PatientRecordsResponse response = service.getRecordsByDoctorId(doctorId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get a specific record by record ID
     * @param recordId Record identifier
     * @return Record details
     */
    @GetMapping("/{recordId}")
    public ResponseEntity<RecordDetailsResponse> getRecordById(
            @PathVariable String recordId) {
        
        log.info("Retrieving record: {}", recordId);
        RecordDetailsResponse record = service.getRecordById(recordId);
        
        return record != null && record.isSuccess() ? 
            ResponseEntity.ok(record) : 
            ResponseEntity.notFound().build();
    }
    
    /**
     * Get records by type for a patient
     * @param patientId Patient identifier
     * @param recordType Type of record (lab_report, prescription, etc.)
     * @return Filtered records
     */
    @GetMapping("/patient/{patientId}/type/{recordType}")
    public ResponseEntity<PatientRecordsResponse> getRecordsByType(
            @PathVariable String patientId,
            @PathVariable String recordType) {
        
        log.info("Retrieving {} records for patient: {}", recordType, patientId);
        PatientRecordsResponse response = service.getRecordsByType(patientId, recordType);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get records within a date range
     * @param patientId Patient identifier
     * @param startDate Start datetime
     * @param endDate End datetime
     * @return Records within the date range
     */
    @GetMapping("/patient/{patientId}/date-range")
    public ResponseEntity<PatientRecordsResponse> getRecordsByDateRange(
            @PathVariable String patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("Retrieving records for patient: {} between {} and {}", patientId, startDate, endDate);
        PatientRecordsResponse response = service.getRecordsByDateRange(patientId, startDate, endDate);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Download a record file from IPFS
     * @param ipfsHash IPFS hash of the file
     * @return File content for download
     */
    @GetMapping("/download/{ipfsHash}")
    public ResponseEntity<byte[]> downloadRecord(@PathVariable String ipfsHash) {
        try {
            log.info("Downloading record from IPFS: {}", ipfsHash);
            byte[] fileData = service.downloadRecord(ipfsHash);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "medical-record");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(fileData);
                
        } catch (Exception e) {
            log.error("Error downloading record: {}", ipfsHash, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Verify record integrity on blockchain
     * @param recordId Record identifier
     * @return Verification result
     */
    @GetMapping("/verify/{recordId}")
    public ResponseEntity<VerificationResponse> verifyRecord(
            @PathVariable String recordId) {
        
        log.info("Verifying record: {}", recordId);
        VerificationResponse response = service.verifyRecord(recordId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a medical record
     * @param recordId Record identifier
     * @return Deletion response
     */
    @DeleteMapping("/{recordId}")
    public ResponseEntity<UploadResponse> deleteRecord(
            @PathVariable String recordId) {
        
        log.info("Deleting record: {}", recordId);
        UploadResponse response = service.deleteRecord(recordId);
        
        return response.isSuccess() ? 
            ResponseEntity.ok(response) : 
            ResponseEntity.notFound().build();
    }
    
    /**
     * Health check endpoint
     * @return Service status
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("Health check requested");
        return ResponseEntity.ok("Medical Records Service is running");
    }

    @GetMapping("/all")
    public ResponseEntity<List<RecordDetailsResponse>> getAllRecords() {
        log.info("Retrieving all records");
        PatientRecordsResponse response = service.getAllRecordsMapped();
        return ResponseEntity.ok(response.getRecords());
    }
}

