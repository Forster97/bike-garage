export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100",
        "outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-lime-400",
        className,
      ].join(" ")}
    />
  );
}