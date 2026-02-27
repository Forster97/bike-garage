import "./globals.css";

export const metadata = {
  title: "Bike Garage",
  description: "Gestiona componentes y peso de tus bicicletas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-text">{children}</body>
    </html>
  );
}