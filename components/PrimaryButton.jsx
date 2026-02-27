export default function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition " +
    "focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-0 disabled:opacity-50";

  const styles =
    variant === "ghost"
      ? "bg-transparent text-slate-100 hover:bg-slate-800 border border-slate-700"
      : "bg-lime-500 text-slate-950 hover:bg-lime-400";

  return (
    <button className={[base, styles, className].join(" ")} {...props}>
      {children}
    </button>
  );
}