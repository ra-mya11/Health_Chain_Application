package com.healthcare.medicalrecords.dto;

import java.util.List;

public class PredictionRequest {
    private int age;
    private int bpSystolic;
    private int bpDiastolic;
    private double sugarLevel;
    private double bmi;
    private int cholesterol;
    private List<String> symptoms;

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public int getBpSystolic() { return bpSystolic; }
    public void setBpSystolic(int bpSystolic) { this.bpSystolic = bpSystolic; }

    public int getBpDiastolic() { return bpDiastolic; }
    public void setBpDiastolic(int bpDiastolic) { this.bpDiastolic = bpDiastolic; }

    public double getSugarLevel() { return sugarLevel; }
    public void setSugarLevel(double sugarLevel) { this.sugarLevel = sugarLevel; }

    public double getBmi() { return bmi; }
    public void setBmi(double bmi) { this.bmi = bmi; }

    public int getCholesterol() { return cholesterol; }
    public void setCholesterol(int cholesterol) { this.cholesterol = cholesterol; }

    public List<String> getSymptoms() { return symptoms; }
    public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }
}
