package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.*;
import com.healthcare.medicalrecords.entity.MedicalRecord;
import com.healthcare.medicalrecords.repository.MedicalRecordJpaRepository;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private static final Logger log = LoggerFactory.getLogger(MedicalRecordService.class);
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String UPLOAD_DIR = System.getProperty("user.home") + "/healthcare-uploads/";

    private final MedicalRecordJpaRepository repository;
    private final AdminUserRepository userRepository;
    private final IPFSService ipfsService;
    private final BlockchainService blockchainService;

    public MedicalRecordService(MedicalRecordJpaRepository repository,
                                AdminUserRepository userRepository,
                                IPFSService ipfsService,
                                BlockchainService blockchainService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.ipfsService = ipfsService;
        this.blockchainService = blockchainService;
        new File(UPLOAD_DIR).mkdirs();
    }

    public UploadResponse uploadRecord(MultipartFile file, String patientIdStr,
                                       String doctorIdStr, String recordType,
                                       String doctorName, String hospitalName,
                                       String dateOfRecord, String notes,
                                       String tags, String visibility, String uploadedByStr) {
        try {
            if (file.isEmpty()) {
                return new UploadResponse(null, null, null, "File is empty", false);
            }

            // Resolve patientId — try numeric first, then look up by email
            Long patientId = null;
            try { patientId = Long.parseLong(patientIdStr); } catch (Exception ignored) {}
            if (patientId == null && patientIdStr != null && patientIdStr.contains("@")) {
                patientId = userRepository.findByEmail(patientIdStr).map(u -> u.getId()).orElse(null);
            }

            Long doctorId = null;
            try { doctorId = Long.parseLong(doctorIdStr); } catch (Exception ignored) {}

            Long uploadedBy = null;
            try { uploadedBy = Long.parseLong(uploadedByStr); } catch (Exception ignored) {}

            String recordId = UUID.randomUUID().toString();
            log.info("Uploading record {} for patient {}", recordId, patientId);

            // Try IPFS, fallback to local
            String ipfsHash = ipfsService.uploadFile(file);
            String storageType;
            String localFilePath = null;

            if (ipfsHash != null) {
                storageType = "ipfs";
            } else {
                String savedName = recordId + "_" + file.getOriginalFilename();
                localFilePath = UPLOAD_DIR + savedName;
                try (FileOutputStream fos = new FileOutputStream(localFilePath)) {
                    fos.write(file.getBytes());
                }
                storageType = "local";
                log.info("Saved locally: {}", localFilePath);
            }

            String txHash = null;
            try {
                txHash = blockchainService.addRecord(recordId,
                        ipfsHash != null ? ipfsHash : "local:" + recordId,
                        String.valueOf(patientId), doctorIdStr, recordType);
            } catch (Exception e) {
                log.warn("Blockchain unavailable: {}", e.getMessage());
            }

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
            record.setVerified(ipfsHash != null && txHash != null);
            record.setDoctorName(doctorName);
            record.setHospitalName(hospitalName);
            record.setDateOfRecord(dateOfRecord);
            record.setNotes(notes);
            record.setVisibility(visibility != null && !visibility.isBlank() ? visibility : "PATIENT_ONLY");
            record.setUploadedBy(uploadedBy);
            record.setLocalFilePath(localFilePath);
            record.setStorageType(storageType);
            record.setTags(tags);

            repository.save(record);
            log.info("Record saved to MySQL: {}", recordId);

            return UploadResponse.builder()
                    .recordId(recordId)
                    .ipfsHash(ipfsHash)
                    .blockchainTxHash(txHash)
                    .message("Record uploaded successfully (" + storageType + ")")
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Upload failed", e);
            return UploadResponse.builder().message("Upload failed: " + e.getMessage()).success(false).build();
        }
    }

    public PatientRecordsResponse getRecordsByPatientId(String patientIdStr) {
        try {
            Long patientId = Long.parseLong(patientIdStr);
            List<RecordDetailsResponse> records = repository
                    .findByPatientIdOrderByUploadedAtDesc(patientId)
                    .stream().map(this::map).collect(Collectors.toList());
            return PatientRecordsResponse.builder()
                    .patientId(patientIdStr).records(records)
                    .totalRecords(records.size()).message("OK").success(true).build();
        } catch (Exception e) {
            log.error("Error fetching records for patient {}", patientIdStr, e);
            return PatientRecordsResponse.builder().message(e.getMessage()).success(false).build();
        }
    }

    public PatientRecordsResponse getRecordsByDoctorId(String doctorIdStr) {
        try {
            Long doctorId = Long.parseLong(doctorIdStr);
            List<RecordDetailsResponse> records = repository
                    .findByDoctorIdOrderByUploadedAtDesc(doctorId)
                    .stream().map(this::map).collect(Collectors.toList());
            return PatientRecordsResponse.builder()
                    .patientId(doctorIdStr).records(records)
                    .totalRecords(records.size()).message("OK").success(true).build();
        } catch (Exception e) {
            log.error("Error fetching records for doctor {}", doctorIdStr, e);
            return PatientRecordsResponse.builder().message(e.getMessage()).success(false).build();
        }
    }

    public RecordDetailsResponse getRecordById(String recordId) {
        return repository.findByRecordId(recordId)
                .map(this::map)
                .orElse(RecordDetailsResponse.builder().recordId(recordId).message("Not found").success(false).build());
    }

    public PatientRecordsResponse getRecordsByType(String patientIdStr, String recordType) {
        try {
            Long patientId = Long.parseLong(patientIdStr);
            List<RecordDetailsResponse> records = repository
                    .findByPatientIdAndRecordTypeOrderByUploadedAtDesc(patientId, recordType)
                    .stream().map(this::map).collect(Collectors.toList());
            return PatientRecordsResponse.builder()
                    .patientId(patientIdStr).records(records)
                    .totalRecords(records.size()).message("OK").success(true).build();
        } catch (Exception e) {
            return PatientRecordsResponse.builder().message(e.getMessage()).success(false).build();
        }
    }

    public PatientRecordsResponse getRecordsByDateRange(String patientIdStr, LocalDateTime start, LocalDateTime end) {
        try {
            Long patientId = Long.parseLong(patientIdStr);
            List<RecordDetailsResponse> records = repository
                    .findByPatientIdOrderByUploadedAtDesc(patientId).stream()
                    .filter(r -> r.getUploadedAt() != null
                            && !r.getUploadedAt().isBefore(start)
                            && !r.getUploadedAt().isAfter(end))
                    .map(this::map).collect(Collectors.toList());
            return PatientRecordsResponse.builder()
                    .patientId(patientIdStr).records(records)
                    .totalRecords(records.size()).message("OK").success(true).build();
        } catch (Exception e) {
            return PatientRecordsResponse.builder().message(e.getMessage()).success(false).build();
        }
    }

    public byte[] downloadRecord(String hash) throws Exception {
        if (hash.startsWith("Qm") || hash.startsWith("bafy")) {
            try { return ipfsService.downloadFile(hash); } catch (Exception ignored) {}
        }
        MedicalRecord record = repository.findByIpfsHash(hash)
                .orElseGet(() -> repository.findByRecordId(hash).orElse(null));
        if (record != null && record.getLocalFilePath() != null) {
            File f = new File(record.getLocalFilePath());
            if (f.exists()) return java.nio.file.Files.readAllBytes(f.toPath());
        }
        throw new Exception("File not found: " + hash);
    }

    public PatientRecordsResponse getAllRecordsMapped() {
        List<RecordDetailsResponse> records = repository.findAll()
                .stream().map(this::map).collect(Collectors.toList());
        return PatientRecordsResponse.builder()
                .records(records).totalRecords(records.size()).message("OK").success(true).build();
    }

    public VerificationResponse verifyRecord(String recordId) {
        MedicalRecord record = repository.findByRecordId(recordId).orElse(null);
        if (record == null) {
            return VerificationResponse.builder().recordId(recordId).verified(false).message("Not found").build();
        }
        try {
            boolean valid = blockchainService.verifyRecord(recordId, record.getIpfsHash());
            return VerificationResponse.builder().recordId(recordId).verified(valid)
                    .ipfsHash(record.getIpfsHash())
                    .message(valid ? "Verified" : "Verification failed").build();
        } catch (Exception e) {
            return VerificationResponse.builder().recordId(recordId).verified(false).message(e.getMessage()).build();
        }
    }

    public UploadResponse deleteRecord(String recordId) {
        MedicalRecord record = repository.findByRecordId(recordId).orElse(null);
        if (record == null) {
            return UploadResponse.builder().recordId(recordId).message("Not found").success(false).build();
        }
        repository.delete(record);
        return UploadResponse.builder().recordId(recordId).message("Deleted").success(true).build();
    }

    private RecordDetailsResponse map(MedicalRecord r) {
        return RecordDetailsResponse.builder()
                .recordId(r.getRecordId())
                .patientId(r.getPatientId() != null ? String.valueOf(r.getPatientId()) : null)
                .doctorId(r.getDoctorId() != null ? String.valueOf(r.getDoctorId()) : null)
                .ipfsHash(r.getIpfsHash())
                .fileName(r.getFileName())
                .fileType(r.getFileType())
                .recordType(r.getRecordType())
                .fileSize(r.getFileSize())
                .blockchainTxHash(r.getBlockchainTxHash())
                .uploadedAt(r.getUploadedAt() != null ? r.getUploadedAt().format(dateFormatter) : null)
                .verified(r.isVerified())
                .status("ACTIVE")
                .doctorName(r.getDoctorName())
                .hospitalName(r.getHospitalName())
                .dateOfRecord(r.getDateOfRecord())
                .notes(r.getNotes())
                .tags(r.getTags() != null ? Arrays.asList(r.getTags().split(",")) : null)
                .visibility(r.getVisibility())
                .uploadedBy(r.getUploadedBy() != null ? String.valueOf(r.getUploadedBy()) : null)
                .storageType(r.getStorageType())
                .message("Success").success(true)
                .build();
    }
}
