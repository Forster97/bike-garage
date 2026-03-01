"use client";

export const dynamic = "force-dynamic";

// Página de notificaciones.
// Muestra todas las alertas de mantenimiento de todas las bicis del usuario.
// Permite activar/desactivar el email por tipo de mantenimiento.
// Botón "Enviar resumen" llama al API route que usa Resend para enviar el correo.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

// ── Helpers (misma lógica que en la página de mantenimiento) ──────────────────

function daysSince(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 864e5);
}

function addDays(dateStr, days) {
  if (!dateStr || !days) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getTypeStatus(mType, lastRecord) {
  if (!lastRecord) return { status: "none", nextDate: null, daysLeft: null, badge: null };
  const intervalDays = mType?.default_interval_days;
  if (!intervalDays) return { status: "ok", nextDate: null, daysLeft: null, badge: null };
  const days = daysSince(lastRecord.performed_at);
  if (days === null) return { status: "none", nextDate: null, daysLeft: null, badge: null };
  const nextDate = addDays(lastRecord.performed_at, intervalDays);
  const daysLeft = intervalDays - days;
  const pct = days / intervalDays;
  if (pct >= 1) return {
    status: "overdue", nextDate, daysLeft,
    badge: { label: `Vencido hace ${Math.abs(daysLeft)}d`, color: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  };
  if (pct >= 0.75) return {
    status: "soon", nextDate, daysLeft,
    badge: { label: `Vence en ${daysLeft}d`, color: "rgba(251,191,36,0.90)", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.20)" },
  };
  return { status: "ok", nextDate, daysLeft, badge: null };
}

function bikeName(bike) {
  return `${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || "Bicicleta";
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [bikes, setBikes] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [types, setTypes] = useState([]);
  // prefs: { [type_id]: boolean } — true = notificar por email, false = ignorar
  const [prefs, setPrefs] = useState({});
  const [savingPref, setSavingPref] = useState(null); // type_id en proceso de guardado
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok, message }

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: ud } = await supabase.auth.getUser();
        if (!ud?.user) return router.replace("/login");
        setUserEmail(ud.user.email ?? "");

        const [bikesRes, typesRes, prefsRes] = await Promise.all([
          supabase.from("bikes").select("id, brand, model, type").eq("user_id", ud.user.id),
          supabase.from("maintenance_types").select("*").order("name"),
          supabase.from("notification_preferences").select("*").eq("user_id", ud.user.id),
        ]);

        if (cancelled) return;

        const bikesData = bikesRes.data || [];
        setBikes(bikesData);
        setTypes(typesRes.data || []);

        // Construye mapa { [type_id]: notify_email }
        // Si no hay preferencia guardada para un tipo, se asume true (habilitado por defecto)
        const prefsMap = {};
        for (const p of prefsRes.data || []) prefsMap[p.type_id] = p.notify_email;
        setPrefs(prefsMap);

        // Carga registros de mantenimiento de todas las bicis
        if (bikesData.length > 0) {
          const { data: recs } = await supabase
            .from("bike_maintenance")
            .select("*")
            .in("bike_id", bikesData.map((b) => b.id))
            .order("performed_at", { ascending: false });
          if (!cancelled) setAllRecords(recs || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [router]);

  // ── Alertas calculadas ─────────────────────────────────────────────────────
  // Para cada bici × tipo con intervalo → calcula estado → filtra overdue/soon
  const alerts = useMemo(() => {
    // Último registro por "bikeId:typeName"
    const lastByKey = {};
    for (const r of allRecords) {
      const key = `${r.bike_id}:${r.type_name}`;
      if (!lastByKey[key]) lastByKey[key] = r;
    }

    const result = [];
    for (const bike of bikes) {
      for (const type of types) {
        if (!type.default_interval_days) continue;
        const last = lastByKey[`${bike.id}:${type.name}`] || null;
        const statusInfo = getTypeStatus(type, last);
        if (statusInfo.status === "overdue" || statusInfo.status === "soon") {
          result.push({ bike, type, last, ...statusInfo });
        }
      }
    }

    // Ordenar: overdue primero, luego por bici
    return result.sort((a, b) => {
      const ord = { overdue: 0, soon: 1 };
      const diff = (ord[a.status] ?? 2) - (ord[b.status] ?? 2);
      if (diff !== 0) return diff;
      return bikeName(a.bike).localeCompare(bikeName(b.bike));
    });
  }, [bikes, types, allRecords]);

  const overdueCount = alerts.filter((a) => a.status === "overdue").length;
  const soonCount = alerts.filter((a) => a.status === "soon").length;

  // Cuántas alertas están habilitadas para email
  const emailEnabledCount = useMemo(() => {
    return alerts.filter((a) => prefs[a.type.id] !== false).length;
  }, [alerts, prefs]);

  // ── Toggles de preferencias ────────────────────────────────────────────────
  const togglePref = async (typeId) => {
    const current = prefs[typeId] !== false; // default true
    const next = !current;
    setPrefs((p) => ({ ...p, [typeId]: next }));
    setSavingPref(typeId);

    try {
      const { data: ud } = await supabase.auth.getUser();
      const uid = ud?.user?.id;
      if (!uid) return;

      await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: uid, type_id: typeId, notify_email: next },
          { onConflict: "user_id,type_id" }
        );
    } finally {
      setSavingPref(null);
    }
  };

  // ── Enviar email de resumen ────────────────────────────────────────────────
  const sendEmail = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setSendResult({ ok: false, message: "No hay sesión activa." });

      const res = await fetch("/api/send-maintenance-email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, message: json.error || "Error al enviar el correo." });
      } else {
        setSendResult({ ok: true, message: json.message || `Resumen enviado a ${userEmail}` });
      }
    } catch (err) {
      setSendResult({ ok: false, message: "Error de red al enviar el correo." });
    } finally {
      setSending(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "grid", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-[18px] border p-4"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
          <div className="h-4 w-1/2 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.10)" }} />
          <div className="h-3 w-3/4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .notif-alert-row { display: flex; align-items: flex-start; gap: 12px; }
        .notif-alert-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
        .notif-pref-row { display: flex; align-items: center; gap: 12px; }
        .notif-pref-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        @media (max-width: 600px) {
          .notif-alert-row { flex-wrap: wrap; }
          .notif-alert-actions { width: 100%; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 8px; margin-top: 4px; }
          .notif-pref-row { flex-wrap: wrap; gap: 8px; }
          .notif-pref-right { width: 100%; justify-content: flex-end; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={S.card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div style={{ minWidth: 0 }}>
            <div style={S.kicker}>Notificaciones</div>
            <div style={S.heroTitle}>Alertas de mantenimiento</div>
            <div style={S.heroSub}>
              {userEmail && (
                <span style={{ color: "rgba(255,255,255,0.55)" }}>{userEmail}</span>
              )}
            </div>
          </div>

          {/* Chips de resumen */}
          <div className="flex items-center gap-2 flex-wrap">
            {overdueCount > 0 && (
              <span style={{ ...S.chip, color: "rgba(239,68,68,0.90)", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}>
                {overdueCount} vencido{overdueCount > 1 ? "s" : ""}
              </span>
            )}
            {soonCount > 0 && (
              <span style={{ ...S.chip, color: "rgba(251,191,36,0.90)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)" }}>
                {soonCount} próximo{soonCount > 1 ? "s" : ""}
              </span>
            )}
            {overdueCount === 0 && soonCount === 0 && (
              <span style={{ ...S.chip, color: "rgba(134,239,172,0.85)", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.20)" }}>
                Todo al día
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Alertas activas ── */}
      {alerts.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "40px 16px" }}>
          <div style={S.emptyIcon}>✅</div>
          <div style={S.emptyTitle}>Sin alertas activas</div>
          <div style={S.emptyText}>Todos tus mantenimientos están al día.</div>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ marginBottom: 12 }}>
            <div style={S.sectionTitle}>Alertas activas</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.46)" }}>
              {emailEnabledCount} de {alerts.length} incluidas en el email
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {alerts.map((alert, idx) => {
              const { bike, type, last, status, badge, nextDate, daysLeft } = alert;
              const emailEnabled = prefs[type.id] !== false;

              return (
                <div
                  key={`${bike.id}-${type.id}`}
                  style={{
                    ...S.alertCard,
                    opacity: emailEnabled ? 1 : 0.55,
                    borderColor: status === "overdue" ? "rgba(239,68,68,0.22)" : "rgba(251,191,36,0.18)",
                    background: status === "overdue" ? "rgba(239,68,68,0.06)" : "rgba(251,191,36,0.04)",
                  }}
                >
                  <div className="notif-alert-row">
                    {/* Contenido principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nombre de la bici */}
                      <div style={S.alertBikeName}>{bikeName(bike)}</div>

                      {/* Tipo de mantenimiento + badge */}
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
                        <div style={S.alertTypeName}>{type.name}</div>
                        {badge && (
                          <span style={{ ...S.badge, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        )}
                      </div>

                      {/* Fechas */}
                      <div style={{ marginTop: 5, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                        {last
                          ? <>Último: {formatDateShort(last.performed_at)}{nextDate && <> · Próximo: {formatDateShort(nextDate)}</>}</>
                          : <span style={{ color: "rgba(255,255,255,0.32)" }}>Sin registro previo</span>
                        }
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="notif-alert-actions">
                      {/* Toggle email */}
                      <button
                        onClick={() => togglePref(type.id)}
                        disabled={savingPref === type.id}
                        style={{
                          ...S.toggleBtn,
                          background: emailEnabled ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.05)",
                          border: emailEnabled ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.10)",
                          color: emailEnabled ? "rgba(165,180,252,0.95)" : "rgba(255,255,255,0.40)",
                        }}
                        title={emailEnabled ? "Desactivar email para este tipo" : "Activar email para este tipo"}
                      >
                        {savingPref === type.id ? "…" : emailEnabled ? "📧 Email on" : "Email off"}
                      </button>

                      {/* Link a la página de mantenimiento */}
                      <a href={`/garage/${bike.id}/maintenance`} style={S.linkChip}>
                        Ver →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Enviar correo de resumen ── */}
      <div style={S.card}>
        <div style={{ marginBottom: 14 }}>
          <div style={S.sectionTitle}>Enviar resumen por email</div>
          <div style={{ marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.50)", lineHeight: 1.5 }}>
            Envía un resumen con todas las alertas habilitadas al correo <strong style={{ color: "rgba(255,255,255,0.75)" }}>{userEmail}</strong>.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={sendEmail}
            disabled={sending || alerts.length === 0 || emailEnabledCount === 0}
            style={{
              ...S.sendBtn,
              opacity: (sending || alerts.length === 0 || emailEnabledCount === 0) ? 0.45 : 1,
              cursor: (sending || alerts.length === 0 || emailEnabledCount === 0) ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Enviando…" : `Enviar resumen (${emailEnabledCount} alerta${emailEnabledCount !== 1 ? "s" : ""})`}
          </button>

          {alerts.length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)" }}>
              No hay alertas activas para enviar.
            </div>
          )}
        </div>

        {/* Resultado del envío */}
        {sendResult && (
          <div style={{
            ...S.sendResult,
            borderColor: sendResult.ok ? "rgba(134,239,172,0.25)" : "rgba(239,68,68,0.25)",
            background: sendResult.ok ? "rgba(134,239,172,0.07)" : "rgba(239,68,68,0.07)",
            color: sendResult.ok ? "rgba(134,239,172,0.90)" : "rgba(239,68,68,0.90)",
          }}>
            {sendResult.ok ? "✓ " : "✕ "}{sendResult.message}
          </div>
        )}

        {/* Tip */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "rgba(99,102,241,0.60)", flexShrink: 0, marginTop: 4 }} />
          Puedes activar o desactivar el email para cada tipo de mantenimiento usando los botones de arriba.
        </div>
      </div>

      {/* ── Gestionar preferencias por tipo ── */}
      {types.filter((t) => t.default_interval_days).length > 0 && (
        <div style={S.card}>
          <div style={{ marginBottom: 12 }}>
            <div style={S.sectionTitle}>Preferencias por tipo</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.46)" }}>
              Controla qué tipos de mantenimiento generan alertas de email
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {types
              .filter((t) => t.default_interval_days)
              .map((type) => {
                const enabled = prefs[type.id] !== false;
                const hasAlert = alerts.some((a) => a.type.id === type.id);

                return (
                  <div key={type.id} className="notif-pref-row" style={S.prefRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: enabled ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.40)" }}>
                        {type.name}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 1 }}>
                        Intervalo: {type.default_interval_days}d
                        {type.default_interval_km ? ` · ${type.default_interval_km} km` : ""}
                      </div>
                    </div>

                    <div className="notif-pref-right">
                      {hasAlert && (
                        <span style={{ ...S.badge, fontSize: 10, color: "rgba(251,191,36,0.85)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)" }}>
                          Alerta activa
                        </span>
                      )}

                      {/* Toggle switch */}
                      <button
                        onClick={() => togglePref(type.id)}
                        disabled={savingPref === type.id}
                        style={{
                          ...S.switchBtn,
                          background: enabled ? "rgba(99,102,241,0.85)" : "rgba(255,255,255,0.10)",
                        }}
                        title={enabled ? "Desactivar notificación" : "Activar notificación"}
                        aria-label={`${enabled ? "Desactivar" : "Activar"} email para ${type.name}`}
                      >
                        <span style={{
                          ...S.switchThumb,
                          transform: enabled ? "translateX(16px)" : "translateX(2px)",
                        }} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const S = {
  card: { borderRadius: 20, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.055)", boxShadow: "0 20px 50px rgba(0,0,0,0.30)", padding: 16 },
  kicker: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" },
  heroTitle: { marginTop: 5, fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 900, letterSpacing: -0.6, color: "rgba(255,255,255,0.96)", lineHeight: 1.1 },
  heroSub: { marginTop: 6, fontSize: 13 },
  chip: { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900 },
  sectionTitle: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" },

  alertCard: { padding: "12px 14px", borderRadius: 14, border: "1px solid", overflow: "hidden" },
  alertBikeName: { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" },
  alertTypeName: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0 },

  toggleBtn: { padding: "7px 12px", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" },
  linkChip: { display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },

  sendBtn: { border: 0, fontWeight: 900, padding: "13px 20px", borderRadius: 14, color: "#0b1220", background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))", boxShadow: "0 10px 28px rgba(0,0,0,0.30)", fontSize: 14 },
  sendResult: { marginTop: 12, padding: "10px 14px", borderRadius: 12, border: "1px solid", fontSize: 13, fontWeight: 600 },

  prefRow: { padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.07)" },
  switchBtn: { position: "relative", width: 36, height: 20, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" },
  switchThumb: { position: "absolute", top: 2, width: 16, height: 16, borderRadius: 999, background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.35)", transition: "transform 0.2s" },

  emptyIcon: { width: 52, height: 52, borderRadius: 18, display: "grid", placeItems: "center", margin: "0 auto 12px", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.20)", fontSize: 24 },
  emptyTitle: { fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.88)" },
  emptyText: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.55)" },
};
