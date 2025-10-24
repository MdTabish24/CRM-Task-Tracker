-- Run this SQL in Render PostgreSQL database

-- Add source_of_reach column if not exists
ALTER TABLE other_admissions ADD COLUMN IF NOT EXISTS source_of_reach VARCHAR(200);

-- Make record_id nullable
ALTER TABLE other_admissions ALTER COLUMN record_id DROP NOT NULL;

-- Make caller_name nullable
ALTER TABLE other_admissions ALTER COLUMN caller_name DROP NOT NULL;
