"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient"; // ajusta si tu ruta es distinta

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setErrMsg(
          "Falta configurar Supabase en Vercel (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrMsg(error.message);
        return;
      }

      // Si logueó bien, debería haber sesión
      const session = data?.session;
      if (!session) {
        setErrMsg("Login OK pero no llegó sesión. Revisa configuración de Auth en Supabase.");
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
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>Bike Garage</h1>
      <p>Inicia sesión para ver tu garage.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {errMsg ? (
          <p style={{ marginTop: 8 }}>
            <b>Error:</b> {errMsg}
          </p>
        ) : null}
      </form>
    </div>
  );
}