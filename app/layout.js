// Importa los estilos globales de la app (fuentes, reset CSS, etc.)
import "./globals.css";
import { color } from "../lib/design";

// Metadata de la app: aparece en la pestaña del navegador, en Google y —desde
// PRD-11.6— cuando alguien la instala en su teléfono.
export const metadata = {
  title: "Bike Garage",
  description: "Anticípate a las mantenciones antes de que tu bici se rompa.",
  applicationName: "Bike Garage",
  icons: { icon: "/icono.svg", apple: "/icono.svg" },
  // iOS ignora el manifiesto para esto: necesita su propia etiqueta para
  // abrir a pantalla completa desde la pantalla de inicio.
  appleWebApp: { capable: true, title: "Bike Garage", statusBarStyle: "black-translucent" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin esto, el contenido se mete debajo de la muesca y del indicador de
  // inicio cuando la app corre a pantalla completa.
  viewportFit: "cover",
  themeColor: color.fondo,
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
