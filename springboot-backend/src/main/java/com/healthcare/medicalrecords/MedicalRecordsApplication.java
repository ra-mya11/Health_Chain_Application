package com.healthcare.medicalrecords;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.healthcare.medicalrecords.repository",
        includeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
                type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
                classes = {
                        com.healthcare.medicalrecords.repository.AdminUserRepository.class,
                        com.healthcare.medicalrecords.repository.AppointmentRepository.class,
                        com.healthcare.medicalrecords.repository.AuditLogRepository.class,
                        com.healthcare.medicalrecords.repository.DepartmentRepository.class,
                        com.healthcare.medicalrecords.repository.DoctorRepository.class,
                        com.healthcare.medicalrecords.repository.NotificationRepository.class,
                        com.healthcare.medicalrecords.repository.PredictionLogRepository.class
                }
        )
)
@EnableMongoRepositories(basePackages = "com.healthcare.medicalrecords.repository",
        includeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
                type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
                classes = {
                        com.healthcare.medicalrecords.repository.UserRepository.class,
                        com.healthcare.medicalrecords.repository.MedicalRecordRepository.class,
                        com.healthcare.medicalrecords.repository.AssessmentRepository.class
                }
        )
)
public class MedicalRecordsApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicalRecordsApplication.class, args);
        System.out.println("Medical Records Management System Started");
        System.out.println("Server running on http://localhost:8080");
    }
}
