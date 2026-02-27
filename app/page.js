import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bgGlow} aria-hidden="true" />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <div style={styles.logo} aria-hidden="true">
              BG
            </div>
            <div>
              <div style={styles.brandName}>Bike Garage</div>
              <div style={styles.brandTag}>Tu garage digital</div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <Link href="/login" style={styles.headerLink}>
              Iniciar sesión
            </Link>
            <Link href="/signup" style={styles.headerCta}>
              Empezar
            </Link>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Hero */}
        <section style={styles.hero}>

          <h1 style={styles.h1}>
            Ordena tus bicis, repuestos y proximamente mantenimiento en un solo lugar.
          </h1>

          <p style={styles.lead}>
            Registra tus bicicletas, piezas y notas. Ten claridad de pesos y cambios de componentes.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/login" style={styles.primaryCta}>
              Crear mi garage
            </Link>
            <a href="#como-funciona" style={styles.secondaryCta}>
              Ver cómo funciona
            </a>
          </div>

          {/* Trust / quick stats */}
          <div style={styles.trustRow}>
            <div style={styles.trustItem}>
              <div style={styles.trustValue}>+1</div>
              <div style={styles.trustLabel}>Bici en 1 min</div>
            </div>
            <div style={styles.trustDivider} />
            <div style={styles.trustItem}>
              <div style={styles.trustValue}>0</div>
              <div style={styles.trustLabel}>Hojas de cálculo</div>
            </div>
            <div style={styles.trustDivider} />
            <div style={styles.trustItem}>
              <div style={styles.trustValue}>100%</div>
              <div style={styles.trustLabel}>Enfocado en ciclismo</div>
            </div>
          </div>

          {/* Mock phone card */}
          <div style={styles.phoneCard} aria-label="Vista previa de la app">
            <div style={styles.phoneHeader}>
              <div style={styles.dot} />
              <div style={styles.dot} />
              <div style={styles.dot} />
              <div style={{ flex: 1 }} />
              <div style={styles.phoneChip}>Garage</div>
            </div>

            <div style={styles.phoneBody}>
              <div style={styles.previewTitle}>Mis bicicletas</div>

              <div style={styles.previewList}>
                <div style={styles.previewRow}>
                  <div style={styles.previewAvatar}>S</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.previewName}>Diverge comp</div>
                    <div style={styles.previewMeta}>Gravel</div>
                  </div>
                  <div style={styles.previewPill}>Activa</div>
                </div>

                <div style={styles.previewRow}>
                  <div style={styles.previewAvatar}>O</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.previewName}>Gambler</div>
                    <div style={styles.previewMeta}>Downhill</div>
                  </div>
                  <div style={styles.previewPillMuted}>En mantención</div>
                </div>

                <div style={styles.previewCard}>
                  <div style={styles.previewCardTitle}>Próximo mantenimiento</div>
                  <div style={styles.previewCardText}>
                    Diverge comp - Revisar pastillas + purga frenos 
                  </div>
                  <div style={styles.previewCardCta}>Marcar como hecho</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Todo lo importante, sin fricción</h2>
          <p style={styles.p}>
            Pensado para que desde el celular tengas claridad rápida: qué tienes,
            qué cambiaste y qué toca hacer.
          </p>

          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>🧩</div>
              <div style={styles.cardTitle}>Piezas por categoría</div>
              <div style={styles.cardText}>
                Registra transmisión, frenos, ruedas, cockpit y más.
              </div>
            </div>
          </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🛠️</div>
              <div style={styles.cardTitle}>Historial de cambios</div>
              <div style={styles.cardText}>
                Ten trazabilidad: qué cambiaste, cuándo y por qué.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>📝</div>
              <div style={styles.cardTitle}>Notas simples</div>
              <div style={styles.cardText}>
                Deja apuntes de setup, presión, sensaciones y ajustes.
                </div>
            </div>
          </section>

        {/* How it works */}
        <section id="como-funciona" style={styles.section}>
          <h2 style={styles.h2}>Cómo funciona</h2>

          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepNum}>1</div>
              <div>
                <div style={styles.stepTitle}>Crea tu bicicleta</div>
                <div style={styles.stepText}>
                  Nombre, tipo, año, talla y notas.
                </div>
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNum}>2</div>
              <div>
                <div style={styles.stepTitle}>Agrega componentes</div>
                <div style={styles.stepText}>
                  Categoría + peso y comentarios.
                </div>
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNum}>3</div>
              <div>
                <div style={styles.stepTitle}>Mantén orden y claridad</div>
                <div style={styles.stepText}>
                  Revisa tu setup cuando quieras y planifica upgrades.
                </div>
              </div>
            </div>
          </div>

          <div style={styles.sectionCtaBox}>
            <div>
              <div style={styles.sectionCtaTitle}>Listo para empezar</div>
              <div style={styles.sectionCtaText}>
                Entra, crea tu primera bici y arma tu garage.
              </div>
            </div>
            <Link href="/login" style={styles.sectionCtaBtn}>
              Ir a /login
            </Link>
          </div>
          </section>
      </main>
    </div>
  );
}

/* =========================
   Styles (mobile-first)
========================= */

