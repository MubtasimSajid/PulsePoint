DROP TABLE IF EXISTS prescription_medications CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;

-- Prescriptions Table
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(user_id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(user_id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);

-- Prescription Medications Table
CREATE TABLE prescription_medications (
    medication_id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- e.g., '1+0+1'
    duration VARCHAR(100) NOT NULL, -- e.g., '7 days', '1 month'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescription_medications_prescription ON prescription_medications(prescription_id);
