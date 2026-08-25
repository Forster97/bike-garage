/**
 * lib/maintenanceView.js
 *
 * EL ENSAMBLADO del mantenimiento: qué tipos aplican a una bici, con qué clave
 * se busca su último registro, y qué preferencias los silencian.
 *
 * No reemplaza al motor. `resolveRule` y `calculateTaskStatus` siguen viviendo en
 * `maintenanceHelpers.js` y este archivo los usa. Lo que unifica es todo lo que
 * los rodea, que estaba reimplementado en cuatro lugares distintos:
 *
 *   /maintenance              todos los tipos · clave por type_id      · sin prefs
 *   /garage/[id]/maintenance  tipos filtrados · clave por type_name    · sin prefs
 *   /notifications            todos los tipos · clave por type_name    · sin prefs
 *   el correo y el cron       todos los tipos · clave por type_name    · CON prefs
 *
 * Esa divergencia era la causa de que la misma bici mostrara dos porcentajes de
 * salud distintos (BG-003), de que los registros con `type_id` nulo fueran
 * invisibles para el dashboard (BG-004), y de que la pantalla de notificaciones
 * no coincidiera con el correo (BG-005).
 */

import { resolveRule, calculateTaskStatus, getStatusBadge, bikeHealthScore } from "./maintenanceHelpers";

/**
 * Qué categorías de componente justifican cada familia de mantención.
 * `null` = ese tipo aplica siempre, tenga lo que tenga la bici.
 *
 * Se indexa por `maintenance_types.category`, no por el nombre del tipo.
 */
export const MAINT_TO_PART_CAT = {
  transmision: ["Transmisión"],
  frenos: ["Frenos"],
  suspension: ["Horquilla", "Sillín / Tija"],
  estructura: null, // rodamientos, torque: aplica a toda bici
  ruedas: ["Ruedas", "Neumáticos"],
  general: null,
};

/** Orden en que se muestran las tareas: lo urgente primero. */
const ORDEN_ESTADO = { overdue: 0, soon: 1, ok: 2, none: 3 };

/**
 * Indexa los registros de mantención para buscarlos por bici + tipo.
 *
 * Guarda cada registro bajo DOS claves —su `type_id` y su `type_name`— porque
 * `bike_maintenance.type_id` es nullable: cuando el usuario escribe un tipo
 * personalizado, solo queda el nombre. Buscar únicamente por id hacía que esos
 * registros fueran invisibles.
 *
 * @param {Array} records — filas de bike_maintenance, ORDENADAS por performed_at desc
 */
export function indexLastRecords(records = []) {
  const porId = new Map();
  const porNombre = new Map();

  for (const r of records) {
    if (r.type_id != null) {
      const k = `${r.bike_id}:${r.type_id}`;
      if (!porId.has(k)) porId.set(k, r);
    }
    if (r.type_name) {
      const k = `${r.bike_id}:${r.type_name.trim().toLowerCase()}`;
      if (!porNombre.has(k)) porNombre.set(k, r);
    }
  }

  return {
    /** Último registro de esa bici para ese tipo, o null. */
    get(bikeId, type) {
      return (
        porId.get(`${bikeId}:${type.id}`) ??
        porNombre.get(`${bikeId}:${(type.name || "").trim().toLowerCase()}`) ??
        null
      );
    },
  };
}

/**
 * Decide si un tipo de mantención aplica a una bici, según lo que tenga montado.
 *
 * @param {Set<string>|null} categoriasMontadas — null o vacío = no sabemos, aplican todos
 */
export function tipoAplica(type, categoriasMontadas) {
  if (!categoriasMontadas || categoriasMontadas.size === 0) return true;
  const mapeadas = MAINT_TO_PART_CAT[type.category];
  if (mapeadas === null || mapeadas === undefined) return true;
  return mapeadas.some((c) => categoriasMontadas.has(c));
}

/**
 * Arma el estado de mantenimiento de UNA bici.
 *
 * Es el único lugar que decide qué tipos entran, cuál fue la última vez, y qué
 * está silenciado. Todas las pantallas y el correo pasan por acá.
 *
 * @returns {{ tasks: Array, health: number, overdue: number, soon: number }}
 */
