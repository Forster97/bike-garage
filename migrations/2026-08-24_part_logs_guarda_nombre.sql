-- 2026-08-24 · El historial guarda el nombre de la pieza, no solo su id
--
-- EL PROBLEMA
-- `part_logs` solo guardaba `part_id` y los pesos. Al eliminar `components` en
-- PRD-12, los 31 eventos quedaron apuntando a filas inexistentes: el historial
-- perdió los nombres y las categorías. Los pesos nunca se perdieron, así que el
-- gráfico de evolución seguía bien; lo que se cayó fue la lista de eventos.
--
-- REF-1 documentaba columnas de nombre en esta tabla (`part_name`, `old_name`,
-- `new_name`, `old_category`…) que en realidad NUNCA existieron. Por eso al
-- migrar se dio por hecho que el historial sobrevivía, y sobrevivió a medias.
--
-- LA REGLA QUE FALTABA
-- Un historial que depende de que la pieza siga existiendo no es un historial.
-- Cada evento guarda ahora una FOTO del nombre y la categoría al momento de
-- ocurrir, y sobrevive a que la pieza se borre, se renombre o se recategorice.

alter table public.part_logs
  add column if not exists part_name     text,
  add column if not exists part_category text;

-- Recuperar los 31 eventos existentes desde el respaldo de PRD-12.
update public.part_logs pl
set part_name     = b.name,
    part_category = b.category
from public._backup_20260823_components b
where b.id = pl.part_id
  and pl.part_name is null;

-- Y los que apunten al catálogo actual, desde ahí.
update public.part_logs pl
set part_name = nullif(trim(
      coalesce(cc.brand,'') || ' ' || coalesce(cc.model,'') || ' ' || coalesce(cc.variant,'')
    ), ''),
    part_category = cc.category
from public.component_catalog cc
where cc.id = pl.part_id
  and pl.part_name is null;

-- Verificado: 31 de 31 eventos recuperados, 0 sin nombre.
--
-- ⚠️ Esto justifica conservar los respaldos _backup_20260823_*: fueron la única
-- forma de recuperar estos nombres. No borrarlos sin revisar antes qué más
-- podría depender de ellos.
