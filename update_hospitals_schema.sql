BEGIN;

-- Add branch_name column
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS branch_name VARCHAR(150);

-- Change location column to TEXT to accommodate addresses
ALTER TABLE hospitals ALTER COLUMN location TYPE TEXT;

COMMIT;
