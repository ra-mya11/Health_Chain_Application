package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.entity.MedicalRecord;
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
        return ResponseEntity.ok(dashboardService.getMyRecords(auth.getName()));
    }

    @GetMapping("/download/{recordId}")
    public ResponseEntity<byte[]> downloadRecord(@PathVariable String recordId, Authentication auth) {
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).findFirst().orElse("").replace("ROLE_", "");
        byte[] data = dashboardService.downloadRecord(recordId, auth.getName(), role);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "medical-record");
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
