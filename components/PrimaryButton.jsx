export default function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "ghost"
      ? "border border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-slate-900/70"
      : "bg-lime-500 text-slate-950 hover:brightness-110";

  return (
    <button className={[base, styles, className].join(" ")} {...props}>
      {children}
    </button>
  );
}