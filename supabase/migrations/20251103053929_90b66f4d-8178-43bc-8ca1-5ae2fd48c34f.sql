-- Make hourly_rate nullable since full-time employees use monthly_salary
ALTER TABLE public.staff
ALTER COLUMN hourly_rate DROP NOT NULL;