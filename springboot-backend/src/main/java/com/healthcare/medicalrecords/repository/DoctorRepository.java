package com.healthcare.medicalrecords.repository;

import com.healthcare.medicalrecords.entity.Doctor;
import com.healthcare.medicalrecords.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByDepartment(Department department);
    List<Doctor> findBySpecialization(String specialization);
    long countByDepartment(Department department);
}
