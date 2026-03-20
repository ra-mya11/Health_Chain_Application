package com.healthcare.medicalrecords.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/prediction")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class PredictionProxyController {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/symptoms")
    public ResponseEntity<Map> getSymptoms() {
        try {
            return restTemplate.getForEntity(aiServiceUrl + "/symptoms", Map.class);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "ML service unavailable"));
        }
    }

    @PostMapping("/predict-disease")
    public ResponseEntity<Map> predictDisease(@RequestBody Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            return restTemplate.exchange(aiServiceUrl + "/predict-disease", HttpMethod.POST, entity, Map.class);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "ML service unavailable: " + e.getMessage()));
        }
    }

    @PostMapping("/book-appointment")
    public ResponseEntity<Map> bookAppointment(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("message", "Appointment request received", "status", "success"));
    }

    @GetMapping("/doctors/{department}")
    public ResponseEntity<Map> getDoctorsByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(Map.of("doctors", java.util.List.of()));
    }
}
