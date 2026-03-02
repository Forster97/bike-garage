-- ==============================================================
-- Bike model templates + component templates  ·  2023-2024-2025
-- Pesos aproximados según especificaciones oficiales (gravel)
-- Idempotente: usa WHERE NOT EXISTS para evitar duplicados
-- Ejecutar en Supabase → SQL Editor
-- ==============================================================


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                         2023                              ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── Specialized Diverge Expert Carbon 2023 ───────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Specialized', 'Diverge Expert Carbon', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Specialized' AND model = 'Diverge Expert Carbon' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'FACT 9r Carbon, CG-R, Future Shock 2.0',          950,  1),
  ('Horquilla',      'Specialized FACT Carbon, 43mm offset',             430,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'Roval Terra CLX (par)',                           1457,  9),
  ('Neumáticos',     'Specialized Pathfinder Pro 2Bliss 38c (par)',      480, 10),
  ('Manillar',       'Specialized Hover Expert Alloy, 124mm drop',       245, 11),
  ('Potencia',       'Specialized Expert Alloy, 100mm',                  112, 12),
  ('Tija de sillín', 'Specialized CG-R Carbon, 350mm',                  295, 13),
  ('Sillín',         'Body Geometry Power Expert',                       225, 14)
) AS v(category, name, weight_g, position);

-- ── Specialized Crux Expert 2023 ─────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Specialized', 'Crux Expert', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Specialized' AND model = 'Crux Expert' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'FACT 11r Carbon, OSBB',                            780,  1),
  ('Horquilla',      'Specialized FACT Carbon, 45mm offset',             370,  2),
  ('Bielas',         'SRAM Force AXS 2x, 46/33T',                       590,  3),
  ('Desviador del.', 'SRAM Force AXS',                                    89,  4),
  ('Desviador',      'SRAM Force AXS',                                  269,  5),
  ('Palancas',       'SRAM Force AXS (par)',                            380,  6),
  ('Cassette',       'SRAM XG-1270 10-33T 12v',                         195,  7),
  ('Cadena',         'SRAM Force 12v',                                  231,  8),
  ('Frenos',         'SRAM Force AXS hidráulico (par)',                  300,  9),
  ('Ruedas',         'Roval Rapide CLX 38 (par)',                      1290, 10),
  ('Neumáticos',     'Specialized Terra Pro 33c (par)',                  420, 11),
  ('Manillar',       'Specialized S-Works Carbon, 125mm drop',           198, 12),
  ('Potencia',       'Specialized Expert Alloy, 90mm',                   108, 13),
  ('Tija de sillín', 'Specialized CG-R Carbon, 350mm',                  295, 14),
  ('Sillín',         'Body Geometry Power Expert',                       225, 15)
) AS v(category, name, weight_g, position);

-- ── Canyon Grail CF SL 8 2023 ─────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Canyon', 'Grail CF SL 8', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Canyon' AND model = 'Grail CF SL 8' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Canyon CF SL Carbon, Hover Bar integration',       900,  1),
  ('Horquilla',      'Canyon CF Carbon, 50mm offset',                    420,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'DT Swiss G 1800 Spline (par)',                   1780,  9),
  ('Neumáticos',     'Schwalbe G-One Allround 40c (par)',                460, 10),
  ('Manillar',       'Canyon Hover Bar 2.0, double-decker',              320, 11),
  ('Potencia',       'Canyon H31, 90mm',                                 110, 12),
  ('Tija de sillín', 'Canyon VCLS 2.0 CF',                              230, 13),
  ('Sillín',         'Fizik Tempo Argo R3',                              248, 14)
) AS v(category, name, weight_g, position);

-- ── Trek Checkpoint SL 7 2023 ─────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Trek', 'Checkpoint SL 7', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Trek' AND model = 'Checkpoint SL 7' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          '500 Series OCLV Carbon, IsoSpeed',                 870,  1),
  ('Horquilla',      'Checkpoint Full Carbon',                           415,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'Bontrager Aeolus Comp 5 TLR (par)',              1620,  9),
  ('Neumáticos',     'Bontrager GR1 Team Issue 40c (par)',               490, 10),
  ('Manillar',       'Bontrager Pro, 24mm drop',                         240, 11),
  ('Potencia',       'Bontrager Elite Alloy, 90mm',                      115, 12),
  ('Tija de sillín', 'Bontrager Comp Isocore',                          280, 13),
  ('Sillín',         'Bontrager Montrose Elite',                         230, 14)
) AS v(category, name, weight_g, position);

