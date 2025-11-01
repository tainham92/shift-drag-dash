-- Add employment_type column to staff table
ALTER TABLE public.staff 
ADD COLUMN employment_type TEXT NOT NULL DEFAULT 'full-time';

-- Add a check constraint to ensure only valid values
ALTER TABLE public.staff 
ADD CONSTRAINT staff_employment_type_check 
CHECK (employment_type IN ('full-time', 'part-time'));