CREATE TABLE users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  dob DATE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
  user_id INT PRIMARY KEY,
  doctor_code VARCHAR(50) UNIQUE,
  consultation_fee DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE patients (
  user_id INT PRIMARY KEY,
  patient_code VARCHAR(50) UNIQUE,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  blood_group VARCHAR(5),
  medical_notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE departments (
  dept_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE specializations (
  spec_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE doctor_specializations (
  doctor_id INT,
  spec_id INT,
  PRIMARY KEY (doctor_id, spec_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE,
  FOREIGN KEY (spec_id) REFERENCES specializations(spec_id)
);

CREATE TABLE doctor_degrees (
  degree_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id INT NOT NULL,
  degree_name VARCHAR(100),
  institution VARCHAR(150),
  achievement_year INT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE hospitals (
  hospital_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  est_year INT,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  license_number VARCHAR(50) UNIQUE,
  FOREIGN KEY (admin_user_id) REFERENCES users(user_id)
);

CREATE TABLE hospital_doctors (
  hospital_id INT,
  doctor_id INT,
  consultation_fee DECIMAL(10,2),
  PRIMARY KEY (hospital_id, doctor_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE chambers (
  chamber_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id INT NOT NULL,
  name VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  appointment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  hospital_id INT,
  chamber_id INT,
  appt_date DATE NOT NULL,
  appt_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  note TEXT,

  CHECK (
    (hospital_id IS NOT NULL AND chamber_id IS NULL)
    OR
    (hospital_id IS NULL AND chamber_id IS NOT NULL)
  ),

  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
  FOREIGN KEY (chamber_id) REFERENCES chambers(chamber_id)
);

CREATE TABLE prescriptions (
  prescription_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL,
  medicine_name VARCHAR(100),
  dosage VARCHAR(50),
  instructions VARCHAR(100),
  duration_days INT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

CREATE TABLE medical_history (
  history_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  visit_date DATE NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id)
);

CREATE INDEX idx_appointments_doctor_date
  ON appointments (doctor_id, appt_date);

CREATE INDEX idx_appointments_patient
  ON appointments (patient_id);

CREATE INDEX idx_medical_history_patient
  ON medical_history (patient_id);
