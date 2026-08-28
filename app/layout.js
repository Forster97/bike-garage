// Importa los estilos globales de la app (fuentes, reset CSS, etc.)
import "./globals.css";
import { color } from "../lib/design";

// Metadata de la app: aparece en la pestaña del navegador y en resultados de Google
export const metadata = {
  title: "Bike Garage",
  description: "Tu garage digital",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Layout raíz — envuelve TODA la aplicación.
// Next.js requiere que exista este componente en app/layout.js.
//
// El fondo y el color de texto base salen del sistema de diseño. Antes eran
// clases de Tailwind (`bg-slate-950`) que declaraban un negro distinto al que
// la app usaba de verdad.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ minHeight: "100vh", background: color.fondo, color: color.texto.fuerte }}>
        {children} {/* Aquí se renderizan todas las páginas de la app */}
      </body>
    </html>
  );
}
