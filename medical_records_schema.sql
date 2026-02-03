CREATE TABLE medical_records (
    record_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- Report, Prescription, Lab, Other
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    file_url TEXT, -- Link/URL to the document
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
