-- Add new fields to other_admissions table
ALTER TABLE other_admissions 
ADD COLUMN fees_paid INTEGER,
ADD COLUMN course_total_fees INTEGER,
ADD COLUMN course_start_date TIMESTAMP,
ADD COLUMN course_end_date TIMESTAMP,
ADD COLUMN payment_mode VARCHAR(100);