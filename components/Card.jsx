export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm",
        "backdrop-blur",
        "p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}