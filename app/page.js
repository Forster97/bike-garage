// Página de inicio — la primera que ve alguien que llega a Bike Garage.
//
// La versión anterior prometía otro producto: mostraba un mockup de navegador
// de escritorio para una app que es mobile-first, con estados que no existen
// ("Activa", "En mantención") y un "peso promedio" que la app no calcula.
// Y no mencionaba la mantención por ningún lado, que es la razón de ser de
// todo el proyecto.
//
// Ahora muestra lo que la app hace de verdad, en un teléfono, que es donde se
// usa. Ver PRD-13-Landing.

import TapLink from "../components/TapLink";
import { color, radio, espacio, texto, tacto, sombra } from "../lib/design";

// Lo que se ve dentro del teléfono. Son las mismas palabras y los mismos
// colores que la app real: si algún día cambian allá, esto queda desalineado
// a propósito visible, no mintiendo en silencio.
const BICIS_DEMO = [
  { inicial: "S", nombre: "Santa Cruz Hightower", meta: "Trail", estado: "2 vencidas", nivel: "vencido" },
  { inicial: "O", nombre: "Orbea Terra", meta: "Gravel", estado: "Al día", nivel: "alDia" },
  { inicial: "S", nombre: "Scott Gambler", meta: "DH", estado: "1 próxima", nivel: "proximo" },
];

const TONO_DEMO = {
  vencido: color.estado.vencido,
  proximo: color.estado.proximo,
  alDia: color.estado.alDia,
};

