import "./globals.css";

export const metadata = {
  title: "Bike Garage",
  description: "Gestiona componentes y peso de tus bicicletas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}