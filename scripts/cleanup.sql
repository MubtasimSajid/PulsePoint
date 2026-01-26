-- Disable constraints temporarily if needed, or just use CASCADE
-- This script deletes all data but keeps the schema structure
BEGIN;

-- Delete from dependent tables first (though CASCADE handles it, explicit is safer for clarity)
TRUNCATE TABLE 
    medical_history, 
    prescriptions, 
    triage_notes,
    account_transactions,
    notifications,
    appointment_slots, 
    appointments 
CASCADE;

TRUNCATE TABLE 
    doctor_degrees,
    doctor_specializations, 
    hospital_doctors, 
    doctor_schedules,
    chambers,
    patients, 
    doctors, 
    hospitals 
CASCADE;

-- Finally clear users
TRUNCATE TABLE users CASCADE;

-- Reset accounts if they exist (depending on constraints)
TRUNCATE TABLE accounts CASCADE;

COMMIT;
