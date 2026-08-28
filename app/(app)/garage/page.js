"use client"; // Le dice a Next.js que este componente se ejecuta en el navegador (no en el servidor)
export const dynamic = "force-dynamic"; // Fuerza que la página siempre se recargue desde el servidor, nunca desde caché

// ── Importaciones ──────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import ComboBox from "../../../components/ComboBox";
import { useRouter } from "next/navigation";
import TapLink, { Pendiente } from "../../../components/TapLink";
import { supabase } from "../../../lib/supabaseClient";
import { createBikeWithTemplate } from "../../../lib/createBikeWithTemplate";
import Chevron from "../../../components/Chevron";
import { BIKE_TYPES } from "../../../lib/constants";
import { bikeName } from "../../../lib/dateHelpers";
import { loadGarageView, estadoDeBici } from "../../../lib/loadGarageView";
import { color, radio, espacio, tacto, texto as textoT } from "../../../lib/design";
import Cargando from "../../../components/Cargando";

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
  const [newName, setNewName] = useState(""); // opcional: si va vacío se deriva de marca + modelo

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Estado de mantención por bici (PRD-11.3). Lo arma el mismo motor que la
  // pantalla de Mantención: acá solo se muestra.
  const [estadoPorBici, setEstadoPorBici] = useState({});

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
        .select("category, name, weight_g, position, brand, sku")
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
      displayName: bikeName(b),
    }));

    setBikes(rows);

    // El estado se carga después y por separado: si el motor falla, las bicis
    // igual se ven. Nunca dejar la pantalla en blanco por un dato de adorno.
    try {
      const { views } = await loadGarageView(supabase, uid, { bikes: data || [] });
      const porId = {};
      for (const v of views) porId[v.bike.id] = estadoDeBici(v);
      setEstadoPorBici(porId);
    } catch (err) {
      console.error("No se pudo cargar el estado de las bicis:", err);
    }
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
        // vacío a propósito: el trigger de la base pone "marca modelo" por
        // defecto, y respeta el nombre si el usuario escribió uno (BG-027)
        name: newName.trim(),
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
      setNewName("");
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

  // Cuántas bicis piden algo. Alimenta el subtítulo del encabezado (PRD-11.3).
  const necesitanAtencion = bikes.filter((b) => estadoPorBici[b.id]?.atencion).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={s.titleRow}>
        <div>
          <div style={s.titleLabel}>Mi colección</div>
          <h1 style={s.title}>Garage</h1>
          {/* Si todas están al día no decimos nada: el silencio también informa. */}
          {!loading && necesitanAtencion > 0 && (
            <div style={s.subtitulo}>
              {necesitanAtencion} necesita{necesitanAtencion !== 1 ? "n" : ""} atención
            </div>
          )}
        </div>

        {!loading && (
          <div style={s.countPill}>
            <span style={s.countNum}>{bikes.length}</span>
            <span style={s.countLabel}>{bikes.length === 1 ? "bici" : "bicis"}</span>
          </div>
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
          <p style={s.emptyText}>Agrega tu primera bici acá abajo para empezar a registrar componentes y pesos.</p>
        </div>
      ) : (
        <div style={s.list}>
          {bikes.map((bike) => {
            // Mientras el estado carga, la línea queda vacía en vez de mentir.
            const estado = estadoPorBici[bike.id];
            return (
              <div key={bike.id} style={s.bikeCard}>
                <TapLink href={`/garage/${bike.id}`} style={s.bikeLink} sinIndicador className="tap-suave">
                  <div style={s.bikeAvatar}>
                    {bikeName(bike).slice(0, 1).toUpperCase()}
                    {estado && estado.atencion && (
                      <span style={{ ...s.puntoEstado, background: estado.color }} />
                    )}
                  </div>

                  <div style={s.bikeInfo}>
                    <div style={s.bikeName}>{bikeName(bike)}</div>

                    <div style={s.bikeMeta}>
                      {bike.type ? `${bike.type} · ` : ""}
                      {estado ? (
                        <span style={{ color: estado.color, fontWeight: 600 }}>{estado.texto}</span>
                      ) : (
                        <span style={{ color: color.texto.tenue }}>…</span>
                      )}
                    </div>
                  </div>

                  {/* Mientras la bici se abre, la flecha se convierte en la ruedita */}
                  <div style={s.bikeArrow}><Pendiente tam={15}>→</Pendiente></div>
                </TapLink>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Agregar bicicleta · PRD-11.3 ──
           Va debajo de la lista a propósito: se usa dos o tres veces en la
           vida, y antes ocupaba el mejor espacio de la pantalla principal. */}
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

              <div style={{ display: "grid", gap: 4 }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={
                    `${newBrand} ${newModel}`.trim()
                      ? `Nombre (opcional) — por defecto: ${`${newBrand} ${newModel}`.trim()}`
                      : "Nombre (opcional)"
                  }
                  style={s.input}
                />
              </div>

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
                {adding && <Cargando tam={14} style={{ marginRight: 8 }} />}
                {adding ? "Agregando…" : "Agregar"}
              </button>
            </div>

            {/* ── Referencia de componentes de este modelo ──
                 La auto-carga está en pausa (ver createBikeWithTemplate), así que
                 esto se muestra como referencia y no promete cargar nada. */}
            {loadingTemplate && (
              <div style={{ fontSize: 12, color: color.texto.tenue, padding: "8px 0" }}>
                Buscando componentes…
              </div>
            )}

            {!loadingTemplate && templatePreview !== null && templatePreview.length > 0 && (
              <div style={{ borderRadius: radio.md, border: `1px solid ${color.borde.normal}`, background: color.superficie.media, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: color.texto.suave, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Este modelo suele traer
                  </span>
                  {templatePreview.some((p) => p.weight_g) && (
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: color.texto.tenue, whiteSpace: "nowrap" }}>
                      ~{(templatePreview.reduce((s2, p) => s2 + (p.weight_g ?? 0), 0) / 1000).toFixed(2)} kg
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 3 }}>
                  {templatePreview.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, color: color.texto.suave, minWidth: 0 }}>
                        {p.name}
                        <span style={{ color: color.texto.tenue, marginLeft: 6 }}>{p.category}</span>
                      </span>
                      <span style={{ fontSize: 11, color: color.texto.tenue, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {p.weight_g ? `${p.weight_g} g` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: color.texto.tenue, lineHeight: 1.4 }}>
                  Es solo referencia: los componentes los agregas tú después, uno a uno.
                </div>
              </div>
            )}

            <div style={s.tip}>
              <span style={s.tipDot} />
              Estos 5 datos son obligatorios. Después podrás agregar notas y componentes dentro de cada bici.
            </div>
          </>
        )}
      </div>

    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  titleRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  titleLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: color.texto.tenue, marginBottom: 4 },
  title: { margin: 0, fontSize: "clamp(28px, 6vw, 38px)", fontWeight: 900, letterSpacing: "-1px", color: color.texto.fuerte, lineHeight: 1 },
  subtitulo: { marginTop: 7, fontSize: 13, fontWeight: 600, color: color.estado.proximo },
  puntoEstado: { position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: radio.full, border: "2px solid #060910" },
  countPill: { display: "flex", alignItems: "baseline", gap: 5, padding: "10px 16px", borderRadius: radio.md, border: `1px solid ${color.borde.normal}`, background: color.superficie.media },
  countNum: { fontSize: 22, fontWeight: 900, color: color.texto.fuerte, letterSpacing: "-0.5px" },
  countLabel: { fontSize: 12, color: color.texto.tenue, fontWeight: 500 },

  addCard: { borderRadius: radio.lg, border: `1px solid ${color.borde.normal}`, background: color.superficie.media, padding: "18px", display: "flex", flexDirection: "column", gap: 14 },
  addCardTitle: { fontWeight: 700, fontSize: 15, color: color.texto.normal, letterSpacing: "-0.3px" },
  addCardSub: { marginTop: 3, fontSize: 12, color: color.texto.tenue },
  newBadge: { fontSize: 11, fontWeight: 700, color: color.estado.alDiaTexto, background: color.estado.alDiaTenue, border: `1px solid ${color.estado.alDiaBorde}`, padding: "4px 10px", borderRadius: radio.full, whiteSpace: "nowrap" },
  addRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  comboWrapper: { flex: 1, minWidth: 180 },
  input: { flex: 1, minWidth: 180, padding: "11px 14px", borderRadius: radio.sm, border: `1px solid ${color.borde.normal}`, background: color.superficie.hundida, color: color.texto.fuerte, fontSize: 14, outline: "none" },
  addBtn: { minHeight: tacto.minimo, padding: `0 ${espacio.lg}px`, borderRadius: radio.md, border: 0, fontWeight: textoT.peso.fuerte, fontSize: textoT.base, color: color.texto.sobreAccion, background: color.accion.base, whiteSpace: "nowrap", cursor: "pointer" },
  tip: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: color.texto.tenue },
  tipDot: { display: "block", width: 5, height: 5, borderRadius: radio.full, background: color.identidad.base, flexShrink: 0 },

  list: { display: "flex", flexDirection: "column", gap: 8 },

  skeletonCard: { display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: radio.lg, border: `1px solid ${color.borde.sutil}`, background: color.superficie.baja },
  skeletonAvatar: { width: 44, height: 44, borderRadius: radio.md, background: color.superficie.alta, flexShrink: 0 },
  skeletonLine1: { height: 14, width: "55%", borderRadius: radio.full, background: color.superficie.alta },
  skeletonLine2: { height: 11, width: "35%", borderRadius: radio.full, background: color.superficie.media },

  emptyState: { padding: "48px 20px", borderRadius: radio.lg, border: `1px solid ${color.borde.sutil}`, background: color.superficie.baja, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyIcon: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontWeight: 700, fontSize: 17, color: color.texto.normal, letterSpacing: "-0.3px" },
  emptyText: { margin: 0, fontSize: 14, color: color.texto.tenue, lineHeight: 1.6, maxWidth: 320 },

  bikeCard: { display: "flex", alignItems: "center", borderRadius: radio.lg, border: `1px solid ${color.borde.normal}`, background: color.superficie.media, overflow: "hidden" },
  bikeLink: { display: "flex", alignItems: "center", gap: 14, flex: 1, padding: "14px 16px", textDecoration: "none", minWidth: 0 },
  bikeAvatar: { position: "relative", width: 44, height: 44, borderRadius: radio.md, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, color: color.texto.normal, background: color.identidad.tenue, border: `1px solid ${color.identidad.borde}`, flexShrink: 0 },
  bikeInfo: { flex: 1, minWidth: 0 },
  bikeName: { fontWeight: 700, fontSize: 16, color: color.texto.fuerte, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bikeMeta: { marginTop: 3, fontSize: 12, color: color.texto.tenue },
  bikeArrow: { fontSize: 16, color: color.texto.tenue, flexShrink: 0 },

};