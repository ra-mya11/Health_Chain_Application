package com.healthcare.medicalrecords.controller;

import com.healthcare.medicalrecords.entity.User;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class DebugController {

    private final AdminUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DebugController(AdminUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            Map<String, Object> response = new HashMap<>();
            response.put("totalUsers", users.size());
            response.put("users", users.stream().map(u -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("email", u.getEmail());
                userMap.put("name", u.getName());
                userMap.put("role", u.getRole());
                return userMap;
            }).toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", "Failed to fetch users");
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("backend", "Spring Boot running on port 8081");
        response.put("database", "MongoDB connected");
        response.put("total_users", String.valueOf(userRepository.count()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seedUsers() {
        try {
            // Clear existing users
            userRepository.deleteAll();
            
            // Create doctor
            User doctor = new User();
            doctor.setEmail("doctor@healthcare.com");
            doctor.setPassword(passwordEncoder.encode("doctor123"));
            doctor.setName("Dr. Sarah Johnson");
            doctor.setPhone("555-0101");
            doctor.setRole("DOCTOR");
            userRepository.save(doctor);

            // Create patient
            User patient = new User();
            patient.setEmail("patient@healthcare.com");
            patient.setPassword(passwordEncoder.encode("patient123"));
            patient.setName("John Doe");
            patient.setPhone("555-0201");
            patient.setRole("PATIENT");
            userRepository.save(patient);

            // Create admin
            User admin = new User();
            admin.setEmail("admin@healthcare.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("Admin User");
            admin.setPhone("555-0301");
            admin.setRole("ADMIN");
            userRepository.save(admin);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "✓ Successfully seeded 3 users");
            response.put("users", List.of(
                "doctor@healthcare.com:doctor123 (DOCTOR)",
                "patient@healthcare.com:patient123 (PATIENT)",
                "admin@healthcare.com:admin123 (ADMIN)"
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
