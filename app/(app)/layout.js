"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabaseClient";
import BackgroundGlow from "../../components/BackgroundGlow";

export default function AppGroupLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link href="/garage" style={s.brand}>
            <div style={s.logo}>BG</div>
            <span style={s.brandName}>Bike Garage</span>
          </Link>

          {/* Desktop: nav + user */}
          <style>{`@media(max-width:639px){.desktop-right{display:none!important}}`}</style>
          <div className="desktop-right" style={s.right}>
            <nav style={s.nav}>
              <Link href="/garage" style={{ ...s.navItem, ...(isGarage ? s.navItemActive : {}) }}>Garage</Link>
              <Link href="/maintenance" style={{ ...s.navItem, ...(isMaintenance ? s.navItemActive : {}) }}>Mantenimiento</Link>
              <Link href="/notifications" style={{ ...s.navItem, ...(isNotifications ? s.navItemActive : {}) }}>Notificaciones</Link>
              <Link href="/settings/categories" style={{ ...s.navItem, ...(isCategories ? s.navItemActive : {}) }}>Categorías</Link>
            </nav>
            {email && (
              <Link href="/settings/profile" style={{ ...s.userChip, textDecoration: "none", ...(isProfile ? { borderColor: "rgba(99,102,241,0.40)", background: "rgba(99,102,241,0.10)" } : {}) }} title={email}>
                <span style={s.onlineDot} />
                <span style={s.userChipText}>{userLabel}</span>
              </Link>
            )}
            <button onClick={logout} style={s.logoutBtn}>Salir</button>
          </div>

          {/* Mobile: hamburger */}
          <style>{`@media(min-width:640px){.mobile-hamburger{display:none!important}}`}</style>
          <button
            className="mobile-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            style={s.hamburgerBtn}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile dropdown — visible solo en mobile cuando está abierto */}
        {menuOpen && (
          <div style={s.mobileMenu} onClick={() => setMenuOpen(false)}>
            <Link href="/garage" style={{ ...s.mobileMenuItem, ...(isGarage ? s.mobileMenuItemActive : {}) }}>Garage</Link>
            <Link href="/maintenance" style={{ ...s.mobileMenuItem, ...(isMaintenance ? s.mobileMenuItemActive : {}) }}>Mantenimiento</Link>
            <Link href="/notifications" style={{ ...s.mobileMenuItem, ...(isNotifications ? s.mobileMenuItemActive : {}) }}>Notificaciones</Link>
            <Link href="/settings/categories" style={{ ...s.mobileMenuItem, ...(isCategories ? s.mobileMenuItemActive : {}) }}>Categorías</Link>
            <Link href="/settings/profile" style={{ ...s.mobileMenuItem, ...(isProfile ? s.mobileMenuItemActive : {}) }}>Perfil</Link>
            <div style={s.mobileMenuDivider} />
            {email && <div style={s.mobileMenuEmail}>{userLabel}</div>}
            <button onClick={logout} style={s.mobileMenuLogout}>Salir</button>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main style={s.main}>{children}</main>
    </div>
  );
}

const s = {
  shell: {
    minHeight: "100vh",
    background: "#060910",
    color: "rgba(255,255,255,0.90)",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(16px)",
    background: "rgba(6,9,16,0.80)",
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
    borderRadius: 9,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 11,
    color: "white",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    boxShadow: "0 0 20px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.4)",
    letterSpacing: "-0.5px",
    flexShrink: 0,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 15,
    color: "rgba(255,255,255,0.90)",
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
    color: "rgba(255,255,255,0.50)",
    padding: "7px 12px",
    borderRadius: 9,
    whiteSpace: "nowrap",
  },
  navItemActive: {
    color: "rgba(255,255,255,0.90)",
    background: "rgba(255,255,255,0.07)",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  },
  onlineDot: {
    display: "block",
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgb(34,197,94)",
    boxShadow: "0 0 6px rgba(34,197,94,0.7)",
    flexShrink: 0,
  },
  userChipText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    // hide on small mobile
  },
  logoutBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.60)",
    cursor: "pointer",
    borderRadius: 9,
    padding: "7px 13px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  hamburgerBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.90)",
    borderRadius: 10,
    padding: "7px 13px",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 900,
  },
  mobileMenu: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(6,9,16,0.98)",
    padding: "8px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  mobileMenuItem: {
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 500,
    color: "rgba(255,255,255,0.65)",
    padding: "12px 8px",
    borderRadius: 8,
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  mobileMenuItemActive: {
    color: "rgba(255,255,255,0.95)",
    background: "rgba(99,102,241,0.10)",
  },
  mobileMenuDivider: {
    height: 1,
    background: "rgba(255,255,255,0.07)",
    margin: "8px 0",
  },
  mobileMenuEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    padding: "4px 8px",
  },
  mobileMenuLogout: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.60)",
    cursor: "pointer",
    borderRadius: 9,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "left",
    marginTop: 4,
  },

  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1020,
    margin: "0 auto",
    padding: "24px 20px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
};