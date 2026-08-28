-- BG-020 · El administrador deja de identificarse por su correo.
--
-- Estaba escrito a mano en DOS archivos: `const ADMIN_EMAIL = "..."`. Dos
-- problemas:
--
--   1. Cambiar uno y olvidar el otro deja media puerta abierta o media cerrada.
--   2. El correo NO es una identidad estable. Un usuario puede cambiar el suyo;
--      si el administrador cambiara el suyo perdería el acceso, y peor: quien
--      tomara ese correo lo ganaría.
--
-- El rol va en `app_metadata`, el único lugar de la sesión que **el usuario no
-- puede modificar** — solo la service role key escribe ahí. Viaja dentro del
-- token, así que el servidor lo verifica sin consultar nada.
--
-- Deliberadamente NO se usó una columna en `profiles`: el usuario puede
-- actualizar su propia fila de perfil, así que un `is_admin` ahí sería una
-- escalada de privilegios servida en bandeja.
--
-- Para nombrar a otro administrador, la misma consulta con su correo.
--
-- Aplicada en producción el 2026-08-28.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'bforsterb@gmail.com';