-- ── Cannondale Topstone Carbon 3 2023 ─────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Cannondale', 'Topstone Carbon 3', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Cannondale' AND model = 'Topstone Carbon 3' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'BallisTec Carbon, SAVE suspension',                900,  1),
  ('Horquilla',      'Topstone Carbon Full Carbon',                      410,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'WTB ST i23 TCS 2.0 (par)',                       1850,  9),
  ('Neumáticos',     'WTB Resolute 42c (par)',                           540, 10),
  ('Manillar',       'Cannondale C2 Alloy',                              260, 11),
  ('Potencia',       'Cannondale C2 Alloy, 90mm',                        120, 12),
  ('Tija de sillín', 'Cannondale Kingpin Micro Suspension',              320, 13),
  ('Sillín',         'Fizik Tempo Argo R3',                              248, 14)
) AS v(category, name, weight_g, position);

-- ── Giant Revolt Advanced 1 2023 ──────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Giant', 'Revolt Advanced 1', 2023
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Giant' AND model = 'Revolt Advanced 1' AND year = 2023
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Advanced SL-Grade Composite, D-Fuse seatstays',    890,  1),
  ('Horquilla',      'Advanced Composite Full Carbon',                    420,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'Giant TCC Carbon Disc (par)',                     1540,  9),
  ('Neumáticos',     'Giant Gavia Fondo 1 40c (par)',                    460, 10),
  ('Manillar',       'Giant Contact SLR OD2 Compact',                    210, 11),
  ('Potencia',       'Giant Contact SLR OD2, 90mm',                      108, 12),
  ('Tija de sillín', 'Giant D-Fuse SLR Carbon',                         225, 13),
  ('Sillín',         'Giant Fleet SL',                                   220, 14)
) AS v(category, name, weight_g, position);


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                         2024                              ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── Specialized Diverge STR Expert 2024 ──────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Specialized', 'Diverge STR Expert', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Specialized' AND model = 'Diverge STR Expert' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'FACT 9r Carbon, Future Shock 3.0 STR (trasero)',  1050,  1),
  ('Horquilla',      'Specialized FACT Carbon, Future Shock 3.0',        450,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'Roval Terra CLX (par)',                           1457,  9),
  ('Neumáticos',     'Specialized Pathfinder Pro 2Bliss 42c (par)',      520, 10),
  ('Manillar',       'Specialized Hover Expert Alloy, 124mm drop',       245, 11),
  ('Potencia',       'Specialized Expert Alloy, 100mm',                  112, 12),
  ('Tija de sillín', 'S-Works CG-R Carbon, 350mm',                      260, 13),
  ('Sillín',         'Body Geometry Power Expert',                       225, 14)
) AS v(category, name, weight_g, position);

-- ── Canyon Grail CFR Di2 2024 ─────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Canyon', 'Grail CFR Di2', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Canyon' AND model = 'Grail CFR Di2' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Canyon CFR Carbon, Hover Bar 3.0',                 780,  1),
  ('Horquilla',      'Canyon CFR Carbon, 50mm offset',                   390,  2),
  ('Bielas',         'Shimano GRX Di2 RX820 2x, 48/31T',                 729,  3),
  ('Desviador del.', 'Shimano GRX Di2 RX820',                             97,  4),
  ('Desviador',      'Shimano GRX Di2 RX820',                            262,  5),
  ('Palancas',       'Shimano GRX Di2 RX820 (par)',                      310,  6),
  ('Cassette',       'Shimano CS-R9200 11-34T 12v',                      223,  7),
  ('Cadena',         'Shimano CN-M9100 12v',                             240,  8),
  ('Frenos',         'Shimano GRX Di2 RX820 hidráulico (par)',            270,  9),
  ('Ruedas',         'Zipp 303 Firecrest (par)',                        1310, 10),
  ('Neumáticos',     'Schwalbe G-One RS 40c (par)',                      370, 11),
  ('Manillar',       'Canyon Hover Bar 3.0, double-decker',              320, 12),
  ('Potencia',       'Canyon H31 CF, 90mm',                              100, 13),
  ('Tija de sillín', 'Canyon VCLS 2.0 CF',                              230, 14),
  ('Sillín',         'Fizik Antares R3',                                 215, 15)
) AS v(category, name, weight_g, position);

