-- El cron de alertas nunca ha enviado un correo, y nadie se enteró en meses.
--
-- No falló en silencio por descuido: en el plan Hobby de Vercel los logs duran
-- UNA HORA, así que una corrida de las 12:00 UTC no deja rastro alguno para
-- cuando uno va a mirar. La única señal era `profiles.last_digest_sent_at`,
-- que solo se escribe cuando el envío SÍ funciona — o sea, calla justo cuando
-- hace falta que hable.
--
-- Esta tabla guarda cada corrida: cuándo, cómo terminó y por qué. Es la
-- diferencia entre "no sé si corre" y "corrió a las 12:00 y falló por esto".
--
-- Cómo se consulta:
--   select * from cron_runs order by ran_at desc limit 10;
--
-- Aplicada en producción el 2026-08-28.

create table if not exists cron_runs (
  id            uuid primary key default gen_random_uuid(),
  job           text not null,
  ran_at        timestamptz not null default now(),
  ok            boolean not null,
  duration_ms   integer,
  sent          integer,
  skipped       integer,
  errors        integer,
  cooldown      integer,
  error_message text
);

create index if not exists cron_runs_job_ran_at_idx on cron_runs (job, ran_at desc);

comment on table cron_runs is
  'Rastro de cada corrida de un cron. Existe porque los logs de Vercel duran una hora en Hobby y el cron de alertas falló invisible durante meses.';

-- Solo el servidor escribe acá, con la service role key. Nadie más la ve.
alter table cron_runs enable row level security;
revoke select on cron_runs from anon, authenticated;
