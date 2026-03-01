"use client";

export const dynamic = "force-dynamic";

// Página de mantenimiento de una bicicleta.
// Muestra y permite gestionar los registros de mantenimiento:
//   - Panel de resumen con estado por tipo (Al día / Pronto / Vencido / Sin registro)
//   - Fecha estimada del próximo mantenimiento
//   - Lista cronológica con edición y eliminación
//   - Modal compartido para agregar y editar registros
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabaseClient";
import AppHeader from "../../../../../components/AppHeader";
import PageShell from "../../../../../components/PageShell";

// ── Helpers ────────────────────────────────────────────────────────────────────

// Formatea "YYYY-MM-DD" como fecha local legible
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// Formatea monto en CLP
function formatCLP(amount) {
  if (amount == null) return null;
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(amount);
}

// Fecha de hoy en YYYY-MM-DD
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Días transcurridos desde una fecha YYYY-MM-DD
function daysSince(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const then = new Date(year, month - 1, day);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// Suma N días a una fecha YYYY-MM-DD y devuelve la nueva fecha YYYY-MM-DD
function addDays(dateStr, days) {
  if (!dateStr || !days) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Calcula el estado de un tipo dado su último registro
// Devuelve: { status, nextDate, daysLeft, badge }
function getTypeStatus(mType, lastRecord) {
  if (!lastRecord) return { status: "none", nextDate: null, daysLeft: null, badge: null };

  const intervalDays = mType?.default_interval_days;
  if (!intervalDays) return { status: "ok", nextDate: null, daysLeft: null, badge: null };

  const days = daysSince(lastRecord.performed_at);
  if (days === null) return { status: "none", nextDate: null, daysLeft: null, badge: null };

  const nextDate = addDays(lastRecord.performed_at, intervalDays);
  const daysLeft = intervalDays - days; // negativo = vencido
  const pct = days / intervalDays;

  if (pct >= 1) {
    return {
      status: "overdue", nextDate, daysLeft,
      badge: { label: `Vencido hace ${Math.abs(daysLeft)}d`, color: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.12)" },
    };
  }
  if (pct >= 0.75) {
    return {
      status: "soon", nextDate, daysLeft,
      badge: { label: `Vence en ${daysLeft}d`, color: "rgba(251,191,36,0.90)", bg: "rgba(251,191,36,0.10)" },
    };
  }
  return { status: "ok", nextDate, daysLeft, badge: null };
}

// Form vacío
const emptyForm = () => ({
  type_id: "", type_name: "", performed_at: todayISO(),
  odometer_km: "", cost_clp: "", notes: "",
});

// Convierte un registro de BD al formato del formulario
function recordToForm(r) {
  return {
    type_id: r.type_id ? String(r.type_id) : "",
    type_name: r.type_name ?? "",
    performed_at: r.performed_at ?? todayISO(),
    odometer_km: r.odometer_km != null ? String(r.odometer_km) : "",
    cost_clp: r.cost_clp != null ? String(r.cost_clp) : "",
    notes: r.notes ?? "",
  };
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function BikeMaintenancePage() {
  const router = useRouter();
  const { bikeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [bike, setBike] = useState(null);
  const [records, setRecords] = useState([]);
  const [types, setTypes] = useState([]);

  // Modal: null = cerrado | "add" = agregar | "edit" = editar
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bikeId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return router.replace("/login");

        const [bikeRes, recordsRes, typesRes] = await Promise.all([
          supabase.from("bikes").select("*").eq("id", bikeId).single(),
          supabase.from("bike_maintenance").select("*").eq("bike_id", bikeId).order("performed_at", { ascending: false }),
          supabase.from("maintenance_types").select("*").order("name", { ascending: true }),
        ]);

        if (cancelled) return;
        setBike(bikeRes.data || null);
        setRecords(recordsRes.data || []);
        setTypes(typesRes.data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [bikeId, router]);

  // ── Lookups calculados ─────────────────────────────────────────────────────

  const typesById = useMemo(() => {
    const map = {};
    for (const t of types) map[t.id] = t;
    return map;
  }, [types]);

  // Último registro por nombre de tipo (ya vienen desc por performed_at)
  const lastByTypeName = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!map[r.type_name]) map[r.type_name] = r;
    }
    return map;
  }, [records]);

  // Panel de resumen: tipos con intervalo de días, ordenados por urgencia
  const statusPanel = useMemo(() => {
    return types
      .filter((t) => t.default_interval_days)
      .map((t) => {
        const last = lastByTypeName[t.name] || null;
        return { type: t, last, ...getTypeStatus(t, last) };
      })
      .sort((a, b) => {
        const order = { overdue: 0, soon: 1, ok: 2, none: 3 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
  }, [types, lastByTypeName]);

  // ── Helpers de formulario ──────────────────────────────────────────────────
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleTypeChange = (e) => {
    const id = e.target.value;
    const found = types.find((t) => String(t.id) === id);
    setField("type_id", id);
    setField("type_name", found ? found.name : "");
  };

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setModalMode("add"); };
  const openEdit = (r) => { setForm(recordToForm(r)); setEditingId(r.id); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingId(null); };

  // Valida el form y devuelve el payload listo para Supabase, o null si hay error
  const parseForm = () => {
    const typeName = form.type_name.trim();
    if (!typeName) { alert("Elige o escribe el tipo de mantenimiento."); return null; }
    if (!form.performed_at) { alert("La fecha es obligatoria."); return null; }

    const km = form.odometer_km === "" ? null : Number(form.odometer_km);
    const cost = form.cost_clp === "" ? null : Number(form.cost_clp);
    if (form.odometer_km !== "" && (isNaN(km) || km < 0)) { alert("Odómetro inválido."); return null; }
    if (form.cost_clp !== "" && (isNaN(cost) || cost < 0)) { alert("Costo inválido."); return null; }

    return {
      type_id: form.type_id ? Number(form.type_id) : null,
      type_name: typeName,
      performed_at: form.performed_at,
      odometer_km: km,
      cost_clp: cost,
      notes: form.notes.trim() || null,
    };
  };

  // ── Guardar nuevo ──────────────────────────────────────────────────────────
  const saveRecord = async (e) => {
    e?.preventDefault?.();
    const parsed = parseForm();
    if (!parsed) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace("/login");

      const { data, error } = await supabase
        .from("bike_maintenance")
        .insert([{ user_id: userId, bike_id: bikeId, ...parsed }])
        .select("*").single();

      if (error) return alert(error.message);

      setRecords((prev) => {
        const next = [data, ...prev];
        next.sort((a, b) => (a.performed_at < b.performed_at ? 1 : -1));
        return next;
      });
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  // ── Actualizar existente ───────────────────────────────────────────────────
  const updateRecord = async (e) => {
    e?.preventDefault?.();
    const parsed = parseForm();
    if (!parsed || !editingId) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bike_maintenance")
        .update(parsed)
        .eq("id", editingId)
        .select("*").single();

      if (error) return alert(error.message);

      setRecords((prev) => {
        const next = prev.map((r) => (r.id === editingId ? data : r));
        next.sort((a, b) => (a.performed_at < b.performed_at ? 1 : -1));
        return next;
      });
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const deleteRecord = async (id) => {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    const { error } = await supabase.from("bike_maintenance").delete().eq("id", id);
    if (error) return alert(error.message);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerActions = [
    <Link key="back" href={`/garage/${bikeId}`} style={styles.linkBtn}>← Volver</Link>,
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell header={<AppHeader actions={headerActions} />}>
        <div className="animate-pulse rounded-[18px] border p-4"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="h-5 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
          <div className="mt-3 h-4 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      </PageShell>
    );
  }

  if (!bike) {
    return (
      <PageShell header={<AppHeader actions={headerActions} />}>
        <div style={{ ...styles.card, textAlign: "center", padding: "40px 14px" }}>
          <div style={styles.emptyIcon}>🤕</div>
          <div style={styles.emptyTitle}>No encontré esta bicicleta</div>
          <button onClick={() => router.push("/garage")} style={{ ...styles.primaryBtn, marginTop: 16 }}>
            Volver al Garage
          </button>
        </div>
      </PageShell>
    );
  }

  const isEditing = modalMode === "edit";
  const currentTypeData = form.type_id ? typesById[Number(form.type_id)] : null;

  return (
    <PageShell header={<AppHeader actions={headerActions} />}>

      {/* ── Hero ── */}
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={styles.kicker}>Mantenimiento</div>
            <div style={styles.heroTitle}>{bike.name}</div>
            <div style={styles.heroSub}>
              {records.length} registro{records.length === 1 ? "" : "s"}
              {records.length > 0 && <> · Último: {formatDate(records[0]?.performed_at)}</>}
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={openAdd}>+ Registrar</button>
        </div>
      </div>

      {/* ── Panel de resumen por tipo ── */}
      {statusPanel.length > 0 && (
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={styles.sectionTitle}>Estado del mantenimiento</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
              {statusPanel.filter(s => s.status === "overdue").length} vencido · {statusPanel.filter(s => s.status === "soon").length} pronto
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {statusPanel.map(({ type, last, status, badge, nextDate, daysLeft }) => {
              // Fondo y borde de la fila según urgencia
              const rowBg = status === "overdue"
                ? "rgba(239,68,68,0.08)"
                : status === "soon"
                  ? "rgba(251,191,36,0.06)"
                  : "rgba(0,0,0,0.22)";
              const rowBorder = status === "overdue"
                ? "1px solid rgba(239,68,68,0.22)"
                : status === "soon"
                  ? "1px solid rgba(251,191,36,0.18)"
                  : "1px solid rgba(255,255,255,0.08)";

              return (
                <div key={type.id} style={{ ...styles.panelRow, background: rowBg, border: rowBorder }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" }}>
                      {type.name}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      {last ? (
                        <>
                          Último: {formatDate(last.performed_at)}
                          {nextDate && (
                            <> · <span style={{ color: "rgba(255,255,255,0.72)" }}>Próximo: {formatDate(nextDate)}</span></>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.35)" }}>Sin registro todavía</span>
                      )}
                    </div>
                  </div>

                  {/* Badge de estado */}
                  {badge ? (
                    <div style={{ ...styles.badge, color: badge.color, background: badge.bg, border: `1px solid ${badge.color}` }}>
                      {badge.label}
                    </div>
                  ) : last ? (
                    <div style={{ ...styles.badge, color: "rgba(134,239,172,0.90)", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.20)" }}>
                      Al día{daysLeft != null ? ` · ${daysLeft}d` : ""}
                    </div>
                  ) : (
                    <div style={{ ...styles.badge, color: "rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Sin registro
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lista de registros ── */}
      {records.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "36px 14px" }}>
          <div style={styles.emptyIcon}>🔧</div>
          <div style={styles.emptyTitle}>Sin registros aún</div>
          <div style={styles.emptyText}>Registra el primer mantenimiento de esta bici.</div>
          <button style={{ ...styles.primaryBtn, marginTop: 16 }} onClick={openAdd}>
            Registrar mantenimiento
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {records.map((r) => {
            const mType = r.type_id ? typesById[r.type_id] : null;
            const { badge: urgency } = getTypeStatus(mType, r);
            const costStr = formatCLP(r.cost_clp);

            return (
              <div key={r.id} style={styles.recordCard}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tipo + badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={styles.recordType}>{r.type_name}</div>
                      {urgency && (
                        <div style={{ ...styles.badge, color: urgency.color, background: urgency.bg, border: `1px solid ${urgency.color}` }}>
                          {urgency.label}
                        </div>
                      )}
                    </div>

                    {/* Fecha */}
                    <div style={styles.recordDate}>{formatDate(r.performed_at)}</div>

                    {/* km + costo */}
                    {(r.odometer_km != null || r.cost_clp != null) && (
                      <div style={styles.recordMeta}>
                        {r.odometer_km != null && <span>{r.odometer_km.toLocaleString("es-CL")} km</span>}
                        {r.odometer_km != null && r.cost_clp != null && <span style={styles.dot} />}
                        {r.cost_clp != null && <span>{costStr}</span>}
                      </div>
                    )}

                    {/* Notas */}
                    {r.notes && <div style={styles.recordNotes}>{r.notes}</div>}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                    <button style={styles.secondaryBtn} onClick={() => openEdit(r)}>Editar</button>
                    <button style={styles.ghostBtn} onClick={() => deleteRecord(r.id)}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FAB (móvil) ── */}
      <button onClick={openAdd} style={styles.fab} aria-label="Registrar mantenimiento">+</button>

      {/* ── Modal compartido (agregar / editar) ── */}
      {modalMode && (
        <div style={styles.modalWrap}>
          <div style={styles.modalOverlay} onClick={closeModal} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                {isEditing ? "Editar mantenimiento" : "Registrar mantenimiento"}
              </div>
              <button style={styles.iconBtn} onClick={closeModal} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={isEditing ? updateRecord : saveRecord} style={{ display: "grid", gap: 12, marginTop: 12 }}>

              {/* Tipo */}
              <div style={styles.field}>
                <div style={styles.label}>Tipo de mantenimiento</div>
                <select value={form.type_id} onChange={handleTypeChange} className="dark-select" style={styles.input}>
                  <option value="">— Personalizado —</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Nombre libre (solo si es personalizado) */}
              {form.type_id === "" && (
                <div style={styles.field}>
                  <div style={styles.label}>Nombre del mantenimiento</div>
                  <input
                    value={form.type_name}
                    onChange={(e) => setField("type_name", e.target.value)}
                    placeholder="Ej: Revisión frenos traseros"
                    style={styles.input}
                  />
                </div>
              )}

              {/* Fecha + Odómetro */}
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Fecha</div>
                  <input type="date" value={form.performed_at} onChange={(e) => setField("performed_at", e.target.value)} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Odómetro (km)</div>
                  <input value={form.odometer_km} onChange={(e) => setField("odometer_km", e.target.value)} placeholder="Ej: 1250" inputMode="numeric" style={styles.input} />
                </div>
              </div>

              {/* Costo + Notas */}
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Costo (CLP)</div>
                  <input value={form.cost_clp} onChange={(e) => setField("cost_clp", e.target.value)} placeholder="Ej: 15000" inputMode="numeric" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Notas</div>
                  <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Ej: lubricante Finish Line" style={styles.input} />
                </div>
              </div>

              {/* Tip: intervalo recomendado del tipo seleccionado */}
              {currentTypeData && (() => {
                const hints = [];
                if (currentTypeData.default_interval_km) hints.push(`cada ${currentTypeData.default_interval_km} km`);
                if (currentTypeData.default_interval_days) hints.push(`cada ${currentTypeData.default_interval_days} días`);
                if (!hints.length) return null;
                return (
                  <div style={styles.tipRow}>
                    <div style={styles.tipDot} />
                    <div style={styles.tipText}>Intervalo recomendado: {hints.join(" o ")}</div>
                  </div>
                );
              })()}

              <div style={styles.btnRowRight}>
                <button type="button" style={styles.secondaryBtn} onClick={closeModal}>Cancelar</button>
                <button type="submit" style={styles.primaryBtn} disabled={saving}>
                  {saving ? "Guardando…" : isEditing ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const styles = {
  card: { borderRadius: 22, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", padding: 14 },
  kicker: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  heroTitle: { marginTop: 6, fontSize: 26, fontWeight: 900, letterSpacing: -0.6, color: "rgba(255,255,255,0.96)", lineHeight: 1.05 },
  heroSub: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.65)" },
  sectionTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)", fontSize: 14 },
  panelRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14 },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0 },
  recordCard: { padding: 14, borderRadius: 18, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" },
  recordType: { fontWeight: 900, fontSize: 15, color: "rgba(255,255,255,0.92)" },
  recordDate: { marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.70)" },
  recordMeta: { marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.60)" },
  recordNotes: { marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.58)", fontStyle: "italic" },
  dot: { display: "inline-block", width: 3, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.30)" },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.92)", fontSize: 20, fontWeight: 900 },
  emptyTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  emptyText: { marginTop: 6, color: "rgba(255,255,255,0.68)", fontSize: 13 },
  linkBtn: { color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, padding: "10px" },
  primaryBtn: { border: 0, fontWeight: 900, padding: "12px 14px", borderRadius: 14, color: "#0b1220", background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))", boxShadow: "0 14px 30px rgba(0,0,0,0.35)", cursor: "pointer" },
  secondaryBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontWeight: 900, padding: "10px 12px", borderRadius: 14, cursor: "pointer", fontSize: 13 },
  ghostBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)", fontWeight: 900, padding: "10px 12px", borderRadius: 14, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  iconBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontWeight: 900, padding: "8px 10px", borderRadius: 12, cursor: "pointer" },
  fab: { position: "fixed", right: 18, bottom: 18, width: 56, height: 56, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(99,102,241,0.65), rgba(34,197,94,0.55))", color: "rgba(255,255,255,0.95)", fontWeight: 900, fontSize: 26, boxShadow: "0 18px 55px rgba(0,0,0,0.45)", cursor: "pointer" },
  modalWrap: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)" },
  modal: { position: "relative", width: "100%", maxWidth: 720, borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(7,10,18,0.90)", backdropFilter: "blur(12px)", boxShadow: "0 25px 70px rgba(0,0,0,0.55)", padding: 14 },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.10)" },
  modalTitle: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  input: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.22)", color: "rgba(255,255,255,0.92)", outline: "none", fontSize: 14, width: "100%", boxSizing: "border-box" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  btnRowRight: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" },
  tipRow: { display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.65)", fontSize: 12 },
  tipDot: { width: 8, height: 8, borderRadius: 99, background: "rgba(99,102,241,0.75)", flexShrink: 0 },
  tipText: { lineHeight: 1.4 },
};
