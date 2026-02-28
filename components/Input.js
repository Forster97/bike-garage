// Input — campo de texto reutilizable con estilos consistentes.
// Acepta todas las props estándar de un <input> de HTML (placeholder, value, onChange, etc.)
// más una prop className para agregar clases extra.
//
// El spread {...props} pasa automáticamente cualquier prop que reciba al <input> real,
// así no hay que listar cada prop manualmente.
export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100", // estilo base
        "outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-lime-400",                    // estilo al enfocar
        className,                                                                                       // clases extra opcionales
      ].join(" ")}
    />
  );
}
