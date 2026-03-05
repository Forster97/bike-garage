-- ==============================================================
-- Component templates · 2022 bikes
-- Inserta componentes para 52 bike_model_templates sin datos.
-- Pesos aproximados según especificaciones oficiales.
-- Ejecutar en Supabase → SQL Editor
-- ==============================================================


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                       GRAVEL                              ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── 3T Exploro Racemax Rival AXS 1x ──────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Marco',        '3T Exploro Racemax Carbon (almacenaje interno)',   780,  1),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Horquilla',    '3T Fundi LTD Carbon',                             380,  2),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Ruedas',       '3T Discus C35 LTD (par)',                        1580,  3),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Neumáticos',   'Pirelli Cinturato Gravel H 700x45 (par)',          880,  4),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Cockpit',      '3T Integra LTD Aero Bar',                         460,  7),
('ac8bfc56-174f-4617-99da-c598a46712ad', 'Sillín / Tija','WTB SL8 Team + 3T Ionic LTD Post',               350,  8);

-- ── BMC Kaius 01 THREE ────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Marco',        'BMC Kaius Carbon',                                820,  1),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Horquilla',    'BMC Kaius Carbon',                                390,  2),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Ruedas',       'DT Swiss GRC 1400 Spline 42 (par)',              1690,  3),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Neumáticos',   'Schwalbe G-One Speed 700x40 (par)',               750,  4),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Cockpit',      'BMC Carbon ICS Integrado',                        450,  7),
('9b453f32-0d2f-4bf7-97ec-ca620b8bfec5', 'Sillín / Tija','Fizik Tempo Argo R5 + BMC Carbon Post',          400,  8);

-- ── Cannondale Topstone Carbon 3 ─────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Marco',        'Cannondale Kingpin Carbon (Kingpin suspension)',   960,  1),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Horquilla',    'Cannondale Topstone Carbon',                      460,  2),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Ruedas',       'WTB STP i23 TCS 700c (par)',                     1780,  3),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Neumáticos',   'WTB Riddler 700x37 TCS (par)',                    840,  4),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Transmisión',  'Shimano GRX 600 2x10 (grupo completo)',           2100,  5),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Cockpit',      'Cannondale 3T Carbon Compact',                    440,  7),
('1c429ab1-9ee6-4ba9-9256-34353d5110a2', 'Sillín / Tija','Fabric Scoop Shallow + Cannondale Carbon Post',  420,  8);

-- ── Canyon Grail CF SL 7 ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Marco',        'Canyon Grail CF SL Carbon (doble cubierta)',      900,  1),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Horquilla',    'Canyon Grail CF SL Carbon',                       430,  2),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Neumáticos',   'Schwalbe G-One Allround 700x40 (par)',            780,  4),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Transmisión',  'SRAM Rival AXS 2x12 (grupo completo)',           2200,  5),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Cockpit',      'Canyon Hover Bar 2.0',                            490,  7),
('ab7cbcaf-c5d2-49df-9eb4-f16e4d39c07d', 'Sillín / Tija','Fizik Vento Argo R3 + Canyon Carbon Post',       380,  8);

-- ── Canyon Grail CF SL 7 AXS ──────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Marco',        'Canyon Grail CF SL Carbon (doble cubierta)',      900,  1),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Horquilla',    'Canyon Grail CF SL Carbon',                       430,  2),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Neumáticos',   'Schwalbe G-One Allround 700x40 (par)',            780,  4),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Cockpit',      'Canyon Hover Bar 2.0',                            490,  7),
('dae954a5-a052-45c0-9602-c6c5a1ad6ff9', 'Sillín / Tija','Fizik Vento Argo R3 + Canyon Carbon Post',       380,  8);

-- ── Canyon Grizl AL 7 ────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Marco',        'Canyon Grizl Aluminum',                          1680,  1),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Horquilla',    'Canyon Grizl Carbon',                             520,  2),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Ruedas',       'Fulcrum Rapid Red 5 DB (par)',                   1880,  3),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Neumáticos',   'Schwalbe G-One Allround 700x40 (par)',            780,  4),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Cockpit',      'Canyon CP15 Alloy',                               470,  7),
('e951c94e-44a8-44d0-ba56-435b1bbc476c', 'Sillín / Tija','Fizik Tempo Argo R5 + Canyon Post',              440,  8);

-- ── Canyon Grizl CF SL 7 ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Marco',        'Canyon Grizl CF SL Carbon',                       940,  1),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Horquilla',    'Canyon Grizl CF SL Carbon',                       430,  2),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Ruedas',       'Fulcrum Rapid Red 5 DB (par)',                   1880,  3),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Neumáticos',   'Schwalbe G-One Allround 700x40 (par)',            780,  4),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Cockpit',      'Canyon CP15 Carbon',                              470,  7),
('20d54ad9-4cc4-4eb3-9644-61eaf0c0f8cb', 'Sillín / Tija','Fizik Tempo Argo R5 + Canyon Carbon Post',       420,  8);

