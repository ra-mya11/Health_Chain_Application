-- Migration: Add fallback patient and doctor fields and missing appointment columns
-- This migration adds support for cross-database lookups and stores names as fallback

-- Add missing columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS time_slot VARCHAR(20),
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS patient_email VARCHAR(150),
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS doctor_email VARCHAR(150),
ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(150);

-- Create indexes for faster lookups on fallback fields
ALTER TABLE appointments 
ADD KEY IF NOT EXISTS idx_patient_email (patient_email),
ADD KEY IF NOT EXISTS idx_patient_name (patient_name),
ADD KEY IF NOT EXISTS idx_doctor_email (doctor_email),
ADD KEY IF NOT EXISTS idx_doctor_name (doctor_name);

-- Populate patient_name and patient_email from users table for existing appointments
UPDATE appointments a
LEFT JOIN users u ON a.patient_id = u.id
SET a.patient_email = u.email, a.patient_name = u.name
WHERE a.patient_name IS NULL AND u.id IS NOT NULL;

-- Populate doctor_name and doctor_email from users table for existing appointments
UPDATE appointments a
LEFT JOIN users u ON a.doctor_id = u.id
SET a.doctor_email = u.email, a.doctor_name = u.name
WHERE a.doctor_name IS NULL AND u.id IS NOT NULL;
