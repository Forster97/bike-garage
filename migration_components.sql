-- =============================================================
-- MIGRACIÓN: parts → components + bike_components (many-to-many)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Tabla components (reemplaza parts)
CREATE TABLE IF NOT EXISTS components (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  weight_g    INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint para permitir upsert por nombre+categoría por usuario
ALTER TABLE components
  ADD CONSTRAINT components_user_name_cat_unique
  UNIQUE (user_id, name, category);

ALTER TABLE components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "components_owner" ON components
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Tabla bike_components (junction many-to-many)
CREATE TABLE IF NOT EXISTS bike_components (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id       UUID NOT NULL REFERENCES bikes ON DELETE CASCADE,
  component_id  UUID NOT NULL REFERENCES components ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (bike_id, component_id)
);

ALTER TABLE bike_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bike_components_owner" ON bike_components
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Migrar datos existentes desde parts
--    (solo si parts existe y tiene datos)
INSERT INTO components (id, user_id, name, category, weight_g, created_at)
SELECT id, user_id, name, category, weight_g, created_at
FROM parts
ON CONFLICT (user_id, name, category) DO NOTHING;

INSERT INTO bike_components (bike_id, component_id, user_id, created_at)
SELECT bike_id, id, user_id, created_at
FROM parts
ON CONFLICT (bike_id, component_id) DO NOTHING;

-- 4. (Opcional) Verificar migración
-- SELECT COUNT(*) FROM components;
-- SELECT COUNT(*) FROM bike_components;
-- SELECT COUNT(*) FROM parts;  -- debería ser igual a los anteriores
