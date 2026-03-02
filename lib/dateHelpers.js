/**
 * lib/dateHelpers.js
 *
 * Utilidades de fecha y mantenimiento compartidas entre páginas cliente y rutas API.
 * Todas las fechas se manejan como strings ISO "YYYY-MM-DD" para evitar desfases
 * de zona horaria que ocurren al usar `new Date(isoString)` directamente.
 */

/** Umbral a partir del cual el mantenimiento se considera "por vencer" (75% del intervalo). */
export const MAINTENANCE_SOON_THRESHOLD = 0.75;

/**
 * Devuelve la fecha de hoy en formato "YYYY-MM-DD" según la hora local del navegador.
 * @returns {string}
 */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Calcula los días transcurridos desde una fecha ISO hasta hoy (hora local).
 * @param {string|null} dateStr — Fecha en formato "YYYY-MM-DD"
 * @returns {number|null} Días transcurridos, o null si no hay fecha
 */
export function daysSince(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 864e5);
}

/**
 * Añade un número de días a una fecha ISO y devuelve el resultado en "YYYY-MM-DD".
 * @param {string|null} dateStr — Fecha base en formato "YYYY-MM-DD"
 * @param {number|null} days   — Días a sumar
 * @returns {string|null}
 */
export function addDays(dateStr, days) {
  if (!dateStr || !days) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * Formatea una fecha ISO a string largo en español (ej: "15 de enero de 2024").
 * @param {string|null} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Formatea una fecha ISO a string corto en español (ej: "15 ene 2024").
 * @param {string|null} dateStr
 * @returns {string}
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * Formatea un número como pesos chilenos (ej: "$ 12.500").
 * @param {number|null} amount
 * @returns {string|null} String formateado, o null si amount es null/undefined
 */
export function formatCLP(amount) {
  if (amount == null) return null;
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Devuelve un nombre legible para una bicicleta a partir de su marca y modelo.
 * @param {{ brand?: string|null, model?: string|null }} bike
 * @returns {string}
 */
export function bikeName(bike) {
  return `${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || "Bicicleta";
}

/**
 * Calcula el estado de mantenimiento de un tipo dado su último registro.
 *
 * @param {{ default_interval_days?: number|null }} mType — Tipo de mantenimiento
 * @param {{ performed_at: string }|null} lastRecord      — Último registro realizado
 * @returns {{
 *   status:   "none" | "ok" | "soon" | "overdue",
 *   nextDate: string|null,
 *   daysLeft: number|null,
 *   badge:    { label: string, color: string, bg: string, border: string } | null
 * }}
 */
export function getTypeStatus(mType, lastRecord) {
  if (!lastRecord) {
    return { status: "none", nextDate: null, daysLeft: null, badge: null };
  }

  const intervalDays = mType?.default_interval_days;
  if (!intervalDays) {
    return { status: "ok", nextDate: null, daysLeft: null, badge: null };
  }

  const days = daysSince(lastRecord.performed_at);
  if (days === null) {
    return { status: "none", nextDate: null, daysLeft: null, badge: null };
  }

  const nextDate = addDays(lastRecord.performed_at, intervalDays);
  const daysLeft = intervalDays - days;
  const pct = days / intervalDays;

  if (pct >= 1) {
    return {
      status: "overdue", nextDate, daysLeft,
      badge: {
        label: `Vencido hace ${Math.abs(daysLeft)}d`,
        color: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)",
      },
    };
  }

  if (pct >= MAINTENANCE_SOON_THRESHOLD) {
    return {
      status: "soon", nextDate, daysLeft,
      badge: {
        label: `Vence en ${daysLeft}d`,
        color: "rgba(251,191,36,0.90)", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.20)",
      },
    };
  }

  return { status: "ok", nextDate, daysLeft, badge: null };
}
