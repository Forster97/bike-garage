"use client";

import { useEffect, useState } from "react";
import TapLink, { Pendiente } from "../../components/TapLink";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabaseClient";
import BackgroundGlow from "../../components/BackgroundGlow";
import { color, radio } from "../../lib/design";

export default function AppGroupLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) return router.replace("/login");
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return router.replace("/login");
      setEmail(data.user.email ?? "");
    };
    load();
  }, [router]);

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
  };

  const isGarage = pathname?.startsWith("/garage");
  const isMaintenance = pathname?.startsWith("/maintenance");
  const isCategories = pathname?.startsWith("/settings/categories");
  const isNotifications = pathname?.startsWith("/notifications");
  const isProfile = pathname?.startsWith("/settings/profile");

  const userLabel = email.length > 22 ? `${email.slice(0, 19)}…` : email;

  return (
    <div style={s.shell}>
      <BackgroundGlow />

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>

          {/* Brand */}
          <TapLink href="/garage" style={s.brand}>
            <div style={s.logo}>BG</div>
            <span style={s.brandName}>Bike Garage</span>
          </TapLink>

          {/* Desktop: nav + user */}
          <style>{`@media(max-width:639px){.desktop-right{display:none!important}}`}</style>
          <div className="desktop-right" style={s.right}>
            <nav style={s.nav}>
              <TapLink href="/garage" style={{ ...s.navItem, ...(isGarage ? s.navItemActive : {}) }}>Garage</TapLink>
              <TapLink href="/maintenance" style={{ ...s.navItem, ...(isMaintenance ? s.navItemActive : {}) }}>Mantenimiento</TapLink>
              <TapLink href="/notifications" style={{ ...s.navItem, ...(isNotifications ? s.navItemActive : {}) }}>Notificaciones</TapLink>
              <TapLink href="/settings/categories" style={{ ...s.navItem, ...(isCategories ? s.navItemActive : {}) }}>Categorías</TapLink>
            </nav>
            {email && (
              <TapLink href="/settings/profile" style={{ ...s.userChip, textDecoration: "none", ...(isProfile ? { borderColor: color.identidad.borde, background: color.identidad.tenue } : {}) }} title={email}>
                <span style={s.onlineDot} />
                <span style={s.userChipText}>{userLabel}</span>
              </TapLink>
            )}
            <button onClick={logout} style={s.logoutBtn}>Salir</button>
          </div>

        </div>
      </header>

      {/* ── Content ── */}
      <main style={s.main}>{children}</main>

      {/* ── PRD-11.2 · Barra de navegación móvil ──
           Cuatro destinos, siempre visibles, al alcance del pulgar.
           En pantalla grande no aparece: ahí sigue el menú de arriba. */}
      <style>{`
        @media(min-width:640px){ .bottom-nav{display:none!important} }
        @media(max-width:639px){ .bn-item:active{ background:${color.superficie.alta} } }
      `}</style>
      <nav className="bottom-nav" style={s.bottomNav} aria-label="Navegación principal">
        {[
          { href: "/garage", icon: "🚲", label: "Garage", activo: isGarage },
          { href: "/maintenance", icon: "🔧", label: "Mantención", activo: isMaintenance },
          { href: "/notifications", icon: "🔔", label: "Alertas", activo: isNotifications },
          { href: "/settings/profile", icon: "👤", label: "Perfil", activo: isProfile || isCategories },
        ].map((it) => (
          <TapLink
            key={it.href}
            href={it.href}
            className="bn-item"
            sinIndicador
            aria-current={it.activo ? "page" : undefined}
            style={{ ...s.bnItem, ...(it.activo ? s.bnItemActive : {}) }}
          >
            {/* La ruedita toma el lugar del ícono: la barra no se mueve */}
            <span style={s.bnIcon} aria-hidden><Pendiente tam={17}>{it.icon}</Pendiente></span>
            <span style={s.bnLabel}>{it.label}</span>
          </TapLink>
        ))}
      </nav>
    </div>
  );
}

const s = {
  shell: {
    minHeight: "100vh",
    background: "#060910",
    color: color.texto.fuerte,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: `1px solid ${color.borde.sutil}`,
    backdropFilter: "blur(16px)",
    background: color.superficie.header,
  },
  headerInner: {
    maxWidth: 1020,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radio.sm,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 11,
    color: "white",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    boxShadow: `0 0 20px ${color.identidad.base}, 0 2px 8px rgba(0,0,0,0.4)`,
    letterSpacing: "-0.5px",
    flexShrink: 0,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 15,
    color: color.texto.fuerte,
    letterSpacing: "-0.3px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    // hide on mobile
    "@media(max-width:640px)": { display: "none" },
  },
  navItem: {
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    color: color.texto.suave,
    padding: "7px 12px",
    borderRadius: radio.sm,
    whiteSpace: "nowrap",
  },
  navItemActive: {
    color: color.texto.fuerte,
    background: color.superficie.alta,
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: radio.full,
    border: `1px solid ${color.borde.normal}`,
    background: color.superficie.media,
  },
  onlineDot: {
    display: "block",
    width: 6,
    height: 6,
    borderRadius: radio.full,
    background: "rgb(34,197,94)",
    boxShadow: `0 0 6px ${color.estado.alDia}`,
    flexShrink: 0,
  },
  userChipText: {
    fontSize: 12,
    color: color.texto.suave,
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    // hide on small mobile
  },
  logoutBtn: {
    border: `1px solid ${color.borde.normal}`,
    background: color.superficie.media,
    color: color.texto.suave,
    cursor: "pointer",
    borderRadius: radio.sm,
    padding: "7px 13px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  // ── PRD-11.2 · barra de navegación móvil ──
  bottomNav: {
    position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    borderTop: `1px solid ${color.borde.normal}`,
    background: color.superficie.barra,
    backdropFilter: "blur(12px)",
    // Deja libre el indicador de inicio del iPhone
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  bnItem: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 3, minHeight: 58, textDecoration: "none",
    color: color.texto.tenue, transition: "color .15s",
  },
  bnItemActive: { color: color.texto.fuerte },
  bnIcon: { fontSize: 19, lineHeight: 1 },
  bnLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.01em" },

  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1020,
    margin: "0 auto",
    // El espacio de abajo deja pasar la barra de navegación móvil (PRD-11.2).
    // En pantalla grande la barra no existe, pero el margen no molesta.
    padding: "24px 20px calc(96px + env(safe-area-inset-bottom, 0px))",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
};