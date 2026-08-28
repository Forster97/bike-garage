-- BG-028, la mitad que faltaba.
--
-- `bikes_sync_name` quedó con search_path fijo el 2026-08-24, pero estas dos
-- no. Una función SECURITY DEFINER con search_path mutable puede ser engañada
-- para ejecutar código de otro esquema: se le antepone uno propio y las tablas
-- que la función cree estar tocando pasan a ser otras.
--
-- No cambia lo que hacen; solo fija en qué esquemas buscan.
--
-- Aplicada en producción el 2026-08-28.

alter function public.seed_bike_template(text, text, integer, text)
  set search_path = public, pg_temp;

alter function public.seed_bike_template_with_weight(text, text, integer, text, integer, text, text)
  set search_path = public, pg_temp;
