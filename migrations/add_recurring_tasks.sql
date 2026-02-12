-- Migration: Add recurring_tasks table and relationship
-- Description: Creates table for storing recurring task configurations (habits)

-- Create recurring_tasks table
CREATE TABLE recurring_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', etc.
  interval INTEGER DEFAULT 1,     -- Every X days
  duration_days INTEGER,          -- Total days for the habit (e.g., 21)
  start_date DATE DEFAULT CURRENT_DATE,
  last_generated_date DATE,
  status TEXT DEFAULT 'active',   -- 'active', 'completed', 'paused'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add recurring_task_id to tasks table to link instances to their parent config
ALTER TABLE tasks ADD COLUMN recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;

-- Create index for efficient querying of active recurring tasks
CREATE INDEX idx_recurring_tasks_status ON recurring_tasks(status);
CREATE INDEX idx_recurring_tasks_board ON recurring_tasks(board_id);