-- ── Trek Checkpoint SL 7 AXS 2024 ────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Trek', 'Checkpoint SL 7 AXS', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Trek' AND model = 'Checkpoint SL 7 AXS' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          '500 Series OCLV Carbon, IsoSpeed delantero',       870,  1),
  ('Horquilla',      'Checkpoint Full Carbon',                           415,  2),
  ('Bielas',         'SRAM Force AXS XPLR 1x, 43T',                     618,  3),
  ('Desviador',      'SRAM Force AXS XPLR',                             289,  4),
  ('Palancas',       'SRAM Force AXS XPLR (par)',                       375,  5),
  ('Cassette',       'SRAM XG-1271 10-44T 12v',                         195,  6),
  ('Cadena',         'SRAM Force 12v',                                  231,  7),
  ('Frenos',         'SRAM Force AXS hidráulico (par)',                  300,  8),
  ('Ruedas',         'Bontrager Aeolus Pro 37V TLR (par)',             1500,  9),
  ('Neumáticos',     'Bontrager GR1 Team Issue 40c (par)',               490, 10),
  ('Manillar',       'Bontrager Pro VR-SF, 24mm drop',                   240, 11),
  ('Potencia',       'Bontrager Pro Alloy, 90mm',                        110, 12),
  ('Tija de sillín', 'Bontrager Isocore Carbon',                         255, 13),
  ('Sillín',         'Bontrager Aeolus Comp',                            210, 14)
) AS v(category, name, weight_g, position);

-- ── Cannondale Topstone Carbon 2 2024 ─────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Cannondale', 'Topstone Carbon 2', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Cannondale' AND model = 'Topstone Carbon 2' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'BallisTec Carbon, Kingpin suspension',             900,  1),
  ('Horquilla',      'Topstone Carbon Full Carbon',                      410,  2),
  ('Bielas',         'SRAM Force AXS XPLR 1x, 43T',                     618,  3),
  ('Desviador',      'SRAM Force AXS XPLR',                             289,  4),
  ('Palancas',       'SRAM Force AXS XPLR (par)',                       375,  5),
  ('Cassette',       'SRAM XG-1271 10-44T 12v',                         195,  6),
  ('Cadena',         'SRAM Force 12v',                                  231,  7),
  ('Frenos',         'SRAM Force AXS hidráulico (par)',                  300,  8),
  ('Ruedas',         'HED Emporia RA Pro Disc (par)',                  1560,  9),
  ('Neumáticos',     'Pirelli Cinturato Gravel M 40c (par)',             440, 10),
  ('Manillar',       'Cannondale C1 Carbon Compact',                     225, 11),
  ('Potencia',       'Cannondale C1 Alloy, 90mm',                        115, 12),
  ('Tija de sillín', 'Cannondale Kingpin Micro Suspension',              320, 13),
  ('Sillín',         'WTB Volt Team',                                    218, 14)
) AS v(category, name, weight_g, position);

-- ── Giant Revolt Advanced 0 2024 ──────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Giant', 'Revolt Advanced 0', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Giant' AND model = 'Revolt Advanced 0' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Advanced SL-Grade Composite, D-Fuse seatstays',    860,  1),
  ('Horquilla',      'Advanced Composite Full Carbon',                    410,  2),
  ('Bielas',         'SRAM Force AXS XPLR 1x, 43T',                     618,  3),
  ('Desviador',      'SRAM Force AXS XPLR',                             289,  4),
  ('Palancas',       'SRAM Force AXS XPLR (par)',                       375,  5),
  ('Cassette',       'SRAM XG-1271 10-44T 12v',                         195,  6),
  ('Cadena',         'SRAM Force 12v',                                  231,  7),
  ('Frenos',         'SRAM Force AXS hidráulico (par)',                  300,  8),
  ('Ruedas',         'Giant TCC Carbon Disc (par)',                     1450,  9),
  ('Neumáticos',     'Giant Gavia Fondo 1 40c (par)',                    460, 10),
  ('Manillar',       'Giant Contact SLR OD2 Compact',                    210, 11),
  ('Potencia',       'Giant Contact SLR OD2, 100mm',                     108, 12),
  ('Tija de sillín', 'Giant D-Fuse SLR Carbon',                         225, 13),
  ('Sillín',         'Fizik Tempo Argo R3',                              215, 14)
) AS v(category, name, weight_g, position);