-- ── Cervélo Áspero GRX RX810 ─────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Marco',        'Cervélo Áspero Carbon',                           850,  1),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Horquilla',    'Cervélo Carbon Gravel',                           360,  2),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Ruedas',       'DT Swiss GRC 1400 Spline 42 (par)',              1690,  3),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Neumáticos',   'Hutchinson Overide 700x38 (par)',                  820,  4),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Transmisión',  'Shimano GRX RX810 Di2 1x11 (grupo completo)',    1900,  5),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Frenos',       'Shimano GRX RX810 HRD (par)',                     460,  6),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Cockpit',      '3T Integra Team Aero',                            490,  7),
('b739f840-d09d-41a3-bb62-955eaadf97ac', 'Sillín / Tija','Fizik Antares R3 + Cervélo Carbon Post',         360,  8);

-- ── Merida Silex 7000 ─────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Marco',        'Merida Silex Carbon (integración total)',          880,  1),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Horquilla',    'Merida Silex Carbon',                             420,  2),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Ruedas',       'Fulcrum Racing 4 DB (par)',                      1820,  3),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Neumáticos',   'Vittoria Terreno Mix 700x35 (par)',                740,  4),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Transmisión',  'Shimano Ultegra R8000 Di2 2x11 (grupo completo)',1950,  5),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Cockpit',      'Merida Expert SL Carbon',                         460,  7),
('1b37a326-49c0-4dcf-ba58-9886a5dd53f2', 'Sillín / Tija','Selle Italia SLR Boost + Merida Carbon Post',   370,  8);

-- ── Orbea Terra M30Team ───────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Marco',        'Orbea Terra Carbon OMR',                          910,  1),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Horquilla',    'Orbea Terra Carbon',                              420,  2),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Neumáticos',   'Panaracer GravelKing SK 700x38 (par)',            800,  4),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Cockpit',      'Orbea OC Carbon Compact',                         470,  7),
('2f005451-d190-4bc2-bd70-77e57dcf6d4b', 'Sillín / Tija','Prologo Dimension AGX + Orbea Carbon Post',      390,  8);

-- ── Salsa Cutthroat GRX 600 ──────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('8e515383-d90c-4646-afca-c122498d7396', 'Marco',        'Salsa Cutthroat Carbon (bikepacking ready)',     1020,  1),
('8e515383-d90c-4646-afca-c122498d7396', 'Horquilla',    'Salsa Carbon Dropbar',                            480,  2),
('8e515383-d90c-4646-afca-c122498d7396', 'Ruedas',       'WTB Asym i23 TCS 700c (par)',                    1960,  3),
('8e515383-d90c-4646-afca-c122498d7396', 'Neumáticos',   'WTB Resolute 700x42 (par)',                      1000,  4),
('8e515383-d90c-4646-afca-c122498d7396', 'Transmisión',  'Shimano GRX 600 1x11 (grupo completo)',           1820,  5),
('8e515383-d90c-4646-afca-c122498d7396', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('8e515383-d90c-4646-afca-c122498d7396', 'Cockpit',      'Salsa Cowchipper Carbon Deluxe',                  490,  7),
('8e515383-d90c-4646-afca-c122498d7396', 'Sillín / Tija','WTB Volt 142 + Salsa Shaft Post',               430,  8);

-- ── Salsa Warbird GRX 600 ────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Marco',        'Salsa Warbird Carbon',                            980,  1),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Horquilla',    'Salsa Carbon Warbird',                            430,  2),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Neumáticos',   'Teravail Rutland 700x38 (par)',                   840,  4),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Cockpit',      'Salsa Woodchipper Carbon Deluxe',                 440,  7),
('29595c3f-2b1c-41c7-8be7-123ac75388a0', 'Sillín / Tija','WTB Volt 142 + Salsa Shaft Post',               430,  8);

-- ── Santa Cruz Stigmata CC Force 1X ──────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('83496217-db31-4c12-8008-e0ebb730b402', 'Marco',        'Santa Cruz Stigmata CC Carbon',                   840,  1),
('83496217-db31-4c12-8008-e0ebb730b402', 'Horquilla',    'Fox 32 SC Factory Carbon 700c 40mm',              440,  2),
('83496217-db31-4c12-8008-e0ebb730b402', 'Ruedas',       'Reserve 28 Carbon Disc (par)',                   1620,  3),
('83496217-db31-4c12-8008-e0ebb730b402', 'Neumáticos',   'WTB Resolute 700x42 (par)',                      1000,  4),
('83496217-db31-4c12-8008-e0ebb730b402', 'Transmisión',  'SRAM Force AXS XPLR 1x12 (grupo completo)',      1780,  5),
('83496217-db31-4c12-8008-e0ebb730b402', 'Frenos',       'SRAM Force AXS HRD (par)',                        380,  6),
('83496217-db31-4c12-8008-e0ebb730b402', 'Cockpit',      'Santa Cruz Carbon Compact',                       450,  7),
('83496217-db31-4c12-8008-e0ebb730b402', 'Sillín / Tija','WTB Volt 142 + Santa Cruz Carbon Post',          390,  8);

