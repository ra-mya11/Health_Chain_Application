package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.patient.*;
import com.healthcare.medicalrecords.model.User;
import com.healthcare.medicalrecords.repository.UserRepository;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import com.healthcare.medicalrecords.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, AdminUserRepository adminUserRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "PATIENT";
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Save to MongoDB (for medical records / patient features)
        User mongoUser = new User();
        mongoUser.setEmail(request.getEmail());
        mongoUser.setPassword(encodedPassword);
        mongoUser.setName(request.getName());
        mongoUser.setPhone(request.getPhone());
        mongoUser.setRole(role);
        mongoUser = userRepository.save(mongoUser);

        // Save to MySQL (for admin management)
        if (!adminUserRepository.existsByEmail(request.getEmail())) {
            com.healthcare.medicalrecords.entity.User mysqlUser = new com.healthcare.medicalrecords.entity.User();
            mysqlUser.setEmail(request.getEmail());
            mysqlUser.setPassword(encodedPassword);
            mysqlUser.setName(request.getName());
            mysqlUser.setPhone(request.getPhone());
            mysqlUser.setRole(role);
            mysqlUser.setEnabled(true);
            adminUserRepository.save(mysqlUser);
        }

        String token = jwtUtil.generateToken(mongoUser.getId(), mongoUser.getRole());
        return new AuthResponse(token, mongoUser.getId(), mongoUser.getEmail(), mongoUser.getName(), mongoUser.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