-- ── Santa Cruz Stigmata CC Force AXS 2024 ────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Santa Cruz', 'Stigmata CC Force AXS', 2024
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Santa Cruz' AND model = 'Stigmata CC Force AXS' AND year = 2024
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'CC Carbon High Modulus',                           870,  1),
  ('Horquilla',      'Santa Cruz CC Carbon',                             400,  2),
  ('Bielas',         'SRAM Force AXS XPLR 1x, 43T',                     618,  3),
  ('Desviador',      'SRAM Force AXS XPLR',                             289,  4),
  ('Palancas',       'SRAM Force AXS XPLR (par)',                       375,  5),
  ('Cassette',       'SRAM XG-1271 10-44T 12v',                         195,  6),
  ('Cadena',         'SRAM Force 12v',                                  231,  7),
  ('Frenos',         'SRAM Force AXS hidráulico (par)',                  300,  8),
  ('Ruedas',         'Reserve 37|44 GD Disc (par)',                    1390,  9),
  ('Neumáticos',     'WTB Riddler 37c (par)',                            440, 10),
  ('Manillar',       'Enve G Series Compact',                            210, 11),
  ('Potencia',       'Enve Road, 100mm',                                 105, 12),
  ('Tija de sillín', 'Santa Cruz Carbon, 350mm',                        260, 13),
  ('Sillín',         'WTB Volt Team',                                    218, 14)
) AS v(category, name, weight_g, position);


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                         2025                              ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── Specialized Diverge STR Comp Carbon 2025 ─────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Specialized', 'Diverge STR Comp Carbon', 2025
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Specialized' AND model = 'Diverge STR Comp Carbon' AND year = 2025
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'FACT 9r Carbon, Future Shock 3.0 STR (trasero)',  1050,  1),
  ('Horquilla',      'Specialized FACT Carbon, Future Shock 3.0',        450,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'Roval Terra C (par)',                             1600,  9),
  ('Neumáticos',     'Specialized Pathfinder Pro 2Bliss 42c (par)',      520, 10),
  ('Manillar',       'Specialized Hover Comp Alloy, 124mm drop',         260, 11),
  ('Potencia',       'Specialized Comp Alloy, 100mm',                    120, 12),
  ('Tija de sillín', 'Specialized CG-R Comp Carbon, 350mm',             310, 13),
  ('Sillín',         'Body Geometry Toupé Comp',                         265, 14)
) AS v(category, name, weight_g, position);

-- ── Canyon Grail CF SL 8 2025 ─────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Canyon', 'Grail CF SL 8', 2025
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Canyon' AND model = 'Grail CF SL 8' AND year = 2025
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Canyon CF SL Carbon',                              880,  1),
  ('Horquilla',      'Canyon CF Carbon, 50mm offset',                    410,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'DT Swiss G 1800 Spline (par)',                   1750,  9),
  ('Neumáticos',     'Schwalbe G-One Allround TLE 40c (par)',            460, 10),
  ('Manillar',       'Canyon Hover Bar 4.0, double-decker',              300, 11),
  ('Potencia',       'Canyon H31, 90mm',                                 110, 12),
  ('Tija de sillín', 'Canyon VCLS 2.0 CF',                              230, 13),
  ('Sillín',         'Fizik Tempo Argo R3',                              248, 14)
) AS v(category, name, weight_g, position);

