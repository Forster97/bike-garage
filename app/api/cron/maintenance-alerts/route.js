// Cron Job: GET /api/cron/maintenance-alerts
// Vercel lo llama automáticamente según el schedule en vercel.json.
// Itera todos los usuarios, calcula alertas con la MISMA lógica que la app
// (perfil + km + reglas custom) y envía email a quienes tengan alertas activas.
//
// Anti-spam: cada usuario recibe a lo más un resumen cada 7 días
// (se controla con profiles.last_digest_sent_at).
//
// Variables de entorno requeridas:
//   CRON_SECRET               — secreto para autenticar la llamada de Vercel
//   SUPABASE_SERVICE_ROLE_KEY — clave de servicio de Supabase
//   RESEND_API_KEY            — clave de Resend
//   RESEND_FROM_EMAIL         — dirección remitente

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

import { computeUserAlerts } from "../../../../lib/maintenanceAlerts";
import { generateEmailHtml } from "../../../../lib/maintenanceEmail";
import { todayISO, daysSince } from "../../../../lib/dateHelpers";
import { getAppUrl } from "../../../../lib/appUrl";

const DIGEST_COOLDOWN_DAYS = 7;

// Cuántos usuarios se piden por página y cuántas páginas como máximo.
// 50 x 40 = 2.000 usuarios. Pasado eso el cron necesita otro diseño, no un
// número más grande.
const POR_PAGINA = 50;
const MAX_PAGINAS = 40;

// BG-011: sin esto Vercel corta la función a los 10 segundos por defecto, y el
// corte no avisa: los usuarios que quedaban simplemente no reciben nada.
// 60 es el máximo del plan Hobby.
export const maxDuration = 60;

// Margen para alcanzar a anotar la corrida antes de que Vercel corte.
const MARGEN_MS = 5000;

/**
 * Deja constancia de la corrida en `cron_runs`.
 *
 * Existe porque este cron nunca envió un correo y nadie se enteró durante
 * meses: en el plan Hobby de Vercel los logs duran UNA HORA, así que una
 * corrida de las 12:00 UTC no deja rastro para cuando uno va a mirar.
 *
 * Nunca revienta: si no se puede anotar la corrida, eso no puede ser motivo
 * para que el cron falle.
 */
async function anotarCorrida(supabaseAdmin, fila) {
  try {
    await supabaseAdmin.from("cron_runs").insert([{ job: "maintenance-alerts", ...fila }]);
  } catch (err) {
    console.error("No se pudo anotar la corrida:", err);
  }
}

export async function GET(request) {
  // 1. Verificar el CRON_SECRET que Vercel envía automáticamente
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const empezó = Date.now();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Desde acá, cualquier cosa que salga mal queda escrita.
  try {

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = getAppUrl();

  // 2. Obtener todos los usuarios registrados
  // BG-010: `listUsers()` sin argumentos devuelve SOLO LA PRIMERA PÁGINA — 50
  // usuarios. Del 51 en adelante nadie recibía nada, y no había ningún error:
  // el cron terminaba diciendo "ok". Con dos usuarios nunca se notó; con
  // cincuenta y uno, el número 51 simplemente no existe para la app.
  const users = [];
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: POR_PAGINA,
    });
    if (usersError) {
      console.error("Error listing users:", usersError);
      throw new Error(`No se pudo listar usuarios (página ${page}): ${usersError.message}`);
    }
    const lote = data?.users ?? [];
    users.push(...lote);
    if (lote.length < POR_PAGINA) break;   // última página

    if (page === MAX_PAGINAS) {
      // Si algún día se llega acá, es que el producto creció más que este
      // cron. Mejor que quede escrito a que se corte en silencio otra vez.
      console.warn(`Se alcanzó el tope de ${MAX_PAGINAS} páginas de usuarios.`);
    }
  }

  // 3. Cargar datos globales (tipos de mantenimiento) y cooldowns de envío
  const [{ data: types }, { data: digestRows }] = await Promise.all([
    supabaseAdmin.from("maintenance_types").select("*"),
    supabaseAdmin.from("profiles").select("id, last_digest_sent_at"),
  ]);

  const lastDigestById = {};
  for (const p of digestRows || []) lastDigestById[p.id] = p.last_digest_sent_at;

  const results = { sent: 0, skipped: 0, errors: 0, cooldown: 0 };
  const today = todayISO();

  // 4. Iterar cada usuario
  let cortadoPorTiempo = false;
  for (const user of users) {
    // Si se acaba el tiempo, se corta A PROPÓSITO y queda escrito. Lo que no
    // se envió hoy se envía mañana: nadie queda en cooldown sin haber recibido
    // nada, porque `last_digest_sent_at` solo se marca tras un envío real.
    if (Date.now() - empezó > (maxDuration * 1000 - MARGEN_MS)) {
      cortadoPorTiempo = true;
      break;
    }

    if (!user.email) { results.skipped++; continue; }

    // Anti-spam: no reenviar si ya se envió dentro de la ventana de cooldown
    const lastSent = lastDigestById[user.id];
    if (lastSent) {
      const since = daysSince(lastSent);
      if (since !== null && since < DIGEST_COOLDOWN_DAYS) { results.cooldown++; continue; }
    }

    try {
      const { bikes, alerts } = await computeUserAlerts({
        supabaseAdmin,
        userId: user.id,
        types: types || [],
      });

      if (bikes.length === 0 || alerts.length === 0) { results.skipped++; continue; }

      const html = generateEmailHtml({ alerts, userEmail: user.email, appUrl });
      const { error: sendError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: `🔧 ${alerts.length} alerta${alerts.length > 1 ? "s" : ""} de mantenimiento — Bike Garage`,
        html,
      });

      if (sendError) {
        console.error(`Error enviando a ${user.email}:`, sendError);
        results.errors++;
      } else {
        results.sent++;
        // Registrar el envío para respetar el cooldown
        await supabaseAdmin
          .from("profiles")
          .upsert({ id: user.id, last_digest_sent_at: today }, { onConflict: "id" });
      }
    } catch (err) {
      console.error(`Error procesando usuario ${user.id}:`, err);
      results.errors++;
    }
  }

  console.log("Cron maintenance-alerts:", results, `usuarios: ${users.length}`);
  await anotarCorrida(supabaseAdmin, {
    ok: results.errors === 0 && !cortadoPorTiempo,
    duration_ms: Date.now() - empezó,
    error_message: cortadoPorTiempo
      ? `Cortado por tiempo tras ${results.sent + results.skipped + results.cooldown} de ${users.length} usuarios. Los demás entran mañana.`
      : null,
    ...results,
  });
  return NextResponse.json({ ok: true, usuarios: users.length, cortadoPorTiempo, ...results });

  } catch (err) {
    // Lo que antes desaparecía con los logs, ahora queda en la base.
    console.error("Cron maintenance-alerts falló:", err);
    await anotarCorrida(supabaseAdmin, {
      ok: false,
      duration_ms: Date.now() - empezó,
      error_message: String(err?.message ?? err).slice(0, 500),
    });
    return NextResponse.json({ error: "Cron falló", detalle: String(err?.message ?? err) }, { status: 500 });
  }
}
