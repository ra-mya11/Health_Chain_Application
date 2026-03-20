package com.healthcare.medicalrecords.dto;

import com.healthcare.medicalrecords.entity.Doctor;

public class DoctorDto {
    public Long userId;
    public String name;
    public String email;
    public String phone;
    public String specialization;
    public Integer experienceYears;
    public String availability;
    public Double consultationFee;
    public Boolean isAvailable;
    public Long departmentId;
    public String departmentName;
    public Long appointmentCount;

    public DoctorDto() {}

    public static DoctorDto from(Doctor doc) {
        DoctorDto dto = new DoctorDto();
        dto.userId         = doc.getUserId();
        dto.name           = doc.getUser() != null ? doc.getUser().getName() : "";
        dto.email          = doc.getUser() != null ? doc.getUser().getEmail() : "";
        dto.phone          = doc.getUser() != null ? doc.getUser().getPhone() : "";
        dto.specialization = doc.getSpecialization();
        dto.experienceYears = doc.getExperienceYears();
        dto.availability   = doc.getAvailability();
        dto.consultationFee = doc.getConsultationFee();
        dto.isAvailable    = doc.getIsAvailable();
        dto.departmentId   = doc.getDepartment() != null ? doc.getDepartment().getId() : null;
        dto.departmentName = doc.getDepartment() != null ? doc.getDepartment().getName() : "";
        return dto;
    }

    // Getters
    public Long getUserId()          { return userId; }
    public String getName()          { return name; }
    public String getEmail()         { return email; }
    public String getPhone()         { return phone; }
    public String getSpecialization(){ return specialization; }
    public Integer getExperienceYears(){ return experienceYears; }
    public String getAvailability()  { return availability; }
    public Double getConsultationFee(){ return consultationFee; }
    public Boolean getIsAvailable()  { return isAvailable; }
    public Long getDepartmentId()    { return departmentId; }
    public String getDepartmentName(){ return departmentName; }
    public Long getAppointmentCount(){ return appointmentCount; }
    public void setAppointmentCount(Long c){ this.appointmentCount = c; }
}
