package com.healthcare.medicalrecords;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MedicalRecordsApplication {
    public static void main(String[] args) {
        SpringApplication.run(MedicalRecordsApplication.class, args);
        System.out.println("Medical Records Management System Started on http://localhost:8081");
    }
}
