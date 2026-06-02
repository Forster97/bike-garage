"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);   // true cuando la sesión de recovery está activa
  const [errSession, setErrSession] = useState(""); // error al establecer sesión
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Supabase envía el link con ?code=xxx (flujo PKCE) o #access_token=xxx (flujo implícito).
  // Intentamos ambos: primero el code param, luego escuchamos onAuthStateChange para PASSWORD_RECOVERY.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const code = searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setErrSession("El link de recuperación es inválido o expiró. Solicita uno nuevo.");
        } else {
          setReady(true);
        }
      });
      return;
    }

    // Fallback: flujo implícito (hash en la URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== password2) return setErrMsg("Las contraseñas no coinciden.");
    if (password.length < 6) return setErrMsg("Mínimo 6 caracteres.");

    setErrMsg("");
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/garage"), 2500);
    } catch (err) {
      setErrMsg(err?.message ?? "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = password.length >= 6 && password === password2 && !loading;

  return (
    <main className="min-h-[100svh] bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Bike Garage
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Nueva contraseña
            </h1>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">

            {/* Error al establecer sesión de recovery */}
            {errSession ? (
              <div className="grid gap-4 text-center">
                <div className="mx-auto text-3xl">⚠️</div>
                <p className="text-sm text-red-300">{errSession}</p>
                <button
                  onClick={() => router.push("/forgot-password")}
                  className="mx-auto text-sm text-zinc-400 hover:text-zinc-100"
                >
                  Solicitar nuevo link
                </button>
              </div>
            ) : done ? (
              /* Contraseña actualizada con éxito */
              <div className="grid gap-4 text-center">
                <div className="mx-auto text-3xl">✅</div>
                <p className="text-sm text-emerald-300 font-semibold">
                  Contraseña actualizada.
                </p>
                <p className="text-xs text-zinc-400">
                  Redirigiendo a tu garage...
                </p>
              </div>
            ) : !ready ? (
              /* Esperando que se establezca la sesión de recovery */
              <div className="grid gap-3 text-center py-4">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
                <p className="text-sm text-zinc-400">Verificando link...</p>
              </div>
            ) : (
              /* Formulario para ingresar nueva contraseña */
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-200">Nueva contraseña</label>
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
                    autoComplete="new-password"
                    placeholder="mínimo 6 caracteres"
                    className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm text-zinc-200">Confirmar contraseña</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                    placeholder="repite tu contraseña"
                    className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                  />
                  {password2.length > 0 && password2 !== password ? (
                    <p className="text-xs text-amber-300">Las contraseñas no coinciden.</p>
                  ) : null}
                </div>

                {errMsg ? (
                  <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm">
                    <span className="font-semibold text-red-200">Error: </span>
                    <span className="text-red-100">{errMsg}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "h-11 rounded-xl px-4 text-sm font-semibold transition",
                    "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  ].join(" ")}
                >
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} Bike Garage
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
