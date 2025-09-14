-- Create position types enum
CREATE TYPE position_type AS ENUM ('مدير', 'مندوب طبي', 'مندوب شؤون', 'سائق', 'محاسب', 'سكرتير');

-- Add new columns to employees table
ALTER TABLE employees 
ADD COLUMN birth_date DATE,
ADD COLUMN civil_id_no TEXT,
ADD COLUMN residency_expiry_date DATE;

-- Modify position column to use enum (first add new column, copy data, drop old, rename new)
ALTER TABLE employees ADD COLUMN position_new position_type;

-- Set default position for existing records if needed
UPDATE employees SET position_new = 'مندوب طبي'::position_type WHERE position IS NOT NULL;

-- Drop the old position column and rename the new one
ALTER TABLE employees DROP COLUMN position;
ALTER TABLE employees RENAME COLUMN position_new TO position;