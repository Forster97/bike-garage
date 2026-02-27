"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

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

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl border border-primary/60 ring-1 ring-border/60 bg-primary px-4 py-2 text-sm font-semibold text-bg shadow-soft hover:brightness-110 hover:ring-border/80 transition disabled:opacity-60 disabled:cursor-not-allowed";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition disabled:opacity-60 disabled:cursor-not-allowed";

const INPUT =
  "w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40";

export default function CategoriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [custom, setCustom] = useState([]); // { id, name }
  const [hidden, setHidden] = useState(() => new Set()); // Set<string>

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

  const stats = useMemo(() => {
    return {
      visibles: visibleList.length,
      ocultas: hiddenList.length,
      personalizadas: custom.length,
    };
  }, [visibleList.length, hiddenList.length, custom.length]);

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

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

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

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

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

    if (authErr || !user) {
      router.replace("/login");
      return;
    }

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

  if (loading) return <div className="px-6 py-8 text-muted">Cargando categorías…</div>;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/garage")} className={cn(BTN_SECONDARY, "px-3")}>
          ← Garage
        </button>

        <div className="text-sm text-muted truncate max-w-[55%]">{email}</div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-xl2 border border-border bg-card/75 shadow-soft backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary2/10 via-transparent to-primary/10" />
        <div className="relative p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-muted">Ajustes</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Categorías</h1>
              <p className="mt-2 text-sm text-muted">
                Define qué aparece en tus componentes (y qué quieres ocultar).
              </p>
            </div>

            <div className="rounded-xl2 border border-border bg-surface/40 p-4">
              <div className="text-xs text-muted">Resumen</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill tone="good">{stats.visibles} visibles</Pill>
                <Pill tone="mid">{stats.ocultas} ocultas</Pill>
                <Pill tone="indigo">{stats.personalizadas} personalizadas</Pill>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-xl2 border border-border bg-card/60 p-3 text-sm text-rose-300">
          {errorMsg}
        </div>
      ) : null}

      {/* Add custom */}
      <div className="rounded-xl2 border border-border bg-card/75 p-5 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Agregar categoría</div>
            <div className="mt-1 text-xs text-muted">No se agregan duplicadas (incluye defaults).</div>
          </div>
          <span className="rounded-full border border-border bg-surface/40 px-2 py-1 text-[11px] text-muted">
            NUEVO
          </span>
        </div>

        <form onSubmit={addCustom} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Suspension"
            className={INPUT}
          />
          <button type="submit" disabled={saving || !newName.trim()} className={BTN_PRIMARY}>
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </form>
      </div>

      {/* Visibles */}
      <Section
        title="Visibles"
        subtitle="Aparecen en los selects y en tus componentes."
        emptyText="No tienes categorías visibles."
      >
        {visibleList.length ? (
          <div className="flex flex-wrap gap-2">
            {visibleList.map((name) => (
              <Chip
                key={`vis-${name}`}
                label={name}
                actionLabel="Ocultar"
                onAction={() => hideCategory(name)}
              />
            ))}
          </div>
        ) : null}
      </Section>

      {/* Ocultas */}
      <Section
        title="Ocultas"
        subtitle="No aparecerán en tus selects."
        emptyText="No tienes categorías ocultas."
      >
        {hiddenList.length ? (
          <div className="flex flex-wrap gap-2">
            {hiddenList.map((name) => (
              <Chip
                key={`hid-${name}`}
                label={name}
                actionLabel="Mostrar"
                onAction={() => unhideCategory(name)}
                tone="muted"
              />
            ))}
          </div>
        ) : null}
      </Section>

      {/* Personalizadas */}
      <div className="rounded-xl2 border border-border bg-card/75 p-5 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Personalizadas</div>
            <div className="mt-1 text-xs text-muted">Puedes ocultarlas o eliminarlas.</div>
          </div>
        </div>

        {custom.length === 0 ? (
          <div className="mt-3 text-sm text-muted">Aún no agregas categorías personalizadas.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {custom.map((row) => {
              const isHidden = hidden.has(row.name);
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{row.name}</div>
                    <div className="mt-1 text-xs text-muted">
                      {isHidden ? "Oculta" : "Visible"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isHidden ? (
                      <button onClick={() => hideCategory(row.name)} className={cn(BTN_SECONDARY, "px-3 py-2")}>
                        Ocultar
                      </button>
                    ) : (
                      <button onClick={() => unhideCategory(row.name)} className={cn(BTN_SECONDARY, "px-3 py-2")}>
                        Mostrar
                      </button>
                    )}

                    <button
                      onClick={() => deleteCustom(row)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/15 transition"
                      title="Eliminar categoría personalizada"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-xs text-muted">
          Nota: eliminar solo borra la categoría personalizada (no toca defaults).
        </div>
      </div>
    </div>
  );
}

/* =========================
   Small UI Components
========================= */

function Pill({ children, tone = "mid" }) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : tone === "indigo"
      ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
      : "bg-white/5 text-muted border-white/10";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Section({ title, subtitle, emptyText, children }) {
  const hasContent = !!children;
  return (
    <div className="rounded-xl2 border border-border bg-card/75 p-5 shadow-soft backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-muted">{subtitle}</div>
        </div>
      </div>

      <div className="mt-4">
        {hasContent ? children : <div className="text-sm text-muted">{emptyText}</div>}
      </div>
    </div>
  );
}

function Chip({ label, actionLabel, onAction, tone = "default" }) {
  const base = "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm";
  const skin =
    tone === "muted"
      ? "border-border bg-surface/30"
      : "border-border bg-surface/40";

  return (
    <div className={cn(base, skin)}>
      <span className="text-text">{label}</span>
      <button
        onClick={onAction}
        className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface/80 hover:text-text transition"
        title={actionLabel}
      >
        {actionLabel}
      </button>
    </div>
  );
}