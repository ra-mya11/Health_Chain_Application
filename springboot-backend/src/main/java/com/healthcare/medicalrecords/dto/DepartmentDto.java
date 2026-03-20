package com.healthcare.medicalrecords.dto;

import com.healthcare.medicalrecords.entity.Department;

public class DepartmentDto {
    public Long id;
    public String name;
    public String description;
    public long doctorCount;
    public String createdAt;

    public DepartmentDto() {}

    public static DepartmentDto from(Department dept, long doctorCount) {
        DepartmentDto dto = new DepartmentDto();
        dto.id = dept.getId();
        dto.name = dept.getName();
        dto.description = dept.getDescription();
        dto.doctorCount = doctorCount;
        dto.createdAt = dept.getCreatedAt() != null ? dept.getCreatedAt().toString() : null;
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public long getDoctorCount() { return doctorCount; }
    public String getCreatedAt() { return createdAt; }
}
