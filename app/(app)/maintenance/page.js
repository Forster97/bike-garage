"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";
import { healthColor } from "../../../lib/maintenanceHelpers";
import { loadGarageView } from "../../../lib/loadGarageView";
import { color, radio } from "../../../lib/design";

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bikeData, setBikeData] = useState([]); // Array<{ bike, profile, stats, taskStatuses, healthScore, overdue, soon }>

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) return router.replace("/login");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");

      // Un solo lugar arma el estado, y es el mismo que usa el Garage.
      // Tener esto copiado fue lo que produjo BG-003.
      const { views, records } = await loadGarageView(supabase, user.id);

      const result = views.map((v) => ({
        ...v,
        lastMaintenance: records.find((r) => r.bike_id === v.bike.id)?.performed_at ?? null,
      }));

      setBikeData(result);
      setLoading(false);
    };
    load();
  }, [router]);

  const totalOverdue = bikeData.reduce((a, b) => a + b.overdue, 0);
  const totalSoon = bikeData.reduce((a, b) => a + b.soon, 0);

  if (loading) {
    return (
      <div style={s.loadWrap}>
        <div style={s.spinner} />
        <span style={s.loadText}>Calculando estado…</span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Page title */}
      <div style={s.titleRow}>
        <h1 style={s.title}>Mantenimiento</h1>
        <span style={s.subtitle}>Estado de todas tus bicis</span>
      </div>

      {/* Global alert banner */}
      {totalOverdue > 0 && (
        <div style={s.alertBanner}>
          <span style={s.alertIcon}>⚠</span>
          <span>
            <strong>{totalOverdue} tarea{totalOverdue !== 1 ? "s" : ""} vencida{totalOverdue !== 1 ? "s" : ""}</strong>
            {totalSoon > 0 && ` · ${totalSoon} próxima${totalSoon !== 1 ? "s" : ""}`}
            {" — "}Revisa las bicis marcadas abajo.
          </span>
        </div>
      )}

      {/* Summary KPI row */}
      {bikeData.length > 0 && (
        <div style={s.kpiRow}>
          <div style={s.kpiCard}>
            <span style={s.kpiValue}>{bikeData.length}</span>
            <span style={s.kpiLabel}>Bicis</span>
          </div>
          <div style={s.kpiCard}>
            <span style={{ ...s.kpiValue, color: color.estado.vencido }}>{totalOverdue}</span>
            <span style={s.kpiLabel}>Vencidas</span>
          </div>
          <div style={s.kpiCard}>
            <span style={{ ...s.kpiValue, color: color.estado.proximo }}>{totalSoon}</span>
            <span style={s.kpiLabel}>Próximas</span>
          </div>
          <div style={s.kpiCard}>
            <span style={{ ...s.kpiValue, color: color.estado.alDiaTexto }}>
              {bikeData.length > 0 ? Math.round(bikeData.reduce((a, b) => a + b.health, 0) / bikeData.length) : 100}%
            </span>
            <span style={s.kpiLabel}>Salud media</span>
          </div>
        </div>
      )}

      {/* Bike cards */}
      {bikeData.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🚲</div>
          <p style={s.emptyTitle}>Sin bicis aún</p>
          <p style={s.emptyText}>Agrega bicicletas en tu Garage para ver su estado de mantenimiento aquí.</p>
          <Link href="/garage" style={s.emptyLink}>Ir al Garage →</Link>
        </div>
      ) : (
        <div style={s.grid}>
          {bikeData.map(({ bike, profile, currentKm, overdue, soon, health, lastMaintenance }) => {
            const hc = healthColor(health);
            const hasAlert = overdue > 0;
            const hasSoon = soon > 0 && overdue === 0;

            return (
              <Link key={bike.id} href={`/garage/${bike.id}/maintenance`} style={{ ...s.card, ...(hasAlert ? s.cardAlert : hasSoon ? s.cardSoon : {}) }}>
                {/* Card header */}
                <div style={s.cardHeader}>
                  <div style={s.cardTitleGroup}>
                    <span style={s.cardName}>{bike.name}</span>
                    <span style={s.cardMeta}>{[bike.brand, bike.model, bike.year].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div style={{ ...s.healthBadge, background: hc.bg, borderColor: hc.border, color: hc.fg }}>
                    {health}%
                  </div>
                </div>

                {/* Health bar */}
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${health}%`, background: health >= 80 ? color.estado.alDiaTexto : health >= 60 ? "rgba(251,191,36,0.70)" : color.estado.vencido }} />
                </div>
                <div style={{ ...s.healthLabel, color: hc.fg }}>{hc.label}</div>

                {/* Status pills */}
                <div style={s.pillRow}>
                  {overdue > 0 && (
                    <span style={s.pillRed}>{overdue} vencida{overdue !== 1 ? "s" : ""}</span>
                  )}
                  {soon > 0 && (
                    <span style={s.pillYellow}>{soon} próxima{soon !== 1 ? "s" : ""}</span>
                  )}
                  {overdue === 0 && soon === 0 && (
                    <span style={s.pillGreen}>Al día</span>
                  )}
                </div>

                {/* Footer */}
                <div style={s.cardFooter}>
                  <span style={s.footerDetail}>
                    Perfil: {profile === "maniac" ? "😤 Maniático" : profile === "saver" ? "💰 No Gastar" : "⚖️ Equilibrado"}
                  </span>
                  {currentKm != null && (
                    <span style={s.footerDetail}>{Number(currentKm).toLocaleString("es-CL")} km</span>
                  )}
                </div>
                {lastMaintenance && (
                  <div style={s.lastMaint}>
                    Último mantenimiento: {new Date(lastMaintenance).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}

                <div style={s.cardArrow}>Ver detalles →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  loadWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    paddingTop: 80,
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid ${color.borde.normal}`,
    borderTop: `3px solid ${color.identidad.borde}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadText: {
    fontSize: 14,
    color: color.texto.tenue,
  },
  titleRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
    color: color.texto.fuerte,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14,
    color: color.texto.tenue,
  },
  alertBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: radio.md,
    background: color.estado.vencidoTenue,
    border: `1px solid ${color.estado.vencidoBorde}`,
    color: color.estado.vencido,
    fontSize: 14,
  },
  alertIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  kpiRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  kpiCard: {
    flex: "1 1 80px",
    minWidth: 80,
    padding: "14px 16px",
    borderRadius: radio.md,
    border: `1px solid ${color.borde.sutil}`,
    background: color.superficie.baja,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 800,
    color: color.texto.normal,
    letterSpacing: "-1px",
    lineHeight: 1,
  },
  kpiLabel: {
    fontSize: 11,
    color: color.texto.tenue,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "18px 20px",
    borderRadius: radio.lg,
    border: `1px solid ${color.borde.sutil}`,
    background: color.superficie.baja,
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.15s, background 0.15s",
    cursor: "pointer",
  },
  cardAlert: {
    border: `1px solid ${color.estado.vencidoBorde}`,
    background: color.estado.vencidoTenue,
  },
  cardSoon: {
    border: `1px solid ${color.estado.proximoBorde}`,
    background: color.estado.proximoTenue,
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 700,
    color: color.texto.fuerte,
    letterSpacing: "-0.3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMeta: {
    fontSize: 12,
    color: color.texto.tenue,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  healthBadge: {
    padding: "4px 10px",
    borderRadius: radio.full,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  barTrack: {
    height: 5,
    borderRadius: radio.full,
    background: color.superficie.alta,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radio.full,
    transition: "width 0.4s ease",
  },
  healthLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: -4,
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  pillRed: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: radio.full,
    fontSize: 12,
    fontWeight: 600,
    background: color.estado.vencidoTenue,
    color: color.estado.vencido,
    border: `1px solid ${color.estado.vencidoBorde}`,
  },
  pillYellow: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: radio.full,
    fontSize: 12,
    fontWeight: 600,
    background: color.estado.proximoTenue,
    color: color.estado.proximo,
    border: `1px solid ${color.estado.proximoBorde}`,
  },
  pillGreen: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: radio.full,
    fontSize: 12,
    fontWeight: 600,
    background: color.estado.alDiaTexto,
    color: color.estado.alDiaTexto,
    border: `1px solid ${color.estado.alDiaTexto}`,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    borderTop: `1px solid ${color.borde.sutil}`,
    paddingTop: 8,
    marginTop: 2,
  },
  footerDetail: {
    fontSize: 12,
    color: color.texto.tenue,
  },
  lastMaint: {
    fontSize: 11,
    color: color.texto.tenue,
    marginTop: -4,
  },
  cardArrow: {
    fontSize: 12,
    color: color.identidad.base,
    fontWeight: 600,
    marginTop: 2,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "60px 20px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: color.texto.normal,
    margin: 0,
  },
  emptyText: {
    fontSize: 14,
    color: color.texto.tenue,
    margin: 0,
    maxWidth: 320,
  },
  emptyLink: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 600,
    color: color.identidad.base,
    textDecoration: "none",
  },
};
