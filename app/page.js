// Página de inicio (landing page) — la primera que ve un visitante en bike-garage.app
// No requiere login. Su objetivo es presentar la app y convertir visitantes en usuarios.
// Secciones: Header → Hero → Funcionalidades → Cómo funciona → CTA final → Footer
import Link from "next/link";
import { color, radio } from "../lib/design";

export default function Home() {
  return (
    <div style={s.page}>
      {/* Efectos decorativos de fondo — aria-hidden los oculta a lectores de pantalla */}
      <div style={s.bgGlow} aria-hidden="true" /> {/* gradientes de color difusos */}
      <div style={s.grain} aria-hidden="true" />  {/* textura de ruido sutil */}

      {/* ── Header fijo ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          {/* Logo + nombre de la app */}
          <div style={s.brand}>
            <div style={s.logo}>BG</div>
            <span style={s.brandName}>Bike Garage</span>
          </div>
          {/* Links de navegación: login (sutil) y signup (botón destacado) */}
          <nav style={s.nav}>
            <Link href="/login" style={s.navLink}>Iniciar sesión</Link>
            <Link href="/signup" style={s.cta}>Empezar gratis</Link>
          </nav>
        </div>
      </header>

      <main style={s.main}>

        {/* ── Sección Hero: propuesta de valor principal ── */}
        <section style={s.hero}>
          <div style={s.heroBadge}>🚴 Para ciclistas serios</div>

          <h1 style={s.h1}>
            Tu garage digital,<br />
            {/* Texto con gradiente: "sin el caos." */}
            <span style={s.h1Accent}>sin el caos.</span>
          </h1>

          <p style={s.lead}>
            Registra bicis, componentes y pesos. Ten trazabilidad real de tus cambios,
            todo desde el celular en menos de un minuto.
          </p>

          {/* Botones de acción: signup (principal) y ancla al "cómo funciona" */}
          <div style={s.ctaRow}>
            <Link href="/signup" style={s.primaryCta}>Crear mi garage →</Link>
            <a href="#como-funciona" style={s.ghostCta}>Ver cómo funciona</a>
          </div>

          {/* Fila de estadísticas (datos de marketing) */}
          <div style={s.statsRow}>
            {[
              { value: "1 min", label: "Para agregar una bici" },
              { value: "0", label: "Hojas de cálculo" },
              { value: "100%", label: "Enfocado en ciclismo" },
            ].map((stat, i) => (
              // El borde derecho se agrega en las primeras 2 columnas para separarlas visualmente
              <div key={i} style={{ ...s.statItem, borderRight: i < 2 ? `1px solid ${color.borde.normal}` : "none" }}>
                <div style={s.statValue}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Vista previa de la app (mockup estático, no es interactivo) */}
          <div style={s.appPreview} aria-label="Vista previa">
            {/* Barra de título estilo macOS con los tres puntos de colores */}
            <div style={s.previewBar}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: radio.full, background: c }} />
                ))}
              </div>
              <div style={s.previewUrl}>bike-garage.app / garage</div>
            </div>
            {/* Contenido del mockup: lista de bicis de ejemplo */}
            <div style={s.previewBody}>
              <div style={s.previewSection}>Mi Garage</div>
              {[
                { letter: "D", name: "Diverge Comp", sub: "Gravel · 8.2 kg", badge: "Activa", green: true },
                { letter: "G", name: "Gambler 29", sub: "DH · 14.5 kg", badge: "En mantención", green: false },
              ].map((bike, i) => (
                <div key={i} style={s.previewCard}>
                  <div style={{ ...s.previewAvatar, background: bike.green ? color.estado.alDiaTenue : color.identidad.tenue }}>
                    {bike.letter}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.previewName}>{bike.name}</div>
                    <div style={s.previewSub}>{bike.sub}</div>
                  </div>
                  {/* Badge de estado: verde si activa, gris si en mantención */}
                  <div style={{
                    ...s.previewBadge,
                    background: bike.green ? color.estado.alDiaTenue : color.superficie.alta,
                    borderColor: bike.green ? color.estado.alDiaBorde : color.borde.fuerte,
                    color: bike.green ? color.estado.alDiaTexto : color.texto.suave,
                  }}>
                    {bike.badge}
                  </div>
                </div>
              ))}
              {/* Barra de peso promedio (datos de ejemplo) */}
              <div style={s.previewWeight}>
                <div style={s.previewWeightLabel}>Peso promedio</div>
                <div style={s.previewWeightValue}>11.35 kg</div>
                <div style={s.previewWeightBar}>
                  {/* Barra de progreso al 62% con gradiente morado → verde */}
                  <div style={{ width: "62%", height: "100%", borderRadius: radio.full, background: "linear-gradient(90deg, #6366f1, #22c55e)" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sección Funcionalidades ── */}
        <section style={s.section}>
          <div style={s.sectionLabel}>Funcionalidades</div>
          <h2 style={s.h2}>Todo lo que necesitas, nada que no.</h2>
          <p style={s.sectionLead}>Pensado para ciclistas que quieren claridad, no complejidad.</p>

          {/* Grid de tarjetas de funcionalidades — se adapta automáticamente al ancho disponible */}
          <div style={s.featureGrid}>
            {[
              { icon: "🧩", title: "Componentes por categoría", text: "Frame, frenos, transmisión, cockpit, ruedas. Todo ordenado." },
              { icon: "⚖️", title: "Peso total automático", text: "Suma los gramos de cada pieza y te muestra el total al instante." },
              { icon: "🛠️", title: "Historial de cambios", text: "Registra cuándo y qué cambiaste. Trazabilidad real." },
              { icon: "📝", title: "Notas de ajuste", text: "Presión de neumáticos, configuraciones, sensaciones. Todo en un lugar." },
            ].map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={{ fontSize: 22 }}>{f.icon}</div>
                <div style={s.featureTitle}>{f.title}</div>
                <div style={s.featureText}>{f.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sección Cómo funciona ── */}
        {/* id="como-funciona" permite que el botón "Ver cómo funciona" del hero haga scroll aquí */}
        <section id="como-funciona" style={s.section}>
          <div style={s.sectionLabel}>Proceso</div>
          <h2 style={s.h2}>Tres pasos y listo.</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
            {[
              { n: "01", title: "Crea tu bicicleta", text: "Nombre, tipo, año, talla y notas. Menos de 30 segundos." },
              { n: "02", title: "Agrega componentes", text: "Categoría, nombre y peso. El total se calcula solo." },
              { n: "03", title: "Mantén el orden", text: "Revisa tu configuración, compara pesos y planifica mejoras." },
            ].map((step, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{step.n}</div> {/* número de paso en monospace */}
                <div>
                  <div style={s.stepTitle}>{step.title}</div>
                  <div style={s.stepText}>{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sección CTA final ── */}
        <section style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 20px 80px" }}>
          <div style={s.ctaBox}>
            <div style={s.ctaBoxGlow} aria-hidden="true" /> {/* glow decorativo centrado */}
            <div style={s.ctaBoxBadge}>Gratis para empezar</div>
            <h2 style={{ ...s.h2, maxWidth: 480 }}>¿Listo para ordenar tu garage?</h2>
            <p style={{ margin: 0, fontSize: 15, color: color.texto.suave, lineHeight: 1.6 }}>
              Crea tu cuenta, agrega tu primera bici y empieza hoy.
            </p>
            <Link href="/signup" style={s.ctaBoxBtn}>Crear mi garage →</Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          {/* Logo + nombre (versión reducida) */}
          <div style={s.brand}>
            <div style={{ ...s.logo, width: 28, height: 28, fontSize: 11 }}>BG</div>
            <span style={{ ...s.brandName, fontSize: 13 }}>Bike Garage</span>
          </div>
          {/* Links de autenticación */}
          <div style={{ display: "flex", gap: 4 }}>
            <Link href="/login" style={s.footerLink}>Ingresar</Link>
            <Link href="/signup" style={s.footerLink}>Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Estilos de la landing page ─────────────────────────────────────────────────
const s = {
  page: { fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif', minHeight: "100vh", background: "#060910", color: color.texto.fuerte, overflowX: "hidden" },
  // Gradientes de fondo fijos que no se mueven al hacer scroll
  bgGlow: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 900px 500px at 15% -5%, ${color.identidad.medio} 0%, transparent 65%),radial-gradient(ellipse 700px 400px at 90% 15%, ${color.estado.alDiaTenue} 0%, transparent 60%),radial-gradient(ellipse 600px 300px at 50% 110%, rgba(59,130,246,0.08) 0%, transparent 60%)` },
  // Textura de ruido (grain) generada con SVG inline
  grain: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px 128px" },
  // Header sticky con efecto de vidrio esmerilado
  header: { position: "sticky", top: 0, zIndex: 20, borderBottom: `1px solid ${color.borde.sutil}`, backdropFilter: "blur(16px)", background: color.superficie.header },
  headerInner: { maxWidth: 1020, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: radio.sm, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, color: "white", background: "linear-gradient(135deg, #6366f1, #22c55e)", boxShadow: `0 0 20px ${color.identidad.base}`, letterSpacing: "-0.5px" },
  brandName: { fontWeight: 700, fontSize: 15, color: color.texto.fuerte, letterSpacing: "-0.3px" },
  nav: { display: "flex", alignItems: "center", gap: 6 },
  navLink: { textDecoration: "none", fontSize: 13, color: color.texto.suave, padding: "8px 10px", borderRadius: radio.sm, fontWeight: 500, whiteSpace: "nowrap" },
  cta: { textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#060910", background: color.superficie.alta, padding: "8px 13px", borderRadius: radio.sm, letterSpacing: "-0.2px", whiteSpace: "nowrap" },
  main: { position: "relative", zIndex: 1 },
  // Hero centrado con padding generoso
  hero: { maxWidth: 1020, margin: "0 auto", padding: "60px 20px 40px", display: "flex", flexDirection: "column", gap: 20 },
  heroBadge: { alignSelf: "flex-start", fontSize: 12, fontWeight: 600, color: color.texto.suave, background: color.superficie.alta, border: `1px solid ${color.borde.normal}`, padding: "6px 12px", borderRadius: radio.full, letterSpacing: "0.2px" },
  // clamp() ajusta el tamaño de fuente entre mín y máx según el ancho de la pantalla
  h1: { margin: 0, fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1.5px", color: color.texto.fuerte, maxWidth: 680 },
  // Texto con gradiente usando clip en el fondo
  h1Accent: { background: "linear-gradient(135deg, #a5b4fc, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  lead: { margin: 0, fontSize: 17, lineHeight: 1.6, color: color.texto.suave, maxWidth: 520, fontWeight: 400 },
  ctaRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", flexDirection: "row" },
  primaryCta: { display: "inline-flex", alignItems: "center", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "13px 20px", borderRadius: radio.md, color: "#060910", background: `linear-gradient(135deg, ${color.superficie.alta}, ${color.superficie.alta})`, boxShadow: "0 0 40px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.4)", letterSpacing: "-0.2px", whiteSpace: "nowrap" },
  ghostCta: { display: "inline-flex", alignItems: "center", textDecoration: "none", fontWeight: 600, fontSize: 15, padding: "13px 20px", borderRadius: radio.md, color: color.texto.normal, background: color.superficie.media, border: `1px solid ${color.borde.normal}`, whiteSpace: "nowrap" },
  // Grid de 3 columnas para las estadísticas
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignSelf: "stretch", borderRadius: radio.md, overflow: "hidden", border: `1px solid ${color.borde.normal}`, background: color.superficie.media },
  statItem: { padding: "14px 16px" },
  statValue: { fontWeight: 900, fontSize: 18, color: color.texto.fuerte, letterSpacing: "-0.5px" },
  statLabel: { fontSize: 11, color: color.texto.tenue, marginTop: 2, fontWeight: 500 },
  // Mockup de la app con máx 520px de ancho
  appPreview: { borderRadius: radio.lg, border: `1px solid ${color.borde.normal}`, background: color.superficie.media, backdropFilter: "blur(8px)", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)", maxWidth: 520 },
  previewBar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${color.borde.sutil}`, background: color.superficie.hundida },
  previewUrl: { fontSize: 11, color: color.texto.tenue, fontFamily: "monospace", marginLeft: 4 },
  previewBody: { padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  previewSection: { fontSize: 11, fontWeight: 700, color: color.texto.tenue, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 2 },
  previewCard: { display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: radio.md, background: color.superficie.hundida, border: `1px solid ${color.borde.sutil}` },
  previewAvatar: { width: 36, height: 36, borderRadius: radio.sm, display: "grid", placeItems: "center", fontWeight: 900, color: color.texto.normal, fontSize: 14, flexShrink: 0 },
  previewName: { fontWeight: 700, fontSize: 14, color: color.texto.normal, lineHeight: 1.2 },
  previewSub: { fontSize: 12, color: color.texto.tenue, marginTop: 2 },
  previewBadge: { fontSize: 11, fontWeight: 700, padding: "5px 9px", borderRadius: radio.full, border: "1px solid", whiteSpace: "nowrap" },
  previewWeight: { padding: "12px", borderRadius: radio.md, background: color.identidad.tenue, border: `1px solid ${color.identidad.borde}` },
  previewWeightLabel: { fontSize: 11, color: color.texto.tenue, fontWeight: 600 },
  previewWeightValue: { fontSize: 22, fontWeight: 900, color: color.texto.fuerte, letterSpacing: "-0.5px", margin: "4px 0 8px" },
  previewWeightBar: { height: 4, borderRadius: radio.full, background: color.superficie.alta, overflow: "hidden" },
  // Secciones con separador superior
  section: { maxWidth: 1020, margin: "0 auto", padding: "60px 20px", display: "flex", flexDirection: "column", gap: 16, borderTop: `1px solid ${color.borde.sutil}` },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: color.texto.tenue },
  h2: { margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.8px", color: color.texto.fuerte, lineHeight: 1.1, maxWidth: 560 },
  sectionLead: { margin: 0, fontSize: 16, color: color.texto.suave, lineHeight: 1.6, maxWidth: 480 },
  // auto-fill: columnas de mínimo 220px, se adaptan al espacio disponible
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 8 },
  featureCard: { padding: "20px", borderRadius: radio.lg, background: color.superficie.media, border: `1px solid ${color.borde.normal}`, display: "flex", flexDirection: "column", gap: 8 },
  featureTitle: { fontWeight: 700, fontSize: 15, color: color.texto.normal, letterSpacing: "-0.3px" },
  featureText: { fontSize: 14, color: color.texto.suave, lineHeight: 1.55 },
  step: { display: "flex", gap: 16, padding: "20px", borderRadius: radio.md, alignItems: "flex-start", border: `1px solid ${color.borde.sutil}`, background: color.superficie.baja },
  stepNum: { fontWeight: 900, fontSize: 13, color: color.texto.tenue, letterSpacing: "0.5px", fontFamily: "monospace", paddingTop: 2, flexShrink: 0, minWidth: 28 },
  stepTitle: { fontWeight: 700, fontSize: 15, color: color.texto.normal, marginBottom: 4, letterSpacing: "-0.3px" },
  stepText: { fontSize: 14, color: color.texto.suave, lineHeight: 1.55 },
  // Caja del CTA final con glow interno
  ctaBox: { position: "relative", borderRadius: radio.xl, padding: "48px 40px", border: `1px solid ${color.borde.normal}`, background: color.superficie.media, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 },
  ctaBoxGlow: { position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "200%", background: `radial-gradient(ellipse, ${color.identidad.tenue} 0%, transparent 65%)`, pointerEvents: "none" },
  ctaBoxBadge: { fontSize: 12, fontWeight: 600, color: color.estado.alDiaTexto, background: color.estado.alDiaTenue, border: `1px solid ${color.estado.alDiaBorde}`, padding: "5px 12px", borderRadius: radio.full },
  ctaBoxBtn: { textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "14px 24px", borderRadius: radio.md, color: "#060910", background: `linear-gradient(135deg, ${color.superficie.alta}, ${color.superficie.alta})`, boxShadow: "0 0 30px rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.4)", marginTop: 4, letterSpacing: "-0.2px" },
  footer: { borderTop: `1px solid ${color.borde.sutil}`, background: color.superficie.header },
  footerInner: { maxWidth: 1020, margin: "0 auto", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  footerLink: { textDecoration: "none", fontSize: 13, color: color.texto.tenue, padding: "8px 12px", borderRadius: radio.sm },
};
