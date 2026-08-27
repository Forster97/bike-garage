/**
 * Tests de los contratos implícitos entre constantes.
 *
 * Varias listas de `constants.js` se referencian entre sí por TEXTO, sin que
 * nada lo garantice. Renombrar «Transmisión» rompía el filtrado de mantenciones
 * sin dar ningún error: la app seguía andando y simplemente dejaba de avisar.
 *
 * Estos tests convierten esos acuerdos tácitos en algo que se rompe fuerte.
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_CATEGORIES,
  BIKE_TYPES,
  CATEGORY_TO_CATALOG,
  MULTI_COMPONENT_CATEGORIES,
} from "./constants";
import { MAINT_TO_PART_CAT } from "./maintenanceView";

describe("DEFAULT_CATEGORIES · la lista base", () => {
  it("no tiene duplicados", () => {
    expect(new Set(DEFAULT_CATEGORIES).size).toBe(DEFAULT_CATEGORIES.length);
  });

  it("no tiene espacios sobrantes ni entradas vacías", () => {
    for (const c of DEFAULT_CATEGORIES) {
      expect(c).toBe(c.trim());
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it("incluye «Otros», que es el cajón por defecto cuando no calza nada", () => {
    expect(DEFAULT_CATEGORIES).toContain("Otros");
  });
});

describe("MAINT_TO_PART_CAT · el contrato que rompía el filtrado en silencio", () => {
  it("cada categoría que menciona EXISTE en DEFAULT_CATEGORIES", () => {
    // Si este test falla, alguien renombró una categoría y el filtrado de
    // mantenciones dejó de encontrarla. La app no daría ningún error: sólo
    // dejaría de avisar de esas mantenciones. Por eso está acá.
    for (const [familia, categorias] of Object.entries(MAINT_TO_PART_CAT)) {
      if (categorias === null) continue;
      for (const cat of categorias) {
        expect(
          DEFAULT_CATEGORIES,
          `MAINT_TO_PART_CAT.${familia} apunta a "${cat}", que ya no está en DEFAULT_CATEGORIES`
        ).toContain(cat);
      }
    }
  });

  it("las familias sin categorías usan null, no una lista vacía", () => {
    // null significa «aplica siempre». Una lista vacía significaría «nunca
    // aplica», que no es lo mismo y sería un error silencioso.
    for (const [familia, v] of Object.entries(MAINT_TO_PART_CAT)) {
      if (Array.isArray(v)) {
        expect(v.length, `${familia} tiene una lista vacía; debería ser null`).toBeGreaterThan(0);
      } else {
        expect(v, `${familia} debería ser null o una lista`).toBeNull();
      }
    }
  });
});

describe("MULTI_COMPONENT_CATEGORIES · dónde NO se avisa de pieza repetida", () => {
  it("todas existen en DEFAULT_CATEGORIES", () => {
    for (const c of MULTI_COMPONENT_CATEGORIES) {
      expect(DEFAULT_CATEGORIES, `"${c}" ya no está en DEFAULT_CATEGORIES`).toContain(c);
    }
  });

  it("Marco y Horquilla NO están: una bici lleva una sola de cada una", () => {
    // Es justo el caso que motivó el aviso de pieza duplicada.
    expect(MULTI_COMPONENT_CATEGORIES).not.toContain("Marco");
    expect(MULTI_COMPONENT_CATEGORIES).not.toContain("Horquilla");
  });

  it("Transmisión y Frenos SÍ están: llevan varias piezas por diseño", () => {
    expect(MULTI_COMPONENT_CATEGORIES).toContain("Transmisión");
    expect(MULTI_COMPONENT_CATEGORIES).toContain("Frenos");
  });
});

describe("CATEGORY_TO_CATALOG · el puente al vocabulario técnico", () => {
  it("sus claves existen en DEFAULT_CATEGORIES", () => {
    for (const cat of Object.keys(CATEGORY_TO_CATALOG)) {
      expect(DEFAULT_CATEGORIES, `"${cat}" ya no está en DEFAULT_CATEGORIES`).toContain(cat);
    }
  });

  it("ninguna categoría del catálogo se repite en dos familias", () => {
    // Si «cassette» apareciera en Transmisión y en Frenos, una pieza saldría
    // sugerida en las dos y no sabríamos cuál es la buena.
    const vistas = new Set();
    for (const lista of Object.values(CATEGORY_TO_CATALOG)) {
      for (const c of lista) {
        expect(vistas.has(c), `"${c}" está mapeada en más de una categoría`).toBe(false);
        vistas.add(c);
      }
    }
  });
});

describe("BIKE_TYPES", () => {
  it("no tiene duplicados y ninguno está vacío", () => {
    expect(new Set(BIKE_TYPES).size).toBe(BIKE_TYPES.length);
    for (const t of BIKE_TYPES) expect(t.trim().length).toBeGreaterThan(0);
  });
});
