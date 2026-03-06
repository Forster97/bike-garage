"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../../lib/supabaseClient";
import AppHeader from "../../../../../components/AppHeader";
import PageShell from "../../../../../components/PageShell";
import { formatDate, formatDateShort, formatCLP, todayISO } from "../../../../../lib/dateHelpers";
import {
  PROFILES, resolveRule, calculateTaskStatus, getStatusBadge, bikeHealthScore, healthColor,
} from "../../../../../lib/maintenanceHelpers";

const emptyForm = () => ({
  type_id: "", type_name: "", performed_at: todayISO(),
  odometer_km: "", cost_clp: "", notes: "",
});

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

  // ── Estado base ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [bike, setBike] = useState(null);
  const [records, setRecords] = useState([]);
  const [types, setTypes] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // ── Estado de componentes instalados ──────────────────────────────────────
  const [bikeParts, setBikeParts] = useState([]);

  // ── Estado de perfil, odómetro y reglas ───────────────────────────────────
  const [bikeProfile, setBikeProfile] = useState("balanced");
  const [bikeStats, setBikeStats] = useState(null);
  const [customRules, setCustomRules] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingOdometer, setEditingOdometer] = useState(false);
  const [odometerInput, setOdometerInput] = useState("");
  const [savingOdometer, setSavingOdometer] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({ days: "", km: "" });
  const [savingRule, setSavingRule] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bikeId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: ud } = await supabase.auth.getUser();
        if (!ud?.user) return router.replace("/login");

        const [bikeRes, recRes, typRes, profileRes, statsRes, rulesRes, partsRes] = await Promise.all([
          supabase.from("bikes").select("*").eq("id", bikeId).single(),
          supabase.from("bike_maintenance").select("*").eq("bike_id", bikeId).order("performed_at", { ascending: false }),
          supabase.from("maintenance_types").select("*").order("name", { ascending: true }),
          supabase.from("bike_profiles").select("profile").eq("bike_id", bikeId).maybeSingle(),
          supabase.from("bike_stats").select("odometer_km").eq("bike_id", bikeId).maybeSingle(),
          supabase.from("maintenance_rules").select("*").eq("bike_id", bikeId),
          supabase.from("bike_components").select("component:components(category)").eq("bike_id", bikeId),
        ]);

        if (cancelled) return;
        setBike(bikeRes.data || null);
        setRecords(recRes.data || []);
        setTypes(typRes.data || []);
        setBikeProfile(profileRes.data?.profile ?? "balanced");
        setBikeStats(statsRes.data || null);
        setCustomRules(rulesRes.data || []);
        // Aplanar el join para obtener { category } por cada bike_component
        setBikeParts((partsRes.data || []).map((bc) => ({ category: bc.component?.category })).filter((p) => p.category));
        setOdometerInput(String(statsRes.data?.odometer_km ?? ""));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bikeId, router]);

  // ── Lookups ────────────────────────────────────────────────────────────────
  const typesById = useMemo(() => {
    const m = {}; for (const t of types) m[t.id] = t; return m;
  }, [types]);

  const lastByTypeName = useMemo(() => {
    const m = {}; for (const r of records) { if (!m[r.type_name]) m[r.type_name] = r; } return m;
  }, [records]);

  const recordsByTypeName = useMemo(() => {
    const m = {};
    for (const r of records) { if (!m[r.type_name]) m[r.type_name] = []; m[r.type_name].push(r); }
    return m;
  }, [records]);

  // Map typeId → custom rule
  const customRulesByTypeId = useMemo(() => {
    const m = {}; for (const r of customRules) m[String(r.type_id)] = r; return m;
  }, [customRules]);

  // Mapping: categoría de maintenance_type → categorías de partes correspondientes
  // null = siempre mostrar
  const MAINT_TO_PART_CAT = {
    transmision: ["Transmisión"],
    frenos:      ["Frenos"],
    suspension:  ["Horquilla", "Sillín / Tija"],
    estructura:  null, // rodamientos / torque → aplica a toda bici
    ruedas:      ["Ruedas", "Neumáticos"],
    general:     null,
  };

  // Tipos filtrados según los componentes instalados en esta bici.
  // Si la bici no tiene ningún componente aún, se muestran todos.
  const filteredTypes = useMemo(() => {
    if (bikeParts.length === 0) return types;
    const presentCats = new Set(bikeParts.map((p) => p.category));
    return types.filter((t) => {
      const mapped = MAINT_TO_PART_CAT[t.category];
      if (mapped === null || mapped === undefined) return true;
      return mapped.some((cat) => presentCats.has(cat));
    });
  }, [types, bikeParts]);

  const currentKm = bikeStats?.odometer_km ?? null;

  // ── Panel de estado con lógica de perfil + km ──────────────────────────────
  const statusPanel = useMemo(() => {
    // Fecha de creación de la bici como punto de partida si no hay registro
    const bikeCreatedDate = bike?.created_at ? bike.created_at.split("T")[0] : null;
    const creationFallback = bikeCreatedDate ? { performed_at: bikeCreatedDate, odometer_km: null } : null;

    return filteredTypes
      .map((t) => {
        const rule = resolveRule(t, customRulesByTypeId[String(t.id)], bikeProfile);
        if (!rule.interval_days && !rule.interval_km) return null;
        const last = lastByTypeName[t.name] || null;
        const lastForCalc = last ?? creationFallback;
        const taskStatus = calculateTaskStatus(rule, lastForCalc, currentKm);
        const badge = getStatusBadge(taskStatus);
        return { type: t, last, rule, ...taskStatus, badge };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const order = { overdue: 0, soon: 1, ok: 2, none: 3 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
  }, [filteredTypes, customRulesByTypeId, bikeProfile, lastByTypeName, currentKm, bike]);

  const panelTypeNames = useMemo(() => new Set(statusPanel.map((s) => s.type.name)), [statusPanel]);
  const otherRecords = useMemo(() => records.filter((r) => !panelTypeNames.has(r.type_name)), [records, panelTypeNames]);

  const overdueCount = statusPanel.filter((s) => s.status === "overdue").length;
  const soonCount = statusPanel.filter((s) => s.status === "soon").length;

  const healthScore = useMemo(() => bikeHealthScore(
    statusPanel.map((s) => ({ status: s.status, urgency: s.urgency, severity: s.type.severity }))
  ), [statusPanel]);

  const hc = healthColor(healthScore);

  // ── Acordeón ───────────────────────────────────────────────────────────────
  const toggleType = (name) => setExpandedTypes((p) => ({ ...p, [name]: !p[name] }));

  // ── Guardar perfil ─────────────────────────────────────────────────────────
  const saveProfile = async (profile) => {
    setSavingProfile(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const uid = ud?.user?.id; if (!uid) return;
      await supabase.from("bike_profiles").upsert(
        { bike_id: bikeId, user_id: uid, profile },
        { onConflict: "bike_id" }
      );
      setBikeProfile(profile);
    } finally { setSavingProfile(false); }
  };

  // ── Guardar odómetro ───────────────────────────────────────────────────────
  const saveOdometer = async () => {
    const km = Number(odometerInput);
    if (isNaN(km) || km < 0) return alert("Km inválido.");
    setSavingOdometer(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const uid = ud?.user?.id; if (!uid) return;
      await supabase.from("bike_stats").upsert(
        { bike_id: bikeId, user_id: uid, odometer_km: km, updated_at: new Date().toISOString() },
        { onConflict: "bike_id" }
      );
      setBikeStats((p) => ({ ...p, odometer_km: km }));
      setEditingOdometer(false);
    } finally { setSavingOdometer(false); }
  };

  // ── Guardar regla custom ───────────────────────────────────────────────────
  const saveCustomRule = async (typeId) => {
    setSavingRule(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const uid = ud?.user?.id; if (!uid) return;
      const days = ruleForm.days ? Number(ruleForm.days) : null;
      const km = ruleForm.km ? Number(ruleForm.km) : null;

      if (!days && !km) {
        // Eliminar regla custom → vuelve al perfil
        await supabase.from("maintenance_rules").delete()
          .eq("bike_id", bikeId).eq("type_id", typeId);
        setCustomRules((p) => p.filter((r) => String(r.type_id) !== String(typeId)));
      } else {
        const { data, error } = await supabase.from("maintenance_rules")
          .upsert(
            { user_id: uid, bike_id: bikeId, type_id: typeId, interval_days: days, interval_km: km, is_active: true, updated_at: new Date().toISOString() },
            { onConflict: "bike_id,type_id" }
          ).select("*").single();
        if (!error && data) {
          setCustomRules((p) => [...p.filter((r) => String(r.type_id) !== String(typeId)), data]);
        }
      }
      setEditingRuleId(null);
    } finally { setSavingRule(false); }
  };

  const openRuleEditor = (type, currentRule, e) => {
    e?.stopPropagation?.();
    setEditingRuleId(type.id);
    const cr = customRulesByTypeId[String(type.id)];
    setRuleForm({
      days: String(cr?.interval_days ?? currentRule?.interval_days ?? ""),
      km: String(cr?.interval_km ?? currentRule?.interval_km ?? ""),
    });
  };

  // ── Formulario de registro ─────────────────────────────────────────────────
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleTypeChange = (e) => {
    const id = e.target.value;
    const found = filteredTypes.find((t) => String(t.id) === id);
    setField("type_id", id);
    setField("type_name", found ? found.name : "");
    if (found && currentKm != null) setField("odometer_km", String(currentKm));
  };

  const openAdd = () => {
    setForm({ ...emptyForm(), odometer_km: currentKm != null ? String(currentKm) : "" });
    setEditingId(null); setModalMode("add");
  };
  const openAddForType = (type, e) => {
    e?.stopPropagation?.();
    setForm({ ...emptyForm(), type_id: String(type.id), type_name: type.name, odometer_km: currentKm != null ? String(currentKm) : "" });
    setEditingId(null); setModalMode("add");
  };
  const openEdit = (r, e) => {
    e?.stopPropagation?.();
    setForm(recordToForm(r)); setEditingId(r.id); setModalMode("edit");
  };
  const closeModal = () => { setModalMode(null); setEditingId(null); };

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
      type_name: typeName, performed_at: form.performed_at,
      odometer_km: km, cost_clp: cost, notes: form.notes.trim() || null,
    };
  };

  const saveRecord = async (e) => {
    e?.preventDefault?.();
    const parsed = parseForm(); if (!parsed) return;
    setSaving(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const uid = ud?.user?.id; if (!uid) return router.replace("/login");
      const { data, error } = await supabase
        .from("bike_maintenance").insert([{ user_id: uid, bike_id: bikeId, ...parsed }])
        .select("*").single();
      if (error) return alert(error.message);
      setRecords((p) => { const n = [data, ...p]; n.sort((a, b) => a.performed_at < b.performed_at ? 1 : -1); return n; });
      setExpandedTypes((p) => ({ ...p, [data.type_name]: true }));
      // Actualizar odómetro si el registro tiene km mayor al actual
      if (parsed.odometer_km != null && (currentKm == null || parsed.odometer_km > currentKm)) {
        setBikeStats((p) => ({ ...p, odometer_km: parsed.odometer_km }));
        setOdometerInput(String(parsed.odometer_km));
      }
      closeModal();
    } finally { setSaving(false); }
  };

  const updateRecord = async (e) => {
    e?.preventDefault?.();
    const parsed = parseForm(); if (!parsed || !editingId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bike_maintenance").update(parsed).eq("id", editingId).select("*").single();
      if (error) return alert(error.message);
      setRecords((p) => { const n = p.map((r) => r.id === editingId ? data : r); n.sort((a, b) => a.performed_at < b.performed_at ? 1 : -1); return n; });
      closeModal();
    } finally { setSaving(false); }
  };

  const deleteRecord = async (id, e) => {
    e?.stopPropagation?.();
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    const { error } = await supabase.from("bike_maintenance").delete().eq("id", id);
    if (error) return alert(error.message);
    setRecords((p) => p.filter((r) => r.id !== id));
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerActions = [
    <Link key="back" href={`/garage/${bikeId}`} style={S.linkBtn}>← Volver</Link>,
  ];

  if (loading) return (
    <PageShell header={<AppHeader actions={headerActions} />}>
      <div className="animate-pulse rounded-[18px] border p-4"
        style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
        <div className="h-5 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
        <div className="mt-3 h-4 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="mt-3 h-4 w-3/4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    </PageShell>
  );

  if (!bike) return (
    <PageShell header={<AppHeader actions={headerActions} />}>
      <div style={{ ...S.card, textAlign: "center", padding: "40px 16px" }}>
        <div style={S.emptyIcon}>🤕</div>
        <div style={S.emptyTitle}>No encontré esta bicicleta</div>
        <button onClick={() => router.push("/garage")} style={{ ...S.primaryBtn, marginTop: 16 }}>
          Volver al Garage
        </button>
      </div>
    </PageShell>
  );

  const isEditing = modalMode === "edit";
  const currentTypeData = form.type_id ? typesById[Number(form.type_id)] : null;

  return (
    <PageShell header={<AppHeader actions={headerActions} />}>

      {/* ── CSS responsive ── */}
      <style>{`
        .m-acc-hdr {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 14px; cursor: pointer; border: none; text-align: left;
        }
        .m-acc-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .m-hist-row { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; }
        .m-hist-actions { display: flex; gap: 6px; flex-shrink: 0; align-items: flex-start; padding-top: 2px; }
        .m-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .m-modal-wrap {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .m-modal {
          position: relative; width: 100%; max-width: 720px;
          border-radius: 22px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(7,10,18,0.95); backdrop-filter: blur(16px);
          box-shadow: 0 25px 70px rgba(0,0,0,0.65); padding: 16px;
          max-height: 90vh; overflow-y: auto;
        }
        .m-rec-row { display: flex; align-items: flex-start; gap: 10px; }
        .m-rec-actions { display: flex; gap: 6px; flex-shrink: 0; }
        @media (max-width: 600px) {
          .m-acc-hdr { flex-wrap: wrap; gap: 6px; padding: 12px; }
          .m-acc-right { width: 100%; justify-content: space-between; padding-left: 26px; }
          .m-hist-row { flex-wrap: wrap; padding: 10px 12px; }
          .m-hist-content { flex: 1 1 calc(100% - 22px); min-width: 0; }
          .m-hist-actions {
            flex-shrink: 0; width: calc(100% - 22px); margin-left: 22px;
            justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07);
            padding-top: 8px; margin-top: 6px;
          }
          .m-grid2 { grid-template-columns: 1fr !important; }
          .m-modal-wrap { align-items: flex-end; padding: 0; }
          .m-modal { border-radius: 22px 22px 0 0; max-height: 92vh; padding: 20px 16px; }
          .m-rec-row { flex-wrap: wrap; gap: 6px; }
          .m-rec-actions {
            width: 100%; justify-content: flex-end;
            border-top: 1px solid rgba(255,255,255,0.07); padding-top: 8px; margin-top: 4px;
          }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={S.card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={S.kicker}>Mantenimiento</div>
            <div style={S.heroTitle}>{bike.name}</div>

            {/* Salud general */}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Salud:</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: hc.fg }}>{healthScore}%</span>
              <span style={{ ...S.miniChip, color: hc.fg, background: hc.bg, border: `1px solid ${hc.border}` }}>
                {hc.label}
              </span>
              {overdueCount > 0 && (
                <span style={{ ...S.miniChip, color: "rgba(239,68,68,0.90)", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  {overdueCount} vencido{overdueCount > 1 ? "s" : ""}
                </span>
              )}
              {soonCount > 0 && (
                <span style={{ ...S.miniChip, color: "rgba(251,191,36,0.90)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)" }}>
                  {soonCount} próximo{soonCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Barra de salud */}
            <div style={{ marginTop: 8, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${healthScore}%`, borderRadius: 99,
                background: hc.fg, transition: "width 0.6s ease",
              }} />
            </div>

            {/* Perfil */}
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginRight: 2 }}>Perfil:</span>
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => saveProfile(p.id)}
                  disabled={savingProfile}
                  title={p.description}
                  style={{
                    padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    cursor: savingProfile ? "wait" : "pointer",
                    border: bikeProfile === p.id ? "1px solid rgba(99,102,241,0.55)" : "1px solid rgba(255,255,255,0.11)",
                    background: bikeProfile === p.id ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.04)",
                    color: bikeProfile === p.id ? "rgba(165,180,252,0.95)" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Odómetro */}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Odómetro:</span>
              {editingOdometer ? (
                <>
                  <input
                    value={odometerInput}
                    onChange={(e) => setOdometerInput(e.target.value)}
                    style={{ ...S.input, padding: "5px 10px", width: 90, fontSize: 13 }}
                    inputMode="numeric" placeholder="km" autoFocus
                  />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)" }}>km</span>
                  <button onClick={saveOdometer} disabled={savingOdometer} style={{ ...S.secondaryBtn, fontSize: 11 }}>
                    {savingOdometer ? "…" : "Guardar"}
                  </button>
                  <button onClick={() => { setEditingOdometer(false); setOdometerInput(String(bikeStats?.odometer_km ?? "")); }} style={S.iconBtnSm}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
                    {bikeStats?.odometer_km != null ? `${Number(bikeStats.odometer_km).toLocaleString("es-CL")} km` : "Sin registrar"}
                  </span>
                  <button onClick={() => setEditingOdometer(true)} style={{ ...S.ghostBtn, fontSize: 11 }}>
                    Editar
                  </button>
                </>
              )}
            </div>

            <div style={{ ...S.heroSub, marginTop: 8 }}>
              {records.length} registro{records.length === 1 ? "" : "s"}
              {records.length > 0 && <> · Último: {formatDateShort(records[0]?.performed_at)}</>}
            </div>
          </div>

          <button style={S.primaryBtn} onClick={openAdd}>+ Registrar</button>
        </div>
      </div>

      {/* ── Panel acordeón por tipo ── */}
      {statusPanel.length > 0 && (
        <div style={S.card}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <div style={S.sectionTitle}>Estado del mantenimiento</div>
            {bikeParts.length > 0 && filteredTypes.length < types.length && (
              <Link href={`/garage/${bikeId}`} style={{ fontSize: 11, color: "rgba(165,180,252,0.70)", textDecoration: "none" }}>
                {filteredTypes.length} de {types.length} tareas · por componentes ›
              </Link>
            )}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {statusPanel.map(({ type, last, rule, status, badge, remainingDays, remainingKm, nextDueDate }) => {
              const isOpen = !!expandedTypes[type.name];
              const typeRecords = recordsByTypeName[type.name] || [];
              const count = typeRecords.length;
              const isCustom = !!customRulesByTypeId[String(type.id)];
              const isEditingThisRule = editingRuleId === type.id;

              const rowBg = status === "overdue" ? "rgba(239,68,68,0.07)"
                : status === "soon" ? "rgba(251,191,36,0.05)" : "rgba(0,0,0,0.18)";
              const rowBorder = status === "overdue" ? "1px solid rgba(239,68,68,0.22)"
                : status === "soon" ? "1px solid rgba(251,191,36,0.18)" : "1px solid rgba(255,255,255,0.08)";

              // Sub info con km
              const kmPart = remainingKm !== null
                ? (remainingKm > 0 ? ` · ${Math.round(remainingKm)} km restantes` : ` · ${Math.abs(Math.round(remainingKm))} km excedidos`)
                : "";

              return (
                <div key={type.id} style={{ borderRadius: 16, overflow: "hidden", border: rowBorder }}>

                  {/* Cabecera */}
                  <button
                    type="button"
                    onClick={() => toggleType(type.name)}
                    className="m-acc-hdr"
                    style={{ background: rowBg }}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span style={S.expandArrow}>{isOpen ? "▾" : "▸"}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={S.accTypeName}>{type.name}</span>
                          {count > 0 && <span style={S.countPill}>{count}</span>}
                          {isCustom && (
                            <span style={{ ...S.miniChip, fontSize: 10, color: "rgba(165,180,252,0.80)", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                              personalizado
                            </span>
                          )}
                        </div>
                        <div style={S.accSub}>
                          {last ? (
                            <>
                              Último: {formatDateShort(last.performed_at)}
                              {nextDueDate && (
                                <> · <span style={{ color: "rgba(255,255,255,0.75)" }}>Próximo: {formatDateShort(nextDueDate)}</span>{kmPart}</>
                              )}
                            </>
                          ) : nextDueDate ? (
                            <span style={{ color: "rgba(255,255,255,0.50)" }}>
                              Sin registro · <span style={{ color: "rgba(255,255,255,0.75)" }}>Próximo: {formatDateShort(nextDueDate)}</span>{kmPart}
                            </span>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.32)" }}>Sin registro todavía</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="m-acc-right">
                      {badge ? (
                        <span style={{ ...S.badge, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      ) : last ? (
                        <span style={{ ...S.badge, color: "rgba(134,239,172,0.90)", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.20)" }}>
                          Al día{remainingDays != null ? ` · ${Math.round(remainingDays)}d` : ""}
                        </span>
                      ) : (
                        <span style={{ ...S.badge, color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          Sin registro
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => openAddForType(type, e)}
                        style={S.addTypeBtn}
                        title={`Registrar ${type.name}`}
                      >+</button>
                    </div>
                  </button>

                  {/* Cuerpo expandido */}
                  {isOpen && (
                    <div style={{ background: "rgba(0,0,0,0.14)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

                      {/* Historial */}
                      {count === 0 ? (
                        <div style={{ padding: "14px", fontSize: 13, color: "rgba(255,255,255,0.52)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span>Sin registros para este tipo.</span>
                          <button type="button" style={S.inlineLink} onClick={(e) => openAddForType(type, e)}>
                            Registrar ahora →
                          </button>
                        </div>
                      ) : (
                        typeRecords.map((r, idx) => {
                          const isLast = idx === typeRecords.length - 1;
                          const costStr = formatCLP(r.cost_clp);
                          return (
                            <div key={r.id} className="m-hist-row"
                              style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={S.timelineWrap}>
                                <div style={S.timelineDot} />
                                {!isLast && <div style={S.timelineLine} />}
                              </div>
                              <div className="m-hist-content" style={{ flex: 1, minWidth: 0 }}>
                                <div style={S.histDate}>{formatDate(r.performed_at)}</div>
                                {(r.odometer_km != null || r.cost_clp != null) && (
                                  <div className="flex items-center flex-wrap gap-1.5" style={S.histMeta}>
                                    {r.odometer_km != null && <span>{r.odometer_km.toLocaleString("es-CL")} km</span>}
                                    {r.odometer_km != null && r.cost_clp != null && <span style={S.dot} />}
                                    {r.cost_clp != null && <span>{costStr}</span>}
                                  </div>
                                )}
                                {r.notes && <div style={S.histNotes}>{r.notes}</div>}
                              </div>
                              <div className="m-hist-actions">
                                <button style={S.secondaryBtn} onClick={(e) => openEdit(r, e)}>Editar</button>
                                <button style={S.ghostBtn} onClick={(e) => deleteRecord(r.id, e)}>Eliminar</button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Hint y editor de regla */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px" }}>
                        {type.notes_hint && !isEditingThisRule && (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontStyle: "italic", marginBottom: 8 }}>
                            💡 {type.notes_hint}
                          </div>
                        )}

                        {isEditingThisRule ? (
                          /* Editor inline de intervalo */
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>Cada:</span>
                            <input
                              value={ruleForm.days}
                              onChange={(e) => setRuleForm((p) => ({ ...p, days: e.target.value }))}
                              placeholder="días"
                              style={{ ...S.input, padding: "5px 8px", width: 65, fontSize: 13 }}
                              inputMode="numeric"
                            />
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>días /</span>
                            <input
                              value={ruleForm.km}
                              onChange={(e) => setRuleForm((p) => ({ ...p, km: e.target.value }))}
                              placeholder="km"
                              style={{ ...S.input, padding: "5px 8px", width: 80, fontSize: 13 }}
                              inputMode="numeric"
                            />
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>km</span>
                            <button
                              onClick={() => saveCustomRule(type.id)}
                              disabled={savingRule}
                              style={{ ...S.secondaryBtn, fontSize: 11 }}
                            >
                              {savingRule ? "…" : "Guardar"}
                            </button>
                            <button onClick={() => setEditingRuleId(null)} style={{ ...S.ghostBtn, fontSize: 11 }}>Cancelar</button>
                            {isCustom && (
                              <button
                                onClick={() => { setRuleForm({ days: "", km: "" }); saveCustomRule(type.id); }}
                                style={{ ...S.ghostBtn, fontSize: 11, color: "rgba(239,68,68,0.65)" }}
                              >
                                Restaurar perfil
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Vista de intervalo actual */
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                              Intervalo: {[
                                rule?.interval_days && `${rule.interval_days} días`,
                                rule?.interval_km && `${rule.interval_km.toLocaleString("es-CL")} km`,
                              ].filter(Boolean).join(" / ") || "—"}
                            </span>
                            <button
                              onClick={(e) => openRuleEditor(type, rule, e)}
                              style={{ ...S.ghostBtn, fontSize: 11, marginLeft: "auto" }}
                            >
                              ⚙ Personalizar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Otros registros ── */}
      {otherRecords.length > 0 && (
        <div style={S.card}>
          <div style={{ marginBottom: 12 }}>
            <div style={S.sectionTitle}>Otros registros</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.46)" }}>
              Personalizados o sin intervalo definido
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {otherRecords.map((r) => {
              const costStr = formatCLP(r.cost_clp);
              return (
                <div key={r.id} style={S.recCard}>
                  <div className="m-rec-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.recType}>{r.type_name}</div>
                      <div style={S.recDate}>{formatDate(r.performed_at)}</div>
                      {(r.odometer_km != null || r.cost_clp != null) && (
                        <div className="flex items-center flex-wrap gap-1.5" style={S.recMeta}>
                          {r.odometer_km != null && <span>{r.odometer_km.toLocaleString("es-CL")} km</span>}
                          {r.odometer_km != null && r.cost_clp != null && <span style={S.dot} />}
                          {r.cost_clp != null && <span>{costStr}</span>}
                        </div>
                      )}
                      {r.notes && <div style={S.recNotes}>{r.notes}</div>}
                    </div>
                    <div className="m-rec-actions">
                      <button style={S.secondaryBtn} onClick={(e) => openEdit(r, e)}>Editar</button>
                      <button style={S.ghostBtn} onClick={(e) => deleteRecord(r.id, e)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Estado vacío ── */}
      {statusPanel.length === 0 && otherRecords.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: "40px 16px" }}>
          <div style={S.emptyIcon}>🔧</div>
          <div style={S.emptyTitle}>Sin registros aún</div>
          <div style={S.emptyText}>Registra el primer mantenimiento de esta bici.</div>
          <button style={{ ...S.primaryBtn, marginTop: 18 }} onClick={openAdd}>
            Registrar mantenimiento
          </button>
        </div>
      )}

      {/* ── FAB ── */}
      <button onClick={openAdd} style={S.fab} aria-label="Registrar mantenimiento">+</button>

      {/* ── Modal ── */}
      {modalMode && (
        <div className="m-modal-wrap" onClick={closeModal}>
          <div className="m-modal" onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetHandle} aria-hidden />
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>
                {isEditing ? "Editar mantenimiento" : "Registrar mantenimiento"}
              </div>
              <button style={S.iconBtn} onClick={closeModal} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={isEditing ? updateRecord : saveRecord} style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {/* Tipo */}
              <div style={S.field}>
                <div style={S.label}>Tipo de mantenimiento</div>
                <select value={form.type_id} onChange={handleTypeChange} className="dark-select" style={S.input}>
                  <option value="">— Personalizado —</option>
                  {filteredTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {form.type_id === "" && (
                <div style={S.field}>
                  <div style={S.label}>Nombre del mantenimiento</div>
                  <input
                    value={form.type_name}
                    onChange={(e) => setField("type_name", e.target.value)}
                    placeholder="Ej: Revisión frenos traseros"
                    style={S.input} autoFocus
                  />
                </div>
              )}

              {/* Fecha + Odómetro */}
              <div className="m-grid2">
                <div style={S.field}>
                  <div style={S.label}>Fecha</div>
                  <input type="date" value={form.performed_at} onChange={(e) => setField("performed_at", e.target.value)} style={S.input} />
                </div>
                <div style={S.field}>
                  <div style={S.label}>Odómetro (km)</div>
                  <input value={form.odometer_km} onChange={(e) => setField("odometer_km", e.target.value)} placeholder="Opcional" inputMode="numeric" style={S.input} />
                </div>
              </div>

              {/* Costo + Notas */}
              <div className="m-grid2">
                <div style={S.field}>
                  <div style={S.label}>Costo (CLP)</div>
                  <input value={form.cost_clp} onChange={(e) => setField("cost_clp", e.target.value)} placeholder="Opcional" inputMode="numeric" style={S.input} />
                </div>
                <div style={S.field}>
                  <div style={S.label}>Notas</div>
                  <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Opcional" style={S.input} />
                </div>
              </div>

              {/* Hint del tipo seleccionado */}
              {currentTypeData?.notes_hint && (
                <div style={S.tipRow}>
                  <div style={S.tipDot} />
                  <div style={S.tipText}>{currentTypeData.notes_hint}</div>
                </div>
              )}

              {/* Intervalo recomendado */}
              {currentTypeData && (() => {
                const rule = resolveRule(currentTypeData, customRulesByTypeId[String(currentTypeData.id)], bikeProfile);
                const hints = [rule.interval_days && `${rule.interval_days} días`, rule.interval_km && `${rule.interval_km.toLocaleString("es-CL")} km`].filter(Boolean);
                if (!hints.length) return null;
                return (
                  <div style={{ ...S.tipRow, color: "rgba(165,180,252,0.70)" }}>
                    <div style={{ ...S.tipDot, background: "rgba(99,102,241,0.70)" }} />
                    <div style={S.tipText}>Intervalo ({PROFILES.find(p => p.id === bikeProfile)?.label ?? bikeProfile}): {hints.join(" / ")}</div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 flex-wrap">
                <button type="button" style={S.secondaryBtnLg} onClick={closeModal}>Cancelar</button>
                <button type="submit" style={S.primaryBtn} disabled={saving}>
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

// ── Design tokens ──────────────────────────────────────────────────────────────
const S = {
  card: { borderRadius: 20, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.055)", boxShadow: "0 20px 50px rgba(0,0,0,0.30)", padding: 14 },
  kicker: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" },
  heroTitle: { marginTop: 5, fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 900, letterSpacing: -0.5, color: "rgba(255,255,255,0.96)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.60)" },
  sectionTitle: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" },
  miniChip: { display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 900 },
  expandArrow: { fontSize: 13, color: "rgba(255,255,255,0.45)", flexShrink: 0, lineHeight: 1.6 },
  accTypeName: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.3 },
  accSub: { marginTop: 2, fontSize: 11, color: "rgba(255,255,255,0.50)", lineHeight: 1.4 },
  countPill: { display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)" },
  addTypeBtn: { width: 32, height: 32, borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.80)", fontWeight: 900, fontSize: 20, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badge: { display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 999, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0 },
  timelineWrap: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4, flexShrink: 0, width: 14 },
  timelineDot: { width: 8, height: 8, borderRadius: 999, background: "rgba(99,102,241,0.70)", border: "1px solid rgba(99,102,241,0.40)", flexShrink: 0 },
  timelineLine: { width: 1, flex: 1, minHeight: 16, background: "rgba(255,255,255,0.09)", marginTop: 4 },
  histDate: { fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 },
  histMeta: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.52)" },
  histNotes: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.46)", fontStyle: "italic" },
  dot: { display: "inline-block", width: 3, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.25)" },
  inlineLink: { border: "none", background: "none", color: "rgba(99,102,241,0.90)", fontWeight: 900, fontSize: 13, cursor: "pointer", padding: 0 },
  recCard: { padding: "12px 12px", borderRadius: 14, background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.07)" },
  recType: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" },
  recDate: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.60)" },
  recMeta: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.52)" },
  recNotes: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.44)", fontStyle: "italic" },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 22 },
  emptyTitle: { fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.90)" },
  emptyText: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 },
  linkBtn: { color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 14, padding: "10px" },
  primaryBtn: { border: 0, fontWeight: 900, padding: "13px 18px", borderRadius: 14, color: "#0b1220", background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))", boxShadow: "0 10px 28px rgba(0,0,0,0.30)", cursor: "pointer", fontSize: 14 },
  secondaryBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", fontWeight: 900, padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  secondaryBtnLg: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", fontWeight: 900, padding: "13px 18px", borderRadius: 14, cursor: "pointer", fontSize: 14 },
  ghostBtn: { border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.62)", fontWeight: 900, padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  iconBtn: { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", fontWeight: 900, padding: "8px 10px", borderRadius: 12, cursor: "pointer" },
  iconBtnSm: { border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.70)", fontWeight: 900, padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11 },
  fab: { position: "fixed", right: 18, bottom: 22, width: 56, height: 56, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(99,102,241,0.70), rgba(34,197,94,0.60))", color: "rgba(255,255,255,0.95)", fontWeight: 900, fontSize: 28, boxShadow: "0 16px 48px rgba(0,0,0,0.50)", cursor: "pointer" },
  sheetHandle: { width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)", margin: "0 auto 16px" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.10)" },
  modalTitle: { fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.94)" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.60)" },
  input: { padding: "13px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.92)", outline: "none", fontSize: 15, width: "100%", boxSizing: "border-box" },
  tipRow: { display: "flex", gap: 8, alignItems: "flex-start", color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.5 },
  tipDot: { width: 8, height: 8, borderRadius: 99, background: "rgba(99,102,241,0.80)", flexShrink: 0, marginTop: 3 },
  tipText: {},
};
