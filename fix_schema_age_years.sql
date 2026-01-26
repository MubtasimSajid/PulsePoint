-- Add missing age_years column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_years INT;

-- Recalculate age for all existing users
UPDATE users 
SET age_years = FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)))
WHERE date_of_birth IS NOT NULL;
