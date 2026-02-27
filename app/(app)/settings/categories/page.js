"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

const DEFAULT_CATEGORIES = [
  "Frame",
  "Fork",
  "Wheelset",
  "Tires",
  "Drivetrain",
  "Brakes",
  "Cockpit",
  "Seat / Post",
  "Accessories",
  "Other",
];

const normalizeName = (s) => (s ?? "").trim();

export default function CategoriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [custom, setCustom] = useState([]);
  const [hidden, setHidden] = useState(() => new Set());

  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const visibleList = useMemo(() => {
    const customNames = custom.map((r) => r.name);
    const merged = [...DEFAULT_CATEGORIES, ...customNames];

    const unique = [];
    const seen = new Set();

    for (const name of merged) {
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      if (hidden.has(name)) continue;
      unique.push(name);
    }
    return unique;
  }, [custom, hidden]);

  const hiddenList = useMemo(() => {
    const all = [...DEFAULT_CATEGORIES, ...custom.map((r) => r.name)];
    const unique = [];
    const seen = new Set();

    for (const name of all) {
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      if (!hidden.has(name)) continue;
      unique.push(name);
    }

    for (const name of hidden) {
      if (seen.has(name)) continue;
      unique.push(name);
    }

    return unique;
  }, [custom, hidden]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.replace("/login");
        return;
      }

      if (cancelled) return;
      setEmail(data.user.email ?? "");

      const [{ data: customRows, error: customErr }, { data: hiddenRows, error: hiddenErr }] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id,name,created_at")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("category_hidden")
            .select("name")
            .eq("user_id", data.user.id),
        ]);

      if (cancelled) return;

      if (customErr) setErrorMsg(customErr.message);
      if (hiddenErr) setErrorMsg((prev) => prev || hiddenErr.message);

      setCustom(
        (customRows ?? [])
          .map((r) => ({ id: r.id, name: r.name }))
          .filter((r) => normalizeName(r.name).length > 0)
      );

      setHidden(new Set((hiddenRows ?? []).map((r) => r.name).filter(Boolean)));

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const addCustom = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const name = normalizeName(newName);
    if (!name) return;

    setSaving(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const exists = DEFAULT_CATEGORIES.includes(name) || custom.some((r) => r.name === name);
    if (exists) {
      setSaving(false);
      setNewName("");
      return;
    }

    const { data: row, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name })
      .select("id,name")
      .single();

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setCustom((prev) => [...prev, { id: row.id, name: row.name }]);
    setNewName("");
    setSaving(false);
  };

  const hideCategory = async (name) => {
    setErrorMsg("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) return router.replace("/login");

    const n = normalizeName(name);
    if (!n) return;

    setHidden((prev) => new Set([...prev, n]));

    const { error } = await supabase.from("category_hidden").insert({
      user_id: user.id,
      name: n,
    });

    if (error) {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(n);
        return next;
      });
      setErrorMsg(error.message);
    }
  };

  const unhideCategory = async (name) => {
    setErrorMsg("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) return router.replace("/login");

    const n = normalizeName(name);
    if (!n) return;

    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(n);
      return next;
    });

    const { error } = await supabase
      .from("category_hidden")
      .delete()
      .eq("user_id", user.id)
      .eq("name", n);

    if (error) {
      setHidden((prev) => new Set([...prev, n]));
      setErrorMsg(error.message);
    }
  };

  const deleteCustom = async (row) => {
    setErrorMsg("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) return router.replace("/login");

    setCustom((prev) => prev.filter((r) => r.id !== row.id));

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", row.id)
      .eq("user_id", user.id);

    if (error) {
      setCustom((prev) => [...prev, row]);
      setErrorMsg(error.message);
    }
  };

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
            <Link href="/garage" style={styles.headerLink}>
              Garage
            </Link>
            <Link href="/garage" style={styles.headerCta}>
              Volver
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
                <div style={styles.kicker}>Ajustes</div>
                <div style={styles.h1Like}>Categorías</div>
                <div style={styles.leadSmall}>
                  Administra qué categorías aparecen en tus componentes.
                </div>
              </div>

              <div style={styles.pillMuted}>{email || "—"}</div>
            </div>

            <div style={styles.trustRow}>
              <div style={styles.trustItem}>
                <div style={styles.trustValue}>{visibleList.length}</div>
                <div style={styles.trustLabel}>Visibles</div>
              </div>
              <div style={styles.trustDivider} />
              <div style={styles.trustItem}>
                <div style={styles.trustValue}>{hiddenList.length}</div>
                <div style={styles.trustLabel}>Ocultas</div>
              </div>
              <div style={styles.trustDivider} />
              <div style={styles.trustItem}>
                <div style={styles.trustValue}>{custom.length}</div>
                <div style={styles.trustLabel}>Personalizadas</div>
              </div>
            </div>
          </div>

          {errorMsg ? (
            <div style={{ ...styles.card, borderColor: "rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.08)" }}>
              <div style={styles.cardTitle}>Error</div>
              <div style={styles.cardText}>{errorMsg}</div>
            </div>
          ) : null}

          {/* Add custom */}
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={styles.cardTitle}>Agregar categoría</div>
                <div style={styles.cardText}>No se agregan duplicadas (incluye defaults).</div>
              </div>
              <div style={styles.previewPill}>Nuevo</div>
            </div>

            <form onSubmit={addCustom} style={styles.formRow}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Suspension"
                style={styles.input}
              />
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                style={{
                  ...styles.primaryBtn,
                  opacity: saving || !newName.trim() ? 0.6 : 1,
                }}
              >
                {saving ? "Guardando…" : "Agregar"}
              </button>
            </form>
          </div>

          {/* Visibles */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Visibles</div>
            <div style={styles.cardText}>Aparecen en tus selects.</div>

            {loading ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>Cargando…</div>
            ) : visibleList.length === 0 ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>
                No tienes categorías visibles.
              </div>
            ) : (
              <div style={styles.chipsWrap}>
                {visibleList.map((name) => (
                  <div key={`vis-${name}`} style={styles.chip}>
                    <span style={styles.chipText}>{name}</span>
                    <button onClick={() => hideCategory(name)} style={styles.chipBtn}>
                      Ocultar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ocultas */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Ocultas</div>
            <div style={styles.cardText}>No aparecerán en tus selects.</div>

            {hiddenList.length === 0 ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>
                No tienes categorías ocultas.
              </div>
            ) : (
              <div style={styles.chipsWrap}>
                {hiddenList.map((name) => (
                  <div key={`hid-${name}`} style={{ ...styles.chip, background: "rgba(255,255,255,0.06)" }}>
                    <span style={styles.chipText}>{name}</span>
                    <button onClick={() => unhideCategory(name)} style={styles.chipBtn}>
                      Mostrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personalizadas */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Personalizadas</div>
            <div style={styles.cardText}>Puedes ocultarlas o eliminarlas.</div>

            {custom.length === 0 ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>
                Aún no agregas categorías personalizadas.
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {custom.map((row) => {
                  const isHidden = hidden.has(row.name);
                  return (
                    <div key={row.id} style={styles.row}>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.rowTitle}>{row.name}</div>
                        <div style={styles.rowMeta}>{isHidden ? "Oculta" : "Visible"}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => (isHidden ? unhideCategory(row.name) : hideCategory(row.name))}
                          style={styles.secondaryBtn}
                        >
                          {isHidden ? "Mostrar" : "Ocultar"}
                        </button>
                        <button onClick={() => deleteCustom(row)} style={styles.dangerBtn}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.60)" }}>
              Nota: eliminar solo borra la categoría personalizada (no toca defaults).
            </div>
          </div>
        </section>
      </main>
    </div>
  );
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

  kicker: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 6 },

  h1Like: {
    fontSize: 22,
    fontWeight: 900,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.2,
    lineHeight: 1.1,
  },

  leadSmall: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.70)" },

  pillMuted: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.75)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    whiteSpace: "nowrap",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  trustRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  trustItem: { display: "flex", flexDirection: "column", gap: 2 },
  trustValue: { fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.92)" },
  trustLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  trustDivider: { width: 1, height: 26, background: "rgba(255,255,255,0.12)" },

  card: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  cardTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 6 },
  cardText: { color: "rgba(255,255,255,0.68)", lineHeight: 1.45 },

  formRow: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  input: {
    flex: 1,
    minWidth: 220,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "rgba(255,255,255,0.92)",
    padding: "12px 12px",
    outline: "none",
  },

  primaryBtn: {
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 900,
    color: "#0b1220",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.18)",
    cursor: "pointer",
  },

  secondaryBtn: {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.88)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
  },

  dangerBtn: {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(244,63,94,0.14)",
    border: "1px solid rgba(244,63,94,0.22)",
    cursor: "pointer",
  },

  chipsWrap: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 16,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  chipText: {
    fontWeight: 900,
    color: "rgba(255,255,255,0.90)",
  },

  chipBtn: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.90)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
  },

  previewPill: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.90)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.25)",
    whiteSpace: "nowrap",
  },

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

  rowTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)", lineHeight: 1.1 },
  rowMeta: { fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 2 },
};