-- ── Scott Addict Gravel 30 ────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('69642f8c-7906-4eca-a708-8162de032714', 'Marco',        'Scott Addict Gravel HMF Carbon',                  860,  1),
('69642f8c-7906-4eca-a708-8162de032714', 'Horquilla',    'Scott Addict Gravel Carbon',                      400,  2),
('69642f8c-7906-4eca-a708-8162de032714', 'Ruedas',       'Syncros Capital 1.5 Disc (par)',                 1780,  3),
('69642f8c-7906-4eca-a708-8162de032714', 'Neumáticos',   'Vittoria Terreno Mix 700x38 (par)',                830,  4),
('69642f8c-7906-4eca-a708-8162de032714', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('69642f8c-7906-4eca-a708-8162de032714', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('69642f8c-7906-4eca-a708-8162de032714', 'Cockpit',      'Syncros Capital iC SL Carbon Integrado',          480,  7),
('69642f8c-7906-4eca-a708-8162de032714', 'Sillín / Tija','Syncros Tofino R 1.5 + Syncros Carbon Post',    400,  8);

-- ── Specialized Crux Comp ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Marco',        'Specialized FACT 9r Carbon (CX geometry)',        890,  1),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Horquilla',    'Specialized FACT Carbon CX',                      410,  2),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Ruedas',       'Roval Terra CLX (par)',                          1590,  3),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Neumáticos',   'Specialized Terra Pro 700x38 (par)',               900,  4),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Transmisión',  'SRAM Rival AXS XPLR 1x12 (grupo completo)',      2050,  5),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Cockpit',      'Specialized Comp Shallow Alloy',                  460,  7),
('62e1c4d6-ce7d-4644-b86e-6024d29ff5fb', 'Sillín / Tija','BG Romin Evo Comp + Specialized Post',           400,  8);

-- ── Specialized Diverge Comp Carbon (SRAM Apex eTap AXS) ─────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Marco',        'Specialized FACT 9r Carbon + Future Shock 2.0',   950,  1),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Horquilla',    'Specialized FACT Carbon 43mm offset',             430,  2),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Ruedas',       'Roval Terra CLX Disc (par)',                     1680,  3),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Neumáticos',   'Specialized Pathfinder Pro 700x42 (par)',          900,  4),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Transmisión',  'SRAM Apex AXS 2x12 (grupo completo)',             2350,  5),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Frenos',       'SRAM Apex AXS HRD (par)',                         450,  6),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Cockpit',      'Specialized Comp Alloy Shallow',                  490,  7),
('07e74614-8a06-43c1-9b9f-e74b63fde023', 'Sillín / Tija','BG Romin Evo Comp + Specialized Post',           420,  8);

-- ── Specialized Diverge Comp E5 ──────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Marco',        'Specialized E5 Aluminum + Future Shock 2.0',     1540,  1),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Horquilla',    'Specialized FACT Carbon 43mm offset',             430,  2),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Ruedas',       'Axis Sport Disc (par)',                          2050,  3),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Neumáticos',   'Specialized Pathfinder Sport 700x38 (par)',        980,  4),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Cockpit',      'Specialized Comp Alloy',                          520,  7),
('0b71ed53-24a1-48fa-9eed-dbfe844cbfa1', 'Sillín / Tija','BG Sport Saddle + Specialized Alloy Post',       460,  8);


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                        RUTA                               ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── BMC Teammachine SLR Two ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Marco',        'BMC Teammachine SLR Carbon',                      760,  1),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Horquilla',    'BMC Teammachine SLR Carbon',                      320,  2),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Neumáticos',   'Continental Grand Prix 5000 700x25 (par)',        440,  4),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Transmisión',  'Shimano Ultegra Di2 R8070 2x11 (grupo completo)',1900,  5),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Cockpit',      'BMC Carbon ICS Integrado',                        380,  7),
('2485e85c-a552-4a15-8c70-b2f8d2f1fbe9', 'Sillín / Tija','Fizik Antares R3 + BMC Carbon Post',            360,  8);

-- ── Cannondale SuperSix EVO Carbon Disc 105 ──────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Marco',        'Cannondale SuperSix EVO Carbon',                  800,  1),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Horquilla',    'Cannondale HollowGram Si Carbon',                 330,  2),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Neumáticos',   'Vittoria Zaffiro Pro 700x25 (par)',               450,  4),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Transmisión',  'Shimano 105 R7000 2x11 (grupo completo)',         2250,  5),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Frenos',       'Shimano 105 HRD (par)',                           510,  6),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Cockpit',      'Cannondale HollowGram Si Alloy',                  400,  7),
('cafcfadb-7d63-4158-ad0e-c90dc1d18025', 'Sillín / Tija','Prologo Dimension + Cannondale Post',            400,  8);

-- ── Canyon Aeroad CF SLX 8 Di2 ───────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Marco',        'Canyon Aeroad CF SLX Carbon Aero',                800,  1),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Horquilla',    'Canyon Aeroad CF Carbon Aero',                    350,  2),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Ruedas',       'Shimano Dura-Ace C40 Disc (par)',                1580,  3),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Neumáticos',   'Continental GP 5000S TR 700x25 (par)',            440,  4),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Transmisión',  'Shimano Ultegra Di2 R8170 2x12 (grupo completo)',1900,  5),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Cockpit',      'Canyon Aerocockpit CFR Integrado',                420,  7),
('3673b1a7-3878-4c90-89a0-502fc39a2940', 'Sillín / Tija','Fizik Antares R3 + Canyon Carbon Post',          340,  8);

