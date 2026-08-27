/**
 * Carga desde Supabase todo lo que el motor necesita y devuelve la vista del
 * garage ya armada.
 *
 * Existe porque este bloque de consultas estaba copiado en más de una pantalla,
 * y basta que una copia se quede atrás para que la misma bici muestre dos
 * estados distintos según dónde la mires. Eso ya pasó: ver BG-003.
 *
 * La regla que sostiene todo el motor: **un solo lugar arma el estado.**
 * Si una pantalla nueva necesita saber cómo está una bici, llama acá.
 */

import { buildGarageView } from "./maintenanceView";

/**
 * @param {Object} supabase — cliente ya inicializado
 * @param {string} userId
 * @returns {Promise<{ views: Array, records: Array, types: Array }>}
 *   `views` es lo que devuelve buildGarageView: una entrada por bici, con
 *   `bike`, `tasks`, `health`, `overdue` y `soon`.
 */
export async function loadGarageView(supabase, userId, { bikes: bikesDados } = {}) {
  // Las bicis pueden venir ya cargadas (la pantalla del garage las necesita
  // igual para mostrarlas). Si no vienen, las traemos acá.
  const [bikesRes, typesRes, rulesRes] = await Promise.all([
    bikesDados
      ? Promise.resolve({ data: bikesDados })
      : supabase
          .from("bikes")
          .select("id,name,type,brand,model,year,created_at")
          .eq("user_id", userId)
          .order("name"),
    supabase.from("maintenance_types").select("*"),
    supabase.from("maintenance_rules").select("*").eq("user_id", userId),
  ]);

  const bikes = bikesRes.data ?? [];
  const types = typesRes.data ?? [];
  const bikeIds = bikes.map((b) => b.id);

  let records = [], profiles = [], stats = [], montados = [];

  if (bikeIds.length) {
    const [recRes, pRes, sRes, mRes] = await Promise.all([
      supabase
        .from("bike_maintenance")
        .select("bike_id,type_id,type_name,performed_at,odometer_km")
        .in("bike_id", bikeIds)
        .order("performed_at", { ascending: false }),
      supabase.from("bike_profiles").select("bike_id,profile").in("bike_id", bikeIds),
      supabase.from("bike_stats").select("bike_id,odometer_km").in("bike_id", bikeIds),
      // Qué tiene montado cada bici. Sin esto, una bici sin frenos de disco
      // igual aparecería debiendo una purga de frenos (BG-003).
      supabase
        .from("bike_components")
        .select("bike_id, modelo:component_catalog(category)")
        .in("bike_id", bikeIds),
    ]);
    records = recRes.data ?? [];
    profiles = pRes.data ?? [];
    stats = sRes.data ?? [];
    montados = mRes.data ?? [];
  }

  const categoriasPorBici = {};
  for (const bc of montados) {
    const cat = bc.modelo?.category;
    if (!cat) continue;
    (categoriasPorBici[bc.bike_id] ??= new Set()).add(cat);
  }

  const views = buildGarageView({
    bikes,
    types,
    records,
    rules: rulesRes.data ?? [],
    profiles,
    stats,
    categoriasPorBici,
  });

  return { views, records, types };
}

/**
 * Traduce el estado de una bici a algo que se pueda leer de un vistazo.
 * Una palabra y un color: el número exacto vive en la pantalla de Mantención.
 *
 * @param {{ overdue: number, soon: number, tasks: Array }} view
 */
export function estadoDeBici(view) {
  const overdue = view?.overdue ?? 0;
  const soon = view?.soon ?? 0;
  const seSigue = (view?.tasks ?? []).some((t) => t.status !== "none");

  if (overdue > 0) {
    return {
      nivel: "overdue",
      texto: `${overdue} vencida${overdue !== 1 ? "s" : ""}`,
      color: "rgba(239,68,68,0.90)",
      atencion: true,
    };
  }
  if (soon > 0) {
    return {
      nivel: "soon",
      texto: `${soon} próxima${soon !== 1 ? "s" : ""}`,
      color: "rgba(251,191,36,0.90)",
      atencion: true,
    };
  }
  if (!seSigue) {
    // Bici recién creada, o sin componentes: no es que esté bien, es que todavía
    // no sabemos nada de ella. Decirle "Al día" sería mentirle al usuario.
    return {
      nivel: "none",
      texto: "Sin seguimiento",
      color: "rgba(255,255,255,0.30)",
      atencion: false,
    };
  }
  return {
    nivel: "ok",
    texto: "Al día",
    color: "rgba(34,197,94,0.85)",
    atencion: false,
  };
}
