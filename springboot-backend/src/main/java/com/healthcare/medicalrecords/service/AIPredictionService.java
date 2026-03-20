package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.PredictionRequest;
import com.healthcare.medicalrecords.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIPredictionService {
    
    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    public PredictionResponse predictDisease(PredictionRequest request) {
        try {
            String url = aiServiceUrl + "/predict";
            
            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("age", request.getAge());
            requestBody.put("bp_systolic", request.getBpSystolic());
            requestBody.put("bp_diastolic", request.getBpDiastolic());
            requestBody.put("sugar_level", request.getSugarLevel());
            requestBody.put("bmi", request.getBmi());
            requestBody.put("cholesterol", request.getCholesterol());
            requestBody.put("symptoms", request.getSymptoms());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<PredictionResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                PredictionResponse.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("AI prediction failed: " + e.getMessage());
        }
    }
    
    public boolean checkAIServiceHealth() {
        try {
            String url = aiServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }
}
