-- Add phone, email, and position fields to staff table
ALTER TABLE public.staff 
ADD COLUMN phone TEXT,
ADD COLUMN email TEXT,
ADD COLUMN position TEXT;