-- Appointment Service Database Schema
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER,           -- doctor-service doctor_id (PK of doctors table)
  doctor_user_id INTEGER,      -- auth-service user_id of the doctor (for doctor queries)
  patient_user_id INTEGER NOT NULL,
  patient_name VARCHAR(150) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(50) NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'Telemedicine',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  video_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent migration: add doctor_user_id if upgrading from older schema
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_user_id INTEGER;

