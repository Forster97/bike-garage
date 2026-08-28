// API Route: POST /api/send-maintenance-email
// Verifica la sesión del usuario, calcula alertas de mantenimiento (misma lógica
// que la app: perfil + km + reglas custom) y envía un email vía Resend.
// Envío manual: no aplica cooldown porque lo dispara el propio usuario.
//
// Variables de entorno requeridas:
//   SUPABASE_SERVICE_ROLE_KEY  — clave de servicio de Supabase (solo server-side)
//   RESEND_API_KEY             — clave de Resend (resend.com)
//   RESEND_FROM_EMAIL          — dirección remitente

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

import { computeUserAlerts } from "../../../lib/maintenanceAlerts";
import { generateEmailHtml } from "../../../lib/maintenanceEmail";
import { getAppUrl } from "../../../lib/appUrl";

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

  // 3. Cargar tipos y calcular alertas con la lógica compartida
  const { data: types } = await supabaseAdmin.from("maintenance_types").select("*");
  const { bikes, alerts } = await computeUserAlerts({
    supabaseAdmin,
    userId: user.id,
    types: types || [],
  });

  if (bikes.length === 0 || alerts.length === 0) {
    return NextResponse.json({
      message: "No hay alertas activas para enviar. ¡Todo al día!",
    });
  }

  // 4. Generar y enviar el email con Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = getAppUrl();
  const html = generateEmailHtml({ alerts, userEmail: user.email, appUrl });

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: user.email,
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
    message: `Resumen enviado a ${user.email} con ${alerts.length} alerta${alerts.length > 1 ? "s" : ""}.`,
    sent: alerts.length,
  });
}
