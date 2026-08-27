/**
 * lib/dateHelpers.js
 *
 * Utilidades de fecha y mantenimiento compartidas entre páginas cliente y rutas API.
 * Todas las fechas se manejan como strings ISO "YYYY-MM-DD" para evitar desfases
 * de zona horaria que ocurren al usar `new Date(isoString)` directamente.
 */

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
  // `name` manda: es lo que el ciclista le puso, y si no puso nada el trigger de
  // la base ya guardó "marca modelo" ahí (BG-027). Marca y modelo quedan de
  // respaldo para las bicis creadas antes de que ese trigger existiera.
  return (
    (bike?.name ?? "").trim() ||
    `${bike?.brand ?? ""} ${bike?.model ?? ""}`.trim() ||
    "Bicicleta"
  );
}