-- ── Canyon Endurace CF SLX 8 Di2 ─────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Marco',        'Canyon Endurace CF SLX Carbon',                   830,  1),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Horquilla',    'Canyon Endurace CF Carbon',                       370,  2),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Ruedas',       'DT Swiss PRC 1400 Spline 35 Disc (par)',         1540,  3),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Neumáticos',   'Continental GP 5000 700x28 (par)',                480,  4),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Transmisión',  'Shimano Ultegra Di2 R8170 2x12 (grupo completo)',1900,  5),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Cockpit',      'Canyon Ergo Bar Carbon',                          450,  7),
('b4345e92-65ee-42cf-8422-2b0ca8e7a100', 'Sillín / Tija','Fizik Antares R3 + Canyon Carbon Post',          340,  8);

-- ── Canyon Ultimate CF SL 8 ──────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('7279218d-6429-4302-9786-30b5a257e3ef', 'Marco',        'Canyon Ultimate CF SL Carbon',                    850,  1),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Horquilla',    'Canyon CF Carbon',                                360,  2),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Ruedas',       'Shimano RS505 Disc (par)',                       1780,  3),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Neumáticos',   'Continental GP 5000 700x25 (par)',                440,  4),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Transmisión',  'Shimano Ultegra R8000 2x11 (grupo completo)',    2050,  5),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Cockpit',      'Canyon Ergo Bar Carbon',                          450,  7),
('7279218d-6429-4302-9786-30b5a257e3ef', 'Sillín / Tija','Fizik Antares R3 + Canyon Carbon Post',          340,  8);

-- ── Canyon Ultimate CF SLX 8 Di2 ─────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Marco',        'Canyon Ultimate CF SLX Carbon',                   760,  1),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Horquilla',    'Canyon CF Carbon',                                340,  2),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Ruedas',       'DT Swiss PRC 1400 Spline 35 Disc (par)',         1540,  3),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Neumáticos',   'Continental GP 5000 700x25 (par)',                440,  4),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Transmisión',  'Shimano Ultegra Di2 R8170 2x12 (grupo completo)',1900,  5),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Cockpit',      'Canyon Ergo Bar Carbon',                          430,  7),
('97633c1c-aeaa-4832-9e33-6146de2d93e8', 'Sillín / Tija','Fizik Antares R3 + Canyon Carbon Post',          340,  8);

-- ── Cervélo R5 Ultegra Di2 ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Marco',        'Cervélo R5 Carbon (escalador)',                   750,  1),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Horquilla',    'Cervélo Carbon R5',                               330,  2),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Ruedas',       'DT Swiss PRC 1400 Spline 35 Disc (par)',         1540,  3),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Neumáticos',   'Continental GP 5000 700x25 (par)',                440,  4),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Transmisión',  'Shimano Ultegra Di2 R8070 2x11 (grupo completo)',1900,  5),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Cockpit',      '3T Ergonova LTD Carbon',                          460,  7),
('923b23a7-61f4-4281-8870-361f6d1f70a8', 'Sillín / Tija','Fizik Antares R5 + Cervélo Carbon Post',        360,  8);

-- ── Cervélo S5 Ultegra Di2 ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Marco',        'Cervélo S5 Carbon Aero',                          850,  1),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Horquilla',    'Cervélo Carbon Aero',                             360,  2),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Ruedas',       'DT Swiss PRC 1400 Spline 35 Disc (par)',         1560,  3),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Neumáticos',   'Continental GP 5000 700x25 (par)',                440,  4),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Transmisión',  'Shimano Ultegra Di2 R8070 2x11 (grupo completo)',1900,  5),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Cockpit',      'Cervélo Duo Bar Aero Integrado',                  490,  7),
('1d001ce7-7351-4f1f-852e-9cc7fb46062c', 'Sillín / Tija','Fizik Antares R5 + Cervélo Carbon Post',        370,  8);

-- ── Giant Defy Advanced 1 ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Marco',        'Giant Defy Advanced Carbon (D-Fuse)',             880,  1),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Horquilla',    'Advanced Composite + D-Fuse Carbon',              370,  2),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Ruedas',       'Giant PR-2 Disc (par)',                          1780,  3),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Neumáticos',   'Giant P-SL1 700x28 (par)',                        480,  4),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Transmisión',  'Shimano Ultegra R8000 2x11 (grupo completo)',    2050,  5),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Cockpit',      'Giant Contact SLR OD2',                           450,  7),
('c9a01143-07ff-44bd-ad26-a60f4cd7a65c', 'Sillín / Tija','Giant Contact SLR Forward + D-Fuse SL Post',    390,  8);

-- ── Giant Propel Advanced 1 ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Marco',        'Giant Propel Advanced Carbon Aero',               820,  1),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Horquilla',    'Advanced Composite Aero',                         330,  2),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Ruedas',       'Giant Wheelsystem SLR 1 42mm Disc (par)',        1620,  3),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Neumáticos',   'Giant P-SL1 700x25 (par)',                        440,  4),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Transmisión',  'Shimano Ultegra R8000 2x11 (grupo completo)',    2050,  5),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Cockpit',      'Giant Contact SLR OD2 Aero',                      440,  7),
('7db1fffb-b636-4c62-ab9e-025e5ec23b4e', 'Sillín / Tija','Giant Contact Forward + Giant Carbon Post',      380,  8);

