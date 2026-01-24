CREATE TABLE users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  age_years INT,
  gender VARCHAR(20),
  address TEXT,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'hospital_admin', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  dept_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE specializations (
  spec_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  spec_name VARCHAR(100) UNIQUE NOT NULL,
  dept_id INT REFERENCES departments(dept_id)
);

CREATE TABLE doctors (
  user_id INT PRIMARY KEY,
  doctor_code VARCHAR(50) UNIQUE,
  consultation_fee DECIMAL(10,2),
  license_number VARCHAR(50),
  specialization_id INT REFERENCES specializations(spec_id),
  experience_years INT,
  qualification VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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

CREATE TABLE patients (
  user_id INT PRIMARY KEY,
  patient_code VARCHAR(50) UNIQUE,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  bmi DECIMAL(5,2),
  blood_group VARCHAR(5),
  medical_notes TEXT,
  emergency_contact VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
  department_id INT,
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
  FOREIGN KEY (chamber_id) REFERENCES chambers(chamber_id),
  FOREIGN KEY (department_id) REFERENCES departments(dept_id)
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

-- Calculate age from date_of_birth
CREATE OR REPLACE FUNCTION set_user_age_years()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age_years := FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth)));
  ELSE
    NEW.age_years := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_age_calculation ON users;
CREATE TRIGGER users_age_calculation
  BEFORE INSERT OR UPDATE OF date_of_birth ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_age_years();

-- Keep user profile timestamps fresh
CREATE OR REPLACE FUNCTION touch_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION touch_user_updated_at();

-- BMI calculation trigger for patients
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL THEN
    -- Only compute for realistic values to avoid numeric overflow
    IF NEW.height_cm >= 30 AND NEW.height_cm <= 300 AND NEW.weight_kg > 0 AND NEW.weight_kg <= 500 THEN
      NEW.bmi := LEAST(
        ROUND(NEW.weight_kg / POWER((NEW.height_cm / 100)::numeric, 2), 2),
        999.99
      );
    ELSE
      NEW.bmi := NULL;
    END IF;
  ELSE
    NEW.bmi := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patients_bmi_trigger ON patients;
CREATE TRIGGER patients_bmi_trigger
  BEFORE INSERT OR UPDATE OF height_cm, weight_kg ON patients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();
