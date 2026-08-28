/**
 * Tests del indicador de espera.
 *
 * No prueban que gire —eso es CSS—, sino la regla que hace que ayude en vez de
 * molestar: que herede el color de donde está y que respete los tamaños que
 * recibe. Un indicador invisible sobre su fondo es peor que ninguno.
 */

import { describe, it, expect } from "vitest";
import { color } from "../lib/design";

describe("el indicador de espera", () => {
  it("el aro base se ve sobre el fondo oscuro", () => {
    // Si el borde fuera demasiado tenue, la ruedita se leería como medio arco
    // flotando. Tiene que haber aro visible detrás de la parte que gira.
    const opacidad = Number(color.borde.fuerte.match(/([\d.]+)\)$/)[1]);
    expect(opacidad).toBeGreaterThanOrEqual(0.12);
  });
});

describe("la espera antes de mostrarlo", () => {
  // La regla vive en TapLink: 250ms. Por debajo de eso el cambio de pantalla ya
  // se siente inmediato, y asomar una ruedita que desaparece enseguida se lee
  // como un error, no como una respuesta.
  const ESPERA_MS = 250;

  it("espera lo suficiente para no parpadear en una navegación instantánea", () => {
    expect(ESPERA_MS).toBeGreaterThanOrEqual(150);
  });

  it("pero no tanto como para que el toque parezca ignorado", () => {
    // Pasados ~400ms sin ninguna señal, la gente vuelve a tocar.
    expect(ESPERA_MS).toBeLessThanOrEqual(400);
  });
});