const styles = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    minHeight: "100vh",
    color: "#0b1220",
    background: "#070A12",
  },

  bgGlow: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(800px 400px at 20% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 100% 20%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(600px 300px at 50% 100%, rgba(59,130,246,0.10), transparent 55%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backdropFilter: "blur(10px)",
    background: "rgba(7,10,18,0.70)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  headerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brand: { display: "flex", alignItems: "center", gap: 10 },

  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "white",
    background:
      "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,1))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },

  brandName: { fontWeight: 700, color: "rgba(255,255,255,0.95)" },
  brandTag: { fontSize: 12, color: "rgba(255,255,255,0.60)" },

  headerActions: { display: "flex", alignItems: "center", gap: 10 },

  headerLink: {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14,
    padding: "10px 10px",
    borderRadius: 12,
  },

  headerCta: {
    color: "#0b1220",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.92)",
  },

  main: {
    position: "relative",
    zIndex: 1,
  },

  hero: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  heroTopPill: {
    alignSelf: "flex-start",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "7px 10px",
    borderRadius: 999,
  },

  h1: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.05,
    letterSpacing: -0.6,
    color: "rgba(255,255,255,0.96)",
  },

  lead: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.70)",
    maxWidth: 640,
  },

  ctaRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },

  primaryCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontWeight: 800,
    padding: "14px 16px",
    borderRadius: 14,
    color: "#0b1220",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))",
    boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
    minWidth: 170,
  },

  secondaryCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontWeight: 700,
    padding: "14px 16px",
    borderRadius: 14,
    color: "rgba(255,255,255,0.90)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  trustRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    maxWidth: 680,
  },

  trustItem: { display: "flex", flexDirection: "column", gap: 2 },
  trustValue: {
    fontWeight: 900,
    fontSize: 16,
    color: "rgba(255,255,255,0.92)",
  },
  trustLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  trustDivider: {
    width: 1,
    height: 26,
    background: "rgba(255,255,255,0.12)",
  },

  phoneCard: {
    marginTop: 6,
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
  },

  phoneHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
  },

  phoneChip: {
    fontSize: 12,
    color: "rgba(255,255,255,0.70)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "5px 10px",
    borderRadius: 999,
  },

  phoneBody: { padding: 14 },

  previewTitle: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: 800,
    marginBottom: 10,
  },

  previewList: { display: "flex", flexDirection: "column", gap: 10 },

  previewRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 16,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  previewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(255,255,255,0.10)",
  },

  previewName: {
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 1.1,
  },

  previewMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.60)",
    marginTop: 2,
  },

  previewPill: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.90)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.25)",
  },

  previewPillMuted: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.75)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  previewCard: {
    padding: "12px 12px",
    borderRadius: 16,
    background: "rgba(99,102,241,0.14)",
    border: "1px solid rgba(99,102,241,0.22)",
  },

  previewCardTitle: {
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    marginBottom: 4,
  },

  previewCardText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 10,
  },

  previewCardCta: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },

  section: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  h2: {
    margin: 0,
    fontSize: 22,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.2,
  },

  p: { margin: 0, color: "rgba(255,255,255,0.70)", lineHeight: 1.5 },

  grid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },

  card: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  cardIcon: { fontSize: 18, marginBottom: 8 },
  cardTitle: {
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    marginBottom: 6,
  },
  cardText: { color: "rgba(255,255,255,0.68)", lineHeight: 1.45 },

  steps: {
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  step: {
    display: "flex",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  stepNum: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(255,255,255,0.10)",
    flexShrink: 0,
  },

  stepTitle: {
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    marginBottom: 4,
  },

  stepText: { color: "rgba(255,255,255,0.65)", lineHeight: 1.45 },

  sectionCtaBox: {
    marginTop: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  sectionCtaTitle: {
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    marginBottom: 4,
  },

  sectionCtaText: { color: "rgba(255,255,255,0.65)", fontSize: 13 },

  sectionCtaBtn: {
    textDecoration: "none",
    fontWeight: 900,
    padding: "12px 14px",
    borderRadius: 14,
    color: "#0b1220",
    background: "rgba(255,255,255,0.92)",
    minWidth: 140,
    textAlign: "center",
  },

  footer: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(7,10,18,0.70)",
    marginTop: 10,
  },

  footerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  footerBrand: { display: "flex", alignItems: "center", gap: 10 },

  logoSmall: {
    width: 32,
    height: 32,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 12,
    color: "white",
    background:
      "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,1))",
  },

  footerName: { fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  footerText: { fontSize: 12, color: "rgba(255,255,255,0.60)" },

  footerLinks: { display: "flex", gap: 12, alignItems: "center" },

  footerLink: {
    color: "rgba(255,255,255,0.72)",
    textDecoration: "none",
    fontSize: 14,
    padding: "10px 10px",
    borderRadius: 12,
  },
};

/* =========================
   Responsive enhancements
   (simple: widen grid on larger screens)
========================= */

// Tip: si quieres que el grid sea 2 columnas en desktop sin CSS externo,
// puedes reemplazar styles.grid por una función que revise window.innerWidth.
// Pero para mantenerlo SSR-safe y simple, lo dejamos mobile-first.