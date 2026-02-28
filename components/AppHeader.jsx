"use client";

import Link from "next/link";

/**
 * AppHeader — barra superior compartida en toda la app.
 *
 * Props:
 *  - actions: array de nodos React (links, botones) para el lado derecho
 */
export default function AppHeader({ actions = [] }) {
  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(7,10,18,0.70)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3 px-4 py-3">
        {/* Brand */}
        <Link href="/garage" style={{ textDecoration: "none" }} className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold text-white"
            style={{
              background: "linear-gradient(135deg, rgb(99,102,241), rgb(34,197,94))",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            BG
          </div>
          <span className="font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
            Bike Garage
          </span>
        </Link>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
