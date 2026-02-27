export default function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:opacity-50";

  const styles =
    variant === "ghost"
      ? "bg-surface/50 text-text border border-border hover:bg-surface/70"
      : "bg-primary text-bg hover:opacity-90";

  return (
    <button className={[base, styles, className].join(" ")} {...props}>
      {children}
    </button>
  );
}