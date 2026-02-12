-- ============================================
-- MIGRACIÓN: Sistema Multi-Pizarra
-- Descripción: Agrega tabla boards y relaciona categories/tasks con pizarras
-- Fecha: 2026-02-11
-- ============================================

-- PASO 1: Crear tabla boards
-- ============================================
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: Crear pizarra por defecto
-- ============================================
INSERT INTO boards (name, description) 
VALUES ('Mi Pizarra de Tareas', 'Pizarra principal')
ON CONFLICT DO NOTHING;

-- PASO 3: Agregar columnas board_id a categories y tasks
-- ============================================
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES boards(id) ON DELETE CASCADE;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES boards(id) ON DELETE CASCADE;

-- PASO 4: Migrar datos existentes a la pizarra por defecto
-- ============================================
DO $$
DECLARE
  default_board_id UUID;
BEGIN
  -- Obtener ID de la pizarra por defecto
  SELECT id INTO default_board_id 
  FROM boards 
  WHERE name = 'Mi Pizarra de Tareas' 
  LIMIT 1;

  -- Actualizar categorías sin board_id
  UPDATE categories 
  SET board_id = default_board_id 
  WHERE board_id IS NULL;

  -- Actualizar tareas sin board_id
  UPDATE tasks 
  SET board_id = default_board_id 
  WHERE board_id IS NULL;
END $$;

-- PASO 5: Hacer board_id NOT NULL (después de migrar datos)
-- ============================================
ALTER TABLE categories 
ALTER COLUMN board_id SET NOT NULL;

ALTER TABLE tasks 
ALTER COLUMN board_id SET NOT NULL;

-- PASO 6: Crear índices para mejorar performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_board_id ON categories(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);

-- PASO 7: Crear función para actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 8: Crear trigger para boards
-- ============================================
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas queries para verificar la migración:
-- SELECT * FROM boards;
-- SELECT COUNT(*) FROM categories WHERE board_id IS NOT NULL;
-- SELECT COUNT(*) FROM tasks WHERE board_id IS NOT NULL;
