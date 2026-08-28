// API Route: GET /api/strava/connect
// Inicia el flujo OAuth de Strava. El cliente lo llama con el access_token de
// Supabase en el header Authorization; verificamos el usuario y devolvemos la
// URL de autorización de Strava. El cliente hace window.location = url.
//
// El parámetro `state` lleva el user_id firmado con HMAC para que el callback
// pueda asociar la conexión al usuario correcto sin confiar en cookies.
//
// Variables de entorno requeridas:
//   STRAVA_CLIENT_ID          — client id de la app registrada en Strava
//   SUPABASE_SERVICE_ROLE_KEY — para verificar el token del usuario
//   NEXT_PUBLIC_APP_URL       — base URL pública (para construir redirect_uri)
//   STRAVA_STATE_SECRET       — (opcional) secreto para firmar el state; cae a CRON_SECRET

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAppUrl } from "../../../../lib/appUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_SECRET = process.env.STRAVA_STATE_SECRET || process.env.CRON_SECRET || "";

function signState(userId) {
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(userId).digest("hex");
  return Buffer.from(`${userId}.${sig}`).toString("base64url");
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId || !STATE_SECRET) {
    return NextResponse.json(
      { error: "Strava no está configurado (falta STRAVA_CLIENT_ID o el secreto de state)." },
      { status: 500 }
    );
  }

  const appUrl = getAppUrl();
  const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${appUrl}/api/strava/callback`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("approval_prompt", "auto");
  authorizeUrl.searchParams.set("scope", "read,activity:read,profile:read_all");
  authorizeUrl.searchParams.set("state", signState(user.id));

  return NextResponse.json({ url: authorizeUrl.toString() });
}
