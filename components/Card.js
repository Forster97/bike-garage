// Card — contenedor visual reutilizable con bordes redondeados y fondo oscuro.
// Se usa para agrupar secciones de contenido dentro de una página.
//
// Props:
//   className — clases CSS extra para personalizar (ej: cambiar color de borde)
//   children  — contenido que va adentro de la tarjeta
export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-800 bg-slate-950/30 text-slate-100", // fondo y borde base
        "shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur",                // sombra y desenfoque de fondo
        "p-4",                                                                  // padding interno
        className,                                                              // clases extra opcionales
      ].join(" ")}
    >
      {children}
    </div>
  );
}
