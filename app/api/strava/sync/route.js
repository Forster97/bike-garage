// API Route: POST /api/strava/sync
// Refresca el token si está por expirar, consulta las bicis (gear) del atleta en
// Strava y sincroniza el odómetro de las bicis locales que estén mapeadas a una
// gear de Strava (bikes.strava_gear_id). Devuelve la lista de gear para que el
// usuario pueda elegir el mapeo desde la app.
//
// El cliente lo llama con el access_token de Supabase en el header Authorization.
//
// Variables de entorno requeridas:
//   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET — para refrescar el token
//   SUPABASE_SERVICE_ROLE_KEY              — para leer/escribir conexión y stats

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Refresca el token si quedan menos de 60s de validez.
async function ensureFreshToken(conn) {
  const exp = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (exp - Date.now() > 60_000) return conn;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) throw new Error("No se pudo refrescar el token de Strava.");
  const d = await res.json();
  return {
    ...conn,
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: new Date(d.expires_at * 1000).toISOString(),
  };
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  const { data: conn } = await supabaseAdmin
    .from("strava_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conn) {
    return NextResponse.json({ error: "No hay conexión con Strava." }, { status: 404 });
  }

  let fresh;
  try {
    fresh = await ensureFreshToken(conn);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
  if (fresh.access_token !== conn.access_token) {
    await supabaseAdmin
      .from("strava_connections")
      .update({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
        expires_at: fresh.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  // El atleta tiene "bikes" (gear) con distancia acumulada en metros.
  const athleteRes = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${fresh.access_token}` },
  });
  if (!athleteRes.ok) {
    return NextResponse.json({ error: "Error consultando Strava." }, { status: 502 });
  }
  const athlete = await athleteRes.json();
  const gear = (athlete.bikes || []).map((b) => ({
    id: b.id,
    name: b.name,
    km: Math.round((b.distance || 0) / 1000),
  }));

  // Sincronizar odómetro de las bicis locales mapeadas a una gear de Strava.
  const { data: localBikes } = await supabaseAdmin
    .from("bikes")
    .select("id, strava_gear_id")
    .eq("user_id", user.id)
    .not("strava_gear_id", "is", null);

  let updated = 0;
  for (const lb of localBikes || []) {
    const g = gear.find((x) => x.id === lb.strava_gear_id);
    if (!g) continue;
    await supabaseAdmin.from("bike_stats").upsert(
      { bike_id: lb.id, user_id: user.id, odometer_km: g.km, updated_at: new Date().toISOString() },
      { onConflict: "bike_id" }
    );
    updated++;
  }

  await supabaseAdmin
    .from("strava_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, gear, updated });
}
