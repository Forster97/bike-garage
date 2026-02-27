"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function GaragePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [newBikeName, setNewBikeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const userLabel = useMemo(() => {
    const email = user?.email || "";
    return email.length > 26 ? `${email.slice(0, 22)}…` : email;
  }, [user]);

  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("refreshBikes error:", error);
      alert(error.message);
      return;
    }

    setBikes(data || []);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!data?.user) {
          router.replace("/login");
          return;
        }

        if (cancelled) return;
        setUser(data.user);

        await refreshBikes(data.user.id);
      } catch (err) {
        console.error("Garage load crash:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const addBike = async () => {
    const name = newBikeName.trim();
    if (!name || adding) return;

    try {
      setAdding(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;

      if (userErr || !uid) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("bikes")
        .insert([{ name, user_id: uid }]);
      if (error) throw error;

      setNewBikeName("");
      await refreshBikes(uid);
    } catch (err) {
      console.error("addBike error:", err);
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
  };

  const deleteBike = async (bikeId) => {
    const ok = confirm(
      "¿Eliminar esta bicicleta? Esto también eliminará sus componentes."
    );
    if (!ok) return;

    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) return alert(error.message);

    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  return (
    <div style={styles.page}>
      {/* Background glow (igual a landing) */}
      <div style={styles.bgGlow} aria-hidden="true" />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={styles.logo} aria-hidden="true">
                BG
              </div>
            </Link>
            <div>
              <div style={styles.brandName}>Bike Garage</div>
              <div style={styles.brandTag}>Tu garage digital</div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <Link href="/settings/categories" style={styles.headerLink}>
              Categorías
            </Link>

            {user?.email ? (
              <div
                className="userChipHideMobile"
                style={styles.userChip}
                title={user?.email}
              >
                <span style={styles.userDot} aria-hidden="true" />
                <span style={styles.userText}>{userLabel}</span>
                <style jsx>{`
                  @media (max-width: 520px) {
                    .userChipHideMobile {
                      display: none !important;
                    }
                  }
                `}</style>
              </div>
            ) : null}

            <button onClick={logout} style={styles.headerGhostBtn}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroTopRow}>
            <div>
              <h1 style={styles.h1}>Tu Garage</h1>
              <p style={styles.lead}>
                Crea tus bicicletas y entra a cada una para registrar componentes
                y pesos.
              </p>
            </div>

            <div style={styles.quickPill} aria-label="Resumen">
              <div style={styles.quickPillTop}>
                <div style={styles.quickValue}>{bikes.length}</div>
                <div style={styles.quickLabel}>Bicis</div>
              </div>
              <div style={styles.quickSub}>Todo ordenado, sin Excel</div>
            </div>
          </div>

          {/* Add bike card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>Agregar bicicleta</div>
                <div style={styles.cardText}>
                  Ej: Orbea Terra / Diverge / Gambler
                </div>
              </div>
              <div style={styles.cardBadge}>Nuevo</div>
            </div>

            <div style={styles.addRow}>
              <input
                value={newBikeName}
                onChange={(e) => setNewBikeName(e.target.value)}
                placeholder="Nombre de la bicicleta"
                style={styles.input}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addBike();
                }}
              />

              {/* Placeholder color (solo esta vista) */}
              <style jsx>{`
                input::placeholder {
                  color: rgba(255, 255, 255, 0.45);
                }
              `}</style>

              <button
                onClick={addBike}
                disabled={!newBikeName.trim() || adding}
                style={{
                  ...styles.primaryBtn,
                  opacity: !newBikeName.trim() || adding ? 0.55 : 1,
                  cursor:
                    !newBikeName.trim() || adding ? "not-allowed" : "pointer",
                }}
              >
                {adding ? "Agregando..." : "Agregar"}
              </button>
            </div>

            <div style={styles.tipRow}>
              <div style={styles.tipDot} aria-hidden="true" />
              <div style={styles.tipText}>
                Tip: después podrás agregar tipo, año, talla y notas dentro de la
                bici.
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={styles.skeletonCard} aria-hidden="true">
                  <div style={styles.skelLine1} />
                  <div style={styles.skelLine2} />
                  <div style={styles.skelBtn} />
                </div>
              ))}
            </div>
          ) : bikes.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>✨</div>
              <div style={styles.emptyTitle}>No tienes bicicletas aún</div>
              <div style={styles.emptyText}>
                Agrega tu primera bici arriba para empezar.
              </div>

              <div style={{ height: 10 }} />

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={styles.emptyMini}
              >
                Próximamente: mantenimiento + recordatorios
              </a>
            </div>
          ) : (
            <div style={styles.bikeGrid}>
              {bikes.map((bike) => (
                <div key={bike.id} style={styles.bikeCard}>
                  <div style={styles.bikeHeader}>
                    <Link href={`/garage/${bike.id}`} style={styles.bikeLinkArea}>
                      <div style={styles.bikeLeft}>
                        <div style={styles.bikeAvatar}>
                          {(bike.name || "B").slice(0, 1).toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={styles.bikeName}>{bike.name}</div>
                          <div style={styles.bikeMeta}>
                            Creada:{" "}
                            {new Date(bike.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => deleteBike(bike.id)}
                      style={styles.iconBtn}
                      aria-label="Eliminar bicicleta"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>

                  <div style={styles.bikeDivider} />

                  <Link
                    href={`/garage/${bike.id}`}
                    style={styles.bikeFooterLink}
                  >
                    Toca para ver detalles
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <div style={styles.footerBrand}>
              <div style={styles.logoSmall} aria-hidden="true">
                BG
              </div>
              <div>
                <div style={styles.footerName}>Bike Garage</div>
                <div style={styles.footerText}>Construido para ciclistas</div>
              </div>
            </div>

            <div style={styles.footerLinks}>
              <Link href="/" style={styles.footerLink}>
                Inicio
              </Link>
              <Link href="/settings/categories" style={styles.footerLink}>
                Categorías
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* =========================
   Styles
========================= */

const styles = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    minHeight: "100vh",
    color: "rgba(255,255,255,0.92)",
    background: "#070A12",
  },

  bgGlow: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(800px 400px at 20% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 100% 20%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(600px 300px at 50% 100%, rgba(59,130,246,0.10), transparent 55%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backdropFilter: "blur(10px)",
    background: "rgba(7,10,18,0.70)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  headerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brand: { display: "flex", alignItems: "center", gap: 10 },

  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "white",
    background:
      "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,1))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },

  brandName: { fontWeight: 700, color: "rgba(255,255,255,0.95)" },
  brandTag: { fontSize: 12, color: "rgba(255,255,255,0.60)" },

  headerActions: { display: "flex", alignItems: "center", gap: 10 },

  headerLink: {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14,
    padding: "10px 10px",
    borderRadius: 12,
  },

  headerGhostBtn: {
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: 800,
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
  },

  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
  },

  userDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "rgba(34,197,94,0.9)",
  },

  userText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  main: { position: "relative", zIndex: 1 },

  hero: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  heroTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  h1: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.05,
    letterSpacing: -0.6,
    color: "rgba(255,255,255,0.96)",
  },

  lead: {
    margin: "8px 0 0",
    fontSize: 14,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.70)",
    maxWidth: 680,
  },

  quickPill: {
    borderRadius: 16,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    minWidth: 170,
  },

  quickPillTop: { display: "flex", alignItems: "baseline", gap: 8 },
  quickValue: { fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.92)" },
  quickLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  quickSub: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.60)" },

  card: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    transition: "all 0.2s ease",
    boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  cardTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  cardText: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.65)" },

  cardBadge: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.90)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.25)",
    whiteSpace: "nowrap",
  },

  addRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  input: {
    flex: 1,
    minWidth: 220,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontSize: 14,
    caretColor: "rgba(255,255,255,0.92)",
  },

  primaryBtn: {
    border: 0,
    fontWeight: 900,
    padding: "12px 14px",
    borderRadius: 14,
    color: "#0b1220", // ✅ texto oscuro (botón claro)
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))",
    boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
    minWidth: 130,
  },

  tipRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
  },

  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "rgba(99,102,241,0.75)",
  },

  tipText: { lineHeight: 1.4 },

  grid: {
    marginTop: 4,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },

  empty: {
    padding: "18px 14px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "center",
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 10px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 18,
    fontWeight: 900,
  },

  emptyTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  emptyText: { marginTop: 6, color: "rgba(255,255,255,0.68)", fontSize: 13 },

  emptyMini: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },

  skeletonCard: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  skelLine1: {
    height: 14,
    width: "70%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
  },

  skelLine2: {
    height: 12,
    width: "45%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    marginTop: 10,
  },

  skelBtn: {
    height: 40,
    width: "100%",
    borderRadius: 14,
    background: "rgba(255,255,255,0.10)",
    marginTop: 14,
  },

  bikeGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  bikeCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },

  bikeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
  },

  bikeLinkArea: {
    textDecoration: "none",
    flex: 1,
    minWidth: 0,
  },

  bikeLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  bikeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(255,255,255,0.10)",
    flexShrink: 0,
  },

  bikeName: {
    fontWeight: 900,
    fontSize: 20,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  bikeMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.85)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },

  bikeDivider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
  },

  bikeFooterLink: {
    display: "block",
    padding: "12px 14px",
    textDecoration: "none",
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
  },

  footer: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(7,10,18,0.70)",
    marginTop: 10,
  },

  footerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  footerBrand: { display: "flex", alignItems: "center", gap: 10 },

  logoSmall: {
    width: 32,
    height: 32,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 12,
    color: "white",
    background:
      "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,1))",
  },

  footerName: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  footerText: { fontSize: 12, color: "rgba(255,255,255,0.60)" },

  footerLinks: { display: "flex", gap: 12, alignItems: "center" },

  footerLink: {
    color: "rgba(255,255,255,0.72)",
    textDecoration: "none",
    fontSize: 14,
    padding: "10px 10px",
    borderRadius: 12,
  },
};