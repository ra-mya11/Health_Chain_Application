package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetRole(Notification.TargetRole targetRole);

    List<Notification> findBySentAtIsNull();
}
