-- ================================================
-- AuraHealth Doctor Service Database Schema
-- ================================================

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id           SERIAL PRIMARY KEY,
    user_id             INT UNIQUE NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    specialty           VARCHAR(100) NOT NULL,
    bio                 TEXT,
    license_number      VARCHAR(100),
    qualification       TEXT,
    experience_years    INT DEFAULT 0,
    consultation_fee    DECIMAL(10,2) DEFAULT 0.00,
    phone_number        VARCHAR(20),
    profile_image_url   TEXT,
    languages           TEXT DEFAULT 'English',
    hospital_affiliation TEXT,
    verified            BOOLEAN DEFAULT FALSE,
    rating              DECIMAL(3,2) DEFAULT 0.00,
    total_consultations INT DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability_slots (
    slot_id         SERIAL PRIMARY KEY,
    doctor_id       INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    day_of_week     VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    max_appointments INT DEFAULT 10,
    is_available    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Seed Data
-- ================================================
INSERT INTO doctors (user_id, full_name, specialty, bio, license_number, qualification, experience_years, consultation_fee, phone_number, languages, hospital_affiliation, verified, rating, total_consultations)
VALUES
  (2, 'Dr. Nimal Perera',  'Cardiology',    'Experienced cardiologist with 15 years expertise in cardiovascular medicine and heart disease management.', 'SLMC-2010-001', 'MBBS, MD (Cardiology), FRCP', 15, 2500.00, '0771234567', 'English, Sinhala', 'National Hospital Colombo', TRUE, 4.8, 1245)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, max_appointments)
VALUES
  (1, 'Monday',    '09:00', '13:00', 8),
  (1, 'Wednesday', '09:00', '13:00', 8),
  (1, 'Friday',    '14:00', '18:00', 8)
ON CONFLICT DO NOTHING;
