"use client";

// Página de historial de cambios de una bicicleta.
// Muestra un registro de todos los eventos (crear, editar, eliminar) de componentes,
// agrupados por día y ordenados del más reciente al más antiguo.
import TapLink from "../../../../../components/TapLink";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { color, radio, espacio, texto as textoT, tacto } from "../../../../../lib/design";
import Cargando from "../../../../../components/Cargando";

/* =========================
   Helpers
========================= */

// Convierte el código de acción de la BD en un texto legible en español

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

// El evento guarda una foto del nombre al momento de ocurrir. Esa es la fuente
// buena: sobrevive a que la pieza se borre o se renombre después.
// El catálogo queda solo como respaldo para eventos viejos sin foto.
function getPartDisplayName(l, partsById) {
  if (l.part_name) return l.part_name;

  const p = l.part_id ? partsById?.[l.part_id] : null;
  return p?.name || "Componente";
}

function getPartCategory(l, partsById) {
  if (l.part_category) return l.part_category;

  const p = l.part_id ? partsById?.[l.part_id] : null;
  return p?.category ?? null;
}

function calcDelta(oldW, newW) {
  const o = oldW == null ? null : Number(oldW);
  const n = newW == null ? null : Number(newW);

  if (o == null && n == null) return 0;
  if (o == null && n != null) return n;     // created -> +n
  if (o != null && n == null) return -o;    // deleted -> -o
  return n - o;                              // updated -> n - o
}

function sumWeights(partsRows) {
  return (partsRows || []).reduce((acc, p) => {
    const w = p?.weight_g == null ? 0 : Number(p.weight_g);
    return acc + (Number.isFinite(w) ? w : 0);
  }, 0);
}

// Devuelve: [{ dayKey, dayLabel, weight_g, ts }]
function buildDailyWeightHistory(logsDesc, currentTotalG) {
  const seen = new Set();
  const points = [];

  let running = Number(currentTotalG) || 0;

  for (const l of logsDesc) {
    const ts = new Date(l.created_at).getTime();
    const dayKey = new Date(l.created_at).toISOString().slice(0, 10); // YYYY-MM-DD (estable)
    const dayLabel = new Date(l.created_at).toLocaleDateString();

    // running = peso DESPUÉS de este evento (porque part_logs se guarda al crear el evento)
    if (!seen.has(dayKey)) {
      seen.add(dayKey);
      points.push({ dayKey, dayLabel, weight_g: Math.round(running), ts });
    }

    // viajamos al pasado
    const delta = calcDelta(l.old_weight_g, l.new_weight_g);
    running = running - delta;
  }

  // ya viene desc (por logs desc), pero ordenamos por si acaso
  points.sort((a, b) => b.ts - a.ts);
  return points;
}

