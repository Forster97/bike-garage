"use client";

// Página de historial de cambios de una bicicleta.
// Muestra un registro de todos los eventos (crear, editar, eliminar) de componentes,
// agrupados por día y ordenados del más reciente al más antiguo.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import AppHeader from "../../../../../components/AppHeader";
import PageShell from "../../../../../components/PageShell";

/* =========================
   Helpers
========================= */

// Convierte el código de acción de la BD en un texto legible en español
function labelAction(a) {
  if (a === "created") return "Componente creado";
  if (a === "updated") return "Componente actualizado";
  if (a === "deleted") return "Componente eliminado";
  return a || "Evento";
}

// Calcula la diferencia de peso entre el valor anterior y el nuevo, en gramos.
function formatDelta(oldW, newW) {
  const o = oldW == null ? null : Number(oldW);
  const n = newW == null ? null : Number(newW);
  if (o == null && n == null) return "—";
  if (o == null && n != null) return `+${n} g`;
  if (o != null && n == null) return `-${o} g`;
  const d = n - o;
  return `${d > 0 ? "+" : ""}${d} g`;
}

// Muestra el peso anterior y el nuevo en formato "150 g → 200 g"
function formatWeights(oldW, newW) {
  return `${oldW == null ? "—" : `${oldW} g`} → ${newW == null ? "—" : `${newW} g`}`;
}

// Agrupa los logs por día usando la fecha local del navegador como clave.
function groupLogsByDay(logs) {
  const map = new Map();
  for (const l of logs) {
    const key = new Date(l.created_at).toLocaleDateString(); // ej: "28/2/2026"
    map.set(key, [...(map.get(key) || []), l]);
  }
  return Object.fromEntries(map.entries());
}

function getPartDisplayName(l, partsById) {
  const direct = l.part_name ?? l.new_name ?? l.old_name ?? l.name;
  if (direct) return direct;

  const p = l.part_id ? partsById?.[l.part_id] : null;
  if (p?.name) return p.name;

  return "Componente";
}

function getPartCategory(l, partsById) {
  const direct = l.new_category ?? l.old_category ?? l.category;
  if (direct) return direct;

  const p = l.part_id ? partsById?.[l.part_id] : null;
  return p?.category ?? null;
}

// Para updated: línea "Cambios: ..."
function getUpdateDetails(l) {
  const changes = [];

  const oldName = l.old_name ?? null;
  const newName = l.new_name ?? null;
  if (oldName != null && newName != null && oldName !== newName) {
    changes.push(`nombre: "${oldName}" → "${newName}"`);
  }

  const oldCat = l.old_category ?? null;
  const newCat = l.new_category ?? null;
  if (oldCat != null && newCat != null && oldCat !== newCat) {
    changes.push(`categoría: "${oldCat}" → "${newCat}"`);
  }

  const oldW = l.old_weight_g ?? null;
  const newW = l.new_weight_g ?? null;
  if (oldW != null && newW != null && Number(oldW) !== Number(newW)) {
    changes.push(`peso: ${oldW} g → ${newW} g`);
  }

  if (changes.length === 0) return null;
  return `Cambios: ${changes.join(" · ")}`;
}

