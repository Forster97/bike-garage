/**
 * lib/maintenanceAlerts.js
 *
 * Alertas de un usuario para el correo (manual y cron).
 *
 * Desde BG-008 esto solo carga datos: el cálculo y el ensamblado viven en
 * `maintenanceView.js`, el mismo que usan las pantallas. Así el correo y la app
 * no pueden divergir — que era justamente el problema.
 */

import { buildGarageView, toAlerts } from "./maintenanceView";

/**
 * Calcula las alertas activas (vencidas o próximas) de un usuario.
 *
 * Omite los tipos que el usuario silenció: `notify_email = false` o
 * `silent_mode = true`. La pantalla los muestra atenuados en vez de ocultarlos,
 * pero al correo no llegan.
 *
 * @param {object}   params
 * @param {object}   params.supabaseAdmin — cliente con service role
 * @param {string}   params.userId
 * @param {Array}    params.types         — filas de maintenance_types
 * @returns {Promise<{ bikes: Array, alerts: Array }>}
 */
export async function computeUserAlerts({ supabaseAdmin, userId, types }) {
  const [bikesRes, prefsRes, profilesRes, statsRes, rulesRes] = await Promise.all([
    supabaseAdmin.from("bikes").select("id, name, brand, model, type, created_at").eq("user_id", userId),
    supabaseAdmin.from("notification_preferences").select("type_id, notify_email, silent_mode").eq("user_id", userId),
    supabaseAdmin.from("bike_profiles").select("bike_id, profile").eq("user_id", userId),
    supabaseAdmin.from("bike_stats").select("bike_id, odometer_km").eq("user_id", userId),
    supabaseAdmin.from("maintenance_rules").select("*").eq("user_id", userId),
  ]);

  const bikes = bikesRes.data || [];
  if (bikes.length === 0) return { bikes: [], alerts: [] };

  const bikeIds = bikes.map((b) => b.id);

  const [recordsRes, montadosRes] = await Promise.all([
    supabaseAdmin
      .from("bike_maintenance")
      .select("bike_id, type_id, type_name, performed_at, odometer_km")
      .in("bike_id", bikeIds)
      .order("performed_at", { ascending: false }),
    // Qué tiene montado cada bici, para no alertar del service de suspensión
    // a una bici rígida. Es el mismo criterio que usan las pantallas.
    supabaseAdmin
      .from("bike_components")
      .select("bike_id, modelo:component_catalog(category)")
      .in("bike_id", bikeIds),
  ]);

  const categoriasPorBici = {};
  for (const bc of montadosRes.data || []) {
    const cat = bc.modelo?.category;
    if (!cat) continue;
    (categoriasPorBici[bc.bike_id] ??= new Set()).add(cat);
  }

  const garage = buildGarageView({
    bikes,
    types: types || [],
    records: recordsRes.data || [],
    rules: rulesRes.data || [],
    profiles: profilesRes.data || [],
    stats: statsRes.data || [],
    prefs: prefsRes.data || [],
    categoriasPorBici,
  });

  return { bikes, alerts: toAlerts(garage, { excluirSilenciadas: true }) };
}
