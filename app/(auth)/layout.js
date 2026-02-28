// Layout para las páginas de autenticación (login y signup).
// Envuelve el contenido con un div que ocupa toda la pantalla y tiene padding lateral.
// No incluye header ni navegación, solo el contenido centrado.
export default function AuthLayout({ children }) {
  return <div className="min-h-screen px-4">{children}</div>;
}