function formatKg(g) {
  const n = Number(g);
  if (!Number.isFinite(n)) return "—";
  return `${(n / 1000).toFixed(2)} kg`;
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

  // Constantes de peso total actual y el historial diario de peso para la gráfica
  const [currentTotalG, setCurrentTotalG] = useState(0);
  const [weightHistory, setWeightHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.replace("/login");
        return;
      }

      const [bikeRes, logsRes, partsResAll] = await Promise.all([
        supabase.from("bikes").select("*").eq("id", bikeId).single(),
        supabase
          .from("part_logs")
          .select("*")
          .eq("bike_id", bikeId)
          .order("created_at", { ascending: false }),
        supabase
          .from("bike_components")
          .select("weight_g_override, modelo:component_catalog(weight_g)")
          .eq("bike_id", bikeId),
      ]);

      const logsData = logsRes.data || [];
      // Aplanar el join para que sumWeights reciba { weight_g } por cada componente
      // El peso que cuenta es el ajuste de esta bici; si no hay, el del catálogo.
      const currentTotal = sumWeights((partsResAll.data || []).map((bc) => ({
        weight_g: bc.weight_g_override ?? bc.modelo?.weight_g,
      })));
      const daily = buildDailyWeightHistory(logsData, currentTotal);

      // ✅ Buscar part_id únicos y traer nombre/categoría desde parts
      const ids = Array.from(new Set(logsData.map((l) => l.part_id).filter(Boolean)));

      let partsMap = {};
      if (ids.length > 0) {
        // part_logs guarda el id del MODELO del catálogo (antes era el de la copia privada)
        const partsRes = await supabase
          .from("component_catalog")
          .select("id,brand,model,variant,category,weight_g")
          .in("id", ids);

        const partsData = (partsRes.data || []).map((m) => ({
          ...m,
          name: [m.brand, m.model, m.variant].filter(Boolean).join(" ").trim() || m.category,
        }));
        partsMap = Object.fromEntries(partsData.map((p) => [p.id, p]));
      }

      if (cancelled) return;

      setBike(bikeRes.data || null);
      setLogs(logsData);
      setPartsById(partsMap);
      setLoading(false);
      setCurrentTotalG(currentTotal);
      setWeightHistory(daily);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  // El peso de cada día, para poder mostrarlo en su propia cabecera en vez de
  // en una lista aparte que repetía las mismas fechas.
  const pesoPorDia = {};
  for (const p of weightHistory) pesoPorDia[p.dayLabel] = p.weight_g;

  return (
    <>
      <div style={{ display: "flex", gap: espacio.sm, alignItems: "center" }}>
        <TapLink href={`/garage/${bikeId}`} style={S.volver}>← Volver</TapLink>
      </div>

      {/* Cabecera: el nombre de la bici y su peso. Nada más. */}
      <div style={S.cabecera}>
        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Historial</div>
          <h1 style={S.titulo}>{bike?.name || "Bicicleta"}</h1>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={S.peso}>{formatKg(currentTotalG)}</div>
          <div style={S.pesoPie}>{logs.length} evento{logs.length === 1 ? "" : "s"}</div>
        </div>
      </div>

      {loading ? (
        <div style={S.vacio}><Cargando tam={20} /></div>
      ) : logs.length === 0 ? (
        <div style={S.vacio}>
          <div style={{ fontSize: 28 }}>🧾</div>
          <div style={{ fontWeight: textoT.peso.fuerte, color: color.texto.fuerte }}>
            Aún no hay historial
          </div>
          <p style={{ margin: 0, fontSize: textoT.base, color: color.texto.suave, lineHeight: 1.5 }}>
            Cada componente que agregues, ajustes o quites queda registrado acá.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: espacio.sm }}>
          {orderedDays.map(({ day, items }) => {
            const abierto = !!expandedDays[day];
            const pesoDelDia = pesoPorDia[day];

            return (
              <div key={day}>
                {/* La fecha, cuántos cambios y con cuánto quedó la bici ese día.
                    Antes esto último vivía en una lista aparte que repetía
                    exactamente las mismas fechas. */}
                <button type="button" onClick={() => toggleDay(day)} style={S.dia}>
                  <span style={{ ...S.flecha, transform: abierto ? "rotate(90deg)" : "none" }} aria-hidden>
                    ▸
                  </span>
                  <span style={S.diaFecha}>{day}</span>
                  <span style={S.diaCuenta}>{items.length}</span>
                  {pesoDelDia != null && <span style={S.diaPeso}>{formatKg(pesoDelDia)}</span>}
                </button>

                {abierto && (
                  <div style={S.eventos}>
                    {items.map((l) => {
                      const nombre = getPartDisplayName(l, partsById);
                      const categoria = getPartCategory(l, partsById);
                      const acc = ACCION[l.action] ?? ACCION.otro;
                      const delta = formatDelta(l.old_weight_g, l.new_weight_g);

                      return (
                        <div key={l.id} style={S.evento}>
                          {/* El signo dice qué pasó. Antes eran tres palabras
                              —"Componente creado"— encima de la línea que ya
                              repetía "Componente: …". */}
                          <span
                            style={{ ...S.signo, color: acc.color, borderColor: acc.color }}
                            title={acc.titulo}
                            aria-label={acc.titulo}
                          >
                            {acc.signo}
                          </span>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.nombre}>{nombre}</div>
                            <div style={S.sub}>
                              {categoria ? `${categoria} · ` : ""}
                              {new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ ...S.delta, color: acc.color }}>{delta}</div>
                            {/* El antes y el después solo cuando cambió un peso
                                que ya existía: en un alta o una baja el signo
                                de arriba ya lo dice todo. */}
                            {l.action === "updated" && l.old_weight_g != null && l.new_weight_g != null && (
                              <div style={S.sub}>{formatWeights(l.old_weight_g, l.new_weight_g)}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────

// Qué pasó, dicho con un signo en vez de con tres palabras.
const ACCION = {
  created: { signo: "+", color: color.estado.alDia, titulo: "Agregado" },
  updated: { signo: "~", color: color.estado.proximo, titulo: "Peso ajustado" },
  deleted: { signo: "−", color: color.estado.vencido, titulo: "Quitado" },
  otro:    { signo: "•", color: color.texto.tenue, titulo: "Evento" },
};

const S = {
  volver: { color: color.texto.normal, fontSize: textoT.md, padding: "10px 0" },

  cabecera: {
    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
    gap: espacio.md, marginBottom: espacio.sm,
  },
  kicker: {
    fontSize: textoT.xs, fontWeight: textoT.peso.fuerte, letterSpacing: "1px",
    textTransform: "uppercase", color: color.texto.tenue,
  },
  titulo: {
    margin: "4px 0 0", fontSize: "clamp(24px, 5.5vw, 32px)", fontWeight: textoT.peso.maximo,
    letterSpacing: "-0.8px", color: color.texto.fuerte, lineHeight: 1.1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  peso: { fontSize: textoT.xl, fontWeight: textoT.peso.maximo, color: color.texto.fuerte, lineHeight: 1 },
  pesoPie: { marginTop: 5, fontSize: textoT.sm, color: color.texto.tenue },

  vacio: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: espacio.sm,
    padding: "40px 20px", textAlign: "center",
    borderRadius: radio.lg, border: `1px solid ${color.borde.sutil}`,
    background: color.superficie.baja,
  },

  // La fila de un día: flecha, fecha, cuántos cambios y el peso de esa jornada.
  dia: {
    width: "100%", display: "flex", alignItems: "center", gap: espacio.md,
    minHeight: tacto.minimo, padding: `0 ${espacio.md}px`,
    borderRadius: radio.md, border: `1px solid ${color.borde.sutil}`,
    background: color.superficie.media, cursor: "pointer", textAlign: "left",
  },
  flecha: {
    fontSize: 12, color: color.texto.tenue, flexShrink: 0,
    transition: "transform 0.15s ease", display: "inline-block",
  },
  diaFecha: { flex: 1, fontSize: textoT.base, fontWeight: textoT.peso.fuerte, color: color.texto.normal },
  diaCuenta: {
    minWidth: 20, textAlign: "center", fontSize: textoT.xs, fontWeight: textoT.peso.fuerte,
    color: color.texto.tenue,
  },
  diaPeso: { fontSize: textoT.base, fontWeight: textoT.peso.fuerte, color: color.texto.suave, flexShrink: 0 },

  eventos: { display: "flex", flexDirection: "column", padding: `${espacio.sm}px 0 ${espacio.md}px` },

  evento: {
    display: "flex", alignItems: "center", gap: espacio.md,
    padding: `10px ${espacio.md}px`, minWidth: 0,
  },
  signo: {
    width: 22, height: 22, flexShrink: 0, display: "grid", placeItems: "center",
    borderRadius: radio.full, border: "1px solid", fontSize: 13,
    fontWeight: textoT.peso.maximo, lineHeight: 1,
  },
  nombre: {
    fontSize: textoT.md, fontWeight: textoT.peso.medio, color: color.texto.fuerte,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  sub: { marginTop: 3, fontSize: textoT.sm, color: color.texto.tenue },
  delta: { fontSize: textoT.base, fontWeight: textoT.peso.fuerte, whiteSpace: "nowrap" },
};
