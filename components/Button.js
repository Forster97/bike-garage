"use client";

/**
 * Button — el único botón de la app.
 *
 * Antes había 22 definiciones de botón repartidas en 9 archivos. Por eso
 * achicar "los botones" en una pantalla dejó los de las otras ocho distintos.
 *
 * Variantes:
 *   accion     lima relleno, texto oscuro — LA acción de la pantalla
 *   secundario borde tenue — alternativas
 *   fantasma   casi invisible — acciones menores
 *   peligro    rojo — borrar cosas
 *
 * Todos miden al menos 44px de alto: un objetivo más chico se falla con el
 * pulgar (PRD-11). `grande` los sube a 48 para la acción principal.
 */

import { color, radio, texto, tacto, espacio } from "../lib/design";
import Cargando from "./Cargando";

const variantes = {
  accion: {
    border: 0,
    background: color.accion.base,
    color: color.texto.sobreAccion,
  },
  secundario: {
    border: `1px solid ${color.borde.fuerte}`,
    background: color.superficie.alta,
    color: color.texto.fuerte,
  },
  fantasma: {
    border: `1px solid ${color.borde.normal}`,
    background: color.superficie.baja,
    color: color.texto.normal,
  },
  peligro: {
    border: `1px solid ${color.estado.vencidoBorde}`,
    background: color.estado.vencidoTenue,
    color: color.estado.vencido,
  },
};

export default function Button({
  children,
  variant = "secundario",
  grande = false,
  ancho = false,
  // Mientras `cargando`, el botón muestra la misma ruedita que el resto de la
  // app y deja de aceptar toques: nadie envía dos veces el mismo formulario.
  cargando = false,
  disabled,
  style,
  ...props
}) {
  return (
    <button
      disabled={disabled || cargando}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: espacio.sm,
        minHeight: grande ? tacto.comodo : tacto.minimo,
        padding: `0 ${grande ? espacio.lg : espacio.md}px`,
        width: ancho ? "100%" : undefined,
        borderRadius: radio.md,
        fontSize: texto.base,
        fontWeight: texto.peso.fuerte,
        // El texto de un botón nunca se parte ni se corta: así se leía "Quita"
        // en vez de "Quitar" (BG-041).
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !cargando ? 0.45 : 1,
        transition: "filter .15s, opacity .15s",
        ...(variantes[variant] ?? variantes.secundario),
        ...style,
      }}
      {...props}
    >
      {cargando && <Cargando tam={15} />}
      {children}
    </button>
  );
}
