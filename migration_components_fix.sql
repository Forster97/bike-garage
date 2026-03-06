-- =============================================================
-- CORRECCIÓN DE MIGRACIÓN: limpiar y reiniciar sin unique constraint
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Limpiar estado anterior (parcial o fallido)
DELETE FROM bike_components;
DELETE FROM components;

-- 2. Eliminar el unique constraint problemático (si existe)
ALTER TABLE components
  DROP CONSTRAINT IF EXISTS components_user_name_cat_unique;

-- 3. Migrar TODOS los parts como componentes independientes (sin deduplicar)
--    Cada part es su propio componente con el mismo ID original.
INSERT INTO components (id, user_id, name, category, weight_g, created_at)
SELECT id, user_id, name, category, weight_g, created_at
FROM parts;

-- 4. Crear los vínculos bike ↔ component
INSERT INTO bike_components (bike_id, component_id, user_id, created_at)
SELECT bike_id, id, user_id, created_at
FROM parts;

-- 5. Verificar (opcional)
-- SELECT COUNT(*) AS total_components FROM components;
-- SELECT COUNT(*) AS total_links FROM bike_components;
-- SELECT COUNT(*) AS total_parts FROM parts;
-- Los tres números deben ser iguales.
