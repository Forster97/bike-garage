"use client";

export const dynamic = "force-dynamic";

// Página de notificaciones.
// Muestra todas las alertas de mantenimiento de todas las bicis del usuario.
// Permite activar/desactivar el email por tipo de mantenimiento.
// Botón "Enviar resumen" llama al API route que usa Resend para enviar el correo.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { formatDateShort, bikeName } from "../../../lib/dateHelpers";
import { buildGarageView, toAlerts } from "../../../lib/maintenanceView";
import { color, radio, sombra } from "../../../lib/design";
import TapLink from "../../../components/TapLink";

// ── Componente principal ───────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [bikes, setBikes] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [types, setTypes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState([]);
  const [rules, setRules] = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [categoriasPorBici, setCategoriasPorBici] = useState({});
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

        const [bikesRes, typesRes, rulesRes, prefsRes] = await Promise.all([
          supabase.from("bikes").select("id, name, brand, model, type, created_at").eq("user_id", ud.user.id),
          supabase.from("maintenance_types").select("*").order("name"),
          supabase.from("maintenance_rules").select("*").eq("user_id", ud.user.id),
          // Las mismas preferencias que respeta el correo. Sin esto, la pantalla
          // mostraba alertas que el correo omitía y nadie entendía por qué (BG-005).
          supabase.from("notification_preferences")
            .select("type_id, notify_email, silent_mode").eq("user_id", ud.user.id),
        ]);

        if (cancelled) return;

        const bikesData = bikesRes.data || [];
        setBikes(bikesData);
        setTypes(typesRes.data || []);
        setRules(rulesRes.data || []);
        setPrefs(prefsRes.data || []);

        // Carga registros, perfiles y odómetros de todas las bicis
        if (bikesData.length > 0) {
          const bikeIds = bikesData.map((b) => b.id);
          const [recsRes, profilesRes, statsRes, montRes] = await Promise.all([
            supabase.from("bike_maintenance").select("*").in("bike_id", bikeIds).order("performed_at", { ascending: false }),
            supabase.from("bike_profiles").select("bike_id, profile").in("bike_id", bikeIds),
            supabase.from("bike_stats").select("bike_id, odometer_km").in("bike_id", bikeIds),
            supabase.from("bike_components")
              .select("bike_id, modelo:component_catalog(category)").in("bike_id", bikeIds),
          ]);
          if (!cancelled) {
            setAllRecords(recsRes.data || []);
            setProfiles(profilesRes.data || []);
            setStats(statsRes.data || []);
            const porBici = {};
            for (const bc of montRes.data || []) {
              const cat = bc.modelo?.category;
              if (!cat) continue;
              (porBici[bc.bike_id] ??= new Set()).add(cat);
            }
            setCategoriasPorBici(porBici);
          }
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
  // Mismo ensamblado que usa el correo. Las silenciadas NO se ocultan: se
  // muestran atenuadas, para que se entienda por qué no llegaron por correo.
  const alerts = useMemo(
    () =>
      toAlerts(
        buildGarageView({
          bikes, types, records: allRecords, rules, profiles, stats, prefs, categoriasPorBici,
        }),
        { excluirSilenciadas: false }
      ),
    [bikes, types, allRecords, rules, profiles, stats, prefs, categoriasPorBici]
  );

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
          style={{ border: `1px solid ${color.borde.normal}`, background: color.superficie.media }}>
          <div className="h-4 w-1/2 rounded-full mb-3" style={{ background: color.superficie.alta }} />
          <div className="h-3 w-3/4 rounded-full" style={{ background: color.superficie.alta }} />
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
          .notif-alert-actions { width: 100%; justify-content: flex-end; border-top: 1px solid ${color.borde.sutil}; padding-top: 8px; margin-top: 4px; }
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
                <span style={{ color: color.texto.suave }}>{userEmail}</span>
              )}
            </div>
          </div>

          {/* Chips de resumen */}
          <div className="flex items-center gap-2 flex-wrap">
            {overdueCount > 0 && (
              <span style={{ ...S.chip, color: color.estado.vencido, background: color.estado.vencidoTenue, border: `1px solid ${color.estado.vencidoBorde}` }}>
                {overdueCount} vencido{overdueCount > 1 ? "s" : ""}
              </span>
            )}
            {soonCount > 0 && (
              <span style={{ ...S.chip, color: color.estado.proximo, background: color.estado.proximoTenue, border: `1px solid ${color.estado.proximoBorde}` }}>
                {soonCount} próximo{soonCount > 1 ? "s" : ""}
              </span>
            )}
            {overdueCount === 0 && soonCount === 0 && (
              <span style={{ ...S.chip, color: color.estado.alDiaTexto, background: color.estado.alDiaTexto, border: `1px solid ${color.estado.alDiaTexto}` }}>
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
              const { bike, type, last, status, badge, nextDate, muted } = alert;

              return (
                <div
                  key={`${bike.id}-${type.id}`}
                  style={{
                    ...S.alertCard,
                    // Silenciada: se ve, pero apagada. Está pendiente igual;
                    // lo que no pasa es que llegue por correo.
                    opacity: muted ? 0.45 : 1,
                    borderColor: muted
                      ? color.borde.normal
                      : status === "overdue" ? color.estado.vencidoBorde : color.estado.proximoBorde,
                    background: muted
                      ? color.superficie.baja
                      : status === "overdue" ? color.estado.vencidoTenue : color.estado.proximoTenue,
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
                        {muted && (
                          <span
                            style={{ ...S.badge, color: color.texto.suave, background: color.superficie.alta, border: `1px solid ${color.borde.fuerte}` }}
                            title="Tienes este tipo apagado en tu perfil, así que no te llega por correo"
                          >
                            🔕 sin avisos
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 12, color: color.texto.suave }}>
                        {last
                          ? <>Último: {formatDateShort(last.performed_at)}{nextDate && <> · Próximo: {formatDateShort(nextDate)}</>}</>
                          : <span style={{ color: color.texto.tenue }}>Sin registro previo</span>
                        }
                      </div>
                    </div>
                    <div className="notif-alert-actions">
                      <TapLink href={`/garage/${bike.id}/maintenance`} style={S.linkChip} reemplaza tam={14}>
                        Ver →
                      </TapLink>
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
          <div style={{ marginTop: 3, fontSize: 12, color: color.texto.suave, lineHeight: 1.5 }}>
            Envía un resumen con todas las alertas habilitadas al correo <strong style={{ color: color.texto.normal }}>{userEmail}</strong>.
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
            borderColor: sendResult.ok ? color.estado.alDiaBorde : color.estado.vencidoBorde,
            background: sendResult.ok ? color.estado.alDiaTenue : color.estado.vencidoTenue,
            color: sendResult.ok ? color.estado.alDiaTexto : color.estado.vencido,
          }}>
            {sendResult.ok ? "✓ " : "✕ "}{sendResult.message}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: color.texto.tenue, lineHeight: 1.5 }}>
          Configura qué tipos reciben email en <TapLink href="/settings/profile" style={{ color: color.identidad.texto }}>tu perfil →</TapLink>
        </div>
      </div>
    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const S = {
  card: { borderRadius: radio.xl, border: `1px solid ${color.borde.normal}`, background: color.superficie.alta, boxShadow: sombra.media, padding: 16 },
  kicker: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: color.texto.tenue },
  heroTitle: { marginTop: 5, fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 900, letterSpacing: -0.6, color: color.texto.fuerte, lineHeight: 1.1 },
  heroSub: { marginTop: 6, fontSize: 13 },
  chip: { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: radio.full, fontSize: 12, fontWeight: 900 },
  sectionTitle: { fontWeight: 900, fontSize: 14, color: color.texto.fuerte },

  alertCard: { padding: "12px 14px", borderRadius: radio.md, border: "1px solid", overflow: "hidden" },
  alertBikeName: { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: color.texto.tenue },
  alertTypeName: { fontWeight: 900, fontSize: 14, color: color.texto.fuerte },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: radio.full, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0 },

  linkChip: { display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: radio.sm, border: `1px solid ${color.borde.fuerte}`, background: color.superficie.alta, color: color.texto.normal, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },
  sendBtn: { border: 0, fontWeight: 900, padding: "13px 20px", borderRadius: radio.md, color: "#0b1220", background: `linear-gradient(135deg, ${color.superficie.alta}, ${color.superficie.alta})`, boxShadow: sombra.suave, fontSize: 14 },
  sendResult: { marginTop: 12, padding: "10px 14px", borderRadius: radio.md, border: "1px solid", fontSize: 13, fontWeight: 600 },

  emptyIcon: { width: 52, height: 52, borderRadius: radio.lg, display: "grid", placeItems: "center", margin: "0 auto 12px", background: color.estado.alDiaTexto, border: `1px solid ${color.estado.alDiaTexto}`, fontSize: 24 },
  emptyTitle: { fontWeight: 900, fontSize: 16, color: color.texto.normal },
  emptyText: { marginTop: 6, fontSize: 13, color: color.texto.suave },
};
