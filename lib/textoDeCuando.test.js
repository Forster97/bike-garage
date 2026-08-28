/**
 * Tests del texto relativo de la pantalla de mantenimiento.
 *
 * Es lo único de esa pantalla que puede decir algo **falso**: la barra dibuja
 * un número que el motor ya calculó, pero esto lo traduce a palabras, y una
 * traducción mal hecha le dice al ciclista que puede salir cuando no puede.
 */

import { describe, it, expect } from "vitest";
import { textoDeCuando } from "./maintenanceHelpers";

const last = { performed_at: "2026-08-01" };

describe("lo vencido se dice como vencido", () => {
  it("dice hace cuántos días se pasó", () => {
    expect(textoDeCuando({ status: "overdue", last, remainingDays: -12 }))
      .toBe("vencida hace 12 días");
  });

  it("un solo día va en singular", () => {
    expect(textoDeCuando({ status: "overdue", last, remainingDays: -1 }))
      .toBe("vencida hace 1 día");
  });

  it("el día exacto del vencimiento dice que vence hoy", () => {
    // Ni "en 0 días" ni "vencida hace 0 días": las dos suenan a error.
    expect(textoDeCuando({ status: "overdue", last, remainingDays: 0 })).toBe("vence hoy");
  });
});

describe("lo que falta se dice en la unidad que se entiende", () => {
  it("hasta mes y medio, en días", () => {
    expect(textoDeCuando({ status: "soon", last, remainingDays: 5 })).toBe("en 5 días");
    expect(textoDeCuando({ status: "ok", last, remainingDays: 45 })).toBe("en 45 días");
  });

  it("más allá, en meses: 'en 120 días' no se lee", () => {
    expect(textoDeCuando({ status: "ok", last, remainingDays: 120 })).toBe("en 4 meses");
  });

  it("un mes va en singular", () => {
    expect(textoDeCuando({ status: "ok", last, remainingDays: 30 })).toBe("en 30 días");
    expect(textoDeCuando({ status: "ok", last, remainingDays: 60 })).toBe("en 2 meses");
  });
});

describe("cuando el intervalo es por kilómetros", () => {
  it("dice los km que faltan, con separador de miles", () => {
    expect(textoDeCuando({ status: "ok", last, remainingDays: null, remainingKm: 1500 }))
      .toContain("km");
    expect(textoDeCuando({ status: "ok", last, remainingDays: null, remainingKm: 1500 }))
      .toMatch(/1[.,]500/);
  });

  it("pasado el intervalo, dice cuántos km se pasó", () => {
    expect(textoDeCuando({ status: "overdue", last, remainingDays: null, remainingKm: -340 }))
      .toContain("pasados");
  });
});

describe("lo que no se sabe no se inventa", () => {
  it("sin registro y sin fecha calculada, lo dice", () => {
    expect(textoDeCuando({ status: "none", last: null, remainingDays: null }))
      .toBe("sin registro");
  });

  it("el tiempo manda sobre los km cuando están los dos", () => {
    // El motor ya eligió el más urgente para el estado; el texto sigue al
    // mismo criterio en vez de contradecirlo.
    expect(textoDeCuando({ status: "soon", last, remainingDays: 3, remainingKm: 900 }))
      .toBe("en 3 días");
  });
});
