-- Admin Module Database Schema
-- Run this script to create admin-related tables

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('PATIENT','DOCTOR','ADMIN') DEFAULT 'PATIENT',
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email),
    KEY idx_role (role)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_name (name)
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    user_id BIGINT PRIMARY KEY,
    specialization VARCHAR(100),
    experience_years INT,
    availability LONGTEXT COMMENT 'JSON format: {"mon":["09:00","12:00"],"tue":...}',
    department_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    KEY idx_department (department_id),
    KEY idx_specialization (specialization)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED') DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    KEY idx_patient (patient_id),
    KEY idx_doctor (doctor_id),
    KEY idx_status (status),
    KEY idx_scheduled (scheduled_at)
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    record_type VARCHAR(50),
    ipfs_hash VARCHAR(255),
    blockchain_tx VARCHAR(66),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_patient (patient_id),
    KEY idx_uploaded (uploaded_at)
);

-- Prediction logs table
CREATE TABLE IF NOT EXISTS prediction_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    model_type ENUM('DIABETES','HEART') NOT NULL,
    input_data LONGTEXT COMMENT 'JSON input',
    result_data LONGTEXT COMMENT 'JSON result',
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_model (model_type),
    KEY idx_created (created_at),
    KEY idx_user (user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message LONGTEXT NOT NULL,
    target_role ENUM('PATIENT','DOCTOR','ADMIN','ALL') DEFAULT 'ALL',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_target (target_role),
    KEY idx_sent (sent_at)
);

-- System audit log
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    details LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_admin (admin_id),
    KEY idx_created (created_at)
);
