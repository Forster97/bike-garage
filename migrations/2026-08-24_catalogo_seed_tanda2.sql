-- =====================================================================
-- Bike Garage · component_catalog — segunda tanda de curación
-- 2026-08-24
--
-- Aporta la categoría Marco, y subcategorías nuevas dentro de otras
-- ya empezadas: Ruedas › Llanta y Buje · Frenos › Palanca ·
-- Transmisión › Platos y Pedalier · Accesorios › Portabidón.
--
-- Correcciones sobre el archivo original del investigador:
--   · codificación arreglada (venía UTF-8 leído como Latin-1)
--   · se agregó `discipline`, que faltaba
--   · Race Face: "(Shimano 12v)" salió de `model` a `variant`. El modelo
--     lleva solo el nombre del producto; la compatibilidad es variante.
--   · DT Swiss 240s: baja a 'likely'. La variante decía "Center-Lock 28h"
--     pero la fuente citada describe "32H 6-Bolt", y el peso de un buje
--     cambia con ambas cosas. Se deja la especificación de la fuente y se
--     marca como estimado hasta confirmar cuál corresponde a los 218 g.
-- =====================================================================

-- ---------------------------------------------------------------------
-- MARCO  (el peso depende de la talla: siempre va en `variant`)
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Marco','Doble suspensión','mtb','Ibis','Ripmo AF','Talla M, con amortiguador DVO Topaz',3740,null,
   'verified','https://blisterreview.com/gear-reviews/2020-ibis-ripmo-af'),

  ('Marco','Rígido','mtb','Trek','Procaliber','Gen 3 carbono, Talla M',1150,null,
   'verified','https://www.pinkbike.com/news/first-look-2025-trek-procaliber-carbon-drops-isospeed-drops-weight.html')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- RUEDAS · Llanta y Buje
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Ruedas','Llanta','mtb','DT Swiss','EX 511','29" 32h',590,null,
   'verified','https://worldwidecyclery.com/products/dt-swiss-ex-511-29-tubeless-ready-disc-rim-32h-black-includes-squorx-nipples-and-rim-washers'),

  -- 'likely': la fuente describe 32h y 6 tornillos, no 28h Center-Lock
  ('Ruedas','Buje','mtb','DT Swiss','240s','Trasero Boost 12x148, 32h, 6 tornillos',218,null,
   'likely','https://jensonusa.com/Dt-Swiss-240S-Rear-Boost-Hub-32H-6-Bolt-Shimano-Freehub-148mm')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- FRENOS · Palanca
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Frenos','Palanca de freno','mtb','Shimano','BL-M8100 XT','Palanca individual, sin manguera',105,'BL-M8100',
   'verified','https://www.georgesbikeshop.com.au/product/shimano-bl-m8100-brake-lever-right-hand-deore-xt/')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- TRANSMISIÓN · Platos y Pedalier
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Transmisión','Platos','mtb','Race Face','Narrow Wide CINCH Direct Mount','32t, acero',158,null,
   'verified','https://www.tradeinn.com/bikeinn/en/race-face-narrow-wide-cinch-direct-mount-chainring/136924843/p'),

  ('Transmisión','Platos','mtb','Race Face','CINCH Direct Mount Wide','32t, aluminio 7075, 0mm offset, Shimano 12v',68,null,
   'verified','https://powermetercity.com/product/race-face-cinch-direct-mount-wide-shimano-12-speed-chainring/'),

  ('Transmisión','Pedalier','mtb','Race Face','CINCH BSA','68/73mm, eje 30mm',87,'BB19BSA687330',
   'verified','https://worldwidecyclery.com/collections/bottom-brackets/raceface')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- ACCESORIOS · Portabidón
-- ---------------------------------------------------------------------
insert into component_catalog
  (category, subcategory, discipline, brand, model, variant, weight_g, sku, confidence, source_url)
values
  ('Accesorios','Portabidón','mtb','Elite','Cannibal XC Bio-Based','Estándar',34,null,
   'verified','https://www.elite-it.com/en/bottle-cages/fibre-reinforced-material/cannibal-xc-bio-based')
on conflict do nothing;
