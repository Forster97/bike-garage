// Navbar — barra de navegación superior simple.
// Muestra el nombre de la app, el email del usuario y un botón para cerrar sesión.
// Nota: esta versión es más simple que AppHeader. AppHeader es la que se usa actualmente
// en la mayoría de las páginas. Esta Navbar está disponible como alternativa.
//
// Props:
//   email    — email del usuario logueado (se muestra truncado si es muy largo)
//   onLogout — función que se ejecuta al hacer clic en "Salir"
import Button from "./Button";

export default function Navbar({ email, onLogout }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="font-extrabold text-slate-100">Bike Garage</div>
        <div className="flex items-center gap-3">
          {/* Email del usuario, truncado si supera el ancho máximo */}
          <span className="max-w-[220px] truncate text-sm text-slate-300">
            {email}
          </span>
          <Button onClick={onLogout}>Salir</Button>
        </div>
      </div>
    </div>
  );
}
