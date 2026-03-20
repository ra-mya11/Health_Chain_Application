package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.model.Assessment;
import com.healthcare.medicalrecords.repository.AssessmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class AssessmentController {

    private final AssessmentRepository assessmentRepository;

    public AssessmentController(AssessmentRepository assessmentRepository) {
        this.assessmentRepository = assessmentRepository;
    }

    @PostMapping("/save")
    public ResponseEntity<Assessment> saveAssessment(
            @RequestBody Map<String, Object> body, Authentication auth) {
        Assessment a = new Assessment();
        a.setUserId(auth.getName());
        a.setTimestamp(LocalDateTime.now());

        if (body.get("Age") != null) a.setAge(((Number) body.get("Age")).intValue());
        if (body.get("BMI") != null) a.setBmi(((Number) body.get("BMI")).doubleValue());
        if (body.get("BloodPressure") != null) a.setBloodPressure(((Number) body.get("BloodPressure")).doubleValue());
        if (body.get("Cholesterol") != null) a.setCholesterol(((Number) body.get("Cholesterol")).doubleValue());
        if (body.get("Glucose") != null) a.setGlucose(((Number) body.get("Glucose")).doubleValue());
        if (body.get("Sex") != null) a.setSex(((Number) body.get("Sex")).intValue());
        if (body.get("risk_level") != null) a.setRiskLevel(body.get("risk_level").toString());
        if (body.get("source") != null) a.setSource(body.get("source").toString());

        return ResponseEntity.ok(assessmentRepository.save(a));
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(Authentication auth) {
        return assessmentRepository
                .findTopByUserIdOrderByTimestampDesc(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
