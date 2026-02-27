"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 6 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setErrMsg(
          "Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrMsg(error.message);
        return;
      }

      const session = data?.session;
      if (!session) {
        setErrMsg(
          "Login OK pero no llegó sesión. Revisa la configuración de Auth en Supabase."
        );
        return;
      }

      router.push("/garage");
      router.refresh();
    } catch (err) {
      setErrMsg(err?.message ?? "Error desconocido al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Bike Garage
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Inicia sesión para ver tu garage y llevar el control de tus bicicletas.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <form onSubmit={onSubmit} className="grid gap-4">
              {/* Email */}
              <div className="grid gap-2">
                <label className="text-sm text-zinc-200">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none ring-0 transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {email.length > 0 && !isValidEmail(email) ? (
                  <p className="text-xs text-amber-300">
                    Ingrese un email válido.
                  </p>
                ) : null}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-200">Password</label>

                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-xs text-zinc-300 hover:text-zinc-100"
                  >
                    {showPw ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {password.length > 0 && password.length < 6 ? (
                  <p className="text-xs text-amber-300">
                    Mínimo 6 caracteres.
                  </p>
                ) : null}
              </div>

              {/* Error */}
              {errMsg ? (
                <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm">
                  <span className="font-semibold text-red-200">Error: </span>
                  <span className="text-red-100">{errMsg}</span>
                </div>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "h-11 rounded-xl px-4 text-sm font-semibold transition",
                  "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                ].join(" ")}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-xs text-zinc-300 hover:text-zinc-50"
                >
                  ← Volver
                </button>
              </div>
            </form>
          </div>

          {/* Tiny footer */}
          <p className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} Bike Garage
          </p>
        </div>
      </div>
    </main>
  );
}