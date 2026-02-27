export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary", // primary | ghost | danger
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-lime-500 text-slate-950 hover:brightness-110",
    ghost: "border border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-slate-900/70",
    danger:
      "border border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[base, variants[variant] ?? variants.primary, className].join(" ")}
    >
      {children}
    </button>
  );
}