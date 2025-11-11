-- Add recurring_group_id to track which shifts belong together
ALTER TABLE shifts ADD COLUMN recurring_group_id uuid;

-- Add index for better query performance
CREATE INDEX idx_shifts_recurring_group ON shifts(recurring_group_id);

-- Add comment to explain the column
COMMENT ON COLUMN shifts.recurring_group_id IS 'Groups recurring shifts together. NULL for one-off shifts.';