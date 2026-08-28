/**
 * lib/esAdmin.js — quién es administrador.
 *
 * BG-020. Antes se comparaba el correo contra una constante escrita a mano, y
 * estaba escrita en DOS archivos:
 *
 *     const ADMIN_EMAIL = "bforsterb@gmail.com";
 *
 * Dos problemas. Cambiar uno y olvidar el otro deja media puerta abierta. Y el
 * correo **no es una identidad estable**: un usuario puede cambiar el suyo, así
 * que el administrador podía perder su acceso — y quien tomara ese correo,
 * ganarlo.
 *
 * El rol vive en `app_metadata`, el único lugar de la sesión que **el usuario
 * no puede modificar**: solo se escribe con la service role key. Viaja dentro
 * del token, así que verificarlo no cuesta una consulta.
 *
 * No se usó una columna en `profiles` a propósito: el usuario puede actualizar
 * su propia fila de perfil, así que un `is_admin` ahí sería una escalada de
 * privilegios servida en bandeja.
 *
 * Para nombrar a alguien administrador:
 *   update auth.users
 *   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
 *   where email = '...';
 */

export function esAdmin(user) {
  return user?.app_metadata?.role === "admin";
}
