"use client";

export const dynamic = "force-dynamic";

// Página de detalle de una bicicleta.
// Muestra y permite gestionar:
//   - Datos de la bici (nombre, tipo, año, talla, notas) con edición inline
//   - Peso total calculado automáticamente sumando todos los componentes
//   - Distribución de peso por categoría (gráfico de barras simple)
//   - Lista de componentes con búsqueda, edición y eliminación
//   - Modal para agregar nuevos componentes
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import AppHeader from "../../../../components/AppHeader";
import PageShell from "../../../../components/PageShell";
import { DEFAULT_CATEGORIES } from "../../../../lib/constants";

// ── Constantes y funciones helper ─────────────────────────────────────────────

// Crea un objeto vacío para el formulario de edición de bici
const emptyBikeDraft = () => ({ name: "", type: "", year: "", size: "", notes: "" });

// Convierte los datos de una bici en el formato del formulario de edición
const draftFromBike = (b) => ({
  name: b?.name ?? "",
  type: b?.type ?? "",
  year: b?.year ?? "",
  size: b?.size ?? "",
  notes: b?.notes ?? "",
});

// Convierte gramos a kilogramos con 2 decimales. Ej: 8200 → "8.20 kg"
function formatKgFromGrams(g) {
  if (!Number.isFinite(g) || g <= 0) return "0.00 kg";
  return `${(g / 1000).toFixed(2)} kg`;
}

// Convierte un string a número o null (si está vacío). Retorna NaN si es inválido.
function parseNullableNumber(input) {
  if (input === "") return null;
  const n = Number(input);
  return Number.isNaN(n) ? NaN : n;
}

// Valida el año: puede ser vacío (null) o un número entre 1900 y 2100
function validateYearMaybe(yearStr) {
  const yearVal = parseNullableNumber(yearStr);
  if (yearVal === null) return { ok: true, value: null };   // vacío = válido
  if (Number.isNaN(yearVal) || yearVal < 1900 || yearVal > 2100) return { ok: false };
  return { ok: true, value: yearVal };
}

// Elimina duplicados de un array manteniendo el primer elemento de cada valor
function uniq(arr) {
  return arr.filter((x, i) => arr.indexOf(x) === i);
}

