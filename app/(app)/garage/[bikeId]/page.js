"use client";

export const dynamic = "force-dynamic";

// Página de detalle de una bicicleta.
// Muestra y permite gestionar:
//   - Datos de la bici (nombre, tipo, año, talla, notas) con edición inline
//   - Peso total calculado automáticamente sumando todos los componentes
//   - Distribución de peso por categoría (gráfico de barras simple)
//   - Lista de componentes con búsqueda, edición y eliminación
//   - Modal para agregar nuevos componentes (reutiliza o crea desde biblioteca)
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { DEFAULT_CATEGORIES, MULTI_COMPONENT_CATEGORIES } from "../../../../lib/constants";
import ComboBox from "../../../../components/ComboBox";

// ── Constantes y funciones helper ─────────────────────────────────────────────

const emptyBikeDraft = () => ({ name: "", type: "", year: "", size: "", notes: "" });

const draftFromBike = (b) => ({
  name: b?.name ?? "",
  type: b?.type ?? "",
  year: b?.year ?? "",
  size: b?.size ?? "",
  notes: b?.notes ?? "",
});

function formatKgFromGrams(g) {
  if (!Number.isFinite(g) || g <= 0) return "0.00 kg";
  return `${(g / 1000).toFixed(2)} kg`;
}

function parseNullableNumber(input) {
  if (input === "") return null;
  const n = Number(input);
  return Number.isNaN(n) ? NaN : n;
}

function validateYearMaybe(yearStr) {
  const yearVal = parseNullableNumber(yearStr);
  if (yearVal === null) return { ok: true, value: null };
  if (Number.isNaN(yearVal) || yearVal < 1900 || yearVal > 2100) return { ok: false };
  return { ok: true, value: yearVal };
}

function uniq(arr) {
  return arr.filter((x, i) => arr.indexOf(x) === i);
}

/** Nombre legible de un modelo del catálogo: "Fox F100 RCL". */
function nombreDeModelo(m) {
  if (!m) return "Componente";
  return (
    [m.brand, m.series, m.model, m.variant].filter(Boolean).join(" ").trim() ||
    m.subcategory ||
    m.category ||
    "Componente"
  );
}

/**
 * Aplana un montaje (bike_components) con su modelo del catálogo.
 * El peso que manda es el ajuste de esta bici; si no hay, el del catálogo.
 */
