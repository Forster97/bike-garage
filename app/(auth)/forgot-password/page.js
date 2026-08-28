"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";
import AuthShell, { Campo, ErrorCaja, enlaceTenue } from "../../../components/AuthShell";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { color } from "../../../lib/design";

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
    <AuthShell
      titulo="Recuperar contraseña"
      bajada="Ingresa tu correo y te enviaremos un link para crear una nueva contraseña."
    >
      {sent ? (
        <div style={{ display: "grid", gap: 16, textAlign: "center", justifyItems: "center" }}>
          <div style={{
            width: 48, height: 48, display: "grid", placeItems: "center",
            borderRadius: 999, background: color.estado.alDiaTenue, fontSize: 24,
          }}>
            ✉️
          </div>
          <p style={{ margin: 0, fontSize: 14, color: color.texto.normal, lineHeight: 1.6 }}>
            Enviamos un link a{" "}
            <span style={{ fontWeight: 800, color: color.estado.alDiaTexto }}>{email}</span>.
            Revisa tu bandeja de entrada (y el spam).
          </p>
          <Link href="/login" style={enlaceTenue}>← Volver al login</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
          <Campo
            etiqueta="Correo electrónico"
            aviso={email.length > 0 && !isValidEmail(email) ? "Ingrese un email válido." : null}
          >
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </Campo>

          <ErrorCaja>{errMsg}</ErrorCaja>

          <Button type="submit" variant="accion" grande ancho disabled={!isValidEmail(email) || loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>

          <Link href="/login" style={enlaceTenue}>← Volver al login</Link>
        </form>
      )}
    </AuthShell>
  );
}
