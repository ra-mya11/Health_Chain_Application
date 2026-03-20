package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.model.MedicalRecord;
import com.healthcare.medicalrecords.model.User;
import com.healthcare.medicalrecords.repository.MedicalRecordRepository;
import com.healthcare.medicalrecords.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientDashboardService {

    private final MedicalRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final IPFSService ipfsService;

    public PatientDashboardService(MedicalRecordRepository recordRepository, UserRepository userRepository, IPFSService ipfsService) {
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.ipfsService = ipfsService;
    }
    
    public List<MedicalRecord> getMyRecords(String userId) {
        return recordRepository.findByPatientId(userId);
    }
    
    public List<MedicalRecord> getPatientRecordsAsDoctor(String patientId, String doctorId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        if (!patient.getAuthorizedDoctors().contains(doctorId)) {
            throw new RuntimeException("Access denied");
        }
        
        return recordRepository.findByPatientId(patientId);
    }
    
    public void shareAccessWithDoctor(String patientId, String doctorId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (!"DOCTOR".equals(doctor.getRole())) {
            throw new RuntimeException("User is not a doctor");
        }
        
        patient.getAuthorizedDoctors().add(doctorId);
        userRepository.save(patient);
    }
    
    public void revokeAccessFromDoctor(String patientId, String doctorId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        patient.getAuthorizedDoctors().remove(doctorId);
        userRepository.save(patient);
    }
    
    public byte[] downloadRecord(String recordId, String userId, String userRole) {
        MedicalRecord record = recordRepository.findByRecordId(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        
        if ("PATIENT".equals(userRole) && !record.getPatientId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        if ("DOCTOR".equals(userRole)) {
            User patient = userRepository.findById(record.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            
            if (!patient.getAuthorizedDoctors().contains(userId)) {
                throw new RuntimeException("Access denied");
            }
        }
        
        try {
            return ipfsService.downloadFile(record.getIpfsHash());
        } catch (Exception e) {
            throw new RuntimeException("Download failed: " + e.getMessage());
        }
    }
}
