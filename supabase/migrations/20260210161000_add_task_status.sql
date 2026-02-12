/*
  # Add Task Status Column
  
  1. Changes
    - Add `status` column to `tasks` table
    - Set default value to 'pendiente'
    - Add check constraint for valid status values
    - Update existing categories to be work areas instead of status columns
*/

-- Add status column to tasks table
ALTER TABLE tasks 
ADD COLUMN status text DEFAULT 'pendiente' 
CHECK (status IN ('pendiente', 'en_progreso', 'completado'));

-- Update all existing tasks to have 'pendiente' status
UPDATE tasks SET status = 'pendiente' WHERE status IS NULL;

-- Clear existing categories and add new work area categories
DELETE FROM categories;

INSERT INTO categories (name, position) VALUES
  ('General', 0),
  ('Trabajo', 1),
  ('Personal', 2)
ON CONFLICT DO NOTHING;
