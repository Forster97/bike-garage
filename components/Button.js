export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary", // "primary" | "ghost" | "danger"
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-bg hover:brightness-110",
    ghost: "border border-border bg-surface/60 text-text hover:bg-surface/80",
    danger: "bg-rose-500/20 text-rose-100 border border-rose-500/30 hover:bg-rose-500/30",
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