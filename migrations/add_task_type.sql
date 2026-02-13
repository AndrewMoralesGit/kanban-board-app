-- Add type column to tasks table
ALTER TABLE tasks ADD COLUMN type TEXT DEFAULT 'task'; -- 'task' | 'note'
CREATE INDEX idx_tasks_type ON tasks(type);

-- Update existing rows to be 'task' (already handled by default, but good for clarity)
UPDATE tasks SET type = 'task' WHERE type IS NULL;