-- ── Giant Revolt Advanced 2 ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Marco',        'Giant Revolt Advanced Carbon',                    900,  1),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Horquilla',    'Advanced Composite Gravel',                       400,  2),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Ruedas',       'Giant PR-2 Disc (par)',                          1780,  3),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Neumáticos',   'Giant Crosscut Fast 1 700x40 (par)',              800,  4),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Cockpit',      'Giant Contact OD2 Alloy',                         460,  7),
('1ac86d4c-0db8-4a8d-baa8-93118e05441a', 'Sillín / Tija','Giant Contact Forward + Giant Carbon Post',      400,  8);

-- ── Giant TCR Advanced 1 Disc ─────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Marco',        'Giant TCR Advanced 1 Carbon',                     820,  1),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Horquilla',    'Advanced Composite',                              330,  2),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Ruedas',       'Giant Wheelsystem TCD 42mm Disc (par)',          1660,  3),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Neumáticos',   'Giant P-SL1 700x25 (par)',                        440,  4),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Transmisión',  'Shimano Ultegra R8000 2x11 (grupo completo)',    2050,  5),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Cockpit',      'Giant Contact SLR OD2',                           440,  7),
('7290577f-601d-4bb5-99b6-4222bd57cd58', 'Sillín / Tija','Giant Contact Forward + Giant Carbon Post',      380,  8);

-- ── Scott Addict RC 20 ───────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Marco',        'Scott Addict RC HMX Carbon',                      770,  1),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Horquilla',    'Scott Addict RC HMX Carbon',                      300,  2),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Ruedas',       'Syncros Capital 1.5 Disc (par)',                 1780,  3),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Neumáticos',   'Continental GP 5000 700x25 (par)',                440,  4),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Transmisión',  'Shimano Ultegra Di2 R8070 2x11 (grupo completo)',1900,  5),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Cockpit',      'Syncros RR 1.0 Integrado Carbon',                 390,  7),
('d8e058e4-93ad-4dc2-a11f-0260e27110f9', 'Sillín / Tija','Syncros Tofano R 1.5 + Syncros Carbon Post',   360,  8);

-- ── Specialized Roubaix Comp SRAM Rival eTap AXS ─────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Marco',        'Specialized FACT 10r Carbon + Future Shock 2.0',  900,  1),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Horquilla',    'Specialized FACT 8r Carbon',                      390,  2),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Ruedas',       'Roval Alpinist CL Disc (par)',                   1460,  3),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Neumáticos',   'Specialized S-Works Turbo 700x30 (par)',          540,  4),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Transmisión',  'SRAM Rival AXS 2x12 (grupo completo)',            2200,  5),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Frenos',       'SRAM Rival AXS HRD (par)',                        420,  6),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Cockpit',      'Specialized Comp Alloy Shallow',                  480,  7),
('7ca48f65-b463-4ee4-9aa7-da78c5cac7be', 'Sillín / Tija','BG Phenom Expert + Specialized Post',            400,  8);

-- ── Specialized Tarmac SL7 Comp (Shimano 105 Di2) ────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Marco',        'Specialized FACT 10r Carbon (Tarmac SL7)',        830,  1),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Horquilla',    'Specialized FACT Carbon',                         340,  2),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Ruedas',       'Roval Alpinist CL Disc (par)',                   1480,  3),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Neumáticos',   'Specialized Turbo Cotton 700x26 (par)',           520,  4),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Transmisión',  'Shimano 105 Di2 R7170 2x12 (grupo completo)',    2050,  5),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Frenos',       'Shimano 105 Di2 HRD (par)',                       490,  6),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Cockpit',      'Specialized Comp Shallow Carbon',                 460,  7),
('938bacc0-7ce8-48fd-89fb-099abd1b9ecc', 'Sillín / Tija','BG Phenom Comp + Specialized Carbon Post',       380,  8);

-- ── Specialized Tarmac SL7 Comp Shimano 105 Di2 ──────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Marco',        'Specialized FACT 10r Carbon (Tarmac SL7)',        830,  1),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Horquilla',    'Specialized FACT Carbon',                         340,  2),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Ruedas',       'Roval Alpinist CL Disc (par)',                   1480,  3),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Neumáticos',   'Specialized Turbo Cotton 700x26 (par)',           520,  4),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Transmisión',  'Shimano 105 Di2 R7170 2x12 (grupo completo)',    2050,  5),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Frenos',       'Shimano 105 Di2 HRD (par)',                       490,  6),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Cockpit',      'Specialized Comp Shallow Carbon',                 460,  7),
('4e65f9ce-8669-49c1-8f38-30cca4a1b8c1', 'Sillín / Tija','BG Phenom Comp + Specialized Carbon Post',       380,  8);

-- ── Trek Checkpoint ALR 5 ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Marco',        'Trek Checkpoint Alpha Aluminum',                 1580,  1),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Horquilla',    'Bontrager Checkpoint Carbon',                     450,  2),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Ruedas',       'Shimano RS171 (par)',                            1820,  3),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Neumáticos',   'Bontrager GR1 Team Issue 700x40 (par)',           820,  4),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Transmisión',  'Shimano GRX 600 1x11 (grupo completo)',           1820,  5),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Cockpit',      'Bontrager Elite Alloy',                           490,  7),
('5d6001f6-c2b1-4179-9af8-2e3ef6fd1cf3', 'Sillín / Tija','Bontrager Montrose Elite + Bontrager Post',      440,  8);

