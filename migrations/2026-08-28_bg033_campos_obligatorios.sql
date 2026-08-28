-- BG-033 · Decidido el 2026-08-28: los cinco campos se quedan obligatorios,
-- y se corrige el PRD-02, que prometía lo contrario.
--
-- Pero `NOT NULL` no alcanzaba. Un texto vacío lo satisface, así que la base
-- decía "obligatorio" y aceptaba `brand = ''`. Eso es lo peor de los dos
-- mundos: parece que hay dato y no lo hay, y ninguna pantalla puede
-- distinguirlo de un nombre real.
--
-- Verificado antes de aplicar: ninguna de las 5 bicis tiene campos vacíos,
-- porque el formulario siempre los exigió. Estas restricciones lo hacen cierto
-- también para lo que entre por cualquier otro camino — un script, la API, o
-- el editor de tablas de Supabase.
--
-- Aplicada en producción el 2026-08-28.

alter table bikes
  add constraint bikes_brand_no_vacio check (btrim(brand) <> ''),
  add constraint bikes_model_no_vacio check (btrim(model) <> ''),
  add constraint bikes_size_no_vacio  check (btrim(size)  <> ''),
  add constraint bikes_type_no_vacio  check (btrim(type)  <> ''),
  add constraint bikes_year_razonable check (year between 1900 and 2100);

comment on column bikes.brand is 'Obligatorio y no vacío (BG-033).';
comment on column bikes.model is 'Obligatorio y no vacío (BG-033).';
