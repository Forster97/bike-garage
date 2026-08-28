"use client";

/**
 * Badge — una marca de ESTADO. Dice cómo está algo; nunca se toca.
 *
 * Ojo con la regla del verde (ver lib/design.js): el lima de acción y el verde
 * de "al día" son casi el mismo color, y lo que los distingue es la forma. Por
 * eso esta marca no es un bloque relleno: es un punto y un texto.
 */

import { color, texto } from "../lib/design";

const colores = {
  vencido: color.estado.vencido,
  proximo: color.estado.proximo,
  alDia: color.estado.alDia,
  sinDatos: color.estado.sinDatos,
};

export default function Badge({ nivel = "sinDatos", children, punto = true, style }) {
  const c = colores[nivel] ?? colores.sinDatos;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: texto.sm,
        fontWeight: texto.peso.medio,
        color: c,
        ...style,
      }}
    >
      {punto && (
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }}
        />
      )}
      {children}
    </span>
  );
}
