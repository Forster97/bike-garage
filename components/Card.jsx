export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-border bg-surface/60 text-text shadow-soft backdrop-blur",
        "p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}