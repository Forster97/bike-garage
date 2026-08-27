/**
 * Tests del correo de alertas.
 *
 * Es lo único que el usuario recibe sin abrir la app, y no hay forma de
 * revisarlo antes de que salga: una vez enviado, se envió. Estos tests cuidan
 * que diga lo que corresponde y que no se rompa el HTML.
 */

import { describe, it, expect } from "vitest";
import { generateEmailHtml } from "./maintenanceEmail";

const alerta = (extra = {}) => ({
  bike: { id: "b1", name: "Trail", brand: "Santa Cruz", model: "Hightower" },
  type: { id: 1, name: "Cadena" },
  last: { performed_at: "2026-06-01" },
  status: "overdue",
  nextDate: "2026-07-01",
  daysLeft: -12,
  remainingKm: -340,
  ...extra,
});

const html = (alerts, extra = {}) =>
  generateEmailHtml({
    alerts,
    userEmail: "ciclista@ejemplo.cl",
    appUrl: "https://bike-garage-ten.vercel.app",
    ...extra,
  });

describe("generateEmailHtml · lo básico", () => {
  it("devuelve HTML", () => {
    const h = html([alerta()]);
    expect(typeof h).toBe("string");
    expect(h.length).toBeGreaterThan(100);
  });

  it("incluye el nombre de la bici y el del tipo", () => {
    const h = html([alerta()]);
    expect(h).toContain("Trail");
    expect(h).toContain("Cadena");
  });

  it("usa el nombre que el ciclista le puso, no la marca y el modelo", () => {
    // El correo llega al teléfono sin contexto: tiene que llamar a la bici como
    // la llama su dueño.
    const h = html([alerta({ bike: { id: "b1", name: "La Roja", brand: "Santa Cruz", model: "Hightower" } })]);
    expect(h).toContain("La Roja");
    expect(h).not.toContain("Santa Cruz Hightower");
  });

  it("incluye el link a la app", () => {
    expect(html([alerta()])).toContain("https://bike-garage-ten.vercel.app");
  });

  it("incluye el correo del usuario", () => {
    expect(html([alerta()])).toContain("ciclista@ejemplo.cl");
  });

  it("no deja marcadores de plantilla sin resolver", () => {
    const h = html([alerta()]);
    expect(h).not.toContain("undefined");
    expect(h).not.toContain("[object Object]");
    expect(h).not.toContain("NaN");
  });
});

describe("generateEmailHtml · qué dice de cada alerta", () => {
  it("una vencida dice hace cuánto, en días y km", () => {
    const h = html([alerta({ status: "overdue", daysLeft: -12, remainingKm: -340 })]);
    expect(h).toContain("Vencido hace");
    expect(h).toContain("12 días");
    expect(h).toContain("340 km");
  });

  it("una próxima dice cuánto queda", () => {
    const h = html([alerta({ status: "soon", daysLeft: 5, remainingKm: 80 })]);
    expect(h).toContain("Vence en");
    expect(h).toContain("5 días");
  });

  it("sin datos de días ni km, no inventa un número", () => {
    const h = html([alerta({ status: "overdue", daysLeft: null, remainingKm: null })]);
    expect(h).toContain("Vencido");
    expect(h).not.toContain("null");
  });

  it("sin registro previo lo dice, en vez de mostrar una fecha vacía", () => {
    const h = html([alerta({ last: null })]);
    expect(h).toContain("Sin registro previo");
  });

  it("separa las vencidas de las próximas", () => {
    const h = html([
      alerta({ status: "overdue" }),
      alerta({ status: "soon", type: { id: 2, name: "Frenos" }, daysLeft: 5, remainingKm: null }),
    ]);
    expect(h).toContain("Cadena");
    expect(h).toContain("Frenos");
    // La vencida va antes que la próxima en el cuerpo del correo
    expect(h.indexOf("Cadena")).toBeLessThan(h.indexOf("Frenos"));
  });
});

describe("generateEmailHtml · casos borde que no deben romperlo", () => {
  it("aguanta una bici sin marca ni modelo", () => {
    const h = html([alerta({ bike: { id: "b1" } })]);
    expect(h).toContain("Bicicleta");
    expect(h).not.toContain("undefined");
  });

  it("aguanta una lista vacía sin explotar", () => {
    expect(() => html([])).not.toThrow();
  });

  it("aguanta muchas alertas", () => {
    const muchas = Array.from({ length: 40 }, (_, i) =>
      alerta({ type: { id: i, name: `Tarea ${i}` } })
    );
    const h = html(muchas);
    expect(h).toContain("Tarea 0");
    expect(h).toContain("Tarea 39");
  });

  it("los estilos van en línea, porque los clientes de correo ignoran las hojas de estilo", () => {
    const h = html([alerta()]);
    expect(h).toContain("style=");
    expect(h).not.toContain("<link");
  });
});
