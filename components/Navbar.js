import Button from "./Button";

export default function Navbar({ email, onLogout }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="font-extrabold text-slate-100">Bike Garage</div>
        <div className="flex items-center gap-3">
          <span className="max-w-[220px] truncate text-sm text-slate-300">
            {email}
          </span>
          <Button onClick={onLogout}>Salir</Button>
        </div>
      </div>
    </div>
  );
}