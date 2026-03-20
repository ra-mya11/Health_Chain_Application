package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.dto.patient.ShareAccessRequest;
import com.healthcare.medicalrecords.model.MedicalRecord;
import com.healthcare.medicalrecords.service.PatientDashboardService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class PatientDashboardController {

    private final PatientDashboardService dashboardService;

    public PatientDashboardController(PatientDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }
    
    @GetMapping("/records")
    public ResponseEntity<List<MedicalRecord>> getMyRecords(Authentication auth) {
        String userId = auth.getName();
        List<MedicalRecord> records = dashboardService.getMyRecords(userId);
        return ResponseEntity.ok(records);
    }
    
    @GetMapping("/records/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(
            @PathVariable String patientId, Authentication auth) {
        
        String doctorId = auth.getName();
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");
        
        if (role.equals("ROLE_PATIENT") && !patientId.equals(doctorId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<MedicalRecord> records = role.equals("ROLE_DOCTOR") 
            ? dashboardService.getPatientRecordsAsDoctor(patientId, doctorId)
            : dashboardService.getMyRecords(patientId);
        
        return ResponseEntity.ok(records);
    }
    
    @PostMapping("/share-access")
    public ResponseEntity<String> shareAccess(@RequestBody ShareAccessRequest request, 
                                              Authentication auth) {
        String patientId = auth.getName();
        dashboardService.shareAccessWithDoctor(patientId, request.getDoctorId());
        return ResponseEntity.ok("Access granted successfully");
    }
    
    @DeleteMapping("/revoke-access/{doctorId}")
    public ResponseEntity<String> revokeAccess(@PathVariable String doctorId, 
                                               Authentication auth) {
        String patientId = auth.getName();
        dashboardService.revokeAccessFromDoctor(patientId, doctorId);
        return ResponseEntity.ok("Access revoked successfully");
    }
    
    @GetMapping("/download/{recordId}")
    public ResponseEntity<byte[]> downloadRecord(@PathVariable String recordId, 
                                                 Authentication auth) {
        String userId = auth.getName();
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("")
                .replace("ROLE_", "");
        
        byte[] fileData = dashboardService.downloadRecord(recordId, userId, role);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "medical-record");
        
        return ResponseEntity.ok().headers(headers).body(fileData);
    }
}