/* =========================
   Page
========================= */
export default function BikeHistoryPage() {
  const router = useRouter();
  const { bikeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [bike, setBike] = useState(null);

  // ✅ Mapa de partes (para mostrar nombre/categoría aunque el log no lo traiga)
  const [partsById, setPartsById] = useState({});

  // ✅ Estado: qué días están expandidos
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

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

      const logsData = logsRes.data || [];

      // ✅ Buscar part_id únicos y traer nombre/categoría desde parts
      const ids = Array.from(new Set(logsData.map((l) => l.part_id).filter(Boolean)));

      let partsMap = {};
      if (ids.length > 0) {
        const partsRes = await supabase
          .from("parts")
          .select("id,name,category,weight_g")
          .in("id", ids);

        const partsData = partsRes.data || [];
        partsMap = Object.fromEntries(partsData.map((p) => [p.id, p]));
      }

      if (cancelled) return;

      setBike(bikeRes.data || null);
      setLogs(logsData);
      setPartsById(partsMap);
      setLoading(false);
    };

    if (bikeId) load();
    return () => {
      cancelled = true;
    };
  }, [bikeId, router]);

  // Agrupa por día
  const grouped = useMemo(() => groupLogsByDay(logs), [logs]);

  // ✅ Ordena días (más reciente arriba) y auto-expande el primer día
  const orderedDays = useMemo(() => {
    const entries = Object.entries(grouped);

    const withDate = entries
      .map(([day, items]) => {
        const newest = items?.[0]?.created_at ? new Date(items[0].created_at).getTime() : 0;
        return { day, items, newest };
      })
      .sort((a, b) => b.newest - a.newest);

    return withDate;
  }, [grouped]);

  // Auto-expande el día más reciente (solo cuando cambia el set de días)
  useEffect(() => {
    if (orderedDays.length === 0) return;
    const firstDay = orderedDays[0].day;
    setExpandedDays((prev) => {
      // si ya hay algo definido, no tocamos
      if (Object.keys(prev).length > 0) return prev;
      return { [firstDay]: true };
    });
  }, [orderedDays]);

  const toggleDay = (day) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const linkStyle = {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14,
    padding: "10px",
  };

  const header = (
    <AppHeader
      actions={[
        <Link key="back" href={`/garage/${bikeId}`} style={linkStyle}>
          ← Volver
        </Link>,
        <Link key="cats" href="/settings/categories" style={linkStyle}>
          Categorías
        </Link>,
      ]}
    />
  );

  return (
    <PageShell header={header}>
      {/* Hero */}
      <div
        className="rounded-[22px] border p-4"
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              Historial
            </div>
            <div className="mt-1.5 text-2xl font-black tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
              Cambios de componentes
            </div>
            <div className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
              {bike?.name ? `Bici: ${bike.name}` : "—"}
            </div>
          </div>
          <span
            className="rounded-full px-3 py-2 text-xs font-black"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {logs.length} evento{logs.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "rgba(99,102,241,0.70)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Aquí verás cuando creas, editas o eliminas componentes. Haz click en una fecha para expandir/colapsar.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-[18px] border p-4" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>
            Cargando…
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-[18px] border p-4" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>
            Aún no hay historial
          </div>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>
            Cuando crees, edites o elimines componentes, aparecerán los registros aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orderedDays.map(({ day, items }) => {
            const isOpen = !!expandedDays[day];

            return (
              <div key={day} className="flex flex-col gap-2.5">
                {/* ✅ Header colapsable */}
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-black"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                      aria-hidden="true"
                    >
                      {isOpen ? "▾" : "▸"}
                    </span>

                    <div>
                      <div className="text-xs font-black uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.78)" }}>
                        {day}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {items.length} cambio{items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-black"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(255,255,255,0.70)",
                    }}
                  >
                    {isOpen ? "Ocultar" : "Ver"}
                  </span>
                </button>

                {/* ✅ Lista del día (solo si está abierto) */}
                {isOpen ? (
                  <div className="flex flex-col gap-2.5">
                    {items.map((l) => {
                      const partName = getPartDisplayName(l, partsById);
                      const partCat = getPartCategory(l, partsById);
                      const updateDetails = l.action === "updated" ? getUpdateDetails(l) : null;

                      return (
                        <div
                          key={l.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                          style={{
                            background: "rgba(0,0,0,0.22)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div>
                            <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>
                              {labelAction(l.action)}
                            </div>

                            <div className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>
                              Componente:{" "}
                              <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>
                                {partName}
                              </span>

                              {partCat ? (
                                <span
                                  className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black"
                                  style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "rgba(255,255,255,0.75)",
                                  }}
                                >
                                  {partCat}
                                </span>
                              ) : null}
                            </div>

                            {updateDetails ? (
                              <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                                {updateDetails}
                              </div>
                            ) : null}

                            <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                              {new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>
                              {formatDelta(l.old_weight_g, l.new_weight_g)}
                            </div>
                            <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                              {formatWeights(l.old_weight_g, l.new_weight_g)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}