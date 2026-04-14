-- Patient Service Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

INSERT INTO users (name, email, password, role)
VALUES
  ('Test Patient', 'testpatient@aurahealth.lk', '123456', 'PATIENT'),
  ('Admin User', 'admin@aurahealth.lk', '123456', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO patients (
  user_id, full_name, email, phone, date_of_birth, gender, address,
  blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone
)
SELECT
  u.id,
  'Test Patient',
  'testpatient@aurahealth.lk',
  '0711234567',
  '2000-05-10',
  'Female',
  'Colombo',
  'A+',
  'Dust',
  'Asthma',
  'Nimal Perera',
  '0771234567'
FROM users u
WHERE u.email = 'testpatient@aurahealth.lk'
ON CONFLICT (user_id) DO NOTHING;