function flattenMount(bc, m) {
  return {
    id: bc.id,                       // el MONTAJE es la identidad
    catalog_id: bc.catalog_id,
    name: nombreDeModelo(m),
    category: m?.category ?? "",
    subcategory: m?.subcategory ?? null,
    brand: m?.brand ?? null,
    model: m?.model ?? null,
    variant: m?.variant ?? null,
    sku: m?.sku ?? null,
    confidence: m?.confidence ?? null,
    catalogWeight: m?.weight_g ?? null,
    weight_override: bc.weight_g_override ?? null,
    weight_g: bc.weight_g_override ?? m?.weight_g ?? null,
    created_at: bc.created_at,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function BikeDetailPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [bike, setBike] = useState(null);

  // parts: los montajes de esta bici, aplanados con su modelo del catálogo.
  // La identidad de cada item es el MONTAJE (bike_components.id) — ver flattenMount.
  const [parts, setParts] = useState([]);

  // catalog: el registro de modelos. Alimenta todas las sugerencias.
  const [catalog, setCatalog] = useState([]);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Modal agregar componente
  const [addOpen, setAddOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [partCategory, setPartCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [partWeight, setPartWeight] = useState("");
  const [partHasWeight, setPartHasWeight] = useState(false); // el peso solo se guarda si se activa
  const [partBrand, setPartBrand] = useState("");
  const [partSku, setPartSku] = useState("");
  const [partSubcategory, setPartSubcategory] = useState("");
  const [partModel, setPartModel] = useState("");
  const [catalogHit, setCatalogHit] = useState(null); // modelo del catálogo que rellenó los datos
  const [confirmDupOpen, setConfirmDupOpen] = useState(false); // aviso de segunda pieza en la misma categoría

  const [query, setQuery] = useState("");

  // Edición inline
  const [editingPartId, setEditingPartId] = useState(null);
  const [editById, setEditById] = useState({});

  // Edición de la bici
  const [bikeEditMode, setBikeEditMode] = useState(false);
  const [bikeDraft, setBikeDraft] = useState(emptyBikeDraft());

  // Confirmación de quitar una pieza. null = cerrado, id del montaje = abierto.
  const [confirmPartId, setConfirmPartId] = useState(null);

  // ── Valores calculados ─────────────────────────────────────────────────────
  const totalWeightG = useMemo(
    () => parts.reduce((acc, p) => acc + (Number(p.weight_g) || 0), 0),
    [parts]
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of parts) {
      const cat = p.category || "Otros";
      map.set(cat, (map.get(cat) || 0) + (Number(p.weight_g) || 0));
    }
    return Array.from(map.entries())
      .map(([cat, grams]) => ({ cat, grams }))
      .sort((a, b) => b.grams - a.grams);
  }, [parts]);

  const topCategory = useMemo(() => {
    if (!byCategory.length) return "—";
    return byCategory[0]?.cat ?? "—";
  }, [byCategory]);

  const filteredParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      return n.includes(q) || c.includes(q);
    });
  }, [parts, query]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getUserIdOrRedirect = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) { router.replace("/login"); return null; }
    return uid;
  };

  // Registra un evento en el historial.
  //
  // Guarda una FOTO del nombre y la categoría, no solo el id: un historial que
  // depende de que la pieza siga existiendo no es un historial. Así sobrevive a
  // que el modelo se borre, se renombre o se recategorice.
  const logEvent = async ({ userId, bikeId: bid, partId, name, category, action, oldW, newW }) => {
    const { error } = await supabase.from("part_logs").insert([{
      user_id: userId,
      bike_id: bid,
      part_id: partId,
      part_name: name ?? null,
      part_category: category ?? null,
      action,
      old_weight_g: oldW ?? null,
      new_weight_g: newW ?? null,
    }]);
    if (error) console.error("part_logs insert error:", error);
  };

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bikeId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return router.replace("/login");

        const [catsRes, hiddenRes, bikeRes, bcRes, catalogRes] = await Promise.all([
          supabase.from("categories").select("name").order("created_at", { ascending: true }),
          supabase.from("category_hidden").select("name"),
          supabase.from("bikes").select("*").eq("id", bikeId).single(),
          // Cargar componentes de esta bici vía bike_components + join a components
          supabase.from("bike_components")
            .select("id, catalog_id, weight_g_override, created_at, modelo:component_catalog(*)")
            .eq("bike_id", bikeId)
            .order("created_at", { ascending: false }),
          // El catálogo es EL registro de componentes: alimenta todas las sugerencias
          supabase.from("component_catalog").select("*"),
        ]);

        if (cancelled) return;
        if (bikeRes.error) { setBike(null); return; }

        setBike(bikeRes.data);
        setBikeDraft(draftFromBike(bikeRes.data));

        const customCats = (catsRes.data || []).map((c) => c.name);
        const hidden = new Set((hiddenRes.data || []).map((h) => h.name));
        const merged = uniq([...DEFAULT_CATEGORIES, ...customCats]).filter((n) => !hidden.has(n));
        const finalCats = merged.length > 0 ? merged : DEFAULT_CATEGORIES;
        setCategories(finalCats);
        if (finalCats.length > 0 && !finalCats.includes(partCategory)) setPartCategory(finalCats[0]);

        // Aplanar los montajes. La identidad ahora es el MONTAJE (bike_components.id),
        // no el modelo: una bici puede llevar dos piezas del mismo modelo.
        const rows = (bcRes.data || []).map((bc) => flattenMount(bc, bc.modelo));
        setParts(rows);
        setCatalog(catalogRes.data || []);

        const nextEdit = {};
        for (const p of rows) nextEdit[p.id] = { weight_g: p.weight_override ?? "" };
        setEditById(nextEdit);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikeId]);

  // ── Edición de la bici ─────────────────────────────────────────────────────
  const cancelBikeEdit = () => {
    setBikeEditMode(false);
    setBikeDraft(draftFromBike(bike));
  };

  const saveBike = async () => {
    if (!bikeDraft.name.trim()) return alert("El nombre no puede quedar vacío.");
    const yearCheck = validateYearMaybe(bikeDraft.year);
    if (!yearCheck.ok) return alert("Año inválido (ej: 2021).");
    const patch = {
      name: bikeDraft.name.trim(),
      type: bikeDraft.type.trim() || null,
      year: yearCheck.value,
      size: bikeDraft.size.trim() || null,
      notes: bikeDraft.notes.trim() || null,
    };
    const { data, error } = await supabase.from("bikes").update(patch).eq("id", bikeId).select("*").single();
    if (error) return alert(error.message);
    setBike(data);
    setBikeDraft(draftFromBike(data));
    setBikeEditMode(false);
  };

  // ── CRUD de componentes ────────────────────────────────────────────────────

  // Agrega un componente a la bici.
  // Si el nombre+categoría coincide con uno existente de la biblioteca → lo reutiliza.
  // Si no → crea un componente nuevo y lo vincula.
  // ── Sugerencias en cascada: categoria > subcategoria > marca > modelo ──────
  // Todas salen del catalogo, que ahora habla el mismo idioma que el usuario.
  // Ninguna obliga: si el modelo no existe, se escribe y se crea.

  const catalogForCategory = useMemo(
    () => catalog.filter((c) => c.category === partCategory),
    [catalog, partCategory]
  );

  const subcategoryOptions = useMemo(() => {
    const set = new Set();
    for (const c of catalogForCategory) if (c.subcategory) set.add(c.subcategory);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [catalogForCategory]);

  // Si el usuario eligio subcategoria, filtramos por ella.
  const catalogScope = useMemo(() => {
    if (!partSubcategory.trim()) return catalogForCategory;
    return catalogForCategory.filter(
      (c) => (c.subcategory || "").toLowerCase() === partSubcategory.trim().toLowerCase()
    );
  }, [catalogForCategory, partSubcategory]);

  const brandOptions = useMemo(() => {
    const set = new Set();
    for (const c of catalogScope) if (c.brand) set.add(c.brand);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [catalogScope]);

  const modelOptions = useMemo(() => {
    if (!partBrand.trim()) return [];
    const b = partBrand.trim().toLowerCase();
    const set = new Set();
    for (const c of catalogScope) {
      if ((c.brand || "").toLowerCase() !== b) continue;
      const label = [c.series, c.model, c.variant].filter(Boolean).join(" ").trim();
      if (label) set.add(label);
    }
    return [...set].sort((a, b2) => a.localeCompare(b2));
  }, [catalogScope, partBrand]);

  // Busca el modelo exacto en el catalogo, sin distinguir mayusculas.
  const findCatalogModel = (categoria, subcat, marca, modelo) => {
    const norm = (x) => (x || "").trim().toLowerCase();
    return catalog.find((c) => {
      if (norm(c.category) !== norm(categoria)) return false;
      if (norm(c.brand) !== norm(marca)) return false;
      const label = [c.series, c.model, c.variant].filter(Boolean).join(" ").trim();
      return norm(label) === norm(modelo);
    }) || null;
  };

  // Al elegir un modelo del catalogo, trae su peso y su SKU.
  const applyModel = (value) => {
    setPartModel(value);
    const hit = findCatalogModel(partCategory, partSubcategory, partBrand, value);
    setCatalogHit(hit);
    if (hit) {
      if (hit.weight_g != null) { setPartWeight(String(hit.weight_g)); setPartHasWeight(true); }
      if (hit.sku) setPartSku(hit.sku);
      if (hit.subcategory && !partSubcategory) setPartSubcategory(hit.subcategory);
    }
  };

  // Piezas que ESTA bici ya tiene en la categoría elegida.
  // En las categorías que llevan varias por diseño no se advierte nada.
  const sameCategoryParts = useMemo(() => {
    if (MULTI_COMPONENT_CATEGORIES.includes(partCategory)) return [];
    return parts.filter((p) => p.category === partCategory);
  }, [parts, partCategory]);

  const addPart = async (e) => {
    e?.preventDefault?.();

    const marca = partBrand.trim();
    const modelo = partModel.trim();
    if (!marca && !modelo) return alert("Ponle al menos una marca o un modelo.");

    // El peso solo se considera si el usuario activo la casilla.
    const w = partHasWeight ? parseNullableNumber(partWeight) : null;
    if (partHasWeight && partWeight !== "" && (Number.isNaN(w) || w < 0)) {
      return alert("Peso invalido.");
    }

    // Una segunda pieza en una categoria que normalmente lleva una sola
    // suele ser un error de carga: se confirma antes de guardar.
    if (sameCategoryParts.length > 0 && !confirmDupOpen) {
      setConfirmDupOpen(true);
      return;
    }
    setConfirmDupOpen(false);

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    // 1. Buscar el modelo en el catalogo. Si no esta, lo creamos.
    let modeloDelCatalogo = findCatalogModel(partCategory, partSubcategory, marca, modelo);

    if (!modeloDelCatalogo) {
      const { data: creado, error: catErr } = await supabase
        .from("component_catalog")
        .insert([{
          category: partCategory,
          subcategory: partSubcategory.trim() || null,
          brand: marca || null,
          model: modelo || null,
          weight_g: w,
          sku: partSku.trim() || null,
          confidence: "unverified",   // lo creo un usuario, nadie lo reviso
          created_by: userId,
        }])
        .select("*")
        .single();

      if (catErr) {
        // 23505 = otra persona creo el mismo modelo entremedio. Lo buscamos de nuevo.
        if (catErr.code !== "23505") return alert(catErr.message);
        const { data: existente } = await supabase
          .from("component_catalog").select("*")
          .eq("category", partCategory).ilike("brand", marca).ilike("model", modelo)
          .maybeSingle();
        if (!existente) return alert("No se pudo crear el modelo.");
        modeloDelCatalogo = existente;
      } else {
        modeloDelCatalogo = creado;
        setCatalog((prev) => [...prev, creado]);
      }
    }

    // 2. Montarlo en la bici. Si el peso que puso difiere del catalogo, se guarda
    //    como ajuste SOLO de esta bici: el catalogo no se toca.
    const override =
      w != null && modeloDelCatalogo.weight_g != null && w !== modeloDelCatalogo.weight_g
        ? w
        : (modeloDelCatalogo.weight_g == null ? w : null);

    const { data: bc, error: bcErr } = await supabase
      .from("bike_components")
      .insert([{ bike_id: bikeId, catalog_id: modeloDelCatalogo.id, user_id: userId, weight_g_override: override }])
      .select("id, catalog_id, weight_g_override, created_at, modelo:component_catalog(*)")
      .single();
    if (bcErr) return alert(bcErr.message);

    const nuevoMontaje = flattenMount(bc, bc.modelo ?? modeloDelCatalogo);

    await logEvent({
      userId, bikeId, partId: modeloDelCatalogo.id,
      name: nuevoMontaje.name, category: nuevoMontaje.category,
      action: "created", oldW: null, newW: nuevoMontaje.weight_g,
    });

    setParts((prev) => [nuevoMontaje, ...prev]);
    setEditById((prev) => ({ ...prev, [nuevoMontaje.id]: { weight_g: nuevoMontaje.weight_override ?? "" } }));

    setPartName(""); setPartWeight(""); setPartHasWeight(false); setPartBrand("");
    setPartModel(""); setPartSubcategory(""); setPartSku("");
    setCatalogHit(null); setConfirmDupOpen(false);
    setAddOpen(false);
  };

  // Quita la pieza de ESTA bici. El modelo sigue vivo en el catalogo para todos:
  // por eso ya no existe la opcion de "eliminar de todas las bicis".
  const removePart = async () => {
    const mountId = confirmPartId;
    setConfirmPartId(null);

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const part = parts.find((p) => p.id === mountId);
    await logEvent({
      userId, bikeId, partId: part?.catalog_id ?? null,
      name: part?.name, category: part?.category,
      action: "deleted", oldW: part?.weight_g ?? null, newW: null,
    });

    const { error } = await supabase.from("bike_components").delete().eq("id", mountId);
    if (error) return alert(error.message);

    setParts((prev) => prev.filter((p) => p.id !== mountId));
    setEditById((prev) => { const next = { ...prev }; delete next[mountId]; return next; });
    if (editingPartId === mountId) setEditingPartId(null);
  };

  // La edicion inline ahora ajusta SOLO el peso de esta bici.
  // Los datos del modelo (marca, modelo, SKU) son compartidos y se corrigen
  // desde el catalogo, no desde aca.
  const savePart = async (mountId) => {
    const row = editById[mountId];
    if (!row) return;

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const old = parts.find((p) => p.id === mountId);
    const texto = String(row.weight_g ?? "").trim();
    const w = texto === "" ? null : parseNullableNumber(texto);
    if (texto !== "" && (Number.isNaN(w) || w < 0)) return alert("Peso invalido.");

    const { data, error } = await supabase
      .from("bike_components")
      .update({ weight_g_override: w })
      .eq("id", mountId)
      .select("id, catalog_id, weight_g_override, created_at, modelo:component_catalog(*)")
      .single();
    if (error) return alert(error.message);

    const actualizado = flattenMount(data, data.modelo);

    await logEvent({
      userId, bikeId, partId: actualizado.catalog_id,
      name: actualizado.name, category: actualizado.category,
      action: "updated", oldW: old?.weight_g ?? null, newW: actualizado.weight_g,
    });

    setParts((prev) => prev.map((p) => (p.id === mountId ? actualizado : p)));
    setEditById((prev) => ({ ...prev, [mountId]: { weight_g: actualizado.weight_override ?? "" } }));
    setEditingPartId(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const pageNav = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button onClick={() => router.push("/garage")} style={styles.secondaryBtn}>← Garage</button>
      {bikeId && <>
        <a href={`/garage/${bikeId}/maintenance`} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>Mantenimiento</a>
        <a href={`/garage/${bikeId}/history`} style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>Historial</a>
      </>}
    </div>
  );

  if (loading) {
    return (
      <>
        {pageNav}
        <div className="animate-pulse rounded-[18px] border p-4"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="h-5 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
          <div className="mt-3 h-4 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="mt-5 h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.10)" }} />
        </div>
      </>
    );
  }

  if (!bike) {
    return (
      <>
        {pageNav}
        <div className="rounded-[18px] border p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border text-lg"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)" }}>🤕</div>
          <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>No encontré esta bicicleta</div>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>Puede que no exista o no tengas permisos.</p>
          <button onClick={() => router.push("/garage")} style={styles.primaryBtn} className="mt-4">Volver al Garage</button>
        </div>
      </>
    );
  }

  const partCount = parts.length;
  const confirmPart = parts.find((p) => p.id === confirmPartId);

  return (
    <>
      {pageNav}

      {/* ── Tarjeta hero ── */}
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={{ minWidth: 0 }}>
            {!bikeEditMode ? (
              <>
                <div style={styles.heroKicker}>Bici</div>
                <div style={styles.heroTitleRow}>
                  <h1 style={styles.heroTitle}>{bike.name}</h1>
                  <button onClick={() => setBikeEditMode(true)} style={styles.iconBtn} title="Editar bici" aria-label="Editar bici">✏️</button>
                </div>
                <div style={styles.heroMeta}>
                  <span style={styles.heroMetaStrong}>{formatKgFromGrams(totalWeightG)}</span>{" "}
                  <span style={styles.heroMetaSoft}>({totalWeightG.toFixed(0)} g)</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroMetaSoft}>{partCount} componente{partCount === 1 ? "" : "s"}</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroMetaSoft}>Top: {topCategory}</span>
                </div>
                <div style={styles.heroSubMeta}>
                  {bike.type ? `${bike.type}` : "—"}
                  {bike.year ? ` • ${bike.year}` : ""}
                  {bike.size ? ` • Talla ${bike.size}` : ""}
                  {bike.notes ? ` • ${bike.notes}` : ""}
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={styles.field}>
                  <div style={styles.label}>Nombre</div>
                  <input value={bikeDraft.name} onChange={(e) => setBikeDraft((p) => ({ ...p, name: e.target.value }))} style={styles.input} />
                </div>
                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <div style={styles.label}>Tipo</div>
                    <input value={bikeDraft.type} onChange={(e) => setBikeDraft((p) => ({ ...p, type: e.target.value }))} style={styles.input} placeholder="Gravel / MTB / Ruta..." />
                  </div>
                  <div style={styles.field}>
                    <div style={styles.label}>Año</div>
                    <input value={bikeDraft.year} onChange={(e) => setBikeDraft((p) => ({ ...p, year: e.target.value }))} style={styles.input} placeholder="2021" inputMode="numeric" />
                  </div>
                  <div style={styles.field}>
                    <div style={styles.label}>Talla</div>
                    <input value={bikeDraft.size} onChange={(e) => setBikeDraft((p) => ({ ...p, size: e.target.value }))} style={styles.input} placeholder="S / M / 54..." />
                  </div>
                  <div style={styles.field}>
                    <div style={styles.label}>Notas</div>
                    <input value={bikeDraft.notes} onChange={(e) => setBikeDraft((p) => ({ ...p, notes: e.target.value }))} style={styles.input} placeholder="Ej: tubeless 45mm, Rival 1x..." />
                  </div>
                </div>
                <div style={styles.btnRow}>
                  <button style={styles.primaryBtn} onClick={saveBike}>Guardar</button>
                  <button style={styles.secondaryBtn} onClick={cancelBikeEdit}>Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {!bikeEditMode ? (
            <div style={styles.heroPill}>
              <div style={styles.heroPillTitle}>Peso Total</div>
              <div style={styles.heroPillValue}>{formatKgFromGrams(totalWeightG)}</div>
              <div style={styles.heroPillSub}>({totalWeightG.toFixed(0)} g)</div>
            </div>
          ) : null}
        </div>

        {/* Distribución de peso */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.sectionTop}>
            <div style={styles.sectionTitle}>Distribución de peso</div>
            <div style={styles.sectionHint}>Principales categorías</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(byCategory.length ? byCategory.slice(0, 6) : [{ cat: "Sin piezas", grams: 0 }]).map((row) => {
              const pct = totalWeightG > 0 ? (row.grams / totalWeightG) * 100 : 0;
              return (
                <div key={row.cat} style={styles.distRow}>
                  <div style={styles.distCat}>{row.cat}</div>
                  <div style={styles.distTrack}>
                    <div style={{ ...styles.distFill, width: `${clamp(pct, 0, 100)}%` }} />
                  </div>
                  <div style={styles.distVal}>{row.grams.toFixed(0)} g</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Barra de búsqueda + botón agregar ── */}
      <div style={styles.actionsRow}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar" style={{ ...styles.input, minWidth: 220 }} />
        <button style={styles.primaryBtn} onClick={() => setAddOpen(true)}>+ Agregar componente</button>
      </div>

      {/* ── Lista de componentes ── */}
      {filteredParts.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🧩</div>
          <div style={styles.emptyTitle}>Sin componentes</div>
          <div style={styles.emptyText}>Agrega tus piezas y verás el peso total automáticamente.</div>
          <div style={{ height: 10 }} />
          <button style={styles.primaryBtn} onClick={() => setAddOpen(true)}>Agregar primero</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredParts.map((p) => {
            const row = editById[p.id] || { weight_g: p.weight_override ?? "" };
            const isEditing = editingPartId === p.id;
            const pct = totalWeightG > 0 ? ((Number(p.weight_g) || 0) / totalWeightG) * 100 : 0;
            const guardar = () => savePart(p.id);

            return (
              <div key={p.id} style={styles.partCard}>
                <div style={styles.partTop}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.partName}>
                      {p.name}
                      {p.confidence === "unverified" && (
                        <span style={styles.badgeUnverified} title="Nadie ha comprobado este peso todavía">
                          sin verificar
                        </span>
                      )}
                    </div>

                    {!isEditing ? (
                      <div style={styles.partMeta}>
                        {p.category}
                        {p.subcategory ? ` › ${p.subcategory}` : ""}
                        {" • "}{p.weight_g ?? "—"} g
                        {p.weight_override != null ? (
                          <span style={styles.partMetaSoft} title={`Peso de referencia: ${p.catalogWeight ?? "?"} g`}>
                            {" • peso ajustado"}
                          </span>
                        ) : null}
                        {p.weight_g != null ? <span style={styles.partMetaSoft}> {"•"} {pct.toFixed(1)}%</span> : null}
                        {p.sku ? <div style={styles.partSubMeta}>SKU {p.sku}</div> : null}
                      </div>
                    ) : (
                      <div style={styles.editRow}>
                        <div style={styles.hint}>
                          Pesa tu pieza y ajústalo. La referencia es{" "}
                          <strong>{p.catalogWeight ?? "—"} g</strong>.
                        </div>
                        <input autoFocus value={String(row.weight_g ?? "")}
                          onChange={(e) => setEditById((prev) => ({ ...prev, [p.id]: { weight_g: e.target.value } }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); guardar(); }
                            if (e.key === "Escape") setEditingPartId(null);
                          }}
                          placeholder={p.catalogWeight != null ? String(p.catalogWeight) : "peso (g)"}
                          inputMode="numeric" style={{ ...styles.input, width: 160 }} />
                        <button style={styles.primaryBtn} onClick={guardar}>Guardar</button>
                        <button style={styles.secondaryBtn} onClick={() => setEditingPartId(null)}>Cancelar</button>
                      </div>
                    )}
                  </div>

                  <div style={styles.partBtns}>
                    {!isEditing ? (
                      <button style={styles.secondaryBtn} onClick={() => setEditingPartId(p.id)}>Peso</button>
                    ) : null}
                    <button style={styles.ghostBtn} onClick={() => setConfirmPartId(p.id)}>Quitar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FAB ── */}
      <button onClick={() => setAddOpen(true)} style={styles.fab} aria-label="Agregar componente" title="Agregar componente">
        +
      </button>

      {/* ── Modal para agregar componente ── */}
      {addOpen ? (
        <div style={styles.modalWrap}>
          <div style={styles.modalOverlay} onClick={() => setAddOpen(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Agregar componente</div>
              <button style={styles.iconBtn} onClick={() => setAddOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={addPart} style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {/* 1 · Categoría */}
              <div style={styles.field}>
                <div style={styles.label}>Categoría</div>
                <select
                  value={partCategory}
                  onChange={(e) => {
                    setPartCategory(e.target.value);
                    setPartSubcategory(""); setPartBrand(""); setPartModel(""); setCatalogHit(null);
                  }}
                  className="dark-select" style={styles.input}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 2 · Subcategoría — solo si el catálogo tiene alguna */}
              {subcategoryOptions.length > 0 && (
                <div style={styles.field}>
                  <div style={styles.label}>Tipo <span style={styles.optional}>(opcional)</span></div>
                  <ComboBox
                    value={partSubcategory}
                    onChange={(v) => { setPartSubcategory(v); setPartBrand(""); setPartModel(""); setCatalogHit(null); }}
                    options={subcategoryOptions}
                    placeholder="Ej: Cassette"
                    style={styles.comboWrap}
                  />
                </div>
              )}

              {/* 3 · Marca */}
              <div style={styles.field}>
                <div style={styles.label}>Marca</div>
                <ComboBox
                  value={partBrand}
                  onChange={(v) => { setPartBrand(v); setPartModel(""); setCatalogHit(null); }}
                  options={brandOptions}
                  placeholder="Ej: Fox"
                  style={styles.comboWrap}
                />
                {brandOptions.length === 0 && (
                  <div style={styles.hint}>
                    Todavía no hay marcas sugeridas para “{partCategory}”.
                    Escríbela y queda guardada para la próxima.
                  </div>
                )}
              </div>

              {/* 4 · Modelo */}
              <div style={styles.field}>
                <div style={styles.label}>Modelo</div>
                <ComboBox
                  value={partModel}
                  onChange={applyModel}
                  options={modelOptions}
                  placeholder={partBrand.trim() ? "Ej: F100 RCL" : "Elige una marca primero"}
                  style={styles.comboWrap}
                />
                {catalogHit ? (
                  <div style={styles.catalogHit}>
                    ✓ Peso y SKU rellenados solos
                    {catalogHit.confidence === "likely" && " · peso estimado"}
                    {catalogHit.confidence === "unverified" && " · peso sin comprobar"}
                  </div>
                ) : (partBrand.trim() && partModel.trim()) ? (
                  <div style={styles.hint}>
                    Componente nuevo. Queda guardado para la próxima vez.
                  </div>
                ) : null}
              </div>

              {/* 5 · Peso — solo si se activa */}
              <div style={styles.field}>
                <label style={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={partHasWeight}
                    onChange={(e) => {
                      setPartHasWeight(e.target.checked);
                      if (!e.target.checked) setPartWeight("");
                    }}
                    style={styles.checkbox}
                  />
                  <span>Añadir peso</span>
                </label>
                {partHasWeight && (
                  <input
                    value={partWeight}
                    onChange={(e) => setPartWeight(e.target.value)}
                    placeholder="Ej: 342"
                    inputMode="numeric"
                    style={{ ...styles.input, marginTop: 8 }}
                  />
                )}
              </div>

              {/* 6 · SKU */}
              <div style={styles.field}>
                <div style={styles.label}>SKU / Código <span style={styles.optional}>(opcional)</span></div>
                <input value={partSku} onChange={(e) => setPartSku(e.target.value)} placeholder="Ej: CS-M7100-12" style={styles.input} />
              </div>

              <div style={styles.btnRowRight}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setAddOpen(false)}>Cancelar</button>
                <button type="submit" style={styles.primaryBtn}>Guardar</button>
              </div>

              <div style={styles.tipRow}>
                <div style={styles.tipDot} aria-hidden="true" />
                <div style={styles.tipText}>Tip: si ya tienes este componente con el mismo nombre y categoría, se reutiliza el de tu biblioteca en vez de duplicarlo.</div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Modal confirmación quitar / eliminar componente ── */}
      {/* Aviso: la bici ya tiene una pieza en una categoría que suele llevar una sola */}
      {confirmDupOpen && (
        <div style={{ ...styles.modalWrap, zIndex: 70 }} onClick={() => setConfirmDupOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.92)", textAlign: "center", marginBottom: 8 }}>
              Esta bici ya tiene {partCategory.toLowerCase()}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.5, marginBottom: 4 }}>
              Ya está{sameCategoryParts.length > 1 ? "n" : ""}:
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.6, marginBottom: 14 }}>
              {sameCategoryParts.map((p) => p.name).join(" · ")}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.5, marginBottom: 18 }}>
              Normalmente una bici lleva una sola pieza de esta categoría.
              Si es a propósito, puedes agregarla igual.
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <button style={styles.primaryBtn} onClick={() => setConfirmDupOpen(false)}>
                Volver a revisar
              </button>
              <button style={styles.secondaryBtn} onClick={() => addPart()}>
                Agregar igual
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPartId && (
        <div style={{ ...styles.modalWrap, zIndex: 60 }} onClick={() => setConfirmPartId(null)}>
          <div style={{ ...styles.modal, maxWidth: 380, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🧩</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.92)", textAlign: "center", marginBottom: 6 }}>
              {confirmPart?.name ?? "Componente"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.5, marginBottom: 20 }}>
              ¿Quitar este componente de la bici?
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <button
                style={{ ...styles.ghostBtn, width: "100%", textAlign: "center", color: "rgba(239,68,68,0.85)", borderColor: "rgba(239,68,68,0.25)" }}
                onClick={removePart}
              >
                Quitar
              </button>
              <button
                style={{ ...styles.secondaryBtn, width: "100%", textAlign: "center" }}
                onClick={() => setConfirmPartId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const styles = {
  heroCard: { borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", padding: 14 },
  heroTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" },
  heroKicker: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  heroTitleRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 6 },
  heroTitle: { margin: 0, fontSize: 26, lineHeight: 1.05, letterSpacing: -0.6, color: "rgba(255,255,255,0.96)", maxWidth: 640, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  heroMeta: { marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroMetaStrong: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  heroMetaSoft: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  heroDot: { width: 4, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.25)" },
  heroSubMeta: { marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.62)" },
  heroPill: { borderRadius: 18, padding: "12px 12px", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 200 },
  heroPillTitle: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  heroPillValue: { marginTop: 6, fontWeight: 900, fontSize: 24, color: "rgba(255,255,255,0.92)" },
  heroPillSub: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.60)" },
  sectionTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  sectionTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  sectionHint: { fontSize: 12, color: "rgba(255,255,255,0.60)" },
  distRow: { display: "grid", gridTemplateColumns: "120px 1fr 70px", gap: 10, alignItems: "center" },
  distCat: { fontSize: 12, color: "rgba(255,255,255,0.70)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  distTrack: { height: 8, borderRadius: 99, overflow: "hidden", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" },
  distFill: { height: "100%", borderRadius: 99, background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(34,197,94,0.75))" },
  distVal: { textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.60)" },
  actionsRow: { display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginTop: 2 },
  grid: { marginTop: 2, display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  partCard: { padding: 14, borderRadius: 18, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" },
  partTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  partName: { fontWeight: 900, color: "rgba(255,255,255,0.92)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  partMeta: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.70)" },
  partMetaSoft: { color: "rgba(255,255,255,0.60)" },
  partSubMeta: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.52)" },
  partBtns: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  editRow: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  optional: { color: "rgba(255,255,255,0.38)", fontWeight: 400 },
  badgeUnverified: { marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(234,179,8,0.12)", color: "#facc15", border: "1px solid rgba(234,179,8,0.22)", verticalAlign: "middle" },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 },
  comboWrap: { width: "100%" },
  catalogHit: { fontSize: 11, color: "rgba(134,239,172,0.85)", lineHeight: 1.4, marginTop: 2 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "10px 0", userSelect: "none" },
  checkbox: { width: 18, height: 18, accentColor: "rgba(99,102,241,0.9)", cursor: "pointer" },
  input: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.22)", color: "rgba(255,255,255,0.92)", outline: "none", fontSize: 14 },
  primaryBtn: { border: 0, fontWeight: 900, padding: "12px 14px", borderRadius: 14, color: "#0b1220", background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))", boxShadow: "0 14px 30px rgba(0,0,0,0.35)", cursor: "pointer" },
  secondaryBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontWeight: 900, padding: "12px 14px", borderRadius: 14, cursor: "pointer" },
  ghostBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)", fontWeight: 900, padding: "12px 14px", borderRadius: 14, cursor: "pointer" },
  iconBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontWeight: 900, padding: "8px 10px", borderRadius: 12, cursor: "pointer" },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnRowRight: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" },
  grid2: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  empty: { padding: "18px 14px", borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", textAlign: "center" },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: 900 },
  emptyTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  emptyText: { marginTop: 6, color: "rgba(255,255,255,0.68)", fontSize: 13 },
  fab: { position: "fixed", right: 18, bottom: 18, width: 56, height: 56, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(99,102,241,0.65), rgba(34,197,94,0.55))", color: "rgba(255,255,255,0.95)", fontWeight: 900, fontSize: 26, boxShadow: "0 18px 55px rgba(0,0,0,0.45)", cursor: "pointer" },
  modalWrap: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)" },
  modal: { position: "relative", width: "100%", maxWidth: 720, borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(7,10,18,0.90)", backdropFilter: "blur(12px)", boxShadow: "0 25px 70px rgba(0,0,0,0.55)", padding: 14 },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.10)" },
  modalTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  tipRow: { display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.65)", fontSize: 12 },
  tipDot: { width: 8, height: 8, borderRadius: 99, background: "rgba(99,102,241,0.75)" },
  tipText: { lineHeight: 1.4 },
};
