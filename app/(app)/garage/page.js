"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function GaragePage() {
  const router = useRouter();

  const [bikes, setBikes] = useState([]);
  const [newBikeName, setNewBikeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes").select("*").eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); alert(error.message); return; }
    setBikes(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) { router.replace("/login"); return; }
        if (cancelled) return;
        await refreshBikes(data.user.id);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [router]);

  const addBike = async () => {
    const name = newBikeName.trim();
    if (!name || adding) return;
    try {
      setAdding(true);
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (userErr || !uid) { router.replace("/login"); return; }
      const { error } = await supabase.from("bikes").insert([{ name, user_id: uid }]);
      if (error) throw error;
      setNewBikeName("");
      await refreshBikes(uid);
    } catch (err) {
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
  };

  const deleteBike = async (bikeId) => {
    if (!confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.")) return;
    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) { alert(error.message); return; }
    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  return (
    <>
      {/* ── Title ── */}
      <div style={s.titleRow}>
        <div>
          <div style={s.titleLabel}>Mi colección</div>
          <h1 style={s.title}>Garage</h1>
        </div>
        {!loading && (
          <div style={s.countPill}>
            <span style={s.countNum}>{bikes.length}</span>
            <span style={s.countLabel}>{bikes.length === 1 ? "bici" : "bicis"}</span>
          </div>
        )}
      </div>

      {/* ── Add bike ── */}
      <div style={s.addCard}>
        <div style={s.addCardTop}>
          <div>
            <div style={s.addCardTitle}>Agregar bicicleta</div>
            <div style={s.addCardSub}>Ej: Diverge Comp / Gambler / Orbea Terra</div>
          </div>
          <span style={s.newBadge}>+ Nueva</span>
        </div>

        <div style={s.addRow}>
          <input
            value={newBikeName}
            onChange={(e) => setNewBikeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBike()}
            placeholder="Nombre de la bicicleta"
            style={s.input}
          />
          <button
            onClick={addBike}
            disabled={!newBikeName.trim() || adding}
            style={{
              ...s.addBtn,
              opacity: !newBikeName.trim() || adding ? 0.45 : 1,
              cursor: !newBikeName.trim() || adding ? "not-allowed" : "pointer",
            }}
          >
            {adding ? "Agregando…" : "Agregar"}
          </button>
        </div>

        <div style={s.tip}>
          <span style={s.tipDot} />
          Después podrás agregar tipo, año, talla y notas dentro de cada bici.
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={s.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={s.skeletonCard}>
              <div style={s.skeletonAvatar} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={s.skeletonLine1} />
                <div style={s.skeletonLine2} />
              </div>
            </div>
          ))}
        </div>
      ) : bikes.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🚲</div>
          <div style={s.emptyTitle}>Tu garage está vacío</div>
          <p style={s.emptyText}>Agrega tu primera bici arriba para empezar a registrar componentes y pesos.</p>
        </div>
      ) : (
        <div style={s.list}>
          {bikes.map((bike) => (
            <div key={bike.id} style={s.bikeCard}>
              <Link href={`/garage/${bike.id}`} style={s.bikeLink}>
                <div style={s.bikeAvatar}>
                  {(bike.name || "B").slice(0, 1).toUpperCase()}
                </div>
                <div style={s.bikeInfo}>
                  <div style={s.bikeName}>{bike.name}</div>
                  <div style={s.bikeMeta}>
                    {bike.type ? `${bike.type} · ` : ""}
                    Creada {new Date(bike.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={s.bikeArrow}>→</div>
              </Link>
              <button onClick={() => deleteBike(bike.id)} style={s.deleteBtn} title="Eliminar bicicleta">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const s = {
  titleRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  titleLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 },
  title: { margin: 0, fontSize: "clamp(28px, 6vw, 38px)", fontWeight: 900, letterSpacing: "-1px", color: "rgba(255,255,255,0.95)", lineHeight: 1 },
  countPill: { display: "flex", alignItems: "baseline", gap: 5, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" },
  countNum: { fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.5px" },
  countLabel: { fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500 },

  addCard: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", padding: "18px", display: "flex", flexDirection: "column", gap: 14 },
  addCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  addCardTitle: { fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.3px" },
  addCardSub: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.40)" },
  newBadge: { fontSize: 11, fontWeight: 700, color: "rgba(134,239,172,0.9)", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" },
  addRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 180, padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.90)", fontSize: 14, outline: "none" },
  addBtn: { padding: "11px 18px", borderRadius: 11, border: 0, fontWeight: 700, fontSize: 14, color: "#060910", background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", whiteSpace: "nowrap" },
  tip: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.38)" },
  tipDot: { display: "block", width: 5, height: 5, borderRadius: 999, background: "rgba(99,102,241,0.6)", flexShrink: 0 },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  skeletonCard: { display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 },
  skeletonLine1: { height: 14, width: "55%", borderRadius: 999, background: "rgba(255,255,255,0.07)" },
  skeletonLine2: { height: 11, width: "35%", borderRadius: 999, background: "rgba(255,255,255,0.05)" },

  emptyState: { padding: "48px 20px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyIcon: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,0.80)", letterSpacing: "-0.3px" },
  emptyText: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.40)", lineHeight: 1.6, maxWidth: 320 },

  bikeCard: { display: "flex", alignItems: "center", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", overflow: "hidden" },
  bikeLink: { display: "flex", alignItems: "center", gap: 14, flex: 1, padding: "14px 16px", textDecoration: "none", minWidth: 0 },
  bikeAvatar: { width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.85)", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.20)", flexShrink: 0 },
  bikeInfo: { flex: 1, minWidth: 0 },
  bikeName: { fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bikeMeta: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.40)" },
  bikeArrow: { fontSize: 16, color: "rgba(255,255,255,0.25)", flexShrink: 0 },
  deleteBtn: { padding: "14px 16px", border: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, alignSelf: "stretch", display: "grid", placeItems: "center" },
};