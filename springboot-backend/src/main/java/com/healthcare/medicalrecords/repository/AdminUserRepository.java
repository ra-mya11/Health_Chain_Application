package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminUserRepository extends JpaRepository<User, Long> {
    List<User> findByRole(String role);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
