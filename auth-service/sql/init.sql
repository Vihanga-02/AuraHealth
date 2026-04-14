-- ================================================
-- AuraHealth Auth Service Database Schema
-- ================================================

CREATE TABLE IF NOT EXISTS users (
    user_id     SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        VARCHAR(50) CHECK (role IN ('Patient', 'Doctor', 'Admin')) NOT NULL,
    full_name   VARCHAR(255),
    phone       VARCHAR(20),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors default to inactive until admin approves
-- handled in application layer

CREATE TABLE IF NOT EXISTS admin_logs (
    log_id        SERIAL PRIMARY KEY,
    admin_id      INT REFERENCES users(user_id),
    action        VARCHAR(255) NOT NULL,
    target_user_id INT REFERENCES users(user_id),
    details       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- Seed Data  (password = "123456" for all)
-- ================================================
INSERT INTO users (email, password_hash, role, full_name, is_active)
VALUES
  ('admin@aurahealth.lk',  '123456', 'Admin',   'Super Admin',        TRUE),
  ('doctor@aurahealth.lk', '123456', 'Doctor',  'Dr. Nimal Perera',   TRUE),
  ('patient@aurahealth.lk','123456', 'Patient', 'Kasun Silva',        TRUE)
ON CONFLICT (email) DO NOTHING;
