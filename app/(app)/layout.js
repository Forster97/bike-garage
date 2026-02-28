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
  const isCategories = pathname?.startsWith("/settings/categories");

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

          {/* Nav + user (desktop) */}
          <div style={s.right}>
            <nav style={s.nav}>
              <Link href="/garage" style={{ ...s.navItem, ...(isGarage ? s.navItemActive : {}) }}>
                Garage
              </Link>
              <Link href="/settings/categories" style={{ ...s.navItem, ...(isCategories ? s.navItemActive : {}) }}>
                Categorías
              </Link>
            </nav>

            {email && (
              <div style={s.userChip} title={email}>
                <span style={s.onlineDot} />
                <span style={s.userChipText}>{userLabel}</span>
              </div>
            )}

            <button onClick={logout} style={s.logoutBtn}>Salir</button>
          </div>
        </div>

        {/* Mobile nav tabs */}
        <div style={s.mobileTabs}>
          <Link href="/garage" style={{ ...s.mobileTab, ...(isGarage ? s.mobileTabActive : {}) }}>
            Garage
          </Link>
          <Link href="/settings/categories" style={{ ...s.mobileTab, ...(isCategories ? s.mobileTabActive : {}) }}>
            Categorías
          </Link>
        </div>
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

  /* Mobile tabs - shown below header on small screens */
  mobileTabs: {
    display: "flex",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "0 16px",
  },
  mobileTab: {
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255,255,255,0.45)",
    padding: "10px 14px",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap",
  },
  mobileTabActive: {
    color: "rgba(255,255,255,0.90)",
    borderBottomColor: "rgba(99,102,241,0.7)",
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