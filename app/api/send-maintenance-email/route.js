// API Route: POST /api/send-maintenance-email
// Verifica la sesión del usuario, calcula alertas de mantenimiento y envía un email via Resend.
//
// Variables de entorno requeridas:
//   SUPABASE_SERVICE_ROLE_KEY  — clave de servicio de Supabase (solo server-side, sin NEXT_PUBLIC_)
//   RESEND_API_KEY             — clave de Resend (resend.com)
//   RESEND_FROM_EMAIL          — dirección remitente (ej: "noreply@tudominio.com")
//                                En desarrollo puedes usar "onboarding@resend.dev"

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

// ── Helpers (duplicados del cliente — no se pueden importar desde app/) ────────

function daysSince(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 864e5);
}

function addDays(dateStr, days) {
  if (!dateStr || !days) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getTypeStatus(mType, lastRecord) {
  if (!lastRecord) return { status: "none", nextDate: null, daysLeft: null };
  const intervalDays = mType?.default_interval_days;
  if (!intervalDays) return { status: "ok", nextDate: null, daysLeft: null };
  const days = daysSince(lastRecord.performed_at);
  if (days === null) return { status: "none", nextDate: null, daysLeft: null };
  const nextDate = addDays(lastRecord.performed_at, intervalDays);
  const daysLeft = intervalDays - days;
  const pct = days / intervalDays;
  if (pct >= 1) return { status: "overdue", nextDate, daysLeft };
  if (pct >= 0.75) return { status: "soon", nextDate, daysLeft };
  return { status: "ok", nextDate, daysLeft };
}

function bikeName(bike) {
  return `${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || "Bicicleta";
}

// ── Generador de HTML del email ────────────────────────────────────────────────
function generateEmailHtml({ alerts, userEmail, appUrl }) {
  const overdueAlerts = alerts.filter((a) => a.status === "overdue");
  const soonAlerts = alerts.filter((a) => a.status === "soon");

  const alertRow = (alert) => {
    const { bike, type, last, status, nextDate, daysLeft } = alert;
    const isOverdue = status === "overdue";
    const statusColor = isOverdue ? "#ef4444" : "#f59e0b";
    const statusBg = isOverdue ? "#fef2f2" : "#fffbeb";
    const statusLabel = isOverdue
      ? `Vencido hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? "s" : ""}`
      : `Vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`;

    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div>
              <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:3px;">
                ${bikeName(bike)}
              </div>
              <div style="font-size:15px; font-weight:700; color:#111827;">${type.name}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:4px;">
                ${last ? `Último: ${formatDate(last.performed_at)}` : "Sin registro previo"}
                ${nextDate ? ` &nbsp;·&nbsp; Próximo: ${formatDate(nextDate)}` : ""}
              </div>
            </div>
            <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; background:${statusBg}; color:${statusColor}; border:1px solid ${statusColor}40; white-space:nowrap;">
              ${statusLabel}
            </span>
          </div>
        </td>
      </tr>`;
  };

  const section = (title, color, rows) => rows.length === 0 ? "" : `
    <tr>
      <td style="padding: 16px 16px 8px;">
        <div style="font-size:13px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.05em;">${title}</div>
      </td>
    </tr>
    ${rows.map(alertRow).join("")}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Resumen de mantenimiento — Bike Garage</title>
</head>
<body style="margin:0; padding:0; background:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:32px 16px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#22c55e); padding:28px 24px;">
              <div style="font-size:22px; font-weight:900; color:white; letter-spacing:-0.5px;">🔧 Bike Garage</div>
              <div style="font-size:14px; color:rgba(255,255,255,0.80); margin-top:4px;">Resumen de mantenimiento</div>
            </td>
          </tr>

          <!-- Summary chips -->
          <tr>
            <td style="padding:20px 16px 8px;">
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${overdueAlerts.length > 0 ? `<span style="display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; background:#fef2f2; color:#ef4444; border:1px solid #fecaca;">${overdueAlerts.length} vencido${overdueAlerts.length > 1 ? "s" : ""}</span>` : ""}
                ${soonAlerts.length > 0 ? `<span style="display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; background:#fffbeb; color:#f59e0b; border:1px solid #fde68a;">${soonAlerts.length} próximo${soonAlerts.length > 1 ? "s" : ""}</span>` : ""}
              </div>
            </td>
          </tr>

          <!-- Alerts -->
          <table width="100%" cellpadding="0" cellspacing="0">
            ${section("Vencidos", "#ef4444", overdueAlerts)}
            ${section("Próximos a vencer", "#f59e0b", soonAlerts)}
          </table>

          <!-- CTA -->
          <tr>
            <td style="padding:20px 16px 28px; text-align:center;">
              <a href="${appUrl}/notifications" style="display:inline-block; padding:12px 24px; background:linear-gradient(135deg,#4f46e5,#22c55e); color:white; text-decoration:none; border-radius:10px; font-weight:700; font-size:14px;">
                Ver en Bike Garage →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px; border-top:1px solid #f3f4f6; text-align:center;">
              <div style="font-size:11px; color:#9ca3af;">
                Este correo se envió a ${userEmail} desde Bike Garage.<br>
                Puedes gestionar tus notificaciones en la sección Notificaciones.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Handler principal ──────────────────────────────────────────────────────────
export async function POST(request) {
  // 1. Verificar token de autenticación
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  // 2. Verificar token con Supabase usando la service role key (server-only)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  const userEmail = user.email;

  // 3. Cargar datos del usuario en paralelo
  const [bikesRes, typesRes, prefsRes] = await Promise.all([
    supabaseAdmin.from("bikes").select("id, brand, model, type").eq("user_id", user.id),
    supabaseAdmin.from("maintenance_types").select("*"),
    supabaseAdmin.from("notification_preferences").select("*").eq("user_id", user.id),
  ]);

  const bikes = bikesRes.data || [];
  const types = typesRes.data || [];
  const prefsData = prefsRes.data || [];

  // 4. Construir mapa de preferencias: { type_id: notify_email }
  // Si no hay preferencia, se asume habilitado (true)
  const prefsMap = {};
  for (const p of prefsData) prefsMap[p.type_id] = p.notify_email;

  // 5. Cargar registros de mantenimiento de todas las bicis del usuario
  let records = [];
  if (bikes.length > 0) {
    const { data } = await supabaseAdmin
      .from("bike_maintenance")
      .select("*")
      .in("bike_id", bikes.map((b) => b.id))
      .order("performed_at", { ascending: false });
    records = data || [];
  }

  // 6. Calcular alertas
  const lastByKey = {};
  for (const r of records) {
    const key = `${r.bike_id}:${r.type_name}`;
    if (!lastByKey[key]) lastByKey[key] = r;
  }

  const alerts = [];
  for (const bike of bikes) {
    for (const type of types) {
      if (!type.default_interval_days) continue;

      // Respetar preferencia del usuario (si está explícitamente deshabilitado, saltar)
      if (prefsMap[type.id] === false) continue;

      const last = lastByKey[`${bike.id}:${type.name}`] || null;
      const statusInfo = getTypeStatus(type, last);

      if (statusInfo.status === "overdue" || statusInfo.status === "soon") {
        alerts.push({ bike, type, last, ...statusInfo });
      }
    }
  }

  if (alerts.length === 0) {
    return NextResponse.json({
      message: "No hay alertas activas para enviar. ¡Todo al día!",
    });
  }

  // 7. Generar y enviar el email con Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bike-garage.vercel.app";

  const html = generateEmailHtml({ alerts, userEmail, appUrl });

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: userEmail,
    subject: `🔧 ${alerts.length} alerta${alerts.length > 1 ? "s" : ""} de mantenimiento — Bike Garage`,
    html,
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return NextResponse.json(
      { error: "Error al enviar el correo. Verifica la configuración de Resend." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Resumen enviado a ${userEmail} con ${alerts.length} alerta${alerts.length > 1 ? "s" : ""}.`,
    sent: alerts.length,
  });
}
