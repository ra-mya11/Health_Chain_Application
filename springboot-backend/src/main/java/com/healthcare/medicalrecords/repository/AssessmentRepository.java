package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.model.Assessment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends MongoRepository<Assessment, String> {
    List<Assessment> findByUserIdOrderByTimestampDesc(String userId);
    Optional<Assessment> findTopByUserIdOrderByTimestampDesc(String userId);
}
