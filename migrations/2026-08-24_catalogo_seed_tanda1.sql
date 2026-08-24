-- =====================================================================
-- Bike Garage · component_catalog — primera tanda de curación
-- 2026-08-24
--
-- Categorías cubiertas: Horquilla, Neumáticos, Ruedas, Cockpit,
-- Sillín / Tija, Accesorios. No se repite Transmisión ni Frenos,
-- ya cubiertas para Shimano y SRAM.
--
-- Correcciones aplicadas sobre el archivo original del investigador:
--   · codificación arreglada (venía UTF-8 leído como Latin-1)
--   · `variant` limpio: las notas salieron del campo, porque forma parte
--     del índice único y ensuciarlo rompe la detección de duplicados
--   · la disciplina va en `discipline`, no en `subcategory`
--   · los pedales quedan como PAR: es la unidad real de uso y el peso
--     publicado. Dividirlo por dos convertía un dato verificado en una
--     estimación.
-- =====================================================================

-- ---------------------------------------------------------------------
-- HORQUILLA
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Horquilla','Suspensión','mtb','Fox','34 Factory','130-140mm 29" FIT4',1738,null,
   'verified','https://www.vitalmtb.com/product/guide/Forks,33/FOX/34-Factory-FIT4-2022,33717'),

  ('Horquilla','Suspensión','mtb','Fox','34 Factory','140mm 29" GRIP2',1915,null,
   'verified','https://bikerumor.com/2022-fox-34-factory-mtb-fork-actual-weights-complete-comparison/'),

  ('Horquilla','Suspensión','mtb','Fox','34 Step-Cast Factory','100-120mm 29" FIT4',1496,null,
   'verified','https://www.vitalmtb.com/product/guide/Forks,33/FOX/34-Step-Cast-Factory-FIT4-2022,33720'),

  ('Horquilla','Suspensión','mtb','Fox','34 SL Factory','130mm 29" GRIP SL',1475,null,
   'verified','https://www.fanatikbike.com/products/fox-34-sl-factory-fork-29-grip-sl-44mm-offset-2026'),

  ('Horquilla','Suspensión','mtb','Fox','36 Factory','160mm 29" GRIP2',1942,null,
   'verified','https://nsmb.com/articles/2023-fox-factory-36-grip-2-160-mm-fork/'),

  ('Horquilla','Suspensión','mtb','RockShox','Pike Ultimate','140mm 29" Charger 3',1887,'00.4021.038.026',
   'verified','https://www.vitalmtb.com/product/guide/Forks,33/RockShox/Pike-Ultimate-2023,37122'),

  ('Horquilla','Suspensión','mtb','RockShox','Lyrik Ultimate','160mm 29" Charger 3',2027,null,
   'verified','https://enduro-mtb.com/en/rockshox-lyrik-ultimate-best-mtb-fork-test/')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- NEUMÁTICOS  (peso por neumático, no por par)
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Neumáticos','Cubierta','mtb','Maxxis','Minion DHF','29x2.5 WT 3C MaxxTerra EXO/TR',1099,'TB96800300',
   'verified','https://www.maxxis.com/us/tire/minion-dhf/'),

  ('Neumáticos','Cubierta','mtb','Maxxis','Minion DHF','29x2.3 3C MaxxTerra EXO/TR',1015,'TB96785100',
   'verified','https://www.maxxis.com/us/tire/minion-dhf/'),

  ('Neumáticos','Cubierta','mtb','Maxxis','Minion DHR II','29x2.4 Dual EXO/TR',1040,'TB96797000',
   'verified','https://www.maxxis.com/us/tire/minion-dhr-ii/'),

  ('Neumáticos','Cubierta','mtb','Maxxis','Minion DHR II','29x2.3 3C MaxxTerra EXO/TR',951,'TB96776100',
   'verified','https://www.maxxis.com/us/tire/minion-dhr-ii/'),

  ('Neumáticos','Cubierta','mtb','Schwalbe','Magic Mary','29x2.4 SuperTrail Addix UltraSoft EVO TLE',1230,null,
   'verified','https://www.bikeradar.com/reviews/components/tyres/mountain-bike-tyres/schwalbe-magic-mary-supertrail-addix-ultrasoft-evo-tle-29x2-4-review')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- RUEDAS  (delantera y trasera van separadas: pesan distinto)
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Ruedas','Rueda completa','mtb','DT Swiss','XM 1700 Spline','29" delantera Boost 15x110',875,null,
   'verified','https://www.modernbike.com/dt-swiss-xm-1700-spline-29-15x110-boost-front-wheel'),

  ('Ruedas','Rueda completa','mtb','DT Swiss','XM 1700 Spline','29" trasera Boost 12x148',973,null,
   'verified','https://www.universalcycles.com/shopping/product_details.php?id=103384')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- COCKPIT
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Cockpit','Manubrio','mtb','Renthal','Fatbar Carbon 35','800mm',225,null,
   'verified','https://www.renthal.com/cycle/fatbar-carbon'),

  ('Cockpit','Manubrio','mtb','Renthal','Fatbar Lite Carbon 35','760mm',190,null,
   'verified','https://www.renthal.com/cycle/fatbar-lite-carbon'),

  ('Cockpit','Manubrio','mtb','Renthal','Fatbar 35','800mm aluminio 7050',305,null,
   'verified','https://www.pinkbike.com/news/renthal-35mm-bar-stem-range-2016.html'),

  ('Cockpit','Potencia','mtb','Race Face','Turbine R 35','50mm',138,null,
   'verified','https://www.raceface.com/products/turbine-r-35-stem'),

  ('Cockpit','Potencia','mtb','Renthal','Apex 35','50mm',136,null,
   'verified','https://www.pinkbike.com/news/renthal-35mm-bar-stem-range-2016.html')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- SILLÍN / TIJA
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Sillín / Tija','Sillín','mtb','WTB','Silverado','Riel carbono, angosto 135mm',176,'W065-0574',
   'verified','https://www.wtb.com/products/silverado'),

  ('Sillín / Tija','Sillín','mtb','WTB','Silverado','Riel titanio, angosto 135mm',200,'W065-0575',
   'verified','https://www.wtb.com/products/silverado'),

  ('Sillín / Tija','Sillín','mtb','WTB','Silverado','Riel cromoly, angosto 135mm',265,'W065-0576',
   'verified','https://www.universalcycles.com/shopping/product_details.php?id=100377'),

  ('Sillín / Tija','Tija telescópica','mtb','Fox','Transfer Factory','31.6mm 180mm',691,null,
   'verified','https://worldwidecyclery.com/collections/fox-transfer/dropper-seatpost'),

  ('Sillín / Tija','Tija telescópica','mtb','Fox','Transfer SL Factory','31.6mm 150mm',437,null,
   'verified','https://cyclinic.com.au/products/fox-transfer-sl-dropper-factory-2025'),

  ('Sillín / Tija','Tija telescópica','mtb','OneUp Components','Dropper V2','34.9mm 180mm',660,null,
   'verified','https://int.oneupcomponents.com/products/dropper-post-v2')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- ACCESORIOS
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Accesorios','Bikepacking','mtb','Apidura','Backcountry Full Frame Pack','6L',313,null,
   'verified','https://road.cc/content/review/apidura-backcountry-full-frame-pack-284369'),

  -- Los pedales van de a pares siempre: el par ES la unidad de uso,
  -- y 342 g es el peso publicado. Dividirlo convertía un dato verificado
  -- en una estimación.
  ('Accesorios','Pedales','mtb','Shimano','PD-M8100 XT','par',342,'PD-M8100',
   'verified','https://road.cc/content/review/shimano-deore-xt-pd-m8100-spd-pedals-272943')
on conflict do nothing;
