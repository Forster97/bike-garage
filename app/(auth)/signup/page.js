"use client";

import { useState } from "react";
import { getSupabase } from "../../../lib/supabaseClient";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const supabase = getSupabase();

  const signUp = async () => {
    setMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    setMsg("Listo ✅ Revisa tu correo para confirmar la cuenta y luego vuelve a Login.");
  };

  const disabled = loading || !email.trim() || !password;

  const isSuccess = msg.startsWith("Listo");

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl2 border border-border bg-card/75 p-6 shadow-soft backdrop-blur-sm">
        <div className="mb-5">
          <div className="text-2xl font-semibold tracking-tight">Crear cuenta</div>
          <p className="mt-1 text-sm text-muted">Crea tu garage en 30 segundos.</p>
        </div>

        <div className="space-y-4">
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              inputMode="email"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field label="Password">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              type="password"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <button
            onClick={signUp}
            disabled={disabled}
            className={[
              "w-full rounded-xl px-4 py-2 text-sm font-semibold transition",
              "bg-primary text-bg hover:brightness-110",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
            ].join(" ")}
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>

          {msg ? (
            <div
              className={[
                "rounded-xl border border-border p-3 text-sm",
                isSuccess ? "bg-primary/10 text-primary" : "bg-surface/50 text-red-300",
              ].join(" ")}
            >
              {msg}
            </div>
          ) : null}

          <p className="pt-1 text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Volver a login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-muted">{label}</div>
      {children}
    </div>
  );
}