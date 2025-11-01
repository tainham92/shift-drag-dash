-- Add employee profile fields to staff table
ALTER TABLE public.staff 
ADD COLUMN date_of_birth DATE,
ADD COLUMN national_id TEXT,
ADD COLUMN joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN education TEXT;