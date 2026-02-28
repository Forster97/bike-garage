"use client";

// AppHeader — barra superior compartida en las páginas internas de la app.
// Muestra el logo "BG" + nombre de la app a la izquierda,
// y las acciones (links, botones) que cada página quiera mostrar a la derecha.
//
// Props:
//   actions — array de nodos React (ej: [<Link>, <button>]) para el lado derecho del header.
//             Cada página decide qué poner ahí (botón de salir, link al historial, etc.)
import Link from "next/link";

export default function AppHeader({ actions = [] }) {
  return (
    <header
      className="sticky top-0 z-20 border-b" // sticky: se queda fijo al hacer scroll. z-20: queda encima del contenido
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(7,10,18,0.70)",   // fondo semitransparente oscuro
        backdropFilter: "blur(10px)",        // efecto de vidrio esmerilado
      }}
    >
      <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3 px-4 py-3">

        {/* Logo + nombre de la app — siempre lleva al garage */}
        <Link href="/garage" style={{ textDecoration: "none" }} className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold text-white"
            style={{
              background: "linear-gradient(135deg, rgb(99,102,241), rgb(34,197,94))", // gradiente morado → verde
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            BG
          </div>
          <span className="font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Bike Garage
          </span>
        </Link>

        {/* Acciones del lado derecho — solo se renderizan si se pasaron */}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
