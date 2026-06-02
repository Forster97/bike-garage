/**
 * lib/maintenanceEmail.js
 *
 * Generador del HTML del email de mantenimiento. Compartido entre el cron diario
 * y el envío manual para evitar que diverjan. La etiqueta de estado refleja tanto
 * días como km restantes/excedidos, igual que los badges de la app.
 */

import { formatDate, bikeName } from "./dateHelpers";

/** Etiqueta legible de estado considerando días y km. */
function statusLabel({ status, daysLeft, remainingKm }) {
  const parts = [];
  if (status === "overdue") {
    if (daysLeft != null && daysLeft < 0) parts.push(`${Math.abs(Math.round(daysLeft))} días`);
    if (remainingKm != null && remainingKm < 0) parts.push(`${Math.abs(Math.round(remainingKm))} km`);
    return parts.length ? `Vencido hace ${parts.join(" / ")}` : "Vencido";
  }
  if (daysLeft != null && daysLeft > 0) parts.push(`${Math.round(daysLeft)} días`);
  if (remainingKm != null && remainingKm > 0) parts.push(`${Math.round(remainingKm)} km`);
  return parts.length ? `Vence en ${parts.join(" / ")}` : "Próximo";
}

export function generateEmailHtml({ alerts, userEmail, appUrl }) {
  const overdueAlerts = alerts.filter((a) => a.status === "overdue");
  const soonAlerts = alerts.filter((a) => a.status === "soon");

  const alertRow = (alert) => {
    const { bike, type, last, status, nextDate } = alert;
    const isOverdue = status === "overdue";
    const statusColor = isOverdue ? "#ef4444" : "#f59e0b";
    const statusBg = isOverdue ? "#fef2f2" : "#fffbeb";

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
              ${statusLabel(alert)}
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
