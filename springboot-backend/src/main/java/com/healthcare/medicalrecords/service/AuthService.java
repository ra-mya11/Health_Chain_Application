package com.healthcare.medicalrecords.service;

import com.healthcare.medicalrecords.dto.patient.*;
import com.healthcare.medicalrecords.entity.User;
import com.healthcare.medicalrecords.repository.AdminUserRepository;
import com.healthcare.medicalrecords.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final AdminUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(AdminUserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "PATIENT";
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setEnabled(true);
        user = userRepository.save(user);
        logger.info("✓ Registered user: {}", user.getEmail());
        String token = jwtUtil.generateToken(String.valueOf(user.getId()), user.getRole());
        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail(), user.getName(), user.getRole());
    }

    public java.util.Optional<String> resolveIdByEmail(String email) {
        // Find existing MySQL user
        java.util.Optional<User> existing = userRepository.findByEmail(email.toLowerCase().trim());
        if (existing.isPresent()) {
            return java.util.Optional.of(String.valueOf(existing.get().getId()));
        }
        // Auto-create MySQL user from Node.js MongoDB user via Node.js API
        try {
            String nodeUrl = "http://localhost:3001/api/auth/user-by-email?email=" + java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8);
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(nodeUrl)).GET().build();
            java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(resp.body());
                User user = new User();
                user.setEmail(email.toLowerCase().trim());
                user.setName(node.path("name").asText("Unknown"));
                user.setPassword(node.path("password").asText(""));
                user.setRole((node.path("role").asText("PATIENT")).toUpperCase());
                user.setEnabled(true);
                user = userRepository.save(user);
                logger.info("Auto-created MySQL user for: {}", email);
                return java.util.Optional.of(String.valueOf(user.getId()));
            }
        } catch (Exception e) {
            logger.warn("Could not auto-create MySQL user for {}: {}", email, e.getMessage());
        }
        return java.util.Optional.empty();
    }

    public AuthResponse login(LoginRequest request) {
        logger.info("Login attempt: {}", request.getEmail());

        // Try MySQL first
        java.util.Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        // If not in MySQL, try Node.js MongoDB and auto-create
        if (userOpt.isEmpty()) {
            userOpt = syncUserFromNodeJs(request.getEmail(), request.getPassword());
        }

        User user = userOpt.orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        logger.info("✓ Login successful: {}", user.getEmail());
        String token = jwtUtil.generateToken(String.valueOf(user.getId()), user.getRole());
        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail(), user.getName(), user.getRole());
    }

    private java.util.Optional<User> syncUserFromNodeJs(String email, String password) {
        try {
            String url = "http://localhost:3001/api/auth/user-by-email?email=" +
                    java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8);
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpResponse<String> resp = client.send(
                    java.net.http.HttpRequest.newBuilder().uri(java.net.URI.create(url)).GET().build(),
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(resp.body());
                User user = new User();
                user.setEmail(email.toLowerCase().trim());
                user.setName(node.path("name").asText("Unknown"));
                user.setPassword(node.path("password").asText(""));
                user.setRole((node.path("role").asText("PATIENT")).toUpperCase());
                user.setEnabled(true);
                user = userRepository.save(user);
                logger.info("Auto-synced Node.js user to MySQL: {}", email);
                return java.util.Optional.of(user);
            }
        } catch (Exception e) {
            logger.warn("Node.js sync failed for {}: {}", email, e.getMessage());
        }
        return java.util.Optional.empty();
    }
}