export default function Home() {
  return (
    <div style={s.page}>
      <style>{`
        @media (min-width: 860px) {
          .hero-2col { grid-template-columns: 1.1fr 0.9fr !important; }
        }
      `}</style>
      <div style={s.glow} aria-hidden="true" />
      <div style={s.grain} aria-hidden="true" />

      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>
            <div style={s.logo}>BG</div>
            <span style={s.brandName}>Bike Garage</span>
          </div>
          <nav style={s.nav}>
            <TapLink href="/login" style={s.navLink}>Entrar</TapLink>
            <TapLink href="/signup" style={s.cta}>Crear cuenta</TapLink>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Lo primero ──
             Una sola promesa. La de antes eran tres frases y una fila de
             cifras inventadas ("1 min", "0 hojas de cálculo"). */}
        <section style={s.hero} className="hero-2col">
          <div style={s.heroTexto}>
            <h1 style={s.h1}>
              Tu bici te avisa<br />
              <span style={s.h1Accent}>antes de que se rompa.</span>
            </h1>

            <p style={s.lead}>
              Anota lo que le montas, lo que pesa y lo que le haces.
              Bike Garage lleva la cuenta y te dice qué le toca.
            </p>

            <div style={s.ctaRow}>
              <TapLink href="/signup" style={s.primaryCta}>Empezar gratis</TapLink>
              <TapLink href="/login" style={s.ghostCta}>Ya tengo cuenta</TapLink>
            </div>
          </div>

          {/* El teléfono: lo que la app muestra de verdad al abrirla */}
          <div style={s.telefonoWrap} aria-label="Así se ve Bike Garage en tu teléfono">
            <div style={s.telefono}>
              <div style={s.notch} aria-hidden="true" />
              <div style={s.pantalla}>
                <div style={s.demoTitulo}>Garage</div>
                <div style={s.demoSub}>3 bicis · 1 necesita atención</div>

                <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                  {BICIS_DEMO.map((b) => (
                    <div key={b.nombre} style={s.demoCard}>
                      <div style={s.demoAvatar}>
                        {b.inicial}
                        {b.nivel !== "alDia" && (
                          <span style={{ ...s.demoPunto, background: TONO_DEMO[b.nivel] }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.demoNombre}>{b.nombre}</div>
                        <div style={s.demoMeta}>
                          {b.meta} ·{" "}
                          <span style={{ color: TONO_DEMO[b.nivel], fontWeight: texto.peso.medio }}>
                            {b.estado}
                          </span>
                        </div>
                      </div>
                      <span style={s.demoFlecha}>›</span>
                    </div>
                  ))}
                </div>

                <div style={s.demoBarra} aria-hidden="true">
                  {["🚲", "🔧", "🔔", "👤"].map((i, idx) => (
                    <span key={i} style={{ ...s.demoIcono, opacity: idx === 0 ? 1 : 0.35 }}>{i}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tres cosas, y las tres son ciertas ── */}
        <section style={s.section}>
          <div style={s.grid}>
            {[
              {
                icono: "🔔",
                titulo: "Te avisa antes",
                texto: "Cadena, frenos, suspensión. Cada tarea tiene su intervalo y se ajusta a cuánto exiges la bici. Te llega un correo cuando algo se acerca.",
              },
              {
                icono: "⚖️",
                titulo: "El peso, sin planilla",
                texto: "Cada pieza que montas suma. El total se calcula solo, y puedes ajustar el peso de la tuya cuando la pesas de verdad.",
              },
              {
                icono: "🧾",
                titulo: "Queda registrado",
                texto: "Qué cambiaste, cuándo y cuánto pesaba antes. El historial sobrevive aunque la pieza ya no esté montada.",
              },
            ].map((f) => (
              <div key={f.titulo} style={s.card}>
                <div style={{ fontSize: 24 }} aria-hidden="true">{f.icono}</div>
                <div style={s.cardTitulo}>{f.titulo}</div>
                <p style={s.cardTexto}>{f.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── El cierre ── */}
        <section style={s.sectionCta}>
          <div style={s.ctaBox}>
            <div style={s.ctaGlow} aria-hidden="true" />
            <h2 style={s.h2}>Empieza por una bici.</h2>
            <p style={s.ctaLead}>
              En un minuto la tienes cargada. El resto lo va aprendiendo sola.
            </p>
            <TapLink href="/signup" style={s.primaryCta}>Crear mi garage</TapLink>
          </div>
        </section>
      </main>

      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.brand}>
            <div style={{ ...s.logo, width: 26, height: 26, fontSize: 10 }}>BG</div>
            <span style={{ ...s.brandName, fontSize: texto.base }}>Bike Garage</span>
          </div>
          <div style={{ display: "flex", gap: espacio.sm }}>
            <TapLink href="/login" style={s.footerLink}>Entrar</TapLink>
            <TapLink href="/signup" style={s.footerLink}>Crear cuenta</TapLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
    minHeight: "100vh", background: color.fondo, color: color.texto.fuerte,
    overflowX: "hidden", position: "relative",
  },
  glow: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    background:
      `radial-gradient(ellipse 900px 500px at 12% -10%, ${color.identidad.medio} 0%, transparent 60%),` +
      `radial-gradient(ellipse 700px 420px at 92% 8%, ${color.accion.tenue} 0%, transparent 60%)`,
  },
  grain: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.025,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
    backgroundRepeat: "repeat", backgroundSize: "128px 128px",
  },

  // ── Header ──
  header: {
    position: "sticky", top: 0, zIndex: 20,
    borderBottom: `1px solid ${color.borde.sutil}`,
    backdropFilter: "blur(16px)", background: color.superficie.header,
  },
  headerInner: {
    maxWidth: 1020, margin: "0 auto", padding: `${espacio.md}px ${espacio.lg}px`,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: espacio.md,
  },
  brand: { display: "flex", alignItems: "center", gap: espacio.sm },
  logo: {
    width: 32, height: 32, borderRadius: radio.sm, display: "grid", placeItems: "center",
    fontWeight: texto.peso.maximo, fontSize: 12, color: color.texto.sobreAccion,
    background: color.accion.base, letterSpacing: "-0.5px",
  },
  brandName: { fontWeight: texto.peso.fuerte, fontSize: texto.md, letterSpacing: "-0.3px" },
  nav: { display: "flex", alignItems: "center", gap: espacio.xs },
  navLink: {
    minHeight: tacto.minimo, display: "inline-flex", alignItems: "center",
    padding: `0 ${espacio.md}px`, fontSize: texto.base, color: color.texto.suave,
  },
  cta: {
    minHeight: tacto.minimo, display: "inline-flex", alignItems: "center",
    padding: `0 ${espacio.lg}px`, borderRadius: radio.md,
    background: color.accion.base, color: color.texto.sobreAccion,
    fontSize: texto.base, fontWeight: texto.peso.fuerte, whiteSpace: "nowrap",
  },

  // ── Hero ──
  hero: {
    position: "relative", zIndex: 1, maxWidth: 1020, margin: "0 auto",
    padding: `${espacio.xxl}px ${espacio.lg}px ${espacio.xl}px`,
    display: "grid", gap: espacio.xxl, alignItems: "center",
    gridTemplateColumns: "1fr",
  },
  heroTexto: { maxWidth: 520 },
  h1: {
    margin: 0, fontSize: "clamp(34px, 8vw, 56px)", lineHeight: 1.05,
    fontWeight: texto.peso.maximo, letterSpacing: "-2px", color: color.texto.fuerte,
  },
  h1Accent: { color: color.accion.base },
  lead: {
    margin: `${espacio.lg}px 0 0`, fontSize: "clamp(15px, 4vw, 18px)",
    lineHeight: 1.6, color: color.texto.suave, maxWidth: 460,
  },
  ctaRow: { marginTop: espacio.xl, display: "flex", gap: espacio.md, flexWrap: "wrap" },
  primaryCta: {
    minHeight: tacto.comodo, display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: `0 ${espacio.xl}px`, borderRadius: radio.md,
    background: color.accion.base, color: color.texto.sobreAccion,
    fontSize: texto.lg, fontWeight: texto.peso.fuerte, letterSpacing: "-0.2px",
  },
  ghostCta: {
    minHeight: tacto.comodo, display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: `0 ${espacio.lg}px`, borderRadius: radio.md,
    border: `1px solid ${color.borde.normal}`, background: color.superficie.media,
    color: color.texto.normal, fontSize: texto.md, fontWeight: texto.peso.medio,
  },

  // ── El teléfono ──
  telefonoWrap: { display: "flex", justifyContent: "center" },
  telefono: {
    width: "100%", maxWidth: 300, borderRadius: 36, padding: 10,
    border: `1px solid ${color.borde.fuerte}`, background: color.superficie.alta,
    boxShadow: sombra.fuerte, position: "relative",
  },
  notch: {
    position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
    width: 84, height: 5, borderRadius: radio.full, background: color.borde.fuerte, zIndex: 2,
  },
  pantalla: {
    borderRadius: 28, background: color.fondo, padding: `${espacio.xl}px ${espacio.md}px ${espacio.sm}px`,
    border: `1px solid ${color.borde.sutil}`,
  },
  demoTitulo: { fontSize: 24, fontWeight: texto.peso.maximo, letterSpacing: "-0.8px", color: color.texto.fuerte },
  demoSub: { marginTop: 5, fontSize: texto.sm, fontWeight: texto.peso.medio, color: color.estado.proximo },
  demoCard: {
    display: "flex", alignItems: "center", gap: espacio.md, padding: `10px ${espacio.md}px`,
    borderRadius: radio.md, border: `1px solid ${color.borde.sutil}`, background: color.superficie.media,
  },
  demoAvatar: {
    position: "relative", width: 32, height: 32, flexShrink: 0, borderRadius: radio.sm,
    display: "grid", placeItems: "center", fontWeight: texto.peso.maximo, fontSize: texto.base,
    color: color.texto.normal, background: color.identidad.tenue,
    border: `1px solid ${color.identidad.borde}`,
  },
  demoPunto: {
    position: "absolute", top: -3, right: -3, width: 9, height: 9,
    borderRadius: radio.full, border: `2px solid ${color.fondo}`,
  },
  demoNombre: {
    fontSize: texto.base, fontWeight: texto.peso.fuerte, color: color.texto.fuerte,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  demoMeta: { marginTop: 2, fontSize: 11, color: color.texto.tenue },
  demoFlecha: { color: color.texto.tenue, fontSize: texto.md, flexShrink: 0 },
  demoBarra: {
    marginTop: espacio.lg, paddingTop: espacio.md, display: "flex", justifyContent: "space-around",
    borderTop: `1px solid ${color.borde.sutil}`,
  },
  demoIcono: { fontSize: 16 },

  // ── Secciones ──
  section: {
    position: "relative", zIndex: 1, maxWidth: 1020, margin: "0 auto",
    padding: `${espacio.xl}px ${espacio.lg}px`,
  },
  grid: { display: "grid", gap: espacio.md, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" },
  card: {
    display: "flex", flexDirection: "column", gap: espacio.sm,
    padding: espacio.xl, borderRadius: radio.lg,
    border: `1px solid ${color.borde.sutil}`, background: color.superficie.media,
  },
  cardTitulo: { fontSize: texto.lg, fontWeight: texto.peso.fuerte, color: color.texto.fuerte, letterSpacing: "-0.3px" },
  cardTexto: { margin: 0, fontSize: texto.md, lineHeight: 1.6, color: color.texto.suave },

  // ── Cierre ──
  sectionCta: {
    position: "relative", zIndex: 1, maxWidth: 1020, margin: "0 auto",
    padding: `${espacio.xl}px ${espacio.lg}px ${espacio.xxl}px`,
  },
  ctaBox: {
    position: "relative", overflow: "hidden", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: espacio.md,
    padding: `${espacio.xxl}px ${espacio.lg}px`, borderRadius: radio.xl,
    border: `1px solid ${color.borde.normal}`, background: color.superficie.media,
  },
  ctaGlow: {
    position: "absolute", top: "-60%", left: "50%", transform: "translateX(-50%)",
    width: "70%", height: "180%", pointerEvents: "none",
    background: `radial-gradient(ellipse, ${color.accion.tenue} 0%, transparent 65%)`,
  },
  h2: {
    margin: 0, position: "relative", fontSize: "clamp(24px, 6vw, 34px)",
    fontWeight: texto.peso.maximo, letterSpacing: "-1px", color: color.texto.fuerte,
  },
  ctaLead: { margin: 0, position: "relative", fontSize: texto.md, lineHeight: 1.6, color: color.texto.suave, maxWidth: 380 },

  // ── Footer ──
  footer: { position: "relative", zIndex: 1, borderTop: `1px solid ${color.borde.sutil}`, background: color.superficie.header },
  footerInner: {
    maxWidth: 1020, margin: "0 auto", padding: `${espacio.lg}px`,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: espacio.md, flexWrap: "wrap",
  },
  footerLink: {
    minHeight: tacto.minimo, display: "inline-flex", alignItems: "center",
    padding: `0 ${espacio.md}px`, fontSize: texto.base, color: color.texto.tenue,
  },
};
