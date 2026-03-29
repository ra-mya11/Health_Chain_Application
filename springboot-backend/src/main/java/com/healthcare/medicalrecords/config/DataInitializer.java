package com.healthcare.medicalrecords.config;

import com.healthcare.medicalrecords.entity.User;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AdminUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Initialize default users if none exist
        if (userRepository.count() == 0) {
            System.out.println("Initializing default users...");
            
            // Doctor user
            User doctor = new User();
            doctor.setEmail("doctor@healthcare.com");
            doctor.setPassword(passwordEncoder.encode("doctor123"));
            doctor.setName("Dr. Sarah Johnson");
            doctor.setPhone("555-0101");
            doctor.setRole("DOCTOR");
            userRepository.save(doctor);
            System.out.println("✓ Created doctor: " + doctor.getEmail());

            // Patient user
            User patient = new User();
            patient.setEmail("patient@healthcare.com");
            patient.setPassword(passwordEncoder.encode("patient123"));
            patient.setName("John Doe");
            patient.setPhone("555-0201");
            patient.setRole("PATIENT");
            userRepository.save(patient);
            System.out.println("✓ Created patient: " + patient.getEmail());

            // Admin user
            User admin = new User();
            admin.setEmail("admin@healthcare.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("Admin User");
            admin.setPhone("555-0301");
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("✓ Created admin: " + admin.getEmail());

            System.out.println("✓ Successfully initialized default users!");
        }
    }
}