-- ── Trek Checkpoint SL 5 ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Marco',        'Trek Checkpoint OCLV Carbon',                     960,  1),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Horquilla',    'Bontrager Checkpoint Carbon',                     420,  2),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Ruedas',       'Bontrager Paradigm Comp TLR (par)',              1820,  3),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Neumáticos',   'Bontrager GR1 Team Issue 700x40 (par)',           820,  4),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Transmisión',  'Shimano GRX 600 2x11 (grupo completo)',           2100,  5),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Frenos',       'Shimano GRX HRD (par)',                           490,  6),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Cockpit',      'Bontrager Comp Alloy',                            480,  7),
('786800da-0788-4a1c-9c60-dbfd846d27b7', 'Sillín / Tija','Bontrager Montrose Elite + Bontrager Carbon Post',420, 8);

-- ── Trek Domane SL 5 Gen 3 ───────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Marco',        'Trek Domane OCLV Carbon + IsoSpeed',              860,  1),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Horquilla',    'Bontrager OCLV Carbon',                           350,  2),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Ruedas',       'Bontrager Paradigm TLR Disc (par)',              1820,  3),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Neumáticos',   'Bontrager R2 Hard-Case Lite 700x32 (par)',        640,  4),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Transmisión',  'Shimano 105 R7000 2x11 (grupo completo)',         2250,  5),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Frenos',       'Shimano 105 HRD (par)',                           510,  6),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Cockpit',      'Bontrager Elite Alloy',                           490,  7),
('e914e204-9f44-40b1-a9ad-692d5720de56', 'Sillín / Tija','Bontrager Montrose Elite + Bontrager IsoSpeed Post',430,8);

-- ── Trek Émonda SL 5 Disc ────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Marco',        'Trek Émonda OCLV Carbon',                         780,  1),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Horquilla',    'Bontrager OCLV Carbon',                           330,  2),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Ruedas',       'Bontrager Paradigm Comp TLR Disc (par)',         1820,  3),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Neumáticos',   'Bontrager R2 Hard-Case Lite 700x25 (par)',        480,  4),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Transmisión',  'Shimano 105 R7000 2x11 (grupo completo)',         2250,  5),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Frenos',       'Shimano 105 HRD (par)',                           510,  6),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Cockpit',      'Bontrager Elite Alloy',                           460,  7),
('1d858f00-06ce-4d49-979c-31de2a92942f', 'Sillín / Tija','Bontrager Montrose Elite + Bontrager Carbon Post',400,  8);

-- ── Trek Madone SL 6 ─────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Marco',        'Trek Madone OCLV Carbon Aero',                    810,  1),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Horquilla',    'Bontrager OCLV Carbon Aero',                      340,  2),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Ruedas',       'Bontrager Aeolus Pro 3 TLR Disc (par)',          1620,  3),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Neumáticos',   'Bontrager R3 TLR 700x25 (par)',                   440,  4),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Transmisión',  'Shimano Ultegra R8000 2x11 (grupo completo)',    2050,  5),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Frenos',       'Shimano Ultegra HRD (par)',                       470,  6),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Cockpit',      'Bontrager RSL Carbon Integrado',                  390,  7),
('129b07a5-07ab-4e73-bc1b-c29bcc856aa0', 'Sillín / Tija','Bontrager Montrose Elite + Bontrager Carbon Post',380, 8);


-- ╔═══════════════════════════════════════════════════════════╗
-- ║                         MTB                               ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ── Giant Anthem Advanced Pro 29 2 ───────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Marco',        'Giant Anthem Advanced Pro Carbon, Maestro 100mm',1080,  1),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Horquilla',    'Fox 32 SC Factory GRIP2, 110mm',                1420,  2),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Ruedas',       'Giant XCR 0 Carbon 29 (par)',                   1730,  3),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Neumáticos',   'Maxxis Crossmark II 29x2.1 (par)',              1040,  4),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Frenos',       'Shimano SLX M7100 (par)',                         560,  6),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Cockpit',      'Giant Contact SLR OD2 Carbon',                    360,  7),
('597b9008-31aa-406a-af9c-6af585d9cbe5', 'Sillín / Tija','Giant Contact SLR Neutral + Contact Switch Dropper 100mm', 540, 8);

-- ── Giant Trance X 29 2 ──────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Marco',        'Giant Trance X Advanced Carbon, Maestro 130mm', 1240,  1),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Horquilla',    'Fox 36 Factory GRIP2, 140mm',                   1780,  2),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Ruedas',       'Giant Wheelsystem TRX 0 29 (par)',              1820,  3),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Neumáticos',   'Maxxis Minion DHF/DHR II 29x2.5 (par)',         1600,  4),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Frenos',       'Shimano SLX M7100 4-pist (par)',                  610,  6),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Cockpit',      'Giant Contact SLR OD2 Carbon',                    390,  7),
('2fc81ffe-d29d-46a0-9b32-a9402d11bc3b', 'Sillín / Tija','Giant Contact SLR Neutral + Contact Switch Dropper 150mm', 620, 8);

