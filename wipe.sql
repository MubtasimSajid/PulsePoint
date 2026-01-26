-- Save this as wipe.sql in d:\Documents\PulsePoint
-- Run it with: psql -h localhost -U postgres -d hospital_management -f wipe.sql

BEGIN;

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