export function buildBikeView({
  bike,
  types = [],
  lastIndex,
  rulesByTypeId = {},
  profile = "balanced",
  currentKm = null,
  categoriasMontadas = null,
  prefsByTypeId = {},
}) {
  // Sin registros previos, se cuenta desde que la bici entró a la app.
  // Ver BG-023: está decidido reemplazarlo por un "último service conocido".
  const creada = bike?.created_at ? bike.created_at.split("T")[0] : null;
  const fallback = creada ? { performed_at: creada, odometer_km: null } : null;

  const tasks = [];

  for (const type of types) {
    if (!tipoAplica(type, categoriasMontadas)) continue;

    const rule = resolveRule(type, rulesByTypeId[String(type.id)], profile);
    if (!rule.interval_days && !rule.interval_km) continue;

    const last = lastIndex ? lastIndex.get(bike.id, type) : null;
    const estado = calculateTaskStatus(rule, last ?? fallback, currentKm);

    // Silenciado NO significa excluido: cada consumidor decide qué hacer.
    // El correo lo omite; la pantalla lo muestra atenuado, para que el usuario
    // entienda por qué no le llegó.
    const pref = prefsByTypeId[type.id];
    const muted = pref?.notify_email === false || pref?.silent_mode === true;

    tasks.push({
      type,
      last,
      rule,
      muted,
      badge: getStatusBadge(estado),
      ...estado,
    });
  }

  tasks.sort((a, b) => (ORDEN_ESTADO[a.status] ?? 3) - (ORDEN_ESTADO[b.status] ?? 3));

  const activas = tasks.filter((t) => t.status !== "none");

  return {
    tasks,
    health: bikeHealthScore(
      activas.map((t) => ({ status: t.status, urgency: t.urgency, severity: t.type.severity }))
    ),
    overdue: activas.filter((t) => t.status === "overdue").length,
    soon: activas.filter((t) => t.status === "soon").length,
  };
}

/**
 * Lo mismo para varias bicis de una vez. Lo usan el dashboard global, la
 * pantalla de notificaciones y el correo.
 *
 * @param {Object} categoriasPorBici — { [bikeId]: Set<string> }. Si falta una
 *   bici, se asume que no sabemos qué tiene montado y aplican todos los tipos.
 */
export function buildGarageView({
  bikes = [],
  types = [],
  records = [],
  rules = [],
  profiles = [],
  stats = [],
  prefs = [],
  categoriasPorBici = {},
}) {
  const lastIndex = indexLastRecords(records);

  const perfilPorBici = {};
  for (const p of profiles) perfilPorBici[p.bike_id] = p.profile;

  const kmPorBici = {};
  for (const s of stats) kmPorBici[s.bike_id] = s.odometer_km;

  const reglasPorBici = {};
  for (const r of rules) {
    (reglasPorBici[r.bike_id] ??= {})[String(r.type_id)] = r;
  }

  const prefsByTypeId = {};
  for (const p of prefs) prefsByTypeId[p.type_id] = p;

  return bikes.map((bike) => ({
    bike,
    profile: perfilPorBici[bike.id] ?? "balanced",
    currentKm: kmPorBici[bike.id] ?? null,
    ...buildBikeView({
      bike,
      types,
      lastIndex,
      rulesByTypeId: reglasPorBici[bike.id] ?? {},
      profile: perfilPorBici[bike.id] ?? "balanced",
      currentKm: kmPorBici[bike.id] ?? null,
      categoriasMontadas: categoriasPorBici[bike.id] ?? null,
      prefsByTypeId,
    }),
  }));
}

/**
 * Aplana la vista del garage a una lista de alertas: solo lo vencido o próximo.
 * La usan la pantalla de notificaciones y el correo.
 *
 * @param {boolean} excluirSilenciadas — true para el correo, false para la pantalla
 */
export function toAlerts(garageView, { excluirSilenciadas = false } = {}) {
  const alertas = [];

  for (const { bike, tasks } of garageView) {
    for (const t of tasks) {
      if (t.status !== "overdue" && t.status !== "soon") continue;
      if (excluirSilenciadas && t.muted) continue;

      alertas.push({
        bike,
        type: t.type,
        last: t.last,
        status: t.status,
        muted: t.muted,
        nextDate: t.nextDueDate,
        daysLeft: t.remainingDays,
        remainingKm: t.remainingKm,
        badge: t.badge,
      });
    }
  }

  // Vencidas primero, y dentro de cada grupo por nombre de bici.
  return alertas.sort((a, b) => {
    const orden = { overdue: 0, soon: 1 };
    const d = (orden[a.status] ?? 2) - (orden[b.status] ?? 2);
    if (d !== 0) return d;
    return (a.bike.name || "").localeCompare(b.bike.name || "");
  });
}
