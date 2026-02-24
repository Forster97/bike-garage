"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const signIn = async () => {
    setMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    router.replace("/garage");
  };

  const disabled = loading || !email.trim() || !password;

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl2 border border-border bg-card/75 p-6 shadow-soft backdrop-blur-sm">
        <div className="mb-5">
          <div className="text-2xl font-semibold tracking-tight">Bike Garage</div>
          <p className="mt-1 text-sm text-muted">Inicia sesión para ver tu garage.</p>
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
              placeholder="••••••••"
              type="password"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <button
            onClick={signIn}
            disabled={disabled}
            className={[
              "w-full rounded-xl px-4 py-2 text-sm font-semibold transition",
              "bg-primary text-bg hover:brightness-110",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
            ].join(" ")}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {msg ? (
            <div className="rounded-xl border border-border bg-surface/50 p-3 text-sm text-red-300">
              {msg}
            </div>
          ) : null}

          <p className="pt-1 text-sm text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Crear cuenta
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