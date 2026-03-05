-- ==============================================================
-- Bike Garage — Módulo de Mantenimiento: DDL + Seed
-- Ejecutar en Supabase → SQL Editor (en orden, todo de una vez)
-- Idempotente: usa IF NOT EXISTS y ON CONFLICT
-- ==============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Extender maintenance_types con intervalos por perfil
-- ─────────────────────────────────────────────────────────────
ALTER TABLE maintenance_types
  ADD COLUMN IF NOT EXISTS category               text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS severity               text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS applies_to             text[],
  ADD COLUMN IF NOT EXISTS interval_days_maniac   int,
  ADD COLUMN IF NOT EXISTS interval_km_maniac     int,
  ADD COLUMN IF NOT EXISTS interval_days_balanced int,
  ADD COLUMN IF NOT EXISTS interval_km_balanced   int,
  ADD COLUMN IF NOT EXISTS interval_days_saver    int,
  ADD COLUMN IF NOT EXISTS interval_km_saver      int,
  ADD COLUMN IF NOT EXISTS notes_hint             text;


-- ─────────────────────────────────────────────────────────────
-- 2. Extender notification_preferences
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS days_before     int DEFAULT 7,
  ADD COLUMN IF NOT EXISTS km_before       int DEFAULT 100,
  ADD COLUMN IF NOT EXISTS silent_mode     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_emailed_at date;


-- ─────────────────────────────────────────────────────────────
-- 3. bike_stats — odómetro manual por bici
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bike_stats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id      uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  odometer_km  numeric(10,1) DEFAULT 0,
  updated_at   timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bike_stats_bike_id_idx ON bike_stats (bike_id);

ALTER TABLE bike_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_stats' AND policyname = 'owner'
  ) THEN
    CREATE POLICY "owner" ON bike_stats
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 4. bike_profiles — perfil activo por bici
--    'maniac' | 'balanced' | 'saver'
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bike_profiles (
  bike_id  uuid PRIMARY KEY REFERENCES bikes(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile  text NOT NULL DEFAULT 'balanced'
);

ALTER TABLE bike_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_profiles' AND policyname = 'owner'
  ) THEN
    CREATE POLICY "owner" ON bike_profiles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 5. maintenance_rules — reglas custom por bici + tipo
--    Sobreescriben el intervalo del perfil activo.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id       uuid    NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  type_id       bigint  NOT NULL,   -- references maintenance_types(id)
  interval_days int,
  interval_km   int,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS maintenance_rules_bike_type_idx
  ON maintenance_rules (bike_id, type_id);

CREATE INDEX IF NOT EXISTS maintenance_rules_bike_active_idx
  ON maintenance_rules (bike_id) WHERE is_active = true;

ALTER TABLE maintenance_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_rules' AND policyname = 'owner'
  ) THEN
    CREATE POLICY "owner" ON maintenance_rules
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 6. Índice de performance en bike_maintenance
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bike_maintenance_bike_type_perf_idx
  ON bike_maintenance (bike_id, type_id, performed_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 7. Unique constraint en maintenance_types.name (para seed)
-- ─────────────────────────────────────────────────────────────

-- Primero eliminar duplicados si los hay (mantiene el de menor id)
DELETE FROM maintenance_types WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
    FROM maintenance_types
  ) t WHERE rn > 1
);

-- Agregar constraint si no existe
DO $$ BEGIN
  ALTER TABLE maintenance_types
    ADD CONSTRAINT maintenance_types_name_key UNIQUE (name);
EXCEPTION WHEN others THEN NULL;  -- ya existe, ignorar
END $$;


-- ─────────────────────────────────────────────────────────────
-- 8. Seed: 20 tareas con intervalos por perfil
--    ON CONFLICT (name) DO UPDATE para ser idempotente
-- ─────────────────────────────────────────────────────────────
INSERT INTO maintenance_types (
  name, category, severity,
  interval_days_maniac,  interval_km_maniac,
  interval_days_balanced, interval_km_balanced,
  interval_days_saver,   interval_km_saver,
  default_interval_days, default_interval_km,
  applies_to, notes_hint
) VALUES

