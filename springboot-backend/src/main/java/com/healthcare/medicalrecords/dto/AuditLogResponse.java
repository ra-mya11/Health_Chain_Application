package com.healthcare.medicalrecords.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO for audit log response
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogResponse {
    private String recordId;
    private long timestamp;
    private String action;
    private String actor;
    private String details;
    private String message;
    private boolean success;
}

/**
 * DTO for multiple audit logs
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
class AuditLogListResponse {
    private String recordId;
    private List<AuditLogResponse> auditLogs;
    private int totalLogs;
    private String message;
    private boolean success;
}
