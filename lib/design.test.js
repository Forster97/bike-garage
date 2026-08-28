/**
 * Tests del sistema de diseño.
 *
 * No prueban que se vea bonito —eso no lo prueba ningún test—, sino las reglas
 * que, si se rompen, rompen la app de una forma que nadie nota revisando código:
 * un botón que no se puede tocar con el pulgar, o un estado que se confunde con
 * una acción.
 */

import { describe, it, expect } from "vitest";
import { color, radio, espacio, texto, tacto } from "./design";

describe("tacto · lo que se toca se puede tocar", () => {
  it("ningún objetivo táctil baja de 44px", () => {
    // Por debajo de esto el pulgar falla. Es el piso de PRD-11, no una
    // preferencia estética.
    expect(tacto.minimo).toBeGreaterThanOrEqual(44);
    expect(tacto.comodo).toBeGreaterThanOrEqual(tacto.minimo);
  });
});

describe("color · la regla que separa acción de estado", () => {
  it("la acción y el 'al día' son colores distintos", () => {
    // Son parecidos a propósito (los dos verdosos), pero no pueden ser el mismo:
    // lo que los distingue en pantalla es la forma, no el tono.
    expect(color.accion.base).not.toBe(color.estado.alDia);
  });

  it("los cuatro estados tienen colores distintos entre sí", () => {
    const estados = [
      color.estado.vencido,
      color.estado.proximo,
      color.estado.alDia,
      color.estado.sinDatos,
    ];
    expect(new Set(estados).size).toBe(4);
  });

  it("el texto sobre el color de acción es oscuro", () => {
    // Lima con texto blanco no se lee. Si alguien cambia la acción a un color
    // oscuro, este test avisa que hay que revisar el contraste.
    expect(color.texto.sobreAccion).toMatch(/^#0/);
  });
});

describe("los tokens existen y son del tipo que se espera", () => {
  it("las medidas son números, para poder sumarlas", () => {
    for (const v of Object.values(radio)) expect(typeof v).toBe("number");
    for (const v of Object.values(espacio)) expect(typeof v).toBe("number");
  });

  it("la escala de espacio va de menor a mayor", () => {
    const orden = [espacio.xs, espacio.sm, espacio.md, espacio.lg, espacio.xl, espacio.xxl];
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  });

  it("la escala de texto va de menor a mayor", () => {
    const orden = [texto.xs, texto.sm, texto.base, texto.md, texto.lg, texto.xl];
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  });

  it("el texto fuerte es más visible que el tenue", () => {
    const opacidad = (c) => Number(c.match(/([\d.]+)\)$/)[1]);
    expect(opacidad(color.texto.fuerte)).toBeGreaterThan(opacidad(color.texto.normal));
    expect(opacidad(color.texto.normal)).toBeGreaterThan(opacidad(color.texto.suave));
    expect(opacidad(color.texto.suave)).toBeGreaterThan(opacidad(color.texto.tenue));
  });
});
