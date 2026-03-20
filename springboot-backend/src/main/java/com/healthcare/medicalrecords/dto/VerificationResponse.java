package com.healthcare.medicalrecords.dto;

public class VerificationResponse {
    private String recordId;
    private boolean verified;
    private String ipfsHash;
    private String message;

    public VerificationResponse() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String recordId;
        private boolean verified;
        private String ipfsHash;
        private String message;

        public Builder recordId(String recordId) { this.recordId = recordId; return this; }
        public Builder verified(boolean verified) { this.verified = verified; return this; }
        public Builder ipfsHash(String ipfsHash) { this.ipfsHash = ipfsHash; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public VerificationResponse build() {
            VerificationResponse r = new VerificationResponse();
            r.recordId = this.recordId; r.verified = this.verified;
            r.ipfsHash = this.ipfsHash; r.message = this.message;
            return r;
        }
    }

    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getIpfsHash() { return ipfsHash; }
    public void setIpfsHash(String ipfsHash) { this.ipfsHash = ipfsHash; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
