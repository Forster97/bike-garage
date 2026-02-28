// PageShell — contenedor principal de cada página interna de la app.
// Combina el fondo oscuro + el efecto de glow + el header + el contenido.
// Todas las páginas que usan AppHeader también usan PageShell para tener un diseño consistente.
//
// Props:
//   header   — nodo React con el header de la página (usualmente <AppHeader />)
//   children — contenido de la página (lo que va debajo del header)
import BackgroundGlow from "./BackgroundGlow";

export default function PageShell({ header, children }) {
  return (
    <div
      className="relative min-h-screen" // min-h-screen: ocupa al menos toda la altura de la pantalla
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: "#070A12", // fondo negro azulado
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <BackgroundGlow /> {/* efecto decorativo de gradientes en el fondo */}
      {header}           {/* header sticky de la página */}

      {/* Contenido principal: centrado, con ancho máximo y padding */}
      <main className="relative z-10"> {/* z-10 para quedar por encima del BackgroundGlow */}
        <div className="mx-auto flex max-w-[980px] flex-col gap-4 px-4 py-5">
          {children}
        </div>
      </main>
    </div>
  );
}
