/*
  # Create Task Management System

  1. New Tables
    - `categories`
      - `id` (uuid, primary key) - Unique identifier for each category
      - `name` (text) - Name of the category/area
      - `position` (integer) - Order position for display
      - `created_at` (timestamptz) - Creation timestamp
    
    - `tasks`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `title` (text) - Task title
      - `description` (text) - Detailed task description
      - `category_id` (uuid, foreign key) - Reference to category
      - `position` (integer) - Order position within category
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies allowing all operations for now (single-user app)
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies for categories (allow all operations for simplicity)
CREATE POLICY "Allow all operations on categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for tasks (allow all operations for simplicity)
CREATE POLICY "Allow all operations on tasks"
  ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert some default categories
INSERT INTO categories (name, position) VALUES
  ('Pendiente', 0),
  ('En Progreso', 1),
  ('Completado', 2)
ON CONFLICT DO NOTHING;