// lib/auth.js — helpers de autenticación reutilizables.
// Centraliza la lógica de verificar si hay usuario logueado,
// para no repetir ese código en cada página.

import { getSupabase } from "./supabaseClient";

// getUser — retorna el usuario autenticado actual, o null si no hay sesión.
// Se usa cuando solo necesitas saber quién está logueado.
export async function getUser() {
  const supabase = getSupabase();
  if (!supabase) return null; // si Supabase no está configurado, retorna null

  const { data } = await supabase.auth.getUser();
  return data?.user ?? null; // retorna el usuario o null si no hay sesión
}

// requireUser — retorna el usuario autenticado, o redirige al login si no hay sesión.
// Se usa en páginas que requieren estar logueado.
// router: el hook useRouter de Next.js (necesario para redirigir)
export async function requireUser(router) {
  const user = await getUser();
  if (!user) router.push("/login"); // si no hay usuario, manda al login
  return user;
}
