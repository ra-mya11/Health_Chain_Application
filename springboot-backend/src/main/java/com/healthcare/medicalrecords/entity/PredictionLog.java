package com.healthcare.medicalrecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_logs")
public class PredictionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", updatable = false, insertable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "model_type", nullable = false)
    private ModelType modelType;

    @Column(name = "input_data", columnDefinition = "LONGTEXT")
    private String inputData;  // JSON

    @Column(name = "result_data", columnDefinition = "LONGTEXT")
    private String resultData;  // JSON

    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ModelType {
        DIABETES, HEART
    }

    public PredictionLog() {}

    public PredictionLog(Long userId, ModelType modelType, String input, String result, String riskLevel) {
        this.userId = userId;
        this.modelType = modelType;
        this.inputData = input;
        this.resultData = result;
        this.riskLevel = riskLevel;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ModelType getModelType() { return modelType; }
    public void setModelType(ModelType modelType) { this.modelType = modelType; }

    public String getInputData() { return inputData; }
    public void setInputData(String inputData) { this.inputData = inputData; }

    public String getResultData() { return resultData; }
    public void setResultData(String resultData) { this.resultData = resultData; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
