"use client"; // Le dice a Next.js que este componente se ejecuta en el navegador (no en el servidor)
export const dynamic = "force-dynamic"; // Fuerza que la página siempre se recargue desde el servidor, nunca desde caché

// ── Importaciones ──────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import ComboBox from "../../../components/ComboBox";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { createBikeWithTemplate } from "../../../lib/createBikeWithTemplate";

// ── Chevron reutilizable ───────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transition: "transform 0.22s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Componente principal de la página ─────────────────────────────────────────
export default function GaragePage() {
  const router = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [bikes, setBikes] = useState([]);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newType, setNewType] = useState("Gravel");

  const BIKE_TYPES = ["Ruta", "Gravel", "XC", "Trail", "Enduro", "Urbana", "E-Bike", "Dh", "Otra"];
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // ── Catálogo para ComboBox ────────────────────────────────────────────────
  const [catalogBrands, setCatalogBrands] = useState([]);
  const [catalogModels, setCatalogModels] = useState([]);
  const [catalogYears, setCatalogYears] = useState([]);
  const [catalogSizes, setCatalogSizes] = useState([]);

  // ── Preview de plantilla (componentes con peso) ───────────────────────────
  const [templatePreview, setTemplatePreview] = useState(null); // null = sin buscar, [] = sin plantilla, [...] = componentes
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // ── Efecto: carga marcas y tallas al montar ───────────────────────────────
  useEffect(() => {
    const fetchStaticCatalog = async () => {
      const [brandsRes, sizesRes] = await Promise.all([
        supabase.from("bike_catalog").select("brand").order("brand"),
        supabase.from("bike_sizes").select("size").order("size"),
      ]);
      if (brandsRes.data) setCatalogBrands([...new Set(brandsRes.data.map((r) => r.brand))]);
      if (sizesRes.data) setCatalogSizes(sizesRes.data.map((r) => r.size));
    };
    fetchStaticCatalog();
  }, []);

  // ── Efecto: recarga modelos cuando cambia marca ───────────────────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!newBrand.trim()) {
        setCatalogModels([]);
        return;
      }
      const { data } = await supabase
        .from("bike_catalog")
        .select("model")
        .ilike("brand", newBrand.trim())
        .order("model");
      if (data) setCatalogModels([...new Set(data.map((r) => r.model))]);
    }, 300);
    return () => clearTimeout(t);
  }, [newBrand]);

  // ── Efecto: recarga años cuando cambia marca o modelo ─────────────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!newBrand.trim() || !newModel.trim()) {
        setCatalogYears([]);
        return;
      }
      const { data } = await supabase
        .from("bike_catalog")
        .select("year")
        .ilike("brand", newBrand.trim())
        .ilike("model", newModel.trim())
        .order("year", { ascending: false });
      if (data) setCatalogYears([...new Set(data.map((r) => String(r.year)))]);
    }, 300);
    return () => clearTimeout(t);
  }, [newBrand, newModel]);

  // ── Efecto: busca plantilla cuando cambia marca+modelo+año ───────────────
  useEffect(() => {
    const yearNum = Number(String(newYear).trim());
    if (!newBrand.trim() || !newModel.trim() || !Number.isFinite(yearNum) || yearNum < 1980) {
      setTemplatePreview(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingTemplate(true);
      const { data: tpl } = await supabase
        .from("bike_model_templates")
        .select("id")
        .ilike("brand", newBrand.trim())
        .ilike("model", newModel.trim())
        .eq("year", yearNum)
        .maybeSingle();

      if (!tpl?.id) {
        setTemplatePreview([]);
        setLoadingTemplate(false);
        return;
      }

      const { data: parts } = await supabase
        .from("component_templates")
        .select("category, name, weight_g, position")
        .eq("template_id", tpl.id)
        .order("position", { ascending: true });

      setTemplatePreview(parts || []);
      setLoadingTemplate(false);
    }, 400);
    return () => clearTimeout(t);
  }, [newBrand, newModel, newYear]);

  // ── Función: cargar bicicletas ────────────────────────────────────────────
  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")
      .select("id, user_id, brand, model, type, year, size, notes, created_at, name")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const rows = (data || []).map((b) => ({
      ...b,
      displayName: `${b.brand ?? ""} ${b.model ?? ""}`.trim() || b.name || "Bicicleta",
    }));

    setBikes(rows);
  };

  // ── Efecto: carga inicial / valida sesión ─────────────────────────────────
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
        await refreshBikes(data.user.id);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Función: agregar nueva bicicleta (con autocarga de componentes) ───────
  const addBike = async () => {
    const brand = newBrand.trim();
    const model = newModel.trim();
    const size = newSize.trim();
    const type = (newType || "").trim();
    const yearNum = Number(String(newYear).trim());

    if (adding) return;

    if (!brand || !model || !String(newYear).trim() || !size || !type) {
      alert("Completa marca, modelo, año, talla y tipo.");
      return;
    }

    if (!Number.isFinite(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear() + 1) {
      alert("Año inválido.");
      return;
    }

    try {
      setAdding(true);

      // Usuario
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (userErr || !uid) {
        router.replace("/login");
        return;
      }

      // 1) Upsert en catálogo (no duplica)
      const { error: catErr } = await supabase
        .from("bike_catalog")
        .upsert({ brand, model, year: yearNum, type }, { onConflict: "brand,model,year" });

      if (catErr) throw catErr;

      // 2) Crear bici + autocargar componentes si existe plantilla
      const bike = await createBikeWithTemplate({
        userId: uid,
        name: `${brand} ${model}`.trim(),
        brand,
        model,
        year: yearNum,
        size,
        notes: "",
        type,
      });

      // 3) UI: cerrar + limpiar
      setAddOpen(false);
      setNewBrand("");
      setNewModel("");
      setNewYear("");
      setNewSize("");
      setNewType("Gravel");
      setTemplatePreview(null);

      // 4) refrescar lista
      await refreshBikes(uid);

      // 5) ir al detalle
      router.push(`/garage/${bike.id}`);

      // 6) actualizar marcas sugeridas
      setCatalogBrands((prev) =>
        prev.includes(brand) ? prev : [...prev, brand].sort((a, b) => a.localeCompare(b))
      );
    } catch (err) {
      console.error(err);
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
  };

  // ── Función: eliminar bicicleta ───────────────────────────────────────────
  const deleteBike = async (bikeId) => {
    if (!confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.")) return;

    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) {
      alert(error.message);
      return;
    }

    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
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

      <div style={s.addCard}>
        <button
          onClick={() => setAddOpen((o) => !o)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={s.addCardTitle}>Agregar bicicleta</div>
            <div style={s.addCardSub}>Ej: Diverge Comp / Gambler / Orbea Terra</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={s.newBadge}>+ Nueva</span>
            <Chevron open={addOpen} />
          </div>
        </button>

        {addOpen && (
          <>
            <div style={s.addRow}>
              <ComboBox
                value={newBrand}
                onChange={setNewBrand}
                options={catalogBrands}
                placeholder="Marca (ej: Orbea)"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newModel}
                onChange={setNewModel}
                options={catalogModels}
                placeholder="Modelo (ej: Terra H30)"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newYear}
                onChange={setNewYear}
                options={catalogYears}
                placeholder="Año (ej: 2021)"
                inputMode="numeric"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newSize}
                onChange={setNewSize}
                options={catalogSizes}
                placeholder="Talla (ej: S / 54)"
                style={s.comboWrapper}
              />

              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ ...s.input, cursor: "pointer" }}
              >
                {BIKE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                onClick={addBike}
                disabled={
                  adding ||
                  !newBrand.trim() ||
                  !newModel.trim() ||
                  !String(newYear).trim() ||
                  !newSize.trim() ||
                  !newType.trim()
                }
                style={{
                  ...s.addBtn,
                  opacity:
                    adding ||
                    !newBrand.trim() ||
                    !newModel.trim() ||
                    !String(newYear).trim() ||
                    !newSize.trim() ||
                    !newType.trim()
                      ? 0.45
                      : 1,
                  cursor:
                    adding ||
                    !newBrand.trim() ||
                    !newModel.trim() ||
                    !String(newYear).trim() ||
                    !newSize.trim() ||
                    !newType.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {adding ? "Agregando…" : "Agregar"}
              </button>
            </div>

            {/* ── Preview de plantilla ── */}
            {loadingTemplate && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "8px 0" }}>
                Buscando componentes…
              </div>
            )}

            {!loadingTemplate && templatePreview !== null && (
              templatePreview.length > 0 ? (
                <div style={{ borderRadius: 12, border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.07)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(165,180,252,0.90)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      ✓ Plantilla encontrada — se cargarán {templatePreview.length} componentes
                    </span>
                    {templatePreview.some((p) => p.weight_g) && (
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "rgba(134,239,172,0.85)", whiteSpace: "nowrap" }}>
                        {(templatePreview.reduce((s, p) => s + (p.weight_g ?? 0), 0) / 1000).toFixed(2)} kg total
                      </span>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {templatePreview.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>{p.category}</span>
                        </div>
                        <span style={{ fontSize: 12, color: p.weight_g ? "rgba(134,239,172,0.80)" : "rgba(255,255,255,0.25)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {p.weight_g ? `${p.weight_g} g` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>○</span>
                  Sin plantilla para este modelo — los componentes se agregarán manualmente.
                </div>
              )
            )}

            <div style={s.tip}>
              <span style={s.tipDot} />
              Estos 5 datos son obligatorios. Después podrás agregar notas y componentes dentro de cada bici.
            </div>
          </>
        )}
      </div>

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
                  {(`${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || "B").slice(0, 1).toUpperCase()}
                </div>

                <div style={s.bikeInfo}>
                  <div style={s.bikeName}>
                    {(`${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || bike.name || "Bicicleta")}
                  </div>

                  <div style={s.bikeMeta}>
                    {bike.type ? `${bike.type} · ` : ""}
                    Creada{" "}
                    {new Date(bike.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  titleRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  titleLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 },
  title: { margin: 0, fontSize: "clamp(28px, 6vw, 38px)", fontWeight: 900, letterSpacing: "-1px", color: "rgba(255,255,255,0.95)", lineHeight: 1 },
  countPill: { display: "flex", alignItems: "baseline", gap: 5, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" },
  countNum: { fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.5px" },
  countLabel: { fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500 },

  addCard: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", padding: "18px", display: "flex", flexDirection: "column", gap: 14 },
  addCardTitle: { fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.3px" },
  addCardSub: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.40)" },
  newBadge: { fontSize: 11, fontWeight: 700, color: "rgba(134,239,172,0.9)", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" },
  addRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  comboWrapper: { flex: 1, minWidth: 180 },
  input: { flex: 1, minWidth: 180, padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.90)", fontSize: 14, outline: "none" },
  addBtn: { padding: "11px 18px", borderRadius: 11, border: 0, fontWeight: 700, fontSize: 14, color: "#060910", background: "rgba(255,255,255,0.92)", whiteSpace: "nowrap" },
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