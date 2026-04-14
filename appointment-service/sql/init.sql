-- Appointment Service Database Schema

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  hospital VARCHAR(150),
  location VARCHAR(150),
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  available_days TEXT,
  available_time VARCHAR(100),
  profile_image TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5,
  visit_type VARCHAR(50) DEFAULT 'Telemedicine',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_user_id INTEGER NOT NULL,
  patient_name VARCHAR(150) NOT NULL,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  doctor_name VARCHAR(150) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(50) NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'Telemedicine',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED')),
  hospital VARCHAR(150),
  location VARCHAR(150),
  notes TEXT,
  video_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO doctors
  (name, specialty, hospital, location, consultation_fee, available_days, available_time, profile_image, rating, visit_type)
VALUES
  ('Dr. Sarah Mitchell', 'Cardiology', 'Colombo Heart Center', 'Colombo', 8500, 'Mon, Wed, Fri', '10:30 AM', 'https://i.pravatar.cc/150?img=32', 4.9, 'Telemedicine'),
  ('Dr. James Wilson', 'Pediatrics', 'St. Mary''s Clinic', 'Kandy', 6500, 'Tue, Thu', '02:00 PM', 'https://i.pravatar.cc/150?img=12', 4.7, 'Physical Visit'),
  ('Dr. Ayesha Fernando', 'Dermatology', 'Skin Care Medical', 'Galle', 7000, 'Mon, Sat', '09:00 AM', 'https://i.pravatar.cc/150?img=47', 4.8, 'Telemedicine'),
  ('Dr. Nimal Perera', 'Neurology', 'Neuro Plus Hospital', 'Colombo', 10000, 'Wed, Fri', '04:30 PM', 'https://i.pravatar.cc/150?img=15', 4.6, 'Physical Visit')
ON CONFLICT DO NOTHING;
