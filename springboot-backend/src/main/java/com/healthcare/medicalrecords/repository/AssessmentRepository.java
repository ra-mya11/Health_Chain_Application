package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByUserIdOrderByTimestampDesc(Long userId);
    Optional<Assessment> findTopByUserIdOrderByTimestampDesc(Long userId);
}
