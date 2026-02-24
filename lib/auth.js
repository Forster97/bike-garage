// lib/auth.js
import { getSupabase } from "./supabaseClient";

export async function getUser() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function requireUser(router) {
  const user = await getUser();
  if (!user) router.push("/login");
  return user;
}