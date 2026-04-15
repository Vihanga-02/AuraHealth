-- Patient Service Database Schema
-- NOTE: Auth lives in auth-service. This DB stores patient records keyed by auth-service `user_id`.
-- Do NOT maintain a separate `users` table here to avoid ID/FK conflicts.

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  blood_group VARCHAR(10),
  allergies TEXT,
  chronic_conditions TEXT,
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL,
  report_title VARCHAR(200) NOT NULL,
  report_type VARCHAR(100) DEFAULT 'General',
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER,
  doctor_name VARCHAR(150) NOT NULL,
  diagnosis TEXT,
  medications TEXT,
  notes TEXT,
  issued_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data intentionally omitted: profiles are created via API using JWT user_id.
