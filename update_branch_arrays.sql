BEGIN;

-- Drop the old single branch_name column if it exists
ALTER TABLE hospitals DROP COLUMN IF EXISTS branch_name;

-- Add new array columns for branches
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS branch_names TEXT[];
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS branch_addresses TEXT[];

COMMIT;
