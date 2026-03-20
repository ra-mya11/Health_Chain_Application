package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.dto.PredictionRequest;
import com.healthcare.medicalrecords.dto.PredictionResponse;
import com.healthcare.medicalrecords.service.AIPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class AIPredictionController {

    private final AIPredictionService aiPredictionService;

    public AIPredictionController(AIPredictionService aiPredictionService) {
        this.aiPredictionService = aiPredictionService;
    }
    
    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predictDisease(@RequestBody PredictionRequest request) {
        PredictionResponse response = aiPredictionService.predictDisease(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> checkHealth() {
        boolean isHealthy = aiPredictionService.checkAIServiceHealth();
        return isHealthy 
            ? ResponseEntity.ok("AI service is healthy")
            : ResponseEntity.status(503).body("AI service is unavailable");
    }
}
