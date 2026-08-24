/**
 * lib/constants.js
 *
 * Constantes globales de la aplicación.
 * Centralizar aquí evita valores mágicos dispersos por el código.
 */

/** Tipos de bicicleta disponibles en el formulario de alta y edición. */
export const BIKE_TYPES = [
  "Ruta",
  "Gravel",
  "XC",
  "Trail",
  "Enduro",
  "Urbana",
  "E-Bike",
  "Dh",
  "Otra",
];

/**
 * Categorías de componentes que vienen por defecto en la app.
 * No pueden eliminarse, solo ocultarse.
 */
export const DEFAULT_CATEGORIES = [
  "Marco",
  "Horquilla",
  "Ruedas",
  "Neumáticos",
  "Transmisión",
  "Frenos",
  "Cockpit",
  "Sillín / Tija",
  "Accesorios",
  "Otros",
];

/**
 * Puente entre las categorías que ve el usuario (español, arriba) y las categorías
 * técnicas del catálogo maestro (`component_catalog.category`, en inglés).
 *
 * Una categoría del usuario puede abarcar varias del catálogo: "Frenos" incluye
 * tanto las manetas/calipers como los discos.
 *
 * Las categorías que no aparecen acá todavía no tienen cobertura en el catálogo;
 * en esos casos las sugerencias salen solo de los componentes del propio usuario.
 */
export const CATEGORY_TO_CATALOG = {
  "Transmisión": ["cassette", "chain", "crankset", "rear_derailleur"],
  "Frenos": ["brake", "rotor"],
};

/**
 * Categorías que por diseño llevan VARIAS piezas en la misma bici:
 * Transmisión tiene cassette, cadena, biela y cambio; Frenos tiene delantero,
 * trasero y discos; Ruedas y Neumáticos van de a dos.
 *
 * Agregar una segunda pieza acá es normal y NO se advierte.
 * En el resto (Marco, Horquilla, Sillín / Tija) una segunda pieza suele ser un
 * error de carga, así que se pide confirmación antes de guardar.
 */
export const MULTI_COMPONENT_CATEGORIES = [
  "Transmisión",
  "Frenos",
  "Ruedas",
  "Neumáticos",
  "Cockpit",
  "Accesorios",
  "Otros",
];
