import BackgroundGlow from "./BackgroundGlow";

/**
 * PageShell — wrapper de página con fondo oscuro + glow.
 *
 * Props:
 *  - header: nodo React (usualmente <AppHeader />)
 *  - children: contenido de la página
 */
export default function PageShell({ header, children }) {
  return (
    <div
      className="relative min-h-screen"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: "#070A12",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <BackgroundGlow />
      {header}
      <main className="relative z-10">
        <div className="mx-auto flex max-w-[980px] flex-col gap-4 px-4 py-5">
          {children}
        </div>
      </main>
    </div>
  );
}