-- Migration: Add due_date column to tasks table
-- Description: Adds support for task due dates with timezone awareness

-- Add due_date column
ALTER TABLE tasks 
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying by due date
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Add comment to document the column
COMMENT ON COLUMN tasks.due_date IS 'Optional due date and time for the task';
