package com.healthcare.medicalrecords.dto;

public class AnalyticsDto {
    public long totalPatients;
    public long totalDoctors;
    public long totalAppointments;
    public long totalRecords;
    public long totalPredictions;
    public long diabetesPredictions;
    public long heartPredictions;
    public long scheduledAppointments;
    public long completedAppointments;
    public long cancelledAppointments;

    public AnalyticsDto() {}

    public AnalyticsDto(long patients, long doctors, long apts, long records,
                        long predictions, long diabetes, long heart,
                        long scheduled, long completed, long cancelled) {
        this.totalPatients = patients;
        this.totalDoctors = doctors;
        this.totalAppointments = apts;
        this.totalRecords = records;
        this.totalPredictions = predictions;
        this.diabetesPredictions = diabetes;
        this.heartPredictions = heart;
        this.scheduledAppointments = scheduled;
        this.completedAppointments = completed;
        this.cancelledAppointments = cancelled;
    }

    // Getters
    public long getTotalPatients() { return totalPatients; }
    public long getTotalDoctors() { return totalDoctors; }
    public long getTotalAppointments() { return totalAppointments; }
    public long getTotalRecords() { return totalRecords; }
    public long getTotalPredictions() { return totalPredictions; }
    public long getDiabetesPredictions() { return diabetesPredictions; }
    public long getHeartPredictions() { return heartPredictions; }
    public long getScheduledAppointments() { return scheduledAppointments; }
    public long getCompletedAppointments() { return completedAppointments; }
    public long getCancelledAppointments() { return cancelledAppointments; }
}
