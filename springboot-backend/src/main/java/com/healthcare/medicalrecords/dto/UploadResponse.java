package com.healthcare.medicalrecords.dto;

public class UploadResponse {
    private String recordId;
    private String ipfsHash;
    private String blockchainTxHash;
    private String message;
    private boolean success;

    public UploadResponse() {}

    public UploadResponse(String recordId, String ipfsHash, String blockchainTxHash, String message, boolean success) {
        this.recordId = recordId;
        this.ipfsHash = ipfsHash;
        this.blockchainTxHash = blockchainTxHash;
        this.message = message;
        this.success = success;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String recordId;
        private String ipfsHash;
        private String blockchainTxHash;
        private String message;
        private boolean success;

        public Builder recordId(String recordId) { this.recordId = recordId; return this; }
        public Builder ipfsHash(String ipfsHash) { this.ipfsHash = ipfsHash; return this; }
        public Builder blockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder success(boolean success) { this.success = success; return this; }
        public UploadResponse build() { return new UploadResponse(recordId, ipfsHash, blockchainTxHash, message, success); }
    }

    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }

    public String getIpfsHash() { return ipfsHash; }
    public void setIpfsHash(String ipfsHash) { this.ipfsHash = ipfsHash; }

    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}
