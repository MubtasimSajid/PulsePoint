-- Wipe patient, doctor, and hospital user data from the database
-- Run it with: psql -h localhost -U postgres -d hospital_management -f wipe.sql

BEGIN;

-- Remove all patient, doctor, and hospital related data
-- CASCADE ensures proper deletion order for foreign key dependencies
TRUNCATE TABLE 
    medical_history, 
    prescriptions, 
    triage_notes,
    account_transactions,
    notifications,
    appointment_slots, 
    appointments,
    doctor_degrees,
    doctor_specializations, 
    hospital_doctors, 
    doctor_schedules,
    chambers,
    patients, 
    doctors, 
    hospitals,
    users,
    accounts
CASCADE;

COMMIT;