-- Transmisión
('Cadena – Lubricación', 'transmision', 'high',
  7,100,  14,200,  21,350,  14,200,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Aplica lubricante según condición. Seco: Dry. Lluvia: Wet. Limpia antes de lubricar.'),

('Cadena – Reemplazo', 'transmision', 'critical',
  NULL,1500,  NULL,2000,  NULL,3000,  NULL,2000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Medir con medidor de cadena. Reemplazar al 0.75%. Cambiar cassette si acumula >6.000 km.'),

('Cassette – Reemplazo', 'transmision', 'high',
  NULL,4000,  NULL,6000,  NULL,9000,  NULL,6000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Siempre reemplazar cassette junto con cadena nueva si ambos tienen mucho uso.'),

('Platos – Reemplazo', 'transmision', 'medium',
  NULL,8000,  NULL,12000,  NULL,18000,  NULL,12000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh'],
  'Revisar dientes curvos o asimétricos. Los platos de aluminio duran menos que los de acero.'),

('Cables transmisión – Ajuste', 'transmision', 'medium',
  90,3000,  180,5000,  365,NULL,  180,5000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Incluye ajuste de indexación. Cambiar fundas si están fisuradas o rígidas.'),

-- Frenos
('Frenos – Calibración', 'frenos', 'critical',
  14,300,  30,500,  60,1000,  30,500,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Ajustar mordida de pastillas, centrar caliper. Verificar que no haya ruido al frenar.'),

('Pastillas de freno – Revisión', 'frenos', 'critical',
  30,500,  60,1000,  90,1500,  60,1000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Revisar espesor. Reemplazar si < 1.5mm. Revisar disco por marcas de desgaste inusuales.'),

('Frenos – Purga hidráulica', 'frenos', 'high',
  180,NULL,  365,NULL,  NULL,NULL,  365,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh'],
  'Usar aceite mineral o DOT según fabricante. NUNCA mezclar tipos de aceite.'),

-- Suspensión
('Horquilla – Servicio básico (lowers)', 'suspension', 'high',
  30,NULL,  60,NULL,  120,NULL,  60,NULL,
  ARRAY['Gravel','XC','Trail','Enduro','Dh'],
  'Limpiar y relubricar sellos inferiores. 15 ml de aceite liviano por lado.'),

('Horquilla – Servicio completo', 'suspension', 'medium',
  100,NULL,  180,NULL,  365,NULL,  180,NULL,
  ARRAY['XC','Trail','Enduro','Dh'],
  'Cambio de aceite interno, retenes, cámara de aire. Llevar al taller especializado.'),

('Amortiguador trasero – Servicio', 'suspension', 'medium',
  100,NULL,  180,NULL,  365,NULL,  180,NULL,
  ARRAY['Trail','Enduro','Dh'],
  'Revisar eyelet bearings. Servicio completo cada temporada mínimo.'),

('Tija telescópica – Servicio', 'suspension', 'medium',
  90,NULL,  180,NULL,  365,NULL,  180,NULL,
  ARRAY['XC','Trail','Enduro','Dh'],
  'Limpiar sello externo, revisar caída y retorno del poste. Inyectar aceite si hace ruido.'),

-- Estructura
('Pedalier – Rodamientos', 'estructura', 'medium',
  90,NULL,  180,NULL,  365,NULL,  180,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Limpiar y relubricar. Síntoma: crujidos al pedalear, especialmente al subir.'),

('Bujes – Rodamientos', 'estructura', 'medium',
  90,NULL,  180,NULL,  NULL,NULL,  180,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh'],
  'Revisar juego lateral en ruedas. Relubricar o reemplazar rodamientos si hay juego.'),

('Dirección – Rodamientos', 'estructura', 'low',
  180,NULL,  365,NULL,  NULL,NULL,  365,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh'],
  'Detectar: golpeteo al frenar con horquilla sobre el suelo. Limpiar y relubricar.'),

('Torque check general', 'estructura', 'high',
  30,500,  60,1000,  180,NULL,  60,1000,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Potencia, manillar, tija, cierres de ruedas. Usar torquímetro. Ver valores en el componente.'),

-- Ruedas
('Tubeless – Sellante', 'ruedas', 'high',
  60,NULL,  90,NULL,  120,NULL,  90,NULL,
  ARRAY['Gravel','XC','Trail','Enduro','Dh'],
  'Agregar 30–60ml de sellante. Rotar neumáticos para distribuir. Revisar cortes grandes.'),

('Presión de neumáticos', 'ruedas', 'critical',
  3,NULL,  7,NULL,  14,NULL,  7,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Ajustar según peso, terreno y neumático. Road: 6-8 bar. MTB: 1.8-2.5 bar.'),

-- General
('Limpieza general', 'general', 'low',
  7,100,  14,200,  30,NULL,  14,200,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Lavar bici, secar bien, lubricar puntos de fricción. Revisar estado general.'),

('Revisión visual completa', 'general', 'medium',
  7,NULL,  14,NULL,  30,NULL,  14,NULL,
  ARRAY['Ruta','Gravel','XC','Trail','Enduro','Urbana','E-Bike','Dh','Otra'],
  'Revisar grietas en marco/horquilla, tensión de radios, estado de cubiertas y cables.')

ON CONFLICT (name) DO UPDATE SET
  category               = EXCLUDED.category,
  severity               = EXCLUDED.severity,
  interval_days_maniac   = EXCLUDED.interval_days_maniac,
  interval_km_maniac     = EXCLUDED.interval_km_maniac,
  interval_days_balanced = EXCLUDED.interval_days_balanced,
  interval_km_balanced   = EXCLUDED.interval_km_balanced,
  interval_days_saver    = EXCLUDED.interval_days_saver,
  interval_km_saver      = EXCLUDED.interval_km_saver,
  default_interval_days  = EXCLUDED.default_interval_days,
  default_interval_km    = EXCLUDED.default_interval_km,
  applies_to             = EXCLUDED.applies_to,
  notes_hint             = EXCLUDED.notes_hint;
