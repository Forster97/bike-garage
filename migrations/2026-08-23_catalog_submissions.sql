-- 2026-08-23 · Propuestas de catálogo pendientes de aprobación
--
-- Cuando un usuario carga un componente con una marca/modelo que no está en
-- component_catalog, la combinación queda acá para que un admin la revise.
-- Es el mecanismo de curación colaborativa: el usuario propone, el admin aprueba.
--
-- Ver PRD-09-Catalogo-Maestro y BG-024 en la bóveda.

create table if not exists public.component_catalog_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Lo que propuso el usuario. `category` es la categoría en ESPAÑOL que él ve,
  -- no la técnica del catálogo: el admin hace la traducción al aprobar.
  category      text not null,
  brand         text not null,
  model         text,
  variant       text,
  weight_g      int,
  sku           text,

  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_by   uuid references auth.users(id),
  reviewed_at   timestamptz,
  reject_reason text,

  created_at    timestamptz not null default now()
);

-- Una misma persona no genera dos veces la misma propuesta.
-- Se usa un índice (y no una constraint) porque model puede ser null.
create unique index if not exists component_catalog_submissions_unica
  on public.component_catalog_submissions (
    user_id, lower(category), lower(brand), lower(coalesce(model, ''))
  );

-- Para que el admin liste rápido lo pendiente.
create index if not exists component_catalog_submissions_status_idx
  on public.component_catalog_submissions (status, created_at desc);

alter table public.component_catalog_submissions enable row level security;

-- El usuario solo ve y crea las suyas. Nadie edita ni borra desde el cliente:
-- aprobar y rechazar pasa por /api/admin/catalog con la service role key.
drop policy if exists "submissions: ver las propias" on public.component_catalog_submissions;
create policy "submissions: ver las propias"
  on public.component_catalog_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "submissions: crear las propias" on public.component_catalog_submissions;
create policy "submissions: crear las propias"
  on public.component_catalog_submissions
  for insert with check (auth.uid() = user_id);
