export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-800 bg-slate-950/30 text-slate-100",
        "shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur",
        "p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}