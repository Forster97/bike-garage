/**
 * Tests de las utilidades de fecha y formato.
 *
 * Parecen triviales pero sostienen todo el cálculo de vencimientos, y tienen
 * dos trampas conocidas: el manejo de zona horaria y la guarda de `addDays`.
 */

import { describe, it, expect } from "vitest";
import {
  todayISO, daysSince, addDays, formatDate, formatDateShort, formatCLP, bikeName,
} from "./dateHelpers";

const haceDias = (n) => (n === 0 ? todayISO() : addDays(todayISO(), -n));

describe("todayISO", () => {
  it("devuelve el formato YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("mes y día vienen con dos dígitos", () => {
    const [, m, d] = todayISO().split("-");
    expect(m).toHaveLength(2);
    expect(d).toHaveLength(2);
  });
});

describe("daysSince", () => {
  it("cuenta días completos hacia atrás", () => {
    expect(daysSince(haceDias(0))).toBe(0);
    expect(daysSince(haceDias(1))).toBe(1);
    expect(daysSince(haceDias(365))).toBe(365);
  });

  it("una fecha futura da negativo", () => {
    expect(daysSince(addDays(todayISO(), 5))).toBe(-5);
  });

  it("sin fecha devuelve null, no cero", () => {
    // Es importante: cero significaría "hoy" y dispararía cálculos.
    expect(daysSince(null)).toBeNull();
    expect(daysSince("")).toBeNull();
  });

  it("no se corre un día por la zona horaria", () => {
    // La fecha se parsea por partes justamente para evitar que `new Date(iso)`
    // la interprete como UTC y reste un día en Chile.
    expect(daysSince(todayISO())).toBe(0);
  });
});

describe("addDays", () => {
  it("suma y resta días", () => {
    expect(addDays("2026-03-10", 5)).toBe("2026-03-15");
    expect(addDays("2026-03-10", -5)).toBe("2026-03-05");
  });

  it("cruza fin de mes, fin de año y años bisiestos", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("sin fecha devuelve null", () => {
    expect(addDays(null, 5)).toBeNull();
  });

  it("con 0 días devuelve null — guarda frágil, documentada a propósito", () => {
    // No es lo ideal, pero el motor depende de este comportamiento: un
    // intervalo de 0 días no produce fecha de vencimiento. Ojo también con -0,
    // que es falsy y cae en la misma guarda.
    expect(addDays("2026-01-01", 0)).toBeNull();
    expect(addDays("2026-01-01", -0)).toBeNull();
  });
});

describe("formatDate y formatDateShort", () => {
  it("formatean en español", () => {
    expect(formatDate("2026-01-15")).toContain("enero");
    expect(formatDate("2026-01-15")).toContain("2026");
    expect(formatDateShort("2026-01-15")).toContain("2026");
  });

  it("sin fecha muestran un guion, no 'Invalid Date'", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDateShort(null)).toBe("—");
  });

  it("no se corren un día por zona horaria", () => {
    // Con `new Date("2026-01-15")` en Chile esto mostraría el 14.
    expect(formatDate("2026-01-15")).toContain("15");
    expect(formatDateShort("2026-01-15")).toContain("15");
  });
});

describe("formatCLP", () => {
  it("formatea como peso chileno, sin decimales", () => {
    const r = formatCLP(12500);
    expect(r).toContain("12.500");
    expect(r).not.toContain(",00");
  });

  it("el cero es un monto válido y se muestra", () => {
    // Distinto de "no sé cuánto costó": eso es null.
    expect(formatCLP(0)).toContain("0");
  });

  it("sin monto devuelve null, para que quien llame decida qué mostrar", () => {
    expect(formatCLP(null)).toBeNull();
    expect(formatCLP(undefined)).toBeNull();
  });
});

describe("bikeName", () => {
  it("junta marca y modelo", () => {
    expect(bikeName({ brand: "Santa Cruz", model: "Hightower" })).toBe("Santa Cruz Hightower");
  });

  it("aguanta que falte uno de los dos", () => {
    expect(bikeName({ brand: "Yeti", model: null })).toBe("Yeti");
    expect(bikeName({ brand: null, model: "SB140" })).toBe("SB140");
  });

  it("sin marca ni modelo devuelve algo legible, nunca vacío", () => {
    expect(bikeName({})).toBe("Bicicleta");
    expect(bikeName({ brand: null, model: null })).toBe("Bicicleta");
  });
});
