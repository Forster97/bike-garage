// Importa los estilos globales de la app (fuentes, reset CSS, etc.)
import "./globals.css";

// Metadata de la app: aparece en la pestaña del navegador y en resultados de Google
export const metadata = {
  title: "Bike Garage",
  description: "Tu garage digital",
};

// Layout raíz — envuelve TODA la aplicación.
// Next.js requiere que exista este componente en app/layout.js.
// Define el idioma de la página (lang="es") y el fondo oscuro base.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children} {/* Aquí se renderizan todas las páginas de la app */}
      </body>
    </html>
  );
}