-- ── Orbea Oiz M30 ────────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Marco',        'Orbea Oiz Carbon OMR, 100mm',                   1040,  1),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Horquilla',    'Fox 34 Float SC Factory, 100mm',                1580,  2),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Ruedas',       'Mavic Crossmax SL 29 (par)',                    1780,  3),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Neumáticos',   'Maxxis Rekon Race 29x2.25 (par)',               1080,  4),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Frenos',       'SRAM G2 RSC (par)',                               580,  6),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Cockpit',      'Orbea OC Carbon',                                 380,  7),
('ddc47265-3c97-4b64-a64b-bc2eac42ee85', 'Sillín / Tija','Prologo Kappa Evo + Orbea Dropper 125mm',        590,  8);

-- ── Santa Cruz Bronson C S ────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('ac54781c-7594-404a-af84-28bd66de2c03', 'Marco',        'Santa Cruz Bronson C Carbon, VPP 150mm',        1380,  1),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Horquilla',    'RockShox Lyrik Select+, 150mm',                 1920,  2),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Ruedas',       'Reserve 30|HD Carbon 27.5 (par)',               1780,  3),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Neumáticos',   'Maxxis Minion DHF/DHR II 27.5x2.5/2.4 (par)',  1680,  4),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Transmisión',  'SRAM SX Eagle 1x12 (grupo completo)',            1900,  5),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Frenos',       'SRAM Code RSC (par)',                             640,  6),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Cockpit',      'Race Face Aeffect R',                             420,  7),
('ac54781c-7594-404a-af84-28bd66de2c03', 'Sillín / Tija','WTB Silverado + RockShox Reverb AXS 150mm',     690,  8);

-- ── Santa Cruz Hightower C S ──────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Marco',        'Santa Cruz Hightower C Carbon, VPP 135mm',      1320,  1),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Horquilla',    'Fox 36 Float Factory GRIP2, 140mm',             1780,  2),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Ruedas',       'Reserve 30 Carbon 29 (par)',                    1740,  3),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Neumáticos',   'Maxxis Minion DHF/DHR II 29x2.5/2.4 (par)',    1600,  4),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Frenos',       'SRAM Code RSC (par)',                             640,  6),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Cockpit',      'Race Face Aeffect R',                             420,  7),
('dc07f3be-5307-4305-8f62-f01270e10c45', 'Sillín / Tija','WTB Silverado + RockShox Reverb AXS 150mm',     690,  8);

-- ── Santa Cruz Tallboy C S ────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Marco',        'Santa Cruz Tallboy C Carbon, VPP 115mm',        1200,  1),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Horquilla',    'Fox 34 Float Factory GRIP2, 120mm',             1640,  2),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Ruedas',       'Reserve 30 Carbon 29 (par)',                    1700,  3),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Neumáticos',   'Maxxis Rekon/Ikon 29x2.4/2.2 (par)',           1380,  4),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Frenos',       'SRAM G2 RSC (par)',                               580,  6),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Cockpit',      'Race Face Aeffect R',                             400,  7),
('f252c94f-e2aa-4332-9eeb-4d7b1b093e68', 'Sillín / Tija','WTB Silverado + RockShox Reverb AXS 125mm',     660,  8);

-- ── Specialized Epic Comp ─────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Marco',        'Specialized FACT 9m Carbon, Brain FSR 100mm',   1050,  1),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Horquilla',    'Fox 32 Float SC Factory GRIP, 100mm',           1420,  2),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Ruedas',       'Roval Traverse SL 29 (par)',                    1680,  3),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Neumáticos',   'Specialized Ground Control/Fast Trak 29x2.2/2.0 (par)',1160,4),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Frenos',       'SRAM G2 R (par)',                                 560,  6),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Cockpit',      'Specialized Comp Alloy',                          380,  7),
('7e6b3565-5fd2-4415-bad0-2e7d83e770ee', 'Sillín / Tija','BG Romin Evo + Command Post Black Bird 125mm',  600,  8);

-- ── Specialized Epic EVO Comp ─────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Marco',        'Specialized FACT 9m Carbon, Brain FSR 120mm',   1080,  1),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Horquilla',    'Fox 32 Float SC Factory GRIP, 120mm',           1460,  2),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Ruedas',       'Roval Traverse SL 29 (par)',                    1680,  3),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Neumáticos',   'Specialized Eliminator/Ground Control 29x2.3/2.2 (par)',1280,4),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Frenos',       'SRAM G2 R (par)',                                 560,  6),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Cockpit',      'Specialized Comp Alloy',                          390,  7),
('8eb9c1f6-1c71-468b-8cb0-39b3d871bb2d', 'Sillín / Tija','BG Romin Evo + Command Post Black Bird 150mm',  640,  8);

