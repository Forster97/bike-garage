-- 2026-08-24 · BG-027 — El nombre de la bici vuelve a ser del usuario
--
-- EL PROBLEMA (eran dos, no uno):
--   1. El trigger `bikes_sync_name` reescribía `bikes.name` en cada alta y en
--      cada cambio de marca o modelo. El nombre que escribía el usuario se
--      perdía en silencio. Verificado: 4 de 5 bicis lo tenían pisado.
--   2. El formulario de alta ni siquiera pedía un nombre: lo calculaba solo.
--      Arreglar el trigger sin esto no habría servido de nada.
--
-- LA DECISIÓN (2026-08-17): «marca modelo» es el valor POR DEFECTO, no una
-- imposición. Si el usuario escribe un nombre, ese nombre manda.
--
-- De paso se fija `search_path` en la función, que era BG-028.

create or replace function public.bikes_sync_name()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  derivado_nuevo text;
  derivado_viejo text;
begin
  derivado_nuevo := nullif(trim(coalesce(new.brand, '') || ' ' || coalesce(new.model, '')), '');

  -- Al crear: solo rellenamos si no escribió nada.
  if TG_OP = 'INSERT' then
    if new.name is null or trim(new.name) = '' then
      new.name := coalesce(derivado_nuevo, 'Bicicleta');
    end if;
    return new;
  end if;

  -- Al cambiar marca o modelo.
  derivado_viejo := nullif(trim(coalesce(old.brand, '') || ' ' || coalesce(old.model, '')), '');

  if new.name is null or trim(new.name) = '' then
    new.name := coalesce(derivado_nuevo, 'Bicicleta');
  elsif derivado_viejo is not null and trim(new.name) = derivado_viejo then
    -- Seguía siendo el nombre que pusimos nosotros: se re-deriva para que no
    -- quede mostrando una marca que ya no es cierta.
    new.name := coalesce(derivado_nuevo, new.name);
  end if;

  -- Si el usuario le puso nombre propio, NO se toca.
  return new;
end;
$$;

-- Verificado con los 4 casos: sin nombre deriva · nombre propio se respeta ·
-- al cambiar el modelo el derivado se actualiza y el propio no se toca.
