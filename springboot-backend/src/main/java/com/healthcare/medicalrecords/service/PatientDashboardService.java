package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.entity.MedicalRecord;
import com.healthcare.medicalrecords.repository.MedicalRecordJpaRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientDashboardService {

    private final MedicalRecordJpaRepository recordRepository;
    private final IPFSService ipfsService;

    public PatientDashboardService(MedicalRecordJpaRepository recordRepository, IPFSService ipfsService) {
        this.recordRepository = recordRepository;
        this.ipfsService = ipfsService;
    }

    public List<MedicalRecord> getMyRecords(String userId) {
        try {
            return recordRepository.findByPatientIdOrderByUploadedAtDesc(Long.parseLong(userId));
        } catch (NumberFormatException e) {
            return List.of();
        }
    }

    public byte[] downloadRecord(String recordId, String userId, String userRole) {
        MedicalRecord record = recordRepository.findByRecordId(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        try {
            if (record.getIpfsHash() != null) {
                return ipfsService.downloadFile(record.getIpfsHash());
            }
            if (record.getLocalFilePath() != null) {
                java.io.File f = new java.io.File(record.getLocalFilePath());
                if (f.exists()) return java.nio.file.Files.readAllBytes(f.toPath());
            }
            throw new RuntimeException("File not found");
        } catch (Exception e) {
            throw new RuntimeException("Download failed: " + e.getMessage());
        }
    }
}
