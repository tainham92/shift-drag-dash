-- Add team and is_active columns to staff table
ALTER TABLE public.staff 
ADD COLUMN team text,
ADD COLUMN is_active boolean DEFAULT true NOT NULL;