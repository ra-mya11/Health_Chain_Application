package com.healthcare.medicalrecords.dto;

import java.util.List;

public class PredictionResponse {
    private double diabetesRisk;
    private double heartDiseaseRisk;
    private double hypertensionRisk;
    private String diabetesPrediction;
    private String heartDiseasePrediction;
    private String hypertensionPrediction;
    private String overallRisk;
    private List<String> recommendations;

    public double getDiabetesRisk() { return diabetesRisk; }
    public void setDiabetesRisk(double diabetesRisk) { this.diabetesRisk = diabetesRisk; }

    public double getHeartDiseaseRisk() { return heartDiseaseRisk; }
    public void setHeartDiseaseRisk(double heartDiseaseRisk) { this.heartDiseaseRisk = heartDiseaseRisk; }

    public double getHypertensionRisk() { return hypertensionRisk; }
    public void setHypertensionRisk(double hypertensionRisk) { this.hypertensionRisk = hypertensionRisk; }

    public String getDiabetesPrediction() { return diabetesPrediction; }
    public void setDiabetesPrediction(String diabetesPrediction) { this.diabetesPrediction = diabetesPrediction; }

    public String getHeartDiseasePrediction() { return heartDiseasePrediction; }
    public void setHeartDiseasePrediction(String heartDiseasePrediction) { this.heartDiseasePrediction = heartDiseasePrediction; }

    public String getHypertensionPrediction() { return hypertensionPrediction; }
    public void setHypertensionPrediction(String hypertensionPrediction) { this.hypertensionPrediction = hypertensionPrediction; }

    public String getOverallRisk() { return overallRisk; }
    public void setOverallRisk(String overallRisk) { this.overallRisk = overallRisk; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
}
