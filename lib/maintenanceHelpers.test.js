/**
 * Tests del MOTOR de mantenimiento.
 *
 * Es la lógica más delicada del producto: decide qué está vencido, cuándo, y
 * cuánta "salud" tiene una bici. Todo lo demás es interfaz alrededor de esto.
 *
 * Las funciones son puras, así que no hace falta base de datos ni navegador.
 */

import { describe, it, expect } from "vitest";
import {
  resolveRule,
  calculateTaskStatus,
  bikeHealthScore,
  healthColor,
  getStatusBadge,
  MAINTENANCE_SOON_THRESHOLD,
} from "./maintenanceHelpers";
import { addDays, daysSince, todayISO } from "./dateHelpers";

/**
 * Una fecha a N días atrás de hoy, en formato ISO.
 * Ojo con el 0: `addDays(x, -0)` devuelve null porque -0 es falsy — la guarda
 * frágil que documenta el último test de este archivo.
 */
const haceDias = (n) => (n === 0 ? todayISO() : addDays(todayISO(), -n));

const tipo = (extra = {}) => ({
  id: 1,
  name: "Cadena",
  category: "transmision",
  severity: "medium",
  default_interval_days: 100,
  default_interval_km: 1000,
  interval_days_maniac: 50,
  interval_km_maniac: 500,
  interval_days_balanced: 100,
  interval_km_balanced: 1000,
  interval_days_saver: 200,
  interval_km_saver: 2000,
  ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────
describe("resolveRule · la jerarquía de intervalos", () => {
  it("usa el intervalo del perfil activo", () => {
    expect(resolveRule(tipo(), null, "maniac")).toEqual({ interval_days: 50, interval_km: 500 });
    expect(resolveRule(tipo(), null, "balanced")).toEqual({ interval_days: 100, interval_km: 1000 });
    expect(resolveRule(tipo(), null, "saver")).toEqual({ interval_days: 200, interval_km: 2000 });
  });

  it("una regla custom activa le gana al perfil", () => {
    const r = resolveRule(tipo(), { is_active: true, interval_days: 7, interval_km: 70 }, "saver");
    expect(r).toEqual({ interval_days: 7, interval_km: 70 });
  });

  it("una regla INACTIVA se ignora y manda el perfil", () => {
    const r = resolveRule(tipo(), { is_active: false, interval_days: 7, interval_km: 70 }, "maniac");
    expect(r).toEqual({ interval_days: 50, interval_km: 500 });
  });

  it("cae al intervalo por defecto si el perfil no tiene uno", () => {
    const sinPerfil = tipo({ interval_days_balanced: null, interval_km_balanced: null });
    expect(resolveRule(sinPerfil, null, "balanced")).toEqual({ interval_days: 100, interval_km: 1000 });
  });

  it("devuelve nulos si el tipo no define ningún intervalo", () => {
    const sinNada = tipo({
      default_interval_days: null, default_interval_km: null,
      interval_days_balanced: null, interval_km_balanced: null,
    });
    expect(resolveRule(sinNada, null, "balanced")).toEqual({ interval_days: null, interval_km: null });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("calculateTaskStatus · los umbrales", () => {
  const regla = { interval_days: 100, interval_km: null };

  it("sin registro previo el estado es 'none'", () => {
    const r = calculateTaskStatus(regla, null, null);
    expect(r.status).toBe("none");
    expect(r.urgency).toBe(0);
  });

  it("recién hecho está 'ok'", () => {
    expect(calculateTaskStatus(regla, { performed_at: haceDias(10) }, null).status).toBe("ok");
  });

  it(`el umbral de 'soon' es exactamente ${MAINTENANCE_SOON_THRESHOLD}`, () => {
    // 74 de 100 días todavía es ok; 75 ya es 'soon'
    expect(calculateTaskStatus(regla, { performed_at: haceDias(74) }, null).status).toBe("ok");
    expect(calculateTaskStatus(regla, { performed_at: haceDias(75) }, null).status).toBe("soon");
  });

  it("al cumplirse el intervalo exacto ya está vencido", () => {
    expect(calculateTaskStatus(regla, { performed_at: haceDias(99) }, null).status).toBe("soon");
    expect(calculateTaskStatus(regla, { performed_at: haceDias(100) }, null).status).toBe("overdue");
  });

  it("la urgencia se topa en 100 aunque el score se dispare", () => {
    const r = calculateTaskStatus(regla, { performed_at: haceDias(1000) }, null);
    expect(r.urgency).toBe(100);
    expect(r.score).toBeGreaterThan(1);
  });

  it("calcula la próxima fecha de vencimiento", () => {
    const hecho = haceDias(10);
    const r = calculateTaskStatus(regla, { performed_at: hecho }, null);
    expect(r.nextDueDate).toBe(addDays(hecho, 100));
    expect(r.remainingDays).toBe(90);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("calculateTaskStatus · kilómetros y el criterio que gana", () => {
  it("los km vencen la tarea aunque el tiempo esté al día", () => {
    const regla = { interval_days: 365, interval_km: 1000 };
    const r = calculateTaskStatus(regla, { performed_at: haceDias(1), odometer_km: 0 }, 1200);
    expect(r.status).toBe("overdue");
    expect(r.remainingKm).toBe(-200);
  });

  it("el tiempo vence la tarea aunque no se hayan hecho km", () => {
    const regla = { interval_days: 30, interval_km: 10000 };
    const r = calculateTaskStatus(regla, { performed_at: haceDias(60), odometer_km: 0 }, 10);
    expect(r.status).toBe("overdue");
  });

  it("gana el criterio MÁS urgente de los dos", () => {
    const regla = { interval_days: 100, interval_km: 1000 };
    // 10% del tiempo, 90% de los km → manda el km
    const r = calculateTaskStatus(regla, { performed_at: haceDias(10), odometer_km: 0 }, 900);
    expect(r.status).toBe("soon");
    expect(r.urgency).toBe(90);
  });

  it("ignora los km si el odómetro actual es menor al del registro", () => {
    const regla = { interval_days: 365, interval_km: 100 };
    // El odómetro bajó (dato corregido a mano): no se inventa un avance negativo
    const r = calculateTaskStatus(regla, { performed_at: haceDias(1), odometer_km: 500 }, 100);
    expect(r.status).toBe("ok");
    expect(r.remainingKm).toBeNull();
  });

  it("ignora los km si falta el odómetro actual", () => {
    const regla = { interval_days: 365, interval_km: 100 };
    const r = calculateTaskStatus(regla, { performed_at: haceDias(1), odometer_km: 0 }, null);
    expect(r.remainingKm).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("bikeHealthScore · la ponderación por severidad", () => {
  it("una bici sin tareas activas está al 100", () => {
    expect(bikeHealthScore([])).toBe(100);
    expect(bikeHealthScore([{ status: "none", urgency: 0 }])).toBe(100);
  });

  it("todo recién hecho da 100, todo vencido da 0", () => {
    expect(bikeHealthScore([{ status: "ok", urgency: 0, severity: "medium" }])).toBe(100);
    expect(bikeHealthScore([{ status: "overdue", urgency: 100, severity: "medium" }])).toBe(0);
  });

  it("un freno vencido pesa MÁS que un ajuste menor vencido", () => {
    const critico = bikeHealthScore([
      { status: "overdue", urgency: 100, severity: "critical" },
      { status: "ok", urgency: 0, severity: "low" },
    ]);
    const menor = bikeHealthScore([
      { status: "overdue", urgency: 100, severity: "low" },
      { status: "ok", urgency: 0, severity: "critical" },
    ]);
    expect(critico).toBeLessThan(menor);
  });

  it("respeta los pesos documentados: critical 4 · high 2 · medium 1 · low 0.5", () => {
    // critical vencido + low al día → 4/(4+0.5) = 88.9% de daño → salud 11
    expect(bikeHealthScore([
      { status: "overdue", urgency: 100, severity: "critical" },
      { status: "ok", urgency: 0, severity: "low" },
    ])).toBe(11);
  });

  it("una severidad desconocida se trata como medium", () => {
    const raro = bikeHealthScore([{ status: "overdue", urgency: 100, severity: "inventada" }]);
    const medio = bikeHealthScore([{ status: "overdue", urgency: 100, severity: "medium" }]);
    expect(raro).toBe(medio);
  });

  it("nunca se sale del rango 0-100", () => {
    const r = bikeHealthScore([{ status: "overdue", urgency: 100, severity: "critical" }]);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("healthColor · los umbrales que ve el usuario", () => {
  it("80 o más es Excelente", () => {
    expect(healthColor(100).label).toBe("Excelente");
    expect(healthColor(80).label).toBe("Excelente");
  });
  it("entre 60 y 79 es Atención", () => {
    expect(healthColor(79).label).toBe("Atención");
    expect(healthColor(60).label).toBe("Atención");
  });
  it("bajo 60 requiere mantenimiento", () => {
    expect(healthColor(59).label).toBe("Requiere mantenimiento");
    expect(healthColor(0).label).toBe("Requiere mantenimiento");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getStatusBadge", () => {
  it("no muestra badge cuando está al día o sin registro", () => {
    expect(getStatusBadge({ status: "ok", remainingDays: 50, remainingKm: null })).toBeNull();
    expect(getStatusBadge({ status: "none", remainingDays: null, remainingKm: null })).toBeNull();
  });

  it("vencido informa cuánto se pasó, en días y km", () => {
    const b = getStatusBadge({ status: "overdue", remainingDays: -12, remainingKm: -340 });
    expect(b.label).toBe("Vencido (12d / 340km)");
  });

  it("próximo informa cuánto queda", () => {
    const b = getStatusBadge({ status: "soon", remainingDays: 5, remainingKm: 80 });
    expect(b.label).toBe("Vence en 5d / 80km");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("dateHelpers · las trampas de fechas", () => {
  it("daysSince cuenta días completos desde una fecha ISO", () => {
    expect(daysSince(haceDias(0))).toBe(0);
    expect(daysSince(haceDias(30))).toBe(30);
  });

  it("daysSince devuelve null sin fecha", () => {
    expect(daysSince(null)).toBeNull();
  });

  it("addDays cruza bien fin de mes y de año", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); // bisiesto
  });

  it("addDays con 0 días devuelve null — guarda frágil documentada", () => {
    // No es lo ideal, pero está así y el motor depende de ello:
    // un intervalo de 0 días no produce fecha de vencimiento.
    expect(addDays("2026-01-01", 0)).toBeNull();
  });
});
