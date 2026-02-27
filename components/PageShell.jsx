import BackgroundGlow from "./BackgroundGlow";

export default function PageShell({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        {(title || subtitle || right) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
              )}
            </div>

            {right && <div className="shrink-0">{right}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}