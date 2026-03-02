"use client";

export const dynamic = "force-dynamic";

// Página de notificaciones.
// Muestra todas las alertas de mantenimiento de todas las bicis del usuario.
// Permite activar/desactivar el email por tipo de mantenimiento.
// Botón "Enviar resumen" llama al API route que usa Resend para enviar el correo.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import {
  daysSince, addDays, formatDateShort, getTypeStatus, bikeName,
} from "../../../lib/dateHelpers";

// ── Componente principal ───────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [bikes, setBikes] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [types, setTypes] = useState([]);
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

        const [bikesRes, typesRes] = await Promise.all([
          supabase.from("bikes").select("id, brand, model, type").eq("user_id", ud.user.id),
          supabase.from("maintenance_types").select("*").order("name"),
        ]);

        if (cancelled) return;

        const bikesData = bikesRes.data || [];
        setBikes(bikesData);
        setTypes(typesRes.data || []);

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
        @media (max-width: 600px) {
          .notif-alert-row { flex-wrap: wrap; }
          .notif-alert-actions { width: 100%; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 8px; margin-top: 4px; }
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
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {alerts.map((alert) => {
              const { bike, type, last, status, badge, nextDate } = alert;

              return (
                <div
                  key={`${bike.id}-${type.id}`}
                  style={{
                    ...S.alertCard,
                    borderColor: status === "overdue" ? "rgba(239,68,68,0.22)" : "rgba(251,191,36,0.18)",
                    background: status === "overdue" ? "rgba(239,68,68,0.06)" : "rgba(251,191,36,0.04)",
                  }}
                >
                  <div className="notif-alert-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.alertBikeName}>{bikeName(bike)}</div>
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
                        <div style={S.alertTypeName}>{type.name}</div>
                        {badge && (
                          <span style={{ ...S.badge, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                        {last
                          ? <>Último: {formatDateShort(last.performed_at)}{nextDate && <> · Próximo: {formatDateShort(nextDate)}</>}</>
                          : <span style={{ color: "rgba(255,255,255,0.32)" }}>Sin registro previo</span>
                        }
                      </div>
                    </div>
                    <div className="notif-alert-actions">
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
            disabled={sending || alerts.length === 0}
            style={{
              ...S.sendBtn,
              opacity: (sending || alerts.length === 0) ? 0.45 : 1,
              cursor: (sending || alerts.length === 0) ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Enviando…" : `Enviar resumen (${alerts.length} alerta${alerts.length !== 1 ? "s" : ""})`}
          </button>
        </div>

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

        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
          Configura qué tipos reciben email en <a href="/settings/profile" style={{ color: "rgba(165,180,252,0.70)", textDecoration: "none" }}>tu perfil →</a>
        </div>
      </div>
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

  linkChip: { display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },
  sendBtn: { border: 0, fontWeight: 900, padding: "13px 20px", borderRadius: 14, color: "#0b1220", background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))", boxShadow: "0 10px 28px rgba(0,0,0,0.30)", fontSize: 14 },
  sendResult: { marginTop: 12, padding: "10px 14px", borderRadius: 12, border: "1px solid", fontSize: 13, fontWeight: 600 },

  emptyIcon: { width: 52, height: 52, borderRadius: 18, display: "grid", placeItems: "center", margin: "0 auto 12px", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.20)", fontSize: 24 },
  emptyTitle: { fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.88)" },
  emptyText: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.55)" },
};
