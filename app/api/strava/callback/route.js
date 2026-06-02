// API Route: GET /api/strava/callback
// Strava redirige aquí tras el consentimiento del usuario. Verificamos el `state`
// firmado, intercambiamos el `code` por tokens y guardamos la conexión.
// Luego redirige de vuelta a la app.
//
// Variables de entorno requeridas:
//   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET — credenciales de la app de Strava
//   SUPABASE_SERVICE_ROLE_KEY              — para escribir la conexión (RLS bypass)
//   NEXT_PUBLIC_APP_URL                    — base URL pública
//   STRAVA_STATE_SECRET                    — (opcional) cae a CRON_SECRET

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_SECRET = process.env.STRAVA_STATE_SECRET || process.env.CRON_SECRET || "";

function verifyState(state) {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const [userId, sig] = decoded.split(".");
    if (!userId || !sig) return null;
    const expected = crypto.createHmac("sha256", STATE_SECRET).update(userId).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bike-garage.vercel.app";
  const back = (status) => NextResponse.redirect(`${appUrl}/settings/profile?strava=${status}`);

  if (searchParams.get("error")) return back("denied");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const userId = state ? verifyState(state) : null;
  if (!code || !userId) return back("error");

  // Intercambiar el code por tokens
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    console.error("Strava token exchange failed:", await tokenRes.text());
    return back("error");
  }
  const data = await tokenRes.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error: upsertErr } = await supabaseAdmin.from("strava_connections").upsert(
    {
      user_id: userId,
      athlete_id: data.athlete?.id ?? null,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : null,
      scope: searchParams.get("scope") || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (upsertErr) {
    console.error("Strava connection upsert error:", upsertErr);
    return back("error");
  }

  return back("connected");
}
