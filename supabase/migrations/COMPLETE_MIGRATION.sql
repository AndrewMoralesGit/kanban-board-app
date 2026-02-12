-- =====================================================
-- MIGRACIÓN COMPLETA PARA NUEVO PROYECTO SUPABASE
-- Ejecuta este script completo en el SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PASO 1: Crear tablas base (categories y tasks)
-- =====================================================

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todas las operaciones para desarrollo)
CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- PASO 2: Agregar columna de estado
-- =====================================================

-- Agregar columna status a tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente' 
CHECK (status IN ('pendiente', 'en_progreso', 'completado'));

-- Actualizar tareas existentes sin estado
UPDATE tasks
SET status = 'pendiente'
WHERE status IS NULL;

-- =====================================================
-- PASO 3: Agregar columna de historial
-- =====================================================

-- Agregar columna status_history
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- Inicializar historial para tareas existentes
UPDATE tasks
SET status_history = jsonb_build_array(
  jsonb_build_object(
    'status', COALESCE(status, 'pendiente'),
    'timestamp', COALESCE(created_at, NOW()),
    'previous_status', NULL
  )
)
WHERE status_history = '[]'::jsonb OR status_history IS NULL;

-- =====================================================
-- PASO 4: Insertar categorías por defecto
-- =====================================================

-- Insertar categorías iniciales (solo si no existen)
INSERT INTO categories (name, position)
SELECT 'General', 0
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'General');

INSERT INTO categories (name, position)
SELECT 'Trabajo', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Trabajo');

INSERT INTO categories (name, position)
SELECT 'Personal', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personal');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar estructura de tablas
SELECT 
  'categories' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

SELECT 
  'tasks' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Verificar categorías creadas
SELECT * FROM categories ORDER BY position;

-- =====================================================
-- ¡MIGRACIÓN COMPLETADA!
-- =====================================================
