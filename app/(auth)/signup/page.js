"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    const okEmail = isValidEmail(email);
    const okPw = password.length >= 6;
    const okMatch = password2.length > 0 && password2 === password;
    return okEmail && okPw && okMatch && !loading;
  }, [email, password, password2, loading]);

  async function signUp(e) {
    e?.preventDefault?.();
    setMsg("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setMsg(
          "Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
        );
        setIsSuccess(false);
        return;
      }

      // Opcional: si tienes confirmación de correo activada en Supabase,
      // esto ayuda a controlar hacia dónde vuelve el usuario.
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });

      if (error) {
        setMsg(error.message);
        setIsSuccess(false);
        return;
      }

      setMsg(
        "Listo ✅ Revisa tu correo para confirmar la cuenta y luego vuelve a Login."
      );
      setIsSuccess(true);
      setPassword("");
      setPassword2("");
    } catch (err) {
      setMsg(err?.message ?? "Error desconocido al crear la cuenta.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  const emailTouched = email.length > 0;
  const pwTouched = password.length > 0;
  const pw2Touched = password2.length > 0;

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
              Crear cuenta
            </h1>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <form onSubmit={signUp} className="grid gap-4">
              {/* Email */}
              <div className="grid gap-2">
                <label className="text-sm text-zinc-200">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {emailTouched && !isValidEmail(email) ? (
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
                  autoComplete="new-password"
                  placeholder="mínimo 6 caracteres"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {pwTouched && password.length < 6 ? (
                  <p className="text-xs text-amber-300">
                    Mínimo 6 caracteres.
                  </p>
                ) : null}
              </div>

              {/* Confirm password */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-200">
                    Confirmar password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    className="text-xs text-zinc-300 hover:text-zinc-100"
                  >
                    {showPw2 ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <input
                  type={showPw2 ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="repite tu password"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {pw2Touched && password2 !== password ? (
                  <p className="text-xs text-amber-300">
                    Las contraseñas no coinciden.
                  </p>
                ) : null}
              </div>

              {/* Message */}
              {msg ? (
                <div
                  className={[
                    "rounded-xl border px-3 py-2 text-sm",
                    isSuccess
                      ? "border-emerald-900/60 bg-emerald-950/35 text-emerald-100"
                      : "border-red-900/60 bg-red-950/40 text-red-100",
                  ].join(" ")}
                >
                  {msg}
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
                {loading ? "Creando..." : "Crear cuenta"}
              </button>

              {/* Footer */}
              <p className="pt-1 text-sm text-zinc-400">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-emerald-300 hover:underline">
                  Ir al login
                </Link>
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} Bike Garage
          </p>
        </div>
      </div>
    </main>
  );
}