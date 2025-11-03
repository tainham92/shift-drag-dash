-- Add display_order column to staff table
ALTER TABLE public.staff 
ADD COLUMN display_order integer;

-- Set initial display_order based on created_at
UPDATE public.staff
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.staff
) AS subquery
WHERE staff.id = subquery.id;

-- Set default value and not null constraint
ALTER TABLE public.staff 
ALTER COLUMN display_order SET DEFAULT 0,
ALTER COLUMN display_order SET NOT NULL;