-- ── Specialized Stumpjumper Comp Alloy ───────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('20cd0e6f-704f-495d-8499-0444430952de', 'Marco',        'Specialized M5 Aluminum, 140mm',                1980,  1),
('20cd0e6f-704f-495d-8499-0444430952de', 'Horquilla',    'RockShox Pike Select+, 140mm',                  1850,  2),
('20cd0e6f-704f-495d-8499-0444430952de', 'Ruedas',       'Roval Traverse 29 (par)',                       1940,  3),
('20cd0e6f-704f-495d-8499-0444430952de', 'Neumáticos',   'Specialized Eliminator/Purgatory 29x2.3 (par)',  1340,  4),
('20cd0e6f-704f-495d-8499-0444430952de', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('20cd0e6f-704f-495d-8499-0444430952de', 'Frenos',       'SRAM G2 R (par)',                                 560,  6),
('20cd0e6f-704f-495d-8499-0444430952de', 'Cockpit',      'Specialized Comp Alloy',                          420,  7),
('20cd0e6f-704f-495d-8499-0444430952de', 'Sillín / Tija','BG Romin Evo + Command Post Black Bird 150mm',  650,  8);

-- ── Specialized Stumpjumper EVO Comp ─────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('3e361659-b754-4025-962b-4538b228ee0d', 'Marco',        'Specialized FACT 9m Carbon, 160mm',             1240,  1),
('3e361659-b754-4025-962b-4538b228ee0d', 'Horquilla',    'Fox 36 Float Factory GRIP2, 160mm',             1820,  2),
('3e361659-b754-4025-962b-4538b228ee0d', 'Ruedas',       'Roval Traverse 29 (par)',                       1940,  3),
('3e361659-b754-4025-962b-4538b228ee0d', 'Neumáticos',   'Specialized Butcher/Purgatory 29x2.6/2.4 (par)',1520,  4),
('3e361659-b754-4025-962b-4538b228ee0d', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('3e361659-b754-4025-962b-4538b228ee0d', 'Frenos',       'SRAM Code R (par)',                               620,  6),
('3e361659-b754-4025-962b-4538b228ee0d', 'Cockpit',      'Specialized Comp Alloy',                          440,  7),
('3e361659-b754-4025-962b-4538b228ee0d', 'Sillín / Tija','BG Romin Evo + Command Post Black Bird 170mm',  680,  8);

-- ── Trek Fuel EX 8 ───────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Marco',        'Trek Fuel EX OCLV Carbon, Mino Link 130-140mm', 1280,  1),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Horquilla',    'RockShox Yari RC, 140mm',                       1880,  2),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Ruedas',       'Bontrager Line Comp 30 TLR 29 (par)',           1900,  3),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Neumáticos',   'Bontrager XR4 Team Issue TLR 29x2.4 (par)',     1480,  4),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Frenos',       'SRAM G2 R (par)',                                 560,  6),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Cockpit',      'Bontrager Rhythm Comp Alloy',                    420,  7),
('469935cc-166c-440b-bab0-5a7ad4c135e3', 'Sillín / Tija','Bontrager Arvada + Trek Dropper Post 150mm',    640,  8);

-- ── Trek Slash 8 ─────────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Marco',        'Trek Slash OCLV Carbon, 160mm',                 1380,  1),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Horquilla',    'Fox 36 Float GRIP, 160mm',                      1870,  2),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Ruedas',       'Bontrager Line Comp 30 TLR 29 (par)',           1940,  3),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Neumáticos',   'Bontrager SE4 Team Issue TLR 29x2.4 (par)',     1640,  4),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Frenos',       'SRAM Code R (par)',                               620,  6),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Cockpit',      'Bontrager Rhythm Comp Alloy',                    440,  7),
('d7972002-d8b8-4cf8-be51-fa3a42a17841', 'Sillín / Tija','Bontrager Arvada + Trek Dropper Post 175mm',    700,  8);

-- ── Trek Top Fuel 8 ──────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Marco',        'Trek Top Fuel OCLV Carbon, 100mm',              1120,  1),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Horquilla',    'Fox 32 Float SC Factory GRIP, 100mm',           1420,  2),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Ruedas',       'Bontrager Kovee Pro 30 TLR 29 (par)',           1700,  3),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Neumáticos',   'Bontrager XR4 Team Issue TLR 29x2.2 (par)',     1200,  4),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Frenos',       'Shimano SLX M7100 (par)',                         560,  6),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Cockpit',      'Bontrager RSL Race Carbon',                       370,  7),
('6f0c10df-2b08-4d32-a38f-14a95af19334', 'Sillín / Tija','Bontrager Arvada + Trek Dropper Post 125mm',    620,  8);

-- ── Yeti SB130 C2 ────────────────────────────────────────────
INSERT INTO component_templates (template_id, category, name, weight_g, position) VALUES
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Marco',        'Yeti SB130 Carbon, Switch Infinity 130mm',      1180,  1),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Horquilla',    'Fox 36 Float Factory GRIP2, 140mm',             1780,  2),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Ruedas',       'Industry Nine Hydra Classic 29 (par)',           1840,  3),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Neumáticos',   'Maxxis Minion DHF/DHR II 29x2.5/2.4 (par)',    1600,  4),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Transmisión',  'SRAM GX Eagle 1x12 (grupo completo)',            1820,  5),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Frenos',       'SRAM G2 RSC (par)',                               580,  6),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Cockpit',      'Yeti Carbon Bar',                                 400,  7),
('8904df36-9bb1-4eaf-9a94-9c7beb548c8b', 'Sillín / Tija','WTB Silverado + Fox Transfer Factory 150mm',    700,  8);
