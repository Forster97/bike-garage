"use client";

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

export default function CategoriesSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [custom, setCustom] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [name, setName] = useState("");

  const hiddenSet = useMemo(() => new Set(hidden.map((h) => h.name)), [hidden]);

  const mergedList = useMemo(() => {
    const customNames = custom.map((c) => c.name);

    const all = [...DEFAULT_CATEGORIES, ...customNames]
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .map((n) => ({
        name: n,
        isDefault: DEFAULT_CATEGORIES.includes(n),
        isHidden: hiddenSet.has(n),
        customRow: custom.find((c) => c.name === n) || null,
      }));

    // primero activas, después ocultas
    return all.sort((a, b) => Number(a.isHidden) - Number(b.isHidden));
  }, [custom, hiddenSet]);

  const activeList = useMemo(() => mergedList.filter((x) => !x.isHidden), [mergedList]);
  const hiddenList = useMemo(() => mergedList.filter((x) => x.isHidden), [mergedList]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return router.replace("/login");
      setUser(data.user);

      const { data: customRows } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: hiddenRows } = await supabase.from("category_hidden").select("*");

      setCustom(customRows || []);
      setHidden(hiddenRows || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const addCustom = async () => {
    const n = name.trim();
    if (!n) return;

    // si estaba oculta, la des-ocultamos
    if (hiddenSet.has(n)) {
      const { error } = await supabase
        .from("category_hidden")
        .delete()
        .eq("user_id", user.id)
        .eq("name", n);

      if (error) return alert(error.message);
      setHidden((prev) => prev.filter((h) => h.name !== n));
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ user_id: user.id, name: n }])
      .select("*")
      .single();

    if (error) return alert(error.message);

    setCustom((prev) => [...prev, data]);
    setName("");
  };

  const hideDefault = async (catName) => {
    const ok = confirm(`¿Ocultar "${catName}"? (puedes restaurarla después)`);
    if (!ok) return;

    const { data, error } = await supabase
      .from("category_hidden")
      .insert([{ user_id: user.id, name: catName }])
      .select("*")
      .single();

    if (error) return alert(error.message);
    setHidden((prev) => [...prev, data]);
  };

  const restoreDefault = async (catName) => {
    const { error } = await supabase
      .from("category_hidden")
      .delete()
      .eq("user_id", user.id)
      .eq("name", catName);

    if (error) return alert(error.message);
    setHidden((prev) => prev.filter((h) => h.name !== catName));
  };

  const deleteCustom = async (row) => {
    const ok = confirm(`¿Eliminar "${row.name}"?`);
    if (!ok) return;

    const { error } = await supabase.from("categories").delete().eq("id", row.id);
    if (error) return alert(error.message);

    setCustom((prev) => prev.filter((c) => c.id !== row.id));
  };

  if (loading) return <div className="px-6 py-8 text-muted">Cargando...</div>;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
      >
        ← Volver
      </button>

      {/* Header card */}
      <div className="rounded-xl2 border border-border bg-card/75 p-5 shadow-soft backdrop-blur-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="mt-1 text-sm text-muted">
          Tienes categorías por defecto + tus categorías. Las por defecto se pueden ocultar.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Power Meter, Suspension..."
            className="flex-1 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={addCustom}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Activas */}
      <SectionTitle title="Activas" subtitle={`${activeList.length} categorías`} />
      <div className="grid gap-3">
        {activeList.map((c) => (
          <CategoryRow
            key={c.name}
            c={c}
            onHide={() => hideDefault(c.name)}
            onDelete={() => deleteCustom(c.customRow)}
          />
        ))}
        {activeList.length === 0 ? (
          <EmptyCard text="No hay categorías activas." />
        ) : null}
      </div>

      {/* Ocultas */}
      <SectionTitle title="Ocultas" subtitle={`${hiddenList.length} categorías`} />
      <div className="grid gap-3">
        {hiddenList.map((c) => (
          <div
            key={c.name}
            className="rounded-xl2 border border-border bg-card/55 p-4 shadow-soft backdrop-blur-sm opacity-70"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted">
                  {c.isDefault ? "Default" : "Personalizada"} • Oculta
                </div>
              </div>

              <button
                onClick={() => restoreDefault(c.name)}
                className="rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
              >
                Restaurar
              </button>
            </div>
          </div>
        ))}
        {hiddenList.length === 0 ? (
          <EmptyCard text="No tienes categorías ocultas." />
        ) : null}
      </div>
    </div>
  );
}

function CategoryRow({ c, onHide, onDelete }) {
  return (
    <div className="rounded-xl2 border border-border bg-card/75 p-4 shadow-soft backdrop-blur-sm hover:border-primary/35 transition">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">{c.name}</div>
          <div className="text-xs text-muted">{c.isDefault ? "Default" : "Personalizada"}</div>
        </div>

        <div className="flex gap-2">
          {c.isDefault ? (
            <button
              onClick={onHide}
              className="rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
            >
              Ocultar
            </button>
          ) : (
            <button
              onClick={onDelete}
              className="rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between">
      <div className="text-sm font-semibold text-text">{title}</div>
      <div className="text-xs text-muted">{subtitle}</div>
    </div>
  );
}

function EmptyCard({ text }) {
  return (
    <div className="rounded-xl2 border border-border bg-card/65 p-5 shadow-soft backdrop-blur-sm">
      <div className="text-sm text-muted">{text}</div>
    </div>
  );
}