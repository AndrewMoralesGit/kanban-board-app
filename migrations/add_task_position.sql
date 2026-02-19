ALTER TABLE tasks ADD COLUMN position DOUBLE PRECISION DEFAULT 0;
CREATE INDEX idx_tasks_position ON tasks(position);
