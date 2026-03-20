package com.healthcare.medicalrecords.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "assessments")
public class Assessment {

    @Id
    private String id;
    private String userId;
    private Integer age;
    private Double bmi;
    private Double bloodPressure;
    private Double cholesterol;
    private Double glucose;
    private Integer sex;
    private String riskLevel;
    private Double probability;
    private String source;
    private LocalDateTime timestamp;

    public Assessment() {
        this.timestamp = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }

    public Double getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(Double bloodPressure) { this.bloodPressure = bloodPressure; }

    public Double getCholesterol() { return cholesterol; }
    public void setCholesterol(Double cholesterol) { this.cholesterol = cholesterol; }

    public Double getGlucose() { return glucose; }
    public void setGlucose(Double glucose) { this.glucose = glucose; }

    public Integer getSex() { return sex; }
    public void setSex(Integer sex) { this.sex = sex; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Double getProbability() { return probability; }
    public void setProbability(Double probability) { this.probability = probability; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
