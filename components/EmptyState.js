import Button from "./Button";

export default function EmptyState({ title, desc, ctaText, onCta }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5 text-center text-slate-100">
      <h3 className="m-0 font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{desc}</p>
      {ctaText ? (
        <div className="mt-3">
          <Button onClick={onCta}>{ctaText}</Button>
        </div>
      ) : null}
    </div>
  );
}