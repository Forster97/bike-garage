/**
 * lib/maintenanceHelpers.js
 *
 * Lógica de negocio del módulo de mantenimiento.
 * Cálculo de estados, resolución de reglas y puntuación de salud.
 */

import { daysSince, addDays } from "./dateHelpers";

export const MAINTENANCE_SOON_THRESHOLD = 0.75;

/** Perfiles de mantenimiento disponibles. */
export const PROFILES = [
  {
    id: "maniac",
    label: "😤 Maniático",
    description: "Máxima frecuencia. Detecta problemas antes de que pasen.",
  },
  {
    id: "balanced",
    label: "⚖️ Equilibrado",
    description: "Intervalos recomendados. El punto dulce entre costo y rendimiento.",
  },
  {
    id: "saver",
    label: "💰 No Gastar",
    description: "Solo lo crítico. Seguridad ante todo, sin exagerar.",
  },
];

/**
 * Resuelve el intervalo efectivo para una tarea dada la jerarquía:
 * 1. Regla custom del usuario (maintenance_rules)
 * 2. Intervalo del perfil activo (maintenance_types.interval_*_profile)
 * 3. Intervalo por defecto (maintenance_types.default_interval_*)
 *
 * @param {object} mType      — Fila de maintenance_types
 * @param {object|null} rule  — Fila de maintenance_rules (o null)
 * @param {string} profile    — 'maniac' | 'balanced' | 'saver'
 * @returns {{ interval_days: number|null, interval_km: number|null }}
 */
export function resolveRule(mType, rule, profile = "balanced") {
  if (rule?.is_active) {
    return {
      interval_days: rule.interval_days ?? null,
      interval_km: rule.interval_km ?? null,
    };
  }

  const days =
    mType[`interval_days_${profile}`] ??
    mType.default_interval_days ??
    null;
  const km =
    mType[`interval_km_${profile}`] ??
    mType.default_interval_km ??
    null;

  return { interval_days: days, interval_km: km };
}

/**
 * Calcula el estado de una tarea de mantenimiento.
 * Considera tanto el intervalo por tiempo como por km.
 * El estado final es el más urgente de los dos.
 *
 * @param {{ interval_days: number|null, interval_km: number|null }} rule
 * @param {{ performed_at: string, odometer_km: number|null }|null} lastEvent
 * @param {number|null} currentKm — odómetro actual de la bici
 * @returns {{
 *   status: 'none'|'ok'|'soon'|'overdue',
 *   urgency: number,       // 0–100
 *   score: number,         // 0.0–1.0+ (fracción del intervalo consumida)
 *   remainingDays: number|null,
 *   remainingKm: number|null,
 *   nextDueDate: string|null
 * }}
 */
export function calculateTaskStatus(rule, lastEvent, currentKm) {
  if (!lastEvent) {
    return { status: "none", urgency: 0, score: 0, remainingDays: null, remainingKm: null, nextDueDate: null };
  }

  let scoreTime = 0;
  let scoreKm = 0;
  let remainingDays = null;
  let remainingKm = null;
  let nextDueDate = null;

  if (rule.interval_days) {
    const days = daysSince(lastEvent.performed_at);
    if (days !== null) {
      scoreTime = days / rule.interval_days;
      remainingDays = rule.interval_days - days;
      nextDueDate = addDays(lastEvent.performed_at, rule.interval_days);
    }
  }

  if (rule.interval_km && currentKm != null && lastEvent.odometer_km != null) {
    const kmUsed = currentKm - lastEvent.odometer_km;
    if (kmUsed >= 0) {
      scoreKm = kmUsed / rule.interval_km;
      remainingKm = rule.interval_km - kmUsed;
    }
  }

  // El más urgente de los dos criterios define el estado
  const score = Math.max(scoreTime, scoreKm);
  const urgency = Math.min(Math.round(score * 100), 100);

  let status;
  if (score >= 1.0) status = "overdue";
  else if (score >= MAINTENANCE_SOON_THRESHOLD) status = "soon";
  else status = "ok";

  return { status, urgency, score, remainingDays, remainingKm, nextDueDate };
}

/**
 * Genera el objeto badge de UI para el estado de una tarea.
 *
 * @param {{ status: string, remainingDays: number|null, remainingKm: number|null }} taskStatus
 * @returns {{ label: string, color: string, bg: string, border: string } | null}
 */
export function getStatusBadge(taskStatus) {
  const { status, remainingDays, remainingKm } = taskStatus;

  if (status === "overdue") {
    const parts = [];
    if (remainingDays !== null && remainingDays < 0) parts.push(`${Math.abs(Math.round(remainingDays))}d`);
    if (remainingKm !== null && remainingKm < 0) parts.push(`${Math.abs(Math.round(remainingKm))}km`);
    return {
      label: parts.length ? `Vencido (${parts.join(" / ")})` : "Vencido",
      color: "rgba(239,68,68,0.85)",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
    };
  }

  if (status === "soon") {
    const parts = [];
    if (remainingDays !== null && remainingDays > 0) parts.push(`${Math.round(remainingDays)}d`);
    if (remainingKm !== null && remainingKm > 0) parts.push(`${Math.round(remainingKm)}km`);
    return {
      label: parts.length ? `Vence en ${parts.join(" / ")}` : "Próximo",
      color: "rgba(251,191,36,0.90)",
      bg: "rgba(251,191,36,0.10)",
      border: "rgba(251,191,36,0.20)",
    };
  }

  return null;
}

/**
 * Calcula el score de salud general de una bici (0–100).
 * Pondera por severidad: critical=4, high=2, medium=1, low=0.5
 * Un score de 100 significa todo al día. 0 significa todo vencido.
 *
 * @param {Array<{ status: string, urgency: number, severity?: string }>} tasks
 * @returns {number} 0–100
 */
export function bikeHealthScore(tasks) {
  const activeTasks = tasks.filter((t) => t.status !== "none");
  if (!activeTasks.length) return 100;

  const weights = { critical: 4, high: 2, medium: 1, low: 0.5 };

  const weightedSum = activeTasks.reduce((acc, t) => {
    const w = weights[t.severity ?? "medium"] ?? 1;
    return acc + (t.urgency ?? 0) * w;
  }, 0);

  const maxPossible = activeTasks.reduce((acc, t) => {
    const w = weights[t.severity ?? "medium"] ?? 1;
    return acc + 100 * w;
  }, 0);

  if (!maxPossible) return 100;
  return Math.max(0, Math.min(100, 100 - Math.round((weightedSum / maxPossible) * 100)));
}

/**
 * Devuelve color según el score de salud.
 * @param {number} score
 * @returns {{ fg: string, bg: string, border: string, label: string }}
 */
export function healthColor(score) {
  if (score >= 80) return {
    fg: "rgba(134,239,172,0.90)", bg: "rgba(134,239,172,0.10)",
    border: "rgba(134,239,172,0.25)", label: "Excelente",
  };
  if (score >= 60) return {
    fg: "rgba(251,191,36,0.90)", bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.25)", label: "Atención",
  };
  return {
    fg: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.25)", label: "Requiere mantenimiento",
  };
}
