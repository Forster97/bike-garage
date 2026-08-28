"use client";

/**
 * Cargando — el único indicador de espera de la app.
 *
 * Aparece en cuanto tocas algo que va a tardar. No hace que la app sea más
 * rápida: hace que se note que respondió. Sin esto, un toque que tarda medio
 * segundo se siente como un toque que no funcionó, y la gente vuelve a tocar.
 *
 * Hereda el color de donde esté (`currentColor`), así sirve igual dentro de un
 * botón lima que sobre el fondo oscuro.
 */

import { color } from "../lib/design";

export default function Cargando({ tam = 16, grosor = 2, style }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      style={{
        display: "inline-block",
        width: tam,
        height: tam,
        borderRadius: 999,
        border: `${grosor}px solid ${color.borde.fuerte}`,
        borderTopColor: "currentColor",
        animation: "bg-girar 0.7s linear infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
