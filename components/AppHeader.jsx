"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppHeader({ actions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Mobile-first: empieza en false (desktop), el useEffect corrige en desktop.
  // En mobile nunca cambia → no hay hydration mismatch.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

        {/* Logo + nombre */}
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

        {actions.length > 0 && (
          isDesktop ? (
            /* Desktop: acciones inline */
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              {actions}
            </div>
          ) : (
            /* Mobile: botón hamburger */
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: menuOpen ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.88)",
                borderRadius: 12,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )
        )}
      </div>

      {/* Menú desplegable mobile */}
      {!isDesktop && menuOpen && actions.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(7,10,18,0.97)",
            padding: "10px 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
          onClick={() => setMenuOpen(false)}
        >
          {actions.map((action, i) => (
            <div key={i}>{action}</div>
          ))}
        </div>
      )}
    </header>
  );
}
