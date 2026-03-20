package com.healthcare.medicalrecords.dto;

import java.util.List;

public class PatientRecordsResponse {
    private String patientId;
    private List<RecordDetailsResponse> records;
    private int totalRecords;
    private String message;
    private boolean success;

    public PatientRecordsResponse() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String patientId;
        private List<RecordDetailsResponse> records;
        private int totalRecords;
        private String message;
        private boolean success;

        public Builder patientId(String patientId) { this.patientId = patientId; return this; }
        public Builder records(List<RecordDetailsResponse> records) { this.records = records; return this; }
        public Builder totalRecords(int totalRecords) { this.totalRecords = totalRecords; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder success(boolean success) { this.success = success; return this; }
        public PatientRecordsResponse build() {
            PatientRecordsResponse r = new PatientRecordsResponse();
            r.patientId = this.patientId;
            r.records = this.records;
            r.totalRecords = this.totalRecords;
            r.message = this.message;
            r.success = this.success;
            return r;
        }
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public List<RecordDetailsResponse> getRecords() { return records; }
    public void setRecords(List<RecordDetailsResponse> records) { this.records = records; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}
