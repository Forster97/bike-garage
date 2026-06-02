/**
 * lib/maintenanceAlerts.js
 *
 * Cálculo de alertas de mantenimiento para emails (cron + envío manual).
 * Usa EXACTAMENTE la misma lógica que la app (resolveRule + calculateTaskStatus),
 * considerando perfil activo de la bici, odómetro (km) y reglas personalizadas.
 * Así el correo siempre coincide con lo que el usuario ve en pantalla.
 */

import { resolveRule, calculateTaskStatus } from "./maintenanceHelpers";

/**
 * Calcula las alertas activas (overdue / soon) de un usuario.
 *
 * @param {object}   params
 * @param {object}   params.supabaseAdmin — cliente Supabase con service role
 * @param {string}   params.userId
 * @param {Array}    params.types         — filas de maintenance_types (cargadas una vez)
 * @returns {Promise<{ bikes: Array, alerts: Array }>}
 */
export async function computeUserAlerts({ supabaseAdmin, userId, types }) {
  const [bikesRes, prefsRes, profilesRes, statsRes, rulesRes] = await Promise.all([
    supabaseAdmin.from("bikes").select("id, brand, model, type, created_at").eq("user_id", userId),
    supabaseAdmin.from("notification_preferences").select("type_id, notify_email, silent_mode").eq("user_id", userId),
    supabaseAdmin.from("bike_profiles").select("bike_id, profile").eq("user_id", userId),
    supabaseAdmin.from("bike_stats").select("bike_id, odometer_km").eq("user_id", userId),
    supabaseAdmin.from("maintenance_rules").select("*").eq("user_id", userId),
  ]);

  const bikes = bikesRes.data || [];
  if (bikes.length === 0) return { bikes: [], alerts: [] };

  // Preferencias por tipo (notify_email / silent_mode)
  const prefByType = {};
  for (const p of prefsRes.data || []) prefByType[p.type_id] = p;

  // Perfil activo por bici (default balanced)
  const profileByBike = {};
  for (const p of profilesRes.data || []) profileByBike[p.bike_id] = p.profile;

  // Odómetro por bici
  const kmByBike = {};
  for (const s of statsRes.data || []) kmByBike[s.bike_id] = s.odometer_km;

  // Reglas custom por bike_id:type_id
  const ruleByBikeType = {};
  for (const r of rulesRes.data || []) ruleByBikeType[`${r.bike_id}:${r.type_id}`] = r;

  // Último registro por bici + nombre de tipo
  const { data: records } = await supabaseAdmin
    .from("bike_maintenance")
    .select("bike_id, type_id, type_name, performed_at, odometer_km")
    .in("bike_id", bikes.map((b) => b.id))
    .order("performed_at", { ascending: false });

  const lastByKey = {};
  for (const r of records || []) {
    const key = `${r.bike_id}:${r.type_name}`;
    if (!lastByKey[key]) lastByKey[key] = r;
  }

  const alerts = [];
  for (const bike of bikes) {
    const profile = profileByBike[bike.id] || "balanced";
    const currentKm = kmByBike[bike.id] ?? null;
    const bikeCreated = bike.created_at ? bike.created_at.split("T")[0] : null;
    const creationFallback = bikeCreated ? { performed_at: bikeCreated, odometer_km: null } : null;

    for (const type of types) {
      const pref = prefByType[type.id];
      if (pref?.notify_email === false) continue; // tipo silenciado por email
      if (pref?.silent_mode === true) continue;    // modo silencioso

      const rule = resolveRule(type, ruleByBikeType[`${bike.id}:${type.id}`], profile);
      if (!rule.interval_days && !rule.interval_km) continue;

      const last = lastByKey[`${bike.id}:${type.name}`] || null;
      const lastForCalc = last ?? creationFallback;
      const st = calculateTaskStatus(rule, lastForCalc, currentKm);

      if (st.status === "overdue" || st.status === "soon") {
        alerts.push({
          bike,
          type,
          last,
          status: st.status,
          nextDate: st.nextDueDate,
          daysLeft: st.remainingDays,
          remainingKm: st.remainingKm,
        });
      }
    }
  }

  return { bikes, alerts };
}
