-- 2026-08-23 · PRD-12 — El catálogo como registro único de componentes
--
-- Elimina la biblioteca privada por usuario (`components`) y hace que las bicis
-- apunten directamente al catálogo de modelos.
--
-- Un componente deja de ser "un objeto físico de un usuario" y pasa a ser
-- "un modelo de pieza que cualquier bici puede montar".
--
-- Ver PRD-12-Catalogo-como-Registro-Unico en la bóveda.

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 0 · Respaldo   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists _backup_20260823_components       as select * from public.components;
create table if not exists _backup_20260823_bike_components  as select * from public.bike_components;
create table if not exists _backup_20260823_bike_maintenance as select * from public.bike_maintenance;

alter table _backup_20260823_components       enable row level security;
alter table _backup_20260823_bike_components  enable row level security;
alter table _backup_20260823_bike_maintenance enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1 · Esquema   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.component_catalog
  add column if not exists subcategory text,
  add column if not exists created_by uuid references auth.users(id);

-- La marca deja de ser obligatoria: una entrada creada por un usuario puede no
-- tenerla todavía. Forzar una marca falsa envenenaría el catálogo.
alter table public.component_catalog
  alter column brand drop not null;

-- Dedup real: sin distinguir mayúsculas, contemplando marcas vacías, y por
-- categoría — porque "Shimano XT" existe como cassette Y como freno.
drop index if exists public.uq_component_catalog_model_variant;

create unique index if not exists uq_component_catalog_identidad
  on public.component_catalog (
    lower(coalesce(category, '')),
    lower(coalesce(brand, '')),
    lower(coalesce(model, '')),
    lower(coalesce(variant, ''))
  );

alter table public.bike_components
  add column if not exists catalog_id uuid references public.component_catalog(id) on delete restrict,
  add column if not exists weight_g_override int
    check (weight_g_override is null or weight_g_override >= 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2 · Categorías a dos niveles   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────
update public.component_catalog
set subcategory = case category
      when 'cassette'        then 'Cassette'
      when 'chain'           then 'Cadena'
      when 'rear_derailleur' then 'Cambio trasero'
      when 'crankset'        then 'Biela'
      when 'brake'           then 'Freno'
      when 'rotor'           then 'Disco'
    end,
    category = case category
      when 'cassette'        then 'Transmisión'
      when 'chain'           then 'Transmisión'
      when 'rear_derailleur' then 'Transmisión'
      when 'crankset'        then 'Transmisión'
      when 'brake'           then 'Frenos'
      when 'rotor'           then 'Frenos'
      else category
    end
where category in ('cassette','chain','rear_derailleur','crankset','brake','rotor');

update public.component_catalog
set confidence = 'unverified'
where confidence is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3 · Migrar las piezas montadas al catálogo   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────

-- Resto de prueba
delete from public.bike_components bc
  using public.components c
  where bc.component_id = c.id and lower(c.name) = 'ryet teste';
delete from public.components where lower(name) = 'ryet teste';

-- 'Seat / Post' y 'Sillín / Tija' eran la misma categoría con dos nombres
update public.components
set category = 'Sillín / Tija'
where category = 'Seat / Post';

-- Cada pieza montada se convierte en un MODELO del catálogo.
-- El nombre del componente pasa a ser el modelo: es su identidad real.
insert into public.component_catalog
  (category, subcategory, brand, model, weight_g, sku, confidence, created_by)
select distinct on (lower(c.category), lower(coalesce(nullif(trim(c.brand), ''), '')), lower(c.name))
  c.category, null, nullif(trim(c.brand), ''), c.name, c.weight_g,
  nullif(trim(c.sku), ''), 'unverified', c.user_id
from public.components c
where exists (select 1 from public.bike_components bc where bc.component_id = c.id)
order by lower(c.category), lower(coalesce(nullif(trim(c.brand), ''), '')), lower(c.name), c.created_at
on conflict do nothing;

update public.bike_components bc
set catalog_id = cc.id
from public.components c
join public.component_catalog cc
  on  lower(coalesce(cc.category, '')) = lower(coalesce(c.category, ''))
  and lower(coalesce(cc.brand, ''))    = lower(coalesce(nullif(trim(c.brand), ''), ''))
  and lower(coalesce(cc.model, ''))    = lower(c.name)
where bc.component_id = c.id
  and bc.catalog_id is null;

-- Las 25 piezas huérfanas NO se migran: eran restos de dos plantillas genéricas
-- (MTB y gravel) que quedaron flotando al borrar sus bicis. Sus datos siguen
-- vivos en `component_templates`, que es su lugar correcto.

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4 · Permisos y mantención   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────

-- La mantención cuelga SIEMPRE de la bici. El componente es una anotación
-- opcional que apunta al modelo, con el nombre como texto para que el historial
-- sobreviva aunque la pieza se desmonte.
alter table public.bike_maintenance
  drop constraint if exists bike_maintenance_component_id_fkey;

alter table public.bike_maintenance
  add column if not exists component_name text;

alter table public.bike_maintenance
  add constraint bike_maintenance_component_id_fkey
  foreign key (component_id) references public.component_catalog(id) on delete set null;

-- El usuario puede CREAR modelos, nunca editarlos ni borrarlos,
-- y siempre queda registrado como autor.
drop policy if exists "catalogo: crear modelos" on public.component_catalog;
create policy "catalogo: crear modelos"
  on public.component_catalog
  for insert to authenticated
  with check (created_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4.5 · Estado transitorio   [APLICADO]
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Mientras la tabla vieja siga en pie, ninguna de sus columnas puede ser
-- obligatoria: el código nuevo ya no las escribe.
--
-- `catalog_id` tampoco puede ser obligatoria todavía, porque producción sigue
-- corriendo el código viejo, que monta piezas sin ese campo.
--
-- Las dos vuelven a su estado definitivo en el paso 5.

alter table public.bike_components alter column catalog_id    drop not null;
alter table public.bike_components alter column component_id  drop not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5 · Eliminar lo que sobra   [⛔ PENDIENTE — requiere aprobación]
-- ─────────────────────────────────────────────────────────────────────────────
--
-- NO EJECUTAR hasta que el código escriba `catalog_id` al montar una pieza.
-- Hoy la app todavía usa `components`; si se borra ahora, la app deja de andar.
--
-- Orden correcto:
--   1. Reescribir el código para que use catalog_id            (pendiente)
--   2. Verificar en preview que agregar y quitar piezas anda   (pendiente)
--   3. Recién ahí ejecutar este bloque
--
-- alter table public.bike_components drop column if exists component_id;
-- alter table public.bike_components alter column catalog_id set not null;
-- drop table if exists public.components;
--
-- La tabla de propuestas queda sin rol: la cola de revisión del admin pasa a ser
-- el estado 'unverified' del catálogo.
-- drop table if exists public.component_catalog_submissions;
--
-- Y cuando todo esté estable y verificado, los respaldos:
-- drop table if exists _backup_20260823_components;
-- drop table if exists _backup_20260823_bike_components;
-- drop table if exists _backup_20260823_bike_maintenance;
