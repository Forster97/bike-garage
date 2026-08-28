/**
 * lib/design.js — los tokens del sistema de diseño.
 *
 * Un solo lugar decide cómo se ve la app. Si un color, un radio o una altura
 * aparece dos veces en el código, uno de los dos se va a quedar atrás: pasó con
 * los botones, que se achicaron en el detalle de bici y quedaron distintos en
 * las otras ocho pantallas.
 *
 * LA REGLA: una pantalla no escribe `rgba(...)` ni medidas a mano. Toma de acá.
 *
 * Antes de esto había 655 valores rgba escritos a mano (152 distintos), 22
 * definiciones de botón repartidas en 9 archivos y 13 radios de borde para lo
 * que son tres tamaños.
 */

// ── COLOR ────────────────────────────────────────────────────────────────────

export const color = {
  // El fondo de todo. Casi negro, con un tinte azul.
  fondo: "#060910",

  // Superficies: capas sobre el fondo. Cuanto más alto, más "levantada".
  superficie: {
    baja: "rgba(255,255,255,0.03)",
    media: "rgba(255,255,255,0.04)",
    alta: "rgba(255,255,255,0.06)",
    hundida: "rgba(0,0,0,0.22)",   // campos de texto: se ven metidos, no salidos
    modal: "rgba(7,10,18,0.96)",
  },

  borde: {
    sutil: "rgba(255,255,255,0.07)",
    normal: "rgba(255,255,255,0.10)",
    fuerte: "rgba(255,255,255,0.14)",
  },

  // Texto. El número es cuánta atención pide, no un color distinto.
  texto: {
    fuerte: "rgba(255,255,255,0.92)",   // títulos, datos que importan
    normal: "rgba(255,255,255,0.75)",
    suave: "rgba(255,255,255,0.55)",    // metadatos, apoyo
    tenue: "rgba(255,255,255,0.35)",    // pistas, marcas de agua
    sobreAccion: "#0b1220",             // texto encima del lima
  },

  // ── El color de ACCIÓN ──
  // Lima. Solo para cosas que se tocan y hacen algo.
  accion: {
    base: "#84cc16",
    fuerte: "#a3e635",                     // hover
    tenue: "rgba(132,204,22,0.12)",        // fondos de acento
    borde: "rgba(132,204,22,0.30)",
  },

  // ── El color de IDENTIDAD ──
  // Índigo. Es de dónde viene el aire de la app: los glows del fondo, la ruta
  // activa, los avatares. No es un botón: es el ambiente.
  identidad: {
    base: "rgba(99,102,241,0.65)",
    tenue: "rgba(99,102,241,0.12)",
    borde: "rgba(99,102,241,0.25)",
  },

  // ── Los colores de ESTADO ──
  // Dicen cómo está algo. Nunca son un botón. Ver la regla de abajo.
  estado: {
    vencido: "rgba(239,68,68,0.90)",
    vencidoTenue: "rgba(239,68,68,0.08)",
    vencidoBorde: "rgba(239,68,68,0.25)",
    proximo: "rgba(251,191,36,0.90)",
    proximoTenue: "rgba(251,191,36,0.08)",
    proximoBorde: "rgba(251,191,36,0.25)",
    alDia: "rgba(34,197,94,0.85)",
    sinDatos: "rgba(255,255,255,0.30)",
  },
};

/**
 * ⚠️ LA REGLA QUE EVITA LA CONFUSIÓN VERDE
 *
 * El lima de acción (#84cc16) y el verde de "Al día" (#22c55e) son casi el
 * mismo color. Lo que los distingue NO es el tono, es la FORMA:
 *
 *    ACCIÓN  →  bloque relleno de lima, con texto oscuro.   [ Registrar ]
 *    ESTADO  →  nunca relleno. Un punto o texto de color.   ● Al día
 *
 * Si alguna vez un estado se dibuja como bloque verde relleno, o un botón se
 * dibuja como texto verde suelto, la regla se rompió y el usuario va a tocar
 * algo que no era un botón.
 */

// ── FORMA ────────────────────────────────────────────────────────────────────

export const radio = {
  sm: 10,   // marcas, elementos chicos
  md: 12,   // botones, campos
  lg: 16,   // tarjetas
  xl: 22,   // tarjetas grandes y modales
  full: 999,
};

export const espacio = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// ── TIPOGRAFÍA ───────────────────────────────────────────────────────────────

export const texto = {
  xs: 11,    // etiquetas en mayúsculas, marcas
  sm: 12,
  base: 13,  // el tamaño de los botones y los metadatos
  md: 14,
  lg: 16,    // nombres, títulos de tarjeta
  xl: 24,    // cifras que se leen de lejos
  peso: { normal: 500, medio: 600, fuerte: 800, maximo: 900 },
};

// ── TACTO ────────────────────────────────────────────────────────────────────
//
// Estas dos medidas no son estéticas: un objetivo más chico se falla con el
// pulgar. Vienen del rediseño móvil (PRD-11).

export const tacto = {
  minimo: 44,    // el piso absoluto de cualquier cosa que se toque
  comodo: 48,    // lo que se busca en las acciones principales
};

export const sombra = {
  suave: "0 10px 30px rgba(0,0,0,0.35)",
  fuerte: "0 25px 70px rgba(0,0,0,0.55)",
};

// ── RECETAS ──────────────────────────────────────────────────────────────────
//
// Combinaciones que se repiten. Son atajos sobre los tokens de arriba, no
// valores nuevos.

export const receta = {
  tarjeta: {
    borderRadius: radio.lg,
    border: `1px solid ${color.borde.normal}`,
    background: color.superficie.media,
    padding: espacio.lg,
  },
  campo: {
    minHeight: tacto.minimo,
    padding: `0 ${espacio.md}px`,
    borderRadius: radio.md,
    border: `1px solid ${color.borde.normal}`,
    background: color.superficie.hundida,
    color: color.texto.fuerte,
    fontSize: texto.md,
    outline: "none",
  },
};