-- ── Trek Checkpoint SL 6 2025 ─────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Trek', 'Checkpoint SL 6', 2025
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Trek' AND model = 'Checkpoint SL 6' AND year = 2025
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          '500 Series OCLV Carbon, IsoSpeed delantero',       870,  1),
  ('Horquilla',      'Checkpoint Full Carbon',                           415,  2),
  ('Bielas',         'Shimano GRX Di2 RX820 1x, 40T',                   680,  3),
  ('Desviador',      'Shimano GRX Di2 RX820',                           262,  4),
  ('Palancas',       'Shimano GRX Di2 RX820 (par)',                     310,  5),
  ('Cassette',       'Shimano CS-HG700 11-42T 11v',                     346,  6),
  ('Cadena',         'Shimano CN-HG701',                                 252,  7),
  ('Frenos',         'Shimano GRX Di2 RX820 hidráulico (par)',           270,  8),
  ('Ruedas',         'Bontrager Aeolus Comp 5 TLR (par)',              1620,  9),
  ('Neumáticos',     'Bontrager GR1 Team Issue 40c (par)',               490, 10),
  ('Manillar',       'Bontrager Elite VR-SF Compact',                    250, 11),
  ('Potencia',       'Bontrager Elite Alloy, 90mm',                      115, 12),
  ('Tija de sillín', 'Bontrager Comp Isocore',                          280, 13),
  ('Sillín',         'Bontrager Montrose Elite',                         230, 14)
) AS v(category, name, weight_g, position);

-- ── Giant Revolt Advanced 2 2025 ──────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'Giant', 'Revolt Advanced 2', 2025
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'Giant' AND model = 'Revolt Advanced 2' AND year = 2025
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'Advanced-Grade Composite, D-Fuse seatstays',       920,  1),
  ('Horquilla',      'Advanced-Grade Composite Full Carbon',              430,  2),
  ('Bielas',         'Shimano GRX Di2 RX820 1x, 40T',                   680,  3),
  ('Desviador',      'Shimano GRX Di2 RX820',                           262,  4),
  ('Palancas',       'Shimano GRX Di2 RX820 (par)',                     310,  5),
  ('Cassette',       'Shimano CS-HG700 11-42T 11v',                     346,  6),
  ('Cadena',         'Shimano CN-HG701',                                 252,  7),
  ('Frenos',         'Shimano GRX Di2 RX820 hidráulico (par)',           270,  8),
  ('Ruedas',         'Giant Tracker Disc (par)',                        1850,  9),
  ('Neumáticos',     'Giant Gavia Fondo 1 40c (par)',                    460, 10),
  ('Manillar',       'Giant Contact OD2 Compact',                        230, 11),
  ('Potencia',       'Giant Contact OD2, 90mm',                          115, 12),
  ('Tija de sillín', 'Giant D-Fuse SLR Carbon',                         225, 13),
  ('Sillín',         'Giant Fleet SL',                                   220, 14)
) AS v(category, name, weight_g, position);

-- ── BMC URS Three 2025 ────────────────────────────────────────
WITH t AS (
  INSERT INTO bike_model_templates (brand, model, year)
  SELECT 'BMC', 'URS Three', 2025
  WHERE NOT EXISTS (
    SELECT 1 FROM bike_model_templates
    WHERE brand = 'BMC' AND model = 'URS Three' AND year = 2025
  )
  RETURNING id
)
INSERT INTO component_templates (template_id, category, name, weight_g, position)
SELECT t.id, v.category, v.name, v.weight_g, v.position
FROM t CROSS JOIN (VALUES
  ('Marco',          'BMC Monocoque Carbon, ICS (Integrated Cable System)', 930, 1),
  ('Horquilla',      'BMC Full Carbon, 50mm offset',                    410,  2),
  ('Bielas',         'SRAM Rival AXS XPLR 1x, 40T',                     672,  3),
  ('Desviador',      'SRAM Rival AXS XPLR',                             299,  4),
  ('Palancas',       'SRAM Rival AXS XPLR (par)',                       390,  5),
  ('Cassette',       'SRAM XG-1251 10-44T 12v',                         215,  6),
  ('Cadena',         'SRAM Rival 12v',                                  249,  7),
  ('Frenos',         'SRAM Rival AXS hidráulico (par)',                  320,  8),
  ('Ruedas',         'DT Swiss G 1800 Spline (par)',                   1780,  9),
  ('Neumáticos',     'Vittoria Terreno Dry 38c (par)',                   450, 10),
  ('Manillar',       'FSA Adventure Compact',                            270, 11),
  ('Potencia',       'FSA SL-K, 90mm',                                   105, 12),
  ('Tija de sillín', 'BMC Full Carbon, 350mm',                          265, 13),
  ('Sillín',         'WTB Volt Team',                                    218, 14)
) AS v(category, name, weight_g, position);
