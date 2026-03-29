package com.healthcare.medicalrecords.dto;

import com.healthcare.medicalrecords.entity.User;
import java.time.LocalDateTime;

public class UserDto {
    public Long id;
    public String name;
    public String email;
    public String role;
    public Boolean enabled;
    public String phone;
    public LocalDateTime createdAt;
    public Long appointmentCount;

    public UserDto() {}

    public UserDto(Long id, String name, String email, String role, Boolean enabled) {
        this.id = id; this.name = name; this.email = email; this.role = role; this.enabled = enabled;
    }

    public static UserDto from(User user) {
        UserDto dto = new UserDto(user.getId(), user.getName(), user.getEmail(),
                user.getRole() != null ? user.getRole() : "PATIENT", user.isEnabled());
        dto.phone = user.getPhone();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public Boolean getEnabled() { return enabled; }
    public String getPhone() { return phone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getAppointmentCount() { return appointmentCount; }
    public void setAppointmentCount(Long appointmentCount) { this.appointmentCount = appointmentCount; }
}
