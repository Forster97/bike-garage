"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../../lib/supabaseClient";

/* =========================
   Defaults
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

/* =========================
   Helpers
========================= */

const normalizeName = (s) => (s ?? "").trim();

export default function CategoriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [custom, setCustom] = useState([]); // rows: { id, name }
  const [hidden, setHidden] = useState(() => new Set()); // Set<string>

  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const visibleList = useMemo(() => {
    const hiddenSet = hidden;
    const customNames = custom.map((r) => r.name);
    const supabase = getSupabase();

    // Merge defaults + custom, preserve order, remove duplicates (case-sensitive)
    const merged = [...DEFAULT_CATEGORIES, ...customNames];
    const unique = [];
    const seen = new Set();

    for (const name of merged) {
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      if (hiddenSet.has(name)) continue;
      unique.push(name);
    }
    return unique;
  }, [custom, hidden]);

  const hiddenList = useMemo(() => {
    // show hidden names that exist in defaults or custom; keep stable-ish order
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

    // Also include any "orphan" hidden names (in case defaults changed)
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

      // IMPORTANT: filter by user_id in both tables
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

    // Prevent adding duplicates against defaults/custom
    const exists =
      DEFAULT_CATEGORIES.includes(name) || custom.some((r) => r.name === name);

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
    // If it was hidden, keep it hidden unless user unhides manually
    setNewName("");
    setSaving(false);
  };

  const hideCategory = async (name) => {
    setErrorMsg("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

    const n = normalizeName(name);
    if (!n) return;

    // Optimistic
    setHidden((prev) => new Set([...prev, n]));

    // Insert hidden (if you add a UNIQUE(user_id,name) constraint, this becomes safely idempotent)
    const { error } = await supabase.from("category_hidden").insert({
      user_id: user.id,
      name: n,
    });

    // If duplicate insert fails, you can ignore that specific error,
    // but we’ll keep it simple: revert on any error.
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

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

    const n = normalizeName(name);
    if (!n) return;

    // Optimistic
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

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

    // Optimistic remove
    setCustom((prev) => prev.filter((r) => r.id !== row.id));

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", row.id)
      .eq("user_id", user.id); // IMPORTANT

    if (error) {
      // revert
      setCustom((prev) => [...prev, row].sort((a, b) => String(a.id).localeCompare(String(b.id))));
      setErrorMsg(error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted">Cargando categorías…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
          <p className="mt-1 text-sm text-muted">
            Administra tus categorías visibles/ocultas.
          </p>
        </div>
        <div className="text-sm text-muted">{email}</div>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-border bg-surface/60 p-3 text-sm text-red-400">
          {errorMsg}
        </div>
      ) : null}

      {/* Add custom */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="mb-3 font-medium">Agregar categoría personalizada</div>
        <form onSubmit={addCustom} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Suspension"
            className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-border"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </form>
        <div className="mt-2 text-xs text-muted">
          No se agregan duplicadas (incluye las defaults).
        </div>
      </div>

      {/* Visible */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="mb-3 font-medium">Visibles</div>

        {visibleList.length === 0 ? (
          <div className="text-sm text-muted">No tienes categorías visibles.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleList.map((name) => (
              <div
                key={`vis-${name}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm"
              >
                <span className="text-text">{name}</span>
                <button
                  onClick={() => hideCategory(name)}
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface/80 hover:text-text transition"
                  title="Ocultar"
                >
                  Ocultar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="mb-3 font-medium">Ocultas</div>

        {hiddenList.length === 0 ? (
          <div className="text-sm text-muted">No tienes categorías ocultas.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hiddenList.map((name) => (
              <div
                key={`hid-${name}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm"
              >
                <span className="text-text">{name}</span>
                <button
                  onClick={() => unhideCategory(name)}
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface/80 hover:text-text transition"
                  title="Mostrar"
                >
                  Mostrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom list with delete */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="mb-3 font-medium">Personalizadas</div>

        {custom.length === 0 ? (
          <div className="text-sm text-muted">Aún no agregas categorías personalizadas.</div>
        ) : (
          <div className="space-y-2">
            {custom.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 px-3 py-2"
              >
                <div className="text-sm text-text">{row.name}</div>
                <div className="flex items-center gap-2">
                  {!hidden.has(row.name) ? (
                    <button
                      onClick={() => hideCategory(row.name)}
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface/80 hover:text-text transition"
                    >
                      Ocultar
                    </button>
                  ) : (
                    <button
                      onClick={() => unhideCategory(row.name)}
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface/80 hover:text-text transition"
                    >
                      Mostrar
                    </button>
                  )}

                  <button
                    onClick={() => deleteCustom(row)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-surface/80 transition"
                    title="Eliminar categoría personalizada"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-xs text-muted">
          Nota: eliminar solo borra la categoría personalizada (no toca defaults).
        </div>
      </div>
    </div>
  );
}