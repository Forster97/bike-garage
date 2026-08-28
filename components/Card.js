"use client";

/**
 * Card — la caja en la que vive casi todo el contenido.
 */

import { color, radio, espacio, receta } from "../lib/design";

export default function Card({ children, tono = "normal", style, ...props }) {
  const tonos = {
    normal: {},
    // Para zonas de las que uno se puede arrepentir.
    peligro: {
      border: `1px solid ${color.estado.vencidoBorde}`,
      background: color.estado.vencidoTenue,
    },
    // Para algo que pide atención sin ser un error.
    aviso: {
      border: `1px solid ${color.estado.proximoBorde}`,
      background: color.estado.proximoTenue,
    },
  };

  return (
    <div
      style={{
        ...receta.tarjeta,
        display: "flex",
        flexDirection: "column",
        gap: espacio.md,
        // Sin esto, un nombre largo empuja la tarjeta fuera de la pantalla
        // en un teléfono (BG-040).
        minWidth: 0,
        borderRadius: radio.lg,
        ...(tonos[tono] ?? {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
