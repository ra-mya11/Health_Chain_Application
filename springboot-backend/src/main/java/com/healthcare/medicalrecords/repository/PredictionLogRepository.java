package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.PredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PredictionLogRepository extends JpaRepository<PredictionLog, Long> {
    List<PredictionLog> findByUserId(Long userId);

    List<PredictionLog> findByModelType(PredictionLog.ModelType modelType);

    @Query("SELECT p FROM PredictionLog p WHERE p.createdAt >= ?1 ORDER BY p.createdAt DESC")
    List<PredictionLog> findRecent(LocalDateTime since);

    long countByModelType(PredictionLog.ModelType modelType);
}
