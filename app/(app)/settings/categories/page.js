"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

import Card from "../../../../components/Card";
import Button from "../../../../components/Button";

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

      const [
        { data: customRows, error: customErr },
        { data: hiddenRows, error: hiddenErr },
      ] = await Promise.all([
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
    <div className="space-y-4">
      {/* Header simple (ya tienes topbar global en app/(app)/layout.js) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Ajustes</div>
          <h1 className="text-xl font-semibold text-slate-100">Categorías</h1>
          <p className="mt-1 text-sm text-slate-300">
            Administra qué categorías aparecen en tus componentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="max-w-[240px] truncate rounded-full border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-200"
            title={email}
          >
            {email || "—"}
          </div>

          <Link
            href="/garage"
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-lg font-bold text-slate-100">
              {visibleList.length}
            </div>
            <div className="text-xs text-slate-400">Visibles</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-lg font-bold text-slate-100">
              {hiddenList.length}
            </div>
            <div className="text-xs text-slate-400">Ocultas</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-lg font-bold text-slate-100">{custom.length}</div>
            <div className="text-xs text-slate-400">Personalizadas</div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {errorMsg ? (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <div className="text-sm font-semibold text-rose-100">Error</div>
          <div className="mt-1 text-sm text-rose-100/90">{errorMsg}</div>
        </Card>
      ) : null}

      {/* Agregar categoría */}
      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Agregar categoría
            </div>
            <div className="mt-1 text-xs text-slate-300">
              No se agregan duplicadas (incluye defaults).
            </div>
          </div>

          <div className="rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-200">
            Nuevo
          </div>
        </div>

        <form onSubmit={addCustom} className="flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Suspension"
            className="w-full flex-1 min-w-[220px] rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-lime-400"
          />

          <Button type="submit" disabled={saving || !newName.trim()}>
            {saving ? "Guardando…" : "Agregar"}
          </Button>
        </form>
      </Card>

      {/* Visibles */}
      <Card>
        <div className="text-sm font-semibold text-slate-100">Visibles</div>
        <div className="mt-1 text-xs text-slate-300">Aparecen en tus selects.</div>

        {loading ? (
          <div className="mt-3 text-sm text-slate-300">Cargando…</div>
        ) : visibleList.length === 0 ? (
          <div className="mt-3 text-sm text-slate-300">
            No tienes categorías visibles.
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleList.map((name) => (
              <div
                key={`vis-${name}`}
                className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2"
              >
                <span className="text-sm font-semibold text-slate-100">{name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => hideCategory(name)}
                  className="px-3 py-1 text-xs"
                >
                  Ocultar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ocultas */}
      <Card>
        <div className="text-sm font-semibold text-slate-100">Ocultas</div>
        <div className="mt-1 text-xs text-slate-300">No aparecerán en tus selects.</div>

        {hiddenList.length === 0 ? (
          <div className="mt-3 text-sm text-slate-300">
            No tienes categorías ocultas.
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {hiddenList.map((name) => (
              <div
                key={`hid-${name}`}
                className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-2"
              >
                <span className="text-sm font-semibold text-slate-100">{name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => unhideCategory(name)}
                  className="px-3 py-1 text-xs"
                >
                  Mostrar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Personalizadas */}
      <Card>
        <div className="text-sm font-semibold text-slate-100">Personalizadas</div>
        <div className="mt-1 text-xs text-slate-300">
          Puedes ocultarlas o eliminarlas.
        </div>

        {custom.length === 0 ? (
          <div className="mt-3 text-sm text-slate-300">
            Aún no agregas categorías personalizadas.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {custom.map((row) => {
              const isHidden = hidden.has(row.name);
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {row.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {isHidden ? "Oculta" : "Visible"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        isHidden ? unhideCategory(row.name) : hideCategory(row.name)
                      }
                      className="text-xs"
                    >
                      {isHidden ? "Mostrar" : "Ocultar"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => deleteCustom(row)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-xs text-slate-400">
          Nota: eliminar solo borra la categoría personalizada (no toca defaults).
        </div>
      </Card>
    </div>
  );
}