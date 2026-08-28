"use client";

/**
 * Input — campo de texto del sistema.
 * Acepta todas las props de un <input> normal.
 */

import { receta } from "../lib/design";

export default function Input({ style, ...props }) {
  return <input style={{ ...receta.campo, width: "100%", ...style }} {...props} />;
}
