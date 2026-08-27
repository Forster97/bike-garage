/**
 * Tests de cómo se traduce el estado de una bici a una línea de texto.
 *
 * Es lo primero que se ve al abrir la app (PRD-11.3), y una traducción mal hecha
 * hace algo peor que verse fea: le dice al ciclista que su bici está bien cuando
 * no lo sabemos.
 *
 * `loadGarageView` en sí no se prueba acá: habla con Supabase. Lo que sí importa
 * y sí se puede probar es esta traducción.
 */

import { describe, it, expect } from "vitest";
import { estadoDeBici } from "./loadGarageView";

const vista = ({ overdue = 0, soon = 0, tasks = [{ status: "ok" }] } = {}) => ({
  overdue, soon, tasks,
});

describe("estadoDeBici · qué dice cada estado", () => {
  it("con tareas vencidas, lo dice y cuántas", () => {
    const e = estadoDeBici(vista({ overdue: 2, tasks: [{ status: "overdue" }] }));
    expect(e.texto).toBe("2 vencidas");
    expect(e.nivel).toBe("overdue");
  });

  it("una sola vencida va en singular", () => {
    expect(estadoDeBici(vista({ overdue: 1, tasks: [{ status: "overdue" }] })).texto)
      .toBe("1 vencida");
  });

  it("con tareas próximas y ninguna vencida, avisa de las próximas", () => {
    const e = estadoDeBici(vista({ soon: 3, tasks: [{ status: "soon" }] }));
    expect(e.texto).toBe("3 próximas");
    expect(e.nivel).toBe("soon");
  });

  it("una sola próxima va en singular", () => {
    expect(estadoDeBici(vista({ soon: 1, tasks: [{ status: "soon" }] })).texto)
      .toBe("1 próxima");
  });

  it("lo vencido manda sobre lo próximo", () => {
    // Si hay de las dos, el ciclista necesita saber de lo vencido primero.
    const e = estadoDeBici(vista({ overdue: 1, soon: 5, tasks: [{ status: "overdue" }] }));
    expect(e.nivel).toBe("overdue");
    expect(e.texto).toBe("1 vencida");
  });

  it("sin nada pendiente pero con tareas siguiéndose, está al día", () => {
    const e = estadoDeBici(vista({ tasks: [{ status: "ok" }, { status: "ok" }] }));
    expect(e.texto).toBe("Al día");
    expect(e.nivel).toBe("ok");
  });
});

describe("estadoDeBici · lo que no se sabe no se inventa", () => {
  it("una bici sin ninguna tarea aplicable NO dice que está al día", () => {
    // Una bici recién creada, sin componentes, no está bien: no sabemos nada
    // de ella. Decirle "Al día" sería mentirle.
    const e = estadoDeBici(vista({ tasks: [] }));
    expect(e.texto).toBe("Sin seguimiento");
    expect(e.nivel).toBe("none");
  });

  it("una bici cuyas tareas están todas en 'none' tampoco dice al día", () => {
    const e = estadoDeBici(vista({ tasks: [{ status: "none" }, { status: "none" }] }));
    expect(e.nivel).toBe("none");
  });

  it("aguanta que no le pasen nada", () => {
    expect(() => estadoDeBici(undefined)).not.toThrow();
    expect(estadoDeBici(undefined).nivel).toBe("none");
  });
});

describe("estadoDeBici · lo que la pantalla necesita para pintarlo", () => {
  it("solo lo vencido y lo próximo piden atención", () => {
    expect(estadoDeBici(vista({ overdue: 1, tasks: [{ status: "overdue" }] })).atencion).toBe(true);
    expect(estadoDeBici(vista({ soon: 1, tasks: [{ status: "soon" }] })).atencion).toBe(true);
    expect(estadoDeBici(vista({ tasks: [{ status: "ok" }] })).atencion).toBe(false);
    expect(estadoDeBici(vista({ tasks: [] })).atencion).toBe(false);
  });

  it("cada estado trae un color, para que la pantalla no tenga que decidirlo", () => {
    for (const v of [
      vista({ overdue: 1, tasks: [{ status: "overdue" }] }),
      vista({ soon: 1, tasks: [{ status: "soon" }] }),
      vista({ tasks: [{ status: "ok" }] }),
      vista({ tasks: [] }),
    ]) {
      expect(estadoDeBici(v).color).toMatch(/^rgba\(/);
    }
  });

  it("los cuatro estados tienen colores distintos entre sí", () => {
    const colores = [
      estadoDeBici(vista({ overdue: 1, tasks: [{ status: "overdue" }] })).color,
      estadoDeBici(vista({ soon: 1, tasks: [{ status: "soon" }] })).color,
      estadoDeBici(vista({ tasks: [{ status: "ok" }] })).color,
      estadoDeBici(vista({ tasks: [] })).color,
    ];
    expect(new Set(colores).size).toBe(4);
  });
});
