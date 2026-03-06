"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AppHeader({ actions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const headerRef = useRef(null);
  const [menuTop, setMenuTop] = useState(0);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Calcula dónde termina el header para posicionar el menú justo debajo
  useEffect(() => {
    if (menuOpen && headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setMenuTop(rect.bottom);
    }
  }, [menuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b"
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
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: menuOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.90)",
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
      </header>

      {/* Menú mobile — fixed sobre el contenido, justo debajo del header */}
      {!isDesktop && menuOpen && actions.length > 0 && (
        <>
          {/* Overlay para cerrar al tocar fuera */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 38,
            }}
          />
          {/* Panel del menú */}
          <div
            style={{
              position: "fixed",
              top: menuTop,
              left: 0,
              right: 0,
              zIndex: 39,
              background: "rgba(7,10,18,0.98)",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              padding: "10px 20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={() => setMenuOpen(false)}
          >
            {actions.map((action, i) => (
              <div key={i} style={{ padding: "4px 0" }}>
                {action}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
