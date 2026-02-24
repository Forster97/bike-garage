"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabase  } from "../../../../../lib/supabaseClient";

export default function BikeHistoryPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [bike, setBike] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.replace("/login");

      const { data: bikeData } = await supabase.from("bikes").select("*").eq("id", bikeId).single();
      setBike(bikeData || null);

      const { data } = await supabase
        .from("part_logs")
        .select("*")
        .eq("bike_id", bikeId)
        .order("created_at", { ascending: false });

      setLogs(data || []);
      setLoading(false);
    };

    if (bikeId) load();
  }, [bikeId, router]);

  if (loading) return <div className="text-muted">Cargando...</div>;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push(`/garage/${bikeId}`)}
        className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text"
      >
        ← Volver a la bici
      </button>

      <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="mt-1 text-sm text-muted">{bike?.name ? `Bici: ${bike.name}` : "—"}</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
          <div className="font-semibold">Aún no hay historial</div>
          <p className="mt-1 text-sm text-muted">
            Cuando crees/edites/eliminés componentes, aparecerán registros aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {logs.map((l) => (
            <div key={l.id} className="rounded-xl2 border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{labelAction(l.action)}</div>
                  <div className="text-xs text-muted">{new Date(l.created_at).toLocaleString()}</div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">{formatDelta(l.old_weight_g, l.new_weight_g)}</div>
                  <div className="text-xs text-muted">{formatWeights(l.old_weight_g, l.new_weight_g)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function labelAction(a) {
  if (a === "created") return "Componente creado";
  if (a === "updated") return "Componente actualizado";
  if (a === "deleted") return "Componente eliminado";
  return a || "Evento";
}

function formatDelta(oldW, newW) {
  const o = oldW == null ? null : Number(oldW);
  const n = newW == null ? null : Number(newW);

  if (o == null && n == null) return "—";
  if (o == null && n != null) return `+${n} g`;
  if (o != null && n == null) return `-${o} g`;

  const d = n - o;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d} g`;
}

function formatWeights(oldW, newW) {
  const o = oldW == null ? "—" : `${oldW} g`;
  const n = newW == null ? "—" : `${newW} g`;
  return `${o} → ${n}`;
}