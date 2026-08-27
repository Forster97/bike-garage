"use client";

/**
 * Un pop-up que se comporta como pop-up.
 *
 * BG-042: los modales se dibujaban dentro del contenido de la página. Como el
 * `<main>` del layout tiene su propio contexto de apilamiento (`position:
 * relative; z-index: 1`), subirle el z-index al modal no servía de nada: la
 * barra de navegación de abajo y el header quedaban ENCIMA del pop-up. Y como
 * el fondo seguía siendo scrolleable, el dedo movía la página de atrás en vez
 * del contenido del modal.
 *
 * Este componente resuelve las tres cosas de una vez:
 *   · se monta en el <body> con un portal, así escapa de cualquier contexto
 *   · bloquea el scroll de atrás mientras está abierto
 *   · el contenido tiene su propia altura y su propio scroll, con las áreas
 *     seguras del teléfono respetadas
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = 720,
  zIndex = 1000,
  padding = 14,
  labelledBy,
  // `unstyled` entrega solo el portal, el bloqueo de scroll y Escape. El
  // contenido trae su propio diseño — lo usa la hoja de registrar mantención,
  // que sube desde abajo y no debe verse como una caja centrada.
  unstyled = false,
}) {
  // Bloquea el scroll del fondo. Guarda el valor previo por si algo más lo tocó.
  useEffect(() => {
    if (!open) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [open]);

  // Escape cierra, que es lo que espera cualquiera con un teclado.
  useEffect(() => {
    if (!open || !onClose) return;
    const alTeclear = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [open, onClose]);

  // En el servidor no hay document: el portal solo existe en el navegador.
  if (!open || typeof document === "undefined") return null;

  if (unstyled) return createPortal(children, document.body);

  return createPortal(
    <div
      style={{ ...estilos.wrap, zIndex }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        style={{ ...estilos.caja, maxWidth, padding }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

const estilos = {
  wrap: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.60)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // El padding usa las áreas seguras: en un iPhone el modal no queda debajo
    // de la muesca ni del indicador de inicio.
    padding: "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))",
    overscrollBehavior: "contain",
  },
  caja: {
    position: "relative",
    width: "100%",
    // Nunca más alto que la pantalla: lo que sobre, scrollea adentro.
    maxHeight: "100%",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(7,10,18,0.96)",
    boxShadow: "0 25px 70px rgba(0,0,0,0.55)",
    padding: 14,
  },
};
