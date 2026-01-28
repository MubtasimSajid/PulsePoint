BEGIN;

-- Add degrees array column to doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS degrees TEXT[];

-- Drop the doctor_degrees table
DROP TABLE IF EXISTS doctor_degrees;

COMMIT;
