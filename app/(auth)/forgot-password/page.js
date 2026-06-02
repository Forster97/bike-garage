"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setErrMsg("Falta configurar Supabase.");
        return;
      }

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrMsg(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setErrMsg(err?.message ?? "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

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
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Ingresa tu correo y te enviaremos un link para crear una nueva contraseña.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            {sent ? (
              <div className="grid gap-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/60 text-2xl">
                  ✉️
                </div>
                <p className="text-sm text-zinc-200">
                  Enviamos un link a <span className="font-semibold text-emerald-300">{email}</span>.
                  Revisa tu bandeja de entrada (y el spam).
                </p>
                <Link
                  href="/login"
                  className="text-sm text-zinc-400 hover:text-zinc-100"
                >
                  ← Volver al login
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm text-zinc-200">Correo electrónico</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                  />
                  {email.length > 0 && !isValidEmail(email) ? (
                    <p className="text-xs text-amber-300">Ingrese un email válido.</p>
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
                  disabled={!isValidEmail(email) || loading}
                  className={[
                    "h-11 rounded-xl px-4 text-sm font-semibold transition",
                    "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  ].join(" ")}
                >
                  {loading ? "Enviando..." : "Enviar link"}
                </button>

                <div className="pt-1">
                  <Link href="/login" className="text-xs text-zinc-300 hover:text-zinc-50">
                    ← Volver al login
                  </Link>
                </div>
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
