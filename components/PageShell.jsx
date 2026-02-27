import BackgroundGlow from "./BackgroundGlow";

export default function PageShell({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <BackgroundGlow />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-10">
        {(title || subtitle || right) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-text">
                  {title}
                </h1>
              )}
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {right && <div className="shrink-0">{right}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}