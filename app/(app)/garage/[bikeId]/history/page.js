"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

export default function BikeHistoryPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [bike, setBike] = useState(null);

  useEffect(() => {
    if (!bikeId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          router.replace("/login");
          return;
        }

        const [bikeRes, logsRes] = await Promise.all([
          supabase.from("bikes").select("*").eq("id", bikeId).single(),
          supabase
            .from("part_logs")
            .select("*")
            .eq("bike_id", bikeId)
            .order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;

        setBike(bikeRes.data ?? null);
        setLogs(logsRes.data ?? []);
      } catch (err) {
        console.error("History load crash:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bikeId, router]);

  const stats = useMemo(() => {
    const created = logs.filter((l) => l.action === "created").length;
    const updated = logs.filter((l) => l.action === "updated").length;
    const deleted = logs.filter((l) => l.action === "deleted").length;
    return { created, updated, deleted, total: logs.length };
  }, [logs]);

  if (loading) return <div className="px-6 py-8 text-muted">Cargando…</div>;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/garage/${bikeId}`)}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
        >
          ← Volver
        </button>

        <div className="flex items-center gap-2">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-muted">Historial</div>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
                {bike?.name ? bike.name : "Bicicleta"}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Registro de cambios de componentes (creado / actualizado / eliminado).
              </p>
            </div>

            {/* Quick stats */}
            <div className="rounded-xl2 border border-border bg-surface/40 p-4 text-left sm:text-right">
              <div className="text-xs text-muted">Eventos</div>
              <div className="mt-1 text-3xl sm:text-4xl font-semibold">{stats.total}</div>
              <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                <Pill tone="good">+ {stats.created}</Pill>
                <Pill tone="mid">~ {stats.updated}</Pill>
                <Pill tone="bad">- {stats.deleted}</Pill>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty / List */}
      {logs.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-card/75 p-6 shadow-soft backdrop-blur-sm">
          <div className="text-lg font-semibold">Aún no hay historial</div>
          <p className="mt-2 text-sm text-muted">
            Cuando crees/edites/eliminés componentes, aparecerán los registros aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {logs.map((l) => {
            const d = deltaNumber(l.old_weight_g, l.new_weight_g);
            const tone = d == null ? "mid" : d > 0 ? "good" : d < 0 ? "bad" : "mid";

            return (
              <div
                key={l.id}
                className="rounded-xl2 border border-border bg-card/75 p-4 shadow-soft backdrop-blur-sm transition hover:border-primary/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{labelAction(l.action)}</span>
                      <Badge action={l.action} />
                    </div>

                    <div className="mt-1 text-xs text-muted">
                      {new Date(l.created_at).toLocaleString()}
                    </div>

                    <div className="mt-3 text-sm text-muted">
                      <span className="text-text/90 font-medium">Peso:</span>{" "}
                      {formatWeights(l.old_weight_g, l.new_weight_g)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={deltaClass(tone)}>{formatDelta(l.old_weight_g, l.new_weight_g)}</div>
                    <div className="mt-1 text-xs text-muted">Δ</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================
   UI bits
========================= */

function Pill({ children, tone = "mid" }) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : tone === "bad"
      ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
      : "bg-white/5 text-muted border-white/10";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Badge({ action }) {
  const base = "rounded-full border px-2 py-1 text-[11px] font-semibold";
  if (action === "created") return <span className={`${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/20`}>CREADO</span>;
  if (action === "updated") return <span className={`${base} bg-indigo-500/10 text-indigo-300 border-indigo-500/20`}>EDITADO</span>;
  if (action === "deleted") return <span className={`${base} bg-rose-500/10 text-rose-300 border-rose-500/20`}>ELIMINADO</span>;
  return <span className={`${base} bg-white/5 text-muted border-white/10`}>EVENTO</span>;
}

function deltaClass(tone) {
  if (tone === "good") return "text-emerald-300 font-semibold";
  if (tone === "bad") return "text-rose-300 font-semibold";
  return "text-text font-semibold";
}

/* =========================
   Helpers
========================= */

function labelAction(a) {
  if (a === "created") return "Componente creado";
  if (a === "updated") return "Componente actualizado";
  if (a === "deleted") return "Componente eliminado";
  return a || "Evento";
}

function deltaNumber(oldW, newW) {
  const o = oldW == null ? null : Number(oldW);
  const n = newW == null ? null : Number(newW);

  if (o == null && n == null) return null;
  if (o == null && n != null) return n;
  if (o != null && n == null) return -o;
  return n - o;
}

function formatDelta(oldW, newW) {
  const d = deltaNumber(oldW, newW);
  if (d == null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${d} g`;
}

function formatWeights(oldW, newW) {
  const o = oldW == null ? "—" : `${oldW} g`;
  const n = newW == null ? "—" : `${newW} g`;
  return `${o} → ${n}`;
}