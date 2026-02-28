// EmptyState — componente para mostrar cuando una lista no tiene elementos.
// Muestra un título, una descripción y opcionalmente un botón de acción.
//
// Props:
//   title   — texto principal (ej: "No tienes bicis aún")
//   desc    — texto secundario explicativo
//   ctaText — texto del botón de acción (opcional). Si no se pasa, no se muestra el botón.
//   onCta   — función que se ejecuta al hacer clic en el botón
import Button from "./Button";

export default function EmptyState({ title, desc, ctaText, onCta }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5 text-center text-slate-100">
      <h3 className="m-0 font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{desc}</p>
      {/* Solo muestra el botón si se pasó ctaText */}
      {ctaText ? (
        <div className="mt-3">
          <Button onClick={onCta}>{ctaText}</Button>
        </div>
      ) : null}
    </div>
  );
}
