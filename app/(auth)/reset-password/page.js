"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";
import AuthShell, { Campo, ErrorCaja, enlaceTenue } from "../../../components/AuthShell";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { color } from "../../../lib/design";

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

  const centrado = { display: "grid", gap: 16, textAlign: "center", justifyItems: "center" };

  return (
    <AuthShell titulo="Nueva contraseña">
      {errSession ? (
        /* El link de recuperación no sirve o ya venció */
        <div style={centrado}>
          <div style={{ fontSize: 30 }}>⚠️</div>
          <p style={{ margin: 0, fontSize: 14, color: color.estado.vencido, lineHeight: 1.5 }}>
            {errSession}
          </p>
          <button onClick={() => router.push("/forgot-password")} style={enlaceTenue}>
            Solicitar nuevo link
          </button>
        </div>
      ) : done ? (
        <div style={centrado}>
          <div style={{ fontSize: 30 }}>✅</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: color.estado.alDiaTexto }}>
            Contraseña actualizada.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: color.texto.tenue }}>
            Redirigiendo a tu garage…
          </p>
        </div>
      ) : !ready ? (
        <div style={{ ...centrado, padding: "16px 0" }}>
          <style>{`@keyframes girar { to { transform: rotate(360deg) } }`}</style>
          <div style={{
            width: 24, height: 24, borderRadius: 999,
            border: `2px solid ${color.borde.fuerte}`,
            borderTopColor: color.accion.base,
            animation: "girar 0.8s linear infinite",
          }} />
          <p style={{ margin: 0, fontSize: 14, color: color.texto.tenue }}>Verificando link…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
          <Campo
            etiqueta="Nueva contraseña"
            extra={
              <button type="button" onClick={() => setShowPw((v) => !v)} style={enlaceTenue}>
                {showPw ? "Ocultar" : "Mostrar"}
              </button>
            }
            aviso={password.length > 0 && password.length < 6 ? "Mínimo 6 caracteres." : null}
          >
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="mínimo 6 caracteres"
            />
          </Campo>

          <Campo
            etiqueta="Confirmar contraseña"
            aviso={password2.length > 0 && password2 !== password ? "Las contraseñas no coinciden." : null}
          >
            <Input
              type={showPw ? "text" : "password"}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              placeholder="repite tu contraseña"
            />
          </Campo>

          <ErrorCaja>{errMsg}</ErrorCaja>

          <Button type="submit" variant="accion" grande ancho disabled={!canSubmit}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
