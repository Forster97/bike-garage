import "./globals.css";

export const metadata = {
  title: "Bike Garage",
  description: "Tu garage digital",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}