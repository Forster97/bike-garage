"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";
import {
  resolveRule,
  calculateTaskStatus,
  bikeHealthScore,
  healthColor,
} from "../../../lib/maintenanceHelpers";

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

      const [
        bikesRes,
        typesRes,
        recordsRes,
        profilesRes,
        statsRes,
        rulesRes,
      ] = await Promise.all([
        supabase.from("bikes").select("id,name,type,brand,model,year").eq("user_id", user.id).order("name"),
        supabase.from("maintenance_types").select("*"),
        supabase.from("bike_maintenance").select("bike_id,type_id,performed_at,odometer_km").eq("user_id", user.id).order("performed_at", { ascending: false }),
        supabase.from("bike_profiles").select("bike_id,profile").in("bike_id", []),
        supabase.from("bike_stats").select("bike_id,odometer_km").in("bike_id", []),
        supabase.from("maintenance_rules").select("*").eq("user_id", user.id),
      ]);

      const bikes = bikesRes.data ?? [];
      const types = typesRes.data ?? [];
      const allRecords = recordsRes.data ?? [];

      // Fetch profiles + stats for actual bike IDs
      const bikeIds = bikes.map((b) => b.id);
      let profiles = [], statsArr = [];
      if (bikeIds.length) {
        const [pRes, sRes] = await Promise.all([
          supabase.from("bike_profiles").select("bike_id,profile").in("bike_id", bikeIds),
          supabase.from("bike_stats").select("bike_id,odometer_km").in("bike_id", bikeIds),
        ]);
        profiles = pRes.data ?? [];
        statsArr = sRes.data ?? [];
      }

      const rules = rulesRes.data ?? [];

      // Index lookups
      const profileByBike = Object.fromEntries(profiles.map((p) => [p.bike_id, p.profile]));
      const statsByBike = Object.fromEntries(statsArr.map((s) => [s.bike_id, s.odometer_km]));
      const rulesByBikeType = {};
      for (const r of rules) {
        rulesByBikeType[`${r.bike_id}:${r.type_id}`] = r;
      }

      // Last event per bike+type
      const lastEventMap = {};
      for (const rec of allRecords) {
        const key = `${rec.bike_id}:${rec.type_id}`;
        if (!lastEventMap[key]) lastEventMap[key] = rec;
      }

      // Compute per-bike data
      const result = bikes.map((bike) => {
        const profile = profileByBike[bike.id] ?? "balanced";
        const currentKm = statsByBike[bike.id] ?? null;

        const taskStatuses = types.map((mType) => {
          const rule = rulesByBikeType[`${bike.id}:${mType.id}`] ?? null;
          const resolved = resolveRule(mType, rule, profile);
          const lastEvent = lastEventMap[`${bike.id}:${mType.id}`] ?? null;
          const status = calculateTaskStatus(resolved, lastEvent, currentKm);
          return { ...status, severity: mType.severity, name: mType.name };
        });

        const activeTasks = taskStatuses.filter((t) => t.status !== "none");
        const overdue = activeTasks.filter((t) => t.status === "overdue").length;
        const soon = activeTasks.filter((t) => t.status === "soon").length;
        const health = bikeHealthScore(activeTasks);
        const lastMaintenance = allRecords.find((r) => r.bike_id === bike.id)?.performed_at ?? null;

        return { bike, profile, currentKm, overdue, soon, health, lastMaintenance };
      });

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
            <span style={{ ...s.kpiValue, color: "rgba(239,68,68,0.90)" }}>{totalOverdue}</span>
            <span style={s.kpiLabel}>Vencidas</span>
          </div>
          <div style={s.kpiCard}>
            <span style={{ ...s.kpiValue, color: "rgba(251,191,36,0.90)" }}>{totalSoon}</span>
            <span style={s.kpiLabel}>Próximas</span>
          </div>
          <div style={s.kpiCard}>
            <span style={{ ...s.kpiValue, color: "rgba(134,239,172,0.90)" }}>
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
                  <div style={{ ...s.barFill, width: `${health}%`, background: health >= 80 ? "rgba(134,239,172,0.70)" : health >= 60 ? "rgba(251,191,36,0.70)" : "rgba(239,68,68,0.70)" }} />
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
    border: "3px solid rgba(255,255,255,0.10)",
    borderTop: "3px solid rgba(99,102,241,0.80)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
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
    color: "rgba(255,255,255,0.92)",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.40)",
  },
  alertBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "rgba(239,68,68,0.90)",
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 800,
    color: "rgba(255,255,255,0.88)",
    letterSpacing: "-1px",
    lineHeight: 1,
  },
  kpiLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
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
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.15s, background 0.15s",
    cursor: "pointer",
  },
  cardAlert: {
    border: "1px solid rgba(239,68,68,0.20)",
    background: "rgba(239,68,68,0.04)",
  },
  cardSoon: {
    border: "1px solid rgba(251,191,36,0.18)",
    background: "rgba(251,191,36,0.03)",
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
    color: "rgba(255,255,255,0.92)",
    letterSpacing: "-0.3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  healthBadge: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  barTrack: {
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
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
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "rgba(239,68,68,0.12)",
    color: "rgba(239,68,68,0.90)",
    border: "1px solid rgba(239,68,68,0.20)",
  },
  pillYellow: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "rgba(251,191,36,0.10)",
    color: "rgba(251,191,36,0.90)",
    border: "1px solid rgba(251,191,36,0.20)",
  },
  pillGreen: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "rgba(134,239,172,0.10)",
    color: "rgba(134,239,172,0.85)",
    border: "1px solid rgba(134,239,172,0.18)",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 8,
    marginTop: 2,
  },
  footerDetail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
  },
  lastMaint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.30)",
    marginTop: -4,
  },
  cardArrow: {
    fontSize: 12,
    color: "rgba(99,102,241,0.70)",
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
    color: "rgba(255,255,255,0.75)",
    margin: 0,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.40)",
    margin: 0,
    maxWidth: 320,
  },
  emptyLink: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(99,102,241,0.80)",
    textDecoration: "none",
  },
};
