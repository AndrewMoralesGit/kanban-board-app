-- Migration: Add counters for high frequency tasks
-- Description: Adds columns to support tasks that need to be done multiple times per day (e.g., "Drink 8 glasses of water")

-- Add target_count to config table (how many times per day)
ALTER TABLE recurring_tasks ADD COLUMN target_count INTEGER DEFAULT 1;

-- Add counters to tasks table
-- current_count: User progress (starts at 0)
-- target_count: Goal for this specific instance (copied from recurring_tasks or set manually)
ALTER TABLE tasks ADD COLUMN current_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN target_count INTEGER DEFAULT 1;
