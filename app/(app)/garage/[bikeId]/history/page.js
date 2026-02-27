"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

export default function BikeHistoryPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [bike, setBike] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.replace("/login");

      const { data: bikeData } = await supabase
        .from("bikes")
        .select("*")
        .eq("id", bikeId)
        .single();

      const { data: logsData } = await supabase
        .from("part_logs")
        .select("*")
        .eq("bike_id", bikeId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      setBike(bikeData || null);
      setLogs(logsData || []);
      setLoading(false);
    };

    if (bikeId) load();

    return () => {
      cancelled = true;
    };
  }, [bikeId, router]);

  const grouped = useMemo(() => groupLogsByDay(logs), [logs]);

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} aria-hidden="true" />

      {/* Header (igual a landing) */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <div style={styles.logo} aria-hidden="true">
              BG
            </div>
            <div>
              <div style={styles.brandName}>Bike Garage</div>
              <div style={styles.brandTag}>Tu garage digital</div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <Link href={`/garage/${bikeId}`} style={styles.headerLink}>
              Volver
            </Link>
            <Link href="/settings/categories" style={styles.headerCta}>
              Categorías
            </Link>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          {/* Hero card */}
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <div style={styles.kicker}>Historial</div>
                <div style={styles.h1Like}>Cambios de componentes</div>
                <div style={styles.leadSmall}>
                  {bike?.name ? `Bici: ${bike.name}` : "—"}
                </div>
              </div>

              <div style={styles.pillMuted}>
                {logs.length} evento{logs.length === 1 ? "" : "s"}
              </div>
            </div>

            <div style={styles.helperRow}>
              <div style={styles.helperDot} />
              <div style={styles.helperText}>
                Aquí verás cuando creas, editas o eliminas componentes.
              </div>
            </div>
          </div>

          {loading ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Cargando…</div>
              <div style={styles.cardText}>Preparando historial.</div>
            </div>
          ) : logs.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Aún no hay historial</div>
              <div style={styles.cardText}>
                Cuando crees/edites/eliminés componentes, aparecerán los registros aquí.
              </div>
            </div>
          ) : (
            <div style={styles.list}>
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day} style={styles.dayBlock}>
                  <div style={styles.dayTitle}>{day}</div>

                  <div style={styles.dayList}>
                    {items.map((l) => (
                      <div key={l.id} style={styles.row}>
                        <div style={styles.rowLeft}>
                          <div style={styles.rowTitle}>{labelAction(l.action)}</div>
                          <div style={styles.rowMeta}>
                            {new Date(l.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <div style={styles.rowRight}>
                          <div style={styles.delta}>{formatDelta(l.old_weight_g, l.new_weight_g)}</div>
                          <div style={styles.weights}>{formatWeights(l.old_weight_g, l.new_weight_g)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function labelAction(a) {
  if (a === "created") return "Componente creado";
  if (a === "updated") return "Componente actualizado";
  if (a === "deleted") return "Componente eliminado";
  return a || "Evento";
}

function formatDelta(oldW, newW) {
  const o = oldW == null ? null : Number(oldW);
  const n = newW == null ? null : Number(newW);

  if (o == null && n == null) return "—";
  if (o == null && n != null) return `+${n} g`;
  if (o != null && n == null) return `-${o} g`;

  const d = n - o;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d} g`;
}

function formatWeights(oldW, newW) {
  const o = oldW == null ? "—" : `${oldW} g`;
  const n = newW == null ? "—" : `${newW} g`;
  return `${o} → ${n}`;
}

function groupLogsByDay(logs) {
  const map = new Map();
  for (const l of logs) {
    const d = new Date(l.created_at);
    const key = d.toLocaleDateString();
    map.set(key, [...(map.get(key) || []), l]);
  }
  return Object.fromEntries(map.entries());
}

/* =========================
   Styles (same as landing)
========================= */

const styles = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    minHeight: "100vh",
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
  headerCta: {
    color: "#0b1220",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.92)",
  },
  main: { position: "relative", zIndex: 1 },
  section: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    padding: 14,
  },
  heroTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 6,
  },
  h1Like: {
    fontSize: 22,
    fontWeight: 900,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.2,
    lineHeight: 1.1,
  },
  leadSmall: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
  },
  pillMuted: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.75)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    whiteSpace: "nowrap",
  },

  helperRow: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.10)",
  },
  helperDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(99,102,241,0.70)",
    marginTop: 3,
    flexShrink: 0,
  },
  helperText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.45,
  },

  card: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  cardTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 6 },
  cardText: { color: "rgba(255,255,255,0.68)", lineHeight: 1.45 },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  dayBlock: { display: "flex", flexDirection: "column", gap: 10 },
  dayTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  dayList: { display: "flex", flexDirection: "column", gap: 10 },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 16,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  rowLeft: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  rowTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)", lineHeight: 1.1 },
  rowMeta: { fontSize: 12, color: "rgba(255,255,255,0.60)" },
  rowRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: 2 },
  delta: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  weights: { fontSize: 12, color: "rgba(255,255,255,0.60)" },
};