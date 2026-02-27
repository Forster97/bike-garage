"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

/* =========================
   Constants / Helpers
========================= */

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

const emptyBikeDraft = () => ({
  name: "",
  type: "",
  year: "",
  size: "",
  notes: "",
});

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* =========================
   Component
========================= */

export default function BikeDetailPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  // page state
  const [loading, setLoading] = useState(true);
  const [bike, setBike] = useState(null);

  // parts + categories
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // add-part (modal)
  const [addOpen, setAddOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [partCategory, setPartCategory] = useState("Drivetrain");
  const [partWeight, setPartWeight] = useState("");

  // search
  const [query, setQuery] = useState("");

  // inline edit parts
  const [editingPartId, setEditingPartId] = useState(null);
  const [editById, setEditById] = useState({}); // { [partId]: { category, weight_g } }

  // edit bike
  const [bikeEditMode, setBikeEditMode] = useState(false);
  const [bikeDraft, setBikeDraft] = useState(emptyBikeDraft());

  const totalWeightG = useMemo(
    () => parts.reduce((acc, p) => acc + (Number(p.weight_g) || 0), 0),
    [parts]
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of parts) {
      const cat = p.category || "Other";
      map.set(cat, (map.get(cat) || 0) + (Number(p.weight_g) || 0));
    }
    return Array.from(map.entries())
      .map(([cat, grams]) => ({ cat, grams }))
      .sort((a, b) => b.grams - a.grams);
  }, [parts]);

  const filteredParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      return n.includes(q) || c.includes(q);
    });
  }, [parts, query]);

  /* =========================
     Shared button styles
  ========================= */

  // Primario con borde + ring + sombra para que NO desaparezca.
  const BTN_PRIMARY =
    "inline-flex items-center justify-center rounded-xl border border-primary/60 ring-1 ring-border/60 bg-primary px-4 py-2 text-sm font-semibold text-bg shadow-soft hover:brightness-110 hover:ring-border/80 transition";

  const BTN_SECONDARY =
    "inline-flex items-center justify-center rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition";

  /* =========================
     Auth / Logging
  ========================= */

  const getUserIdOrRedirect = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) {
      router.replace("/login");
      return null;
    }
    return uid;
  };

  const logEvent = async ({ userId, bikeId, partId, action, oldW, newW }) => {
    const { error } = await supabase.from("part_logs").insert([
      {
        user_id: userId,
        bike_id: bikeId,
        part_id: partId,
        action,
        old_weight_g: oldW ?? null,
        new_weight_g: newW ?? null,
      },
    ]);

    if (error) console.error("part_logs insert error:", error);
  };

  /* =========================
     Load
  ========================= */

  useEffect(() => {
    if (!bikeId) return;

    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.replace("/login");

      const [catsRes, hiddenRes, bikeRes, partsRes] = await Promise.all([
        supabase.from("categories").select("name").order("created_at", { ascending: true }),
        supabase.from("category_hidden").select("name"),
        supabase.from("bikes").select("*").eq("id", bikeId).single(),
        supabase.from("parts").select("*").eq("bike_id", bikeId).order("created_at", { ascending: false }),
      ]);

      if (bikeRes.error) {
        setBike(null);
        setLoading(false);
        return;
      }

      setBike(bikeRes.data);
      setBikeDraft(draftFromBike(bikeRes.data));

      const customCats = (catsRes.data || []).map((c) => c.name);
      const hidden = new Set((hiddenRes.data || []).map((h) => h.name));

      const merged = uniq([...DEFAULT_CATEGORIES, ...customCats]).filter((n) => !hidden.has(n));
      const finalCats = merged.length > 0 ? merged : DEFAULT_CATEGORIES;
      setCategories(finalCats);

      if (finalCats.length > 0 && !finalCats.includes(partCategory)) {
        setPartCategory(finalCats[0]);
      }

      const rows = partsRes.data || [];
      setParts(rows);

      const nextEdit = {};
      for (const p of rows) {
        nextEdit[p.id] = { category: p.category, weight_g: p.weight_g ?? "" };
      }
      setEditById(nextEdit);

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikeId, router]);

  /* =========================
     Bike Editing
  ========================= */

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

  /* =========================
     Parts CRUD
  ========================= */

  const addPart = async (e) => {
    e?.preventDefault?.();

    if (!partName.trim()) return alert("Ponle un nombre al componente.");

    const w = parseNullableNumber(partWeight);
    if (partWeight !== "" && (Number.isNaN(w) || w < 0)) return alert("Peso inválido.");

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const { data, error } = await supabase
      .from("parts")
      .insert([
        {
          user_id: userId,
          bike_id: bikeId,
          name: partName.trim(),
          category: partCategory,
          weight_g: w,
        },
      ])
      .select("*")
      .single();

    if (error) return alert(error.message);

    await logEvent({
      userId,
      bikeId,
      partId: data.id,
      action: "created",
      oldW: null,
      newW: data.weight_g ?? null,
    });

    setParts((prev) => [data, ...prev]);
    setEditById((prev) => ({
      ...prev,
      [data.id]: { category: data.category, weight_g: data.weight_g ?? "" },
    }));

    setPartName("");
    setPartWeight("");
    setAddOpen(false);
  };

  const deletePart = async (partId) => {
    const ok = confirm("¿Eliminar este componente?");
    if (!ok) return;

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const partToDelete = parts.find((p) => p.id === partId);

    await logEvent({
      userId,
      bikeId,
      partId,
      action: "deleted",
      oldW: partToDelete?.weight_g ?? null,
      newW: null,
    });

    const { error } = await supabase.from("parts").delete().eq("id", partId);
    if (error) return alert(error.message);

    setParts((prev) => prev.filter((p) => p.id !== partId));
    setEditById((prev) => {
      const next = { ...prev };
      delete next[partId];
      return next;
    });

    if (editingPartId === partId) setEditingPartId(null);
  };

  const savePart = async (partId) => {
    const row = editById[partId];
    if (!row) return;

    const userId = await getUserIdOrRedirect();
    if (!userId) return;

    const old = parts.find((p) => p.id === partId);
    const oldWeight = old?.weight_g ?? null;

    const w = parseNullableNumber(String(row.weight_g ?? ""));
    if (row.weight_g !== "" && (Number.isNaN(w) || w < 0)) return alert("Peso inválido.");

    const { data, error } = await supabase
      .from("parts")
      .update({ category: row.category, weight_g: w })
      .eq("id", partId)
      .select("*")
      .single();

    if (error) return alert(error.message);

    await logEvent({
      userId,
      bikeId,
      partId,
      action: "updated",
      oldW: oldWeight,
      newW: w ?? null,
    });

    setParts((prev) => prev.map((p) => (p.id === partId ? data : p)));
    setEditById((prev) => ({
      ...prev,
      [partId]: { category: data.category, weight_g: data.weight_g ?? "" },
    }));
  };

  /* =========================
     Render
  ========================= */

  if (loading) return <div className="text-muted">Cargando...</div>;

  if (!bike) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/garage")} className={cn(BTN_SECONDARY, "px-3")}>
          ← Volver
        </button>

        <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
          <div className="text-lg font-semibold">No encontré esta bicicleta</div>
          <p className="mt-1 text-sm text-muted">Puede que no exista o no tengas permisos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/garage")} className={cn(BTN_SECONDARY, "px-3")}>
          ← Garage
        </button>

        <div className="flex items-center gap-2">
          <a
            href={`/garage/${bikeId}/history`}
            className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm text-muted hover:bg-surface/70 hover:text-text transition"
          >
            Historial
          </a>
          <a
            href="/settings/categories"
            className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm text-muted hover:bg-surface/70 hover:text-text transition"
          >
            Categorías
          </a>
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-xl2 border border-border bg-card/75 shadow-soft backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary2/10 via-transparent to-primary/10" />
        <div className="relative p-5">
          {!bikeEditMode ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs text-muted">Bike</div>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{bike.name}</h1>
                  <button
                    onClick={() => setBikeEditMode(true)}
                    className="rounded-lg border border-border bg-surface/40 px-2 py-1 text-sm text-muted hover:bg-surface/70 hover:text-text transition"
                    title="Editar bici"
                  >
                    ✏️
                  </button>
                </div>

                <div className="mt-2 text-sm text-muted">
                  {parts.length} componente{parts.length === 1 ? "" : "s"} •{" "}
                  <span className="text-text/90">Peso total</span>{" "}
                  <span className="font-semibold text-text">{formatKgFromGrams(totalWeightG)}</span>
                </div>

                <div className="mt-2 text-xs text-muted">
                  {bike.type ? `${bike.type}` : "—"} {bike.year ? `• ${bike.year}` : ""}{" "}
                  {bike.size ? `• Talla ${bike.size}` : ""} {bike.notes ? `• ${bike.notes}` : ""}
                </div>
              </div>

              <div className="rounded-xl2 border border-border bg-surface/40 p-4 text-left sm:text-right">
                <div className="text-xs text-muted">Peso Total</div>
                <div className="mt-1 text-3xl sm:text-4xl font-semibold">{formatKgFromGrams(totalWeightG)}</div>
                <div className="mt-1 text-xs text-muted">({totalWeightG.toFixed(0)} g)</div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1">
                <div className="text-xs text-muted">Nombre</div>
                <input
                  value={bikeDraft.name}
                  onChange={(e) => setBikeDraft((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tipo">
                  <input
                    value={bikeDraft.type}
                    onChange={(e) => setBikeDraft((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Gravel / MTB / Ruta..."
                  />
                </Field>

                <Field label="Año">
                  <input
                    value={bikeDraft.year}
                    onChange={(e) => setBikeDraft((p) => ({ ...p, year: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="2021"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Talla">
                  <input
                    value={bikeDraft.size}
                    onChange={(e) => setBikeDraft((p) => ({ ...p, size: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="S / M / 54..."
                  />
                </Field>

                <Field label="Notas">
                  <input
                    value={bikeDraft.notes}
                    onChange={(e) => setBikeDraft((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ej: tubeless 45mm, Rival 1x..."
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={saveBike} className={cn(BTN_PRIMARY, "w-full sm:w-auto")}>
                  Guardar
                </button>
                <button onClick={cancelBikeEdit} className={cn(BTN_SECONDARY, "w-full sm:w-auto")}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Distribution bars */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Distribución de peso</div>
              <div className="text-xs text-muted">Top categorías</div>
            </div>

            <div className="space-y-2">
              {(byCategory.length ? byCategory.slice(0, 6) : [{ cat: "No parts", grams: 0 }]).map((row) => {
                const pct = totalWeightG > 0 ? (row.grams / totalWeightG) * 100 : 0;
                return (
                  <div key={row.cat} className="grid grid-cols-[120px_1fr_70px] items-center gap-3">
                    <div className="truncate text-xs text-muted">{row.cat}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface/60">
                      <div
                        className="h-full rounded-full bg-primary/90"
                        style={{ width: `${clamp(pct, 0, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-muted">{row.grams.toFixed(0)} g</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button onClick={() => setAddOpen(true)} className={cn(BTN_PRIMARY, "w-full sm:w-auto")}>
          + Agregar componente
        </button>
      </div>

      {/* Parts list */}
      <div className="grid gap-3">
        {filteredParts.length === 0 ? (
          <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
            <div className="font-semibold">Sin componentes</div>
            <div className="mt-1 text-sm text-muted">
              Agrega tus piezas y verás el peso total automáticamente.
            </div>
          </div>
        ) : (
          filteredParts.map((p) => {
            const row = editById[p.id] || { category: p.category, weight_g: p.weight_g ?? "" };
            const isEditing = editingPartId === p.id;
            const pct = totalWeightG > 0 ? ((Number(p.weight_g) || 0) / totalWeightG) * 100 : 0;

            return (
              <div
                key={p.id}
                className={cn("rounded-xl2 border border-border bg-card p-4 shadow-soft transition", "hover:border-primary/35")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>

                    {!isEditing ? (
                      <div className="mt-1 text-sm text-muted">
                        {p.category} • {p.weight_g ?? "—"} g{" "}
                        {p.weight_g != null ? <span className="text-muted">• {pct.toFixed(1)}%</span> : null}
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <select
                          value={row.category}
                          onChange={(e) =>
                            setEditById((prev) => ({
                              ...prev,
                              [p.id]: { ...row, category: e.target.value },
                            }))
                          }
                          className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <input
                          value={String(row.weight_g ?? "")}
                          onChange={(e) =>
                            setEditById((prev) => ({
                              ...prev,
                              [p.id]: { ...row, weight_g: e.target.value },
                            }))
                          }
                          placeholder="peso (g)"
                          inputMode="numeric"
                          className="w-40 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                        />

                        <button
                          onClick={async () => {
                            await savePart(p.id);
                            setEditingPartId(null);
                          }}
                          className={BTN_PRIMARY}
                        >
                          Guardar
                        </button>

                        <button onClick={() => setEditingPartId(null)} className={BTN_SECONDARY}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => setEditingPartId(p.id)}
                        className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm text-muted hover:bg-surface/70 hover:text-text transition"
                      >
                        Editar
                      </button>
                    )}

                    <button
                      onClick={() => deletePart(p.id)}
                      className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm text-muted hover:bg-surface/70 hover:text-text transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (solo móvil) */}
      <button
        onClick={() => setAddOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-bg shadow-soft hover:brightness-110 active:scale-[0.98]"
        aria-label="Add component"
        title="Add component"
      >
        <span className="text-2xl leading-none">+</span>
      </button>

      {/* Add Modal */}
      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl2 border border-border bg-card/90 p-4 shadow-soft backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="text-base font-semibold">Agregar componente</div>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-lg px-2 py-1 text-muted hover:bg-surface/70 hover:text-text transition"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addPart} className="mt-4 space-y-4">
              <Field label="Nombre">
                <input
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Ej: Cassette 11-42"
                  className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Categoría">
                  <select
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Peso (g)">
                  <input
                    value={partWeight}
                    onChange={(e) => setPartWeight(e.target.value)}
                    placeholder="Ej: 342"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className={cn(BTN_SECONDARY, "w-full sm:w-auto")}>
                  Cancelar
                </button>
                <button type="submit" className={cn(BTN_PRIMARY, "w-full sm:w-auto")}>
                  Guardar
                </button>
              </div>

              <div className="text-xs text-muted">Tip: si no sabes el peso aún, déjalo vacío.</div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-muted">{label}</div>
      {children}
    </div>
  );
}