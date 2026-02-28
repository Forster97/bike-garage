// Button — botón reutilizable con tres variantes de estilo.
//
// Props:
//   children  — texto o contenido del botón
//   onClick   — función que se ejecuta al hacer clic
//   type      — tipo HTML del botón: "button" (defecto), "submit", "reset"
//   disabled  — si está en true, el botón se deshabilita (no se puede hacer clic)
//   className — clases CSS extra para personalizar desde afuera
//   variant   — estilo visual: "primary" (verde, defecto) | "ghost" (borde oscuro) | "danger" (rojo)
export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary", // primary | ghost | danger
}) {
  // Clases base que se aplican a todas las variantes
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-50 disabled:cursor-not-allowed";

  // Clases específicas por variante
  const variants = {
    primary: "bg-lime-500 text-slate-950 hover:brightness-110",                               // verde sólido
    ghost: "border border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-slate-900/70",    // borde oscuro sutil
    danger: "border border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",    // rojo para acciones destructivas
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      // Combina las clases base + variante + las clases extra que lleguen por prop
      className={[base, variants[variant] ?? variants.primary, className].join(" ")}
    >
      {children}
    </button>
  );
}