// Limita un número entre un mínimo y un máximo
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function BikeDetailPage() {
  const router = useRouter();
  const { bikeId } = useParams(); // ID de la bici desde la URL: /garage/[bikeId]

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [bike, setBike] = useState(null);            // datos de la bici desde Supabase

  const [parts, setParts] = useState([]);            // lista de componentes de la bici
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES); // categorías disponibles (default + personalizadas sin ocultas)

  // Estado del modal para agregar un nuevo componente
  const [addOpen, setAddOpen] = useState(false);     // true = modal visible
  const [partName, setPartName] = useState("");
  const [partCategory, setPartCategory] = useState("Drivetrain");
  const [partWeight, setPartWeight] = useState("");

  const [query, setQuery] = useState("");            // texto de búsqueda de componentes

  // Estado de edición inline de componentes
  // editingPartId: ID del componente en edición actualmente (null = ninguno)
  // editById: objeto con los valores del formulario de edición, indexado por ID
  const [editingPartId, setEditingPartId] = useState(null);
  const [editById, setEditById] = useState({});

  // Estado de edición de la bici
  const [bikeEditMode, setBikeEditMode] = useState(false); // true = formulario de edición visible
  const [bikeDraft, setBikeDraft] = useState(emptyBikeDraft()); // valores del formulario

  // ── Valores calculados (useMemo: no se recalculan si no cambian los datos) ──

  // Suma total del peso de todos los componentes en gramos
  const totalWeightG = useMemo(
    () => parts.reduce((acc, p) => acc + (Number(p.weight_g) || 0), 0),
    [parts]
  );

  // Peso agrupado por categoría, ordenado de mayor a menor (para el gráfico de distribución)
  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of parts) {
      const cat = p.category || "Other";
      map.set(cat, (map.get(cat) || 0) + (Number(p.weight_g) || 0));
    }
    return Array.from(map.entries())
      .map(([cat, grams]) => ({ cat, grams }))
      .sort((a, b) => b.grams - a.grams); // de más pesada a menos pesada
  }, [parts]);

  // Categoría con más peso (la que aparece como "Top" en el hero)
  const topCategory = useMemo(() => {
    if (!byCategory.length) return "—";
    return byCategory[0]?.cat ?? "—";
  }, [byCategory]);

  // Componentes filtrados por la búsqueda del usuario (filtra por nombre o categoría)
  const filteredParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts; // sin búsqueda, devuelve todos
    return parts.filter((p) => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      return n.includes(q) || c.includes(q); // coincide si el nombre o la categoría contiene el texto
    });
  }, [parts, query]);

  // ── Helper: obtiene el ID del usuario o redirige al login ─────────────────
  const getUserIdOrRedirect = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) { router.replace("/login"); return null; }
    return uid;
  };

  // ── Helper: registra un evento en la tabla part_logs (historial de cambios) ─
  // Esto crea el registro que aparece en la página de historial de la bici.
  const logEvent = async ({ userId, bikeId, partId, action, oldW, newW }) => {
    const { error } = await supabase.from("part_logs").insert([{
      user_id: userId,
      bike_id: bikeId,
      part_id: partId,
      action,               // "created", "updated" o "deleted"
      old_weight_g: oldW ?? null,
      new_weight_g: newW ?? null,
    }]);
    if (error) console.error("part_logs insert error:", error);
  };

  // ── Carga inicial de datos ─────────────────────────────────────────────────
  useEffect(() => {
    if (!bikeId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return router.replace("/login");

        // Carga en paralelo: categorías personalizadas, categorías ocultas, datos de la bici y componentes
        const [catsRes, hiddenRes, bikeRes, partsRes] = await Promise.all([
          supabase.from("categories").select("name").order("created_at", { ascending: true }),
          supabase.from("category_hidden").select("name"),
          supabase.from("bikes").select("*").eq("id", bikeId).single(),
          supabase.from("parts").select("*").eq("bike_id", bikeId).order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;

        if (bikeRes.error) { setBike(null); return; } // bici no encontrada

        setBike(bikeRes.data);
        setBikeDraft(draftFromBike(bikeRes.data));

        // Construye la lista de categorías: default + personalizadas, sin las ocultas
        const customCats = (catsRes.data || []).map((c) => c.name);
        const hidden = new Set((hiddenRes.data || []).map((h) => h.name));
        const merged = uniq([...DEFAULT_CATEGORIES, ...customCats]).filter((n) => !hidden.has(n));
        const finalCats = merged.length > 0 ? merged : DEFAULT_CATEGORIES;
        setCategories(finalCats);

        // Si la categoría seleccionada no está en la lista, usa la primera disponible
        if (finalCats.length > 0 && !finalCats.includes(partCategory)) setPartCategory(finalCats[0]);

        const rows = partsRes.data || [];
        setParts(rows);

        // Pre-rellena el estado de edición de cada componente con sus valores actuales
        const nextEdit = {};
        for (const p of rows)
          nextEdit[p.id] = { name: p.name ?? "", category: p.category, weight_g: p.weight_g ?? "" };
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

  // Cancela la edición y restaura los valores originales de la bici
  const cancelBikeEdit = () => {
    setBikeEditMode(false);
    setBikeDraft(draftFromBike(bike));
  };

  // Guarda los cambios de la bici en Supabase
  const saveBike = async () => {
    if (!bikeDraft.name.trim()) return alert("El nombre no puede quedar vacío.");

    const yearCheck = validateYearMaybe(bikeDraft.year);
    if (!yearCheck.ok) return alert("Año inválido (ej: 2021).");

    // patch: solo los campos que se pueden editar (evita sobreescribir otros campos)
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

  // Agrega un nuevo componente a la bici
  const addPart = async (e) => {
    e?.preventDefault?.();
    if (!partName.trim()) return alert("Ponle un nombre al componente.");

    const w = parseNullableNumber(partWeight);
    if (partWeight !== "" && (Number.isNaN(w) || w < 0)) return alert("Peso inválido.");

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const { data, error } = await supabase
      .from("parts")
      .insert([{ user_id: userId, bike_id: bikeId, name: partName.trim(), category: partCategory, weight_g: w }])
      .select("*").single();

    if (error) return alert(error.message);

    // Registra el evento en el historial
    await logEvent({ userId, bikeId, partId: data.id, action: "created", oldW: null, newW: data.weight_g ?? null });

    setParts((prev) => [data, ...prev]); // agrega el componente al inicio de la lista
    setEditById((prev) => ({ ...prev, [data.id]: { name: data.name ?? "", category: data.category, weight_g: data.weight_g ?? "" } }));

    // Limpia el formulario y cierra el modal
    setPartName("");
    setPartWeight("");
    setAddOpen(false);
  };

  // Elimina un componente (con confirmación previa)
  const deletePart = async (partId) => {
    const ok = confirm("¿Eliminar este componente?");
    if (!ok) return;

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const partToDelete = parts.find((p) => p.id === partId);

    // Registra el evento ANTES de borrar para tener el peso en el historial
    await logEvent({ userId, bikeId, partId, action: "deleted", oldW: partToDelete?.weight_g ?? null, newW: null });

    const { error } = await supabase.from("parts").delete().eq("id", partId);
    if (error) return alert(error.message);

    // Elimina el componente del estado local
    setParts((prev) => prev.filter((p) => p.id !== partId));
    setEditById((prev) => { const next = { ...prev }; delete next[partId]; return next; });

    if (editingPartId === partId) setEditingPartId(null); // cierra el modo edición si estaba abierto
  };

  // Guarda los cambios de un componente editado inline
  const savePart = async (partId) => {
    const row = editById[partId];
    if (!row) return;

    const nextName = (row.name ?? "").trim();
    if (!nextName) return alert("Nombre inválido.");

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const old = parts.find((p) => p.id === partId);
    const oldWeight = old?.weight_g ?? null;

    const w = parseNullableNumber(String(row.weight_g ?? ""));
    if (row.weight_g !== "" && (Number.isNaN(w) || w < 0)) return alert("Peso inválido.");

    const { data, error } = await supabase
      .from("parts").update({ name: nextName, category: row.category, weight_g: w })
      .eq("id", partId).select("*").single();

    if (error) return alert(error.message);

    // Registra el cambio en el historial con el peso anterior y el nuevo
    await logEvent({ userId, bikeId, partId, action: "updated", oldW: oldWeight, newW: w ?? null });

    // Actualiza el componente en la lista local
    setParts((prev) => prev.map((p) => (p.id === partId ? data : p)));
    setEditById((prev) => ({ ...prev, [partId]: { name: data.name ?? "", category: data.category, weight_g: data.weight_g ?? "" } }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Botón ← Garage reutilizado en varios lugares
  const backBtn = (
    <button onClick={() => router.push("/garage")}
      style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", cursor: "pointer", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontWeight: 800 }}>
      ← Garage
    </button>
  );

  // CASO 1: Cargando → esqueleto animado
  if (loading) {
    return (
      <PageShell header={<AppHeader actions={[backBtn]} />}>
        <div className="animate-pulse rounded-[18px] border p-4"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="h-5 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
          <div className="mt-3 h-4 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="mt-5 h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.10)" }} />
        </div>
      </PageShell>
    );
  }

  // CASO 2: Bici no encontrada (ID inválido o sin permisos)
  if (!bike) {
    return (
      <PageShell header={<AppHeader actions={[backBtn]} />}>
        <div className="rounded-[18px] border p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border text-lg"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)" }}>🤕</div>
          <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>No encontré esta bicicleta</div>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>Puede que no exista o no tengas permisos.</p>
          <button onClick={() => router.push("/garage")} style={styles.primaryBtn} className="mt-4">Volver al Garage</button>
        </div>
      </PageShell>
    );
  }

  const partCount = parts.length;

  // Acciones del header: links al historial y mantenimiento + botón volver
  const navLinkStyle = { color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, padding: "10px" };
  const headerActions = [
    <a key="maintenance" href={`/garage/${bikeId}/maintenance`} style={navLinkStyle}>
      Mantenimiento
    </a>,
    <a key="history" href={`/garage/${bikeId}/history`} style={navLinkStyle}>
      Historial
    </a>,
    <button key="back" onClick={() => router.push("/garage")}
      style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", cursor: "pointer", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontWeight: 800 }}>
      ← Garage
    </button>,
  ];

  // CASO 3: Todo OK → muestra la página completa
  return (
    <PageShell header={<AppHeader actions={headerActions} />}>

      {/* ── Tarjeta hero: datos de la bici + peso total + distribución ── */}
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={{ minWidth: 0 }}>
            {/* Vista normal (sin edición) */}
            {!bikeEditMode ? (
              <>
                <div style={styles.heroKicker}>Bici</div>
                <div style={styles.heroTitleRow}>
                  <h1 style={styles.heroTitle}>{bike.name}</h1>
                  {/* Botón para activar el modo edición de la bici */}
                  <button onClick={() => setBikeEditMode(true)} style={styles.iconBtn} title="Editar bici" aria-label="Editar bici">✏️</button>
                </div>

                {/* Resumen: peso total, cantidad de componentes y categoría top */}
                <div style={styles.heroMeta}>
                  <span style={styles.heroMetaStrong}>{formatKgFromGrams(totalWeightG)}</span>{" "}
                  <span style={styles.heroMetaSoft}>({totalWeightG.toFixed(0)} g)</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroMetaSoft}>{partCount} componente{partCount === 1 ? "" : "s"}</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroMetaSoft}>Top: {topCategory}</span>
                </div>

                {/* Detalles: tipo, año, talla, notas */}
                <div style={styles.heroSubMeta}>
                  {bike.type ? `${bike.type}` : "—"}
                  {bike.year ? ` • ${bike.year}` : ""}
                  {bike.size ? ` • Talla ${bike.size}` : ""}
                  {bike.notes ? ` • ${bike.notes}` : ""}
                </div>
              </>
            ) : (
              // Formulario de edición de la bici
              <div style={{ display: "grid", gap: 10 }}>
                <div style={styles.field}>
                  <div style={styles.label}>Nombre</div>
                  {/* setBikeDraft actualiza solo el campo "name" manteniendo el resto igual (...p) */}
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

          {/* Pastilla del peso total (solo visible fuera del modo edición) */}
          {!bikeEditMode ? (
            <div style={styles.heroPill}>
              <div style={styles.heroPillTitle}>Peso Total</div>
              <div style={styles.heroPillValue}>{formatKgFromGrams(totalWeightG)}</div>
              <div style={styles.heroPillSub}>({totalWeightG.toFixed(0)} g)</div>
            </div>
          ) : null}
        </div>

        {/* ── Distribución de peso por categoría ── */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.sectionTop}>
            <div style={styles.sectionTitle}>Distribución de peso</div>
            <div style={styles.sectionHint}>Principales categorías</div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {/* Muestra las 6 categorías con más peso. Si no hay componentes, muestra una fila vacía. */}
            {(byCategory.length ? byCategory.slice(0, 6) : [{ cat: "Sin piezas", grams: 0 }]).map((row) => {
              const pct = totalWeightG > 0 ? (row.grams / totalWeightG) * 100 : 0; // porcentaje del total
              return (
                <div key={row.cat} style={styles.distRow}>
                  <div style={styles.distCat}>{row.cat}</div>
                  <div style={styles.distTrack}> {/* barra de fondo */}
                    <div style={{ ...styles.distFill, width: `${clamp(pct, 0, 100)}%` }} /> {/* barra de relleno */}
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
        // Estado vacío: sin componentes o sin resultados de búsqueda
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
            const row = editById[p.id] || { name: p.name ?? "", category: p.category, weight_g: p.weight_g ?? "" };
            const isEditing = editingPartId === p.id; // true si este componente está en edición
            const pct = totalWeightG > 0 ? ((Number(p.weight_g) || 0) / totalWeightG) * 100 : 0; // % del peso total

            return (
              <div key={p.id} style={styles.partCard}>
                <div style={styles.partTop}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.partName}>{isEditing ? (row.name ?? p.name) : p.name}</div>

                    {!isEditing ? (
                      // Vista normal: muestra categoría, peso y % del total
                      <div style={styles.partMeta}>
                        {p.category} • {p.weight_g ?? "—"} g
                        {p.weight_g != null ? <span style={styles.partMetaSoft}> • {pct.toFixed(1)}%</span> : null}
                      </div>
                    ) : (
                      // Formulario de edición inline del componente
                      <div style={styles.editRow}>
                        {/* Campo nombre con autoFocus y guardado con Enter */}
                        <input autoFocus value={String(row.name ?? "")}
                          onChange={(e) => setEditById((prev) => ({ ...prev, [p.id]: { ...row, name: e.target.value } }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); savePart(p.id); setEditingPartId(null); }
                            if (e.key === "Escape") setEditingPartId(null);
                          }}
                          placeholder="Nombre" style={{ ...styles.input, minWidth: 220 }} />

                        {/* Selector de categoría */}
                        <select value={row.category}
                          onChange={(e) => setEditById((prev) => ({ ...prev, [p.id]: { ...row, category: e.target.value } }))}
                          className="dark-select" style={{ ...styles.input, padding: "10px 12px" }}>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Campo peso en gramos */}
                        <input value={String(row.weight_g ?? "")}
                          onChange={(e) => setEditById((prev) => ({ ...prev, [p.id]: { ...row, weight_g: e.target.value } }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); savePart(p.id); setEditingPartId(null); }
                            if (e.key === "Escape") setEditingPartId(null);
                          }}
                          placeholder="peso (g)" inputMode="numeric" style={{ ...styles.input, width: 140 }} />

                        <button style={styles.primaryBtn} onClick={async () => { await savePart(p.id); setEditingPartId(null); }}>Guardar</button>
                        <button style={styles.secondaryBtn} onClick={() => setEditingPartId(null)}>Cancelar</button>
                      </div>
                    )}
                  </div>

                  {/* Botones editar / eliminar (solo visibles fuera del modo edición) */}
                  <div style={styles.partBtns}>
                    {!isEditing ? (
                      <button style={styles.secondaryBtn} onClick={() => setEditingPartId(p.id)}>Editar</button>
                    ) : null}
                    <button style={styles.ghostBtn} onClick={() => deletePart(p.id)}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Botón flotante (FAB) — visible en móvil ── */}
      <button onClick={() => setAddOpen(true)} style={styles.fab} aria-label="Agregar componente" title="Agregar componente">
        +
      </button>

      {/* ── Modal para agregar componente ── */}
      {addOpen ? (
        <div style={styles.modalWrap}>
          {/* Overlay oscuro: al hacer clic fuera cierra el modal */}
          <div style={styles.modalOverlay} onClick={() => setAddOpen(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Agregar componente</div>
              <button style={styles.iconBtn} onClick={() => setAddOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={addPart} style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div style={styles.field}>
                <div style={styles.label}>Nombre</div>
                <input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Ej: Cassette 11-42" style={styles.input} />
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Categoría</div>
                  <select value={partCategory} onChange={(e) => setPartCategory(e.target.value)} className="dark-select" style={styles.input}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Peso (g)</div>
                  <input value={partWeight} onChange={(e) => setPartWeight(e.target.value)} placeholder="Ej: 342" inputMode="numeric" style={styles.input} />
                </div>
              </div>

              <div style={styles.btnRowRight}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setAddOpen(false)}>Cancelar</button>
                <button type="submit" style={styles.primaryBtn}>Guardar</button>
              </div>

              {/* Tip: el peso es opcional */}
              <div style={styles.tipRow}>
                <div style={styles.tipDot} aria-hidden="true" />
                <div style={styles.tipText}>Tip: si no sabes el peso aún, déjalo vacío.</div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
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
  // Fila de distribución: nombre | barra de progreso | valor en gramos
  distRow: { display: "grid", gridTemplateColumns: "120px 1fr 70px", gap: 10, alignItems: "center" },
  distCat: { fontSize: 12, color: "rgba(255,255,255,0.70)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  distTrack: { height: 8, borderRadius: 99, overflow: "hidden", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" },
  distFill: { height: "100%", borderRadius: 99, background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(34,197,94,0.75))" }, // barra de relleno con gradiente morado → verde
  distVal: { textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.60)" },
  actionsRow: { display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginTop: 2 },
  grid: { marginTop: 2, display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  partCard: { padding: 14, borderRadius: 18, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" },
  partTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  partName: { fontWeight: 900, color: "rgba(255,255,255,0.92)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  partMeta: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.70)" },
  partMetaSoft: { color: "rgba(255,255,255,0.60)" },
  partBtns: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  editRow: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
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
  // FAB: botón flotante circular fijo en la esquina inferior derecha
  fab: { position: "fixed", right: 18, bottom: 18, width: 56, height: 56, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(99,102,241,0.65), rgba(34,197,94,0.55))", color: "rgba(255,255,255,0.95)", fontWeight: 900, fontSize: 26, boxShadow: "0 18px 55px rgba(0,0,0,0.45)", cursor: "pointer" },
  // Modal: capa superior con overlay oscuro y contenido centrado
  modalWrap: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)" }, // fondo oscurecido al abrir el modal
  modal: { position: "relative", width: "100%", maxWidth: 720, borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(7,10,18,0.90)", backdropFilter: "blur(12px)", boxShadow: "0 25px 70px rgba(0,0,0,0.55)", padding: 14 },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.10)" },
  modalTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  tipRow: { display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.65)", fontSize: 12 },
  tipDot: { width: 8, height: 8, borderRadius: 99, background: "rgba(99,102,241,0.75)" },
  tipText: { lineHeight: 1.4 },
};

/* Responsive tweak: 2 columnas en pantallas grandes */
if (typeof window !== "undefined") {
  // Nada aquí — lo dejamos SSR-safe.
}
