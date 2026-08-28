"use client";

// useMemo: recalcula canSubmit solo cuando cambian los campos del formulario
// useState: variables reactivas del formulario
import { useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabaseClient";
import AuthShell, { Campo, ErrorCaja, Aviso, enlaceTenue } from "../../../components/AuthShell";
import Input from "../../../components/Input";
import Button from "../../../components/Button";

export const dynamic = "force-dynamic";

// Valida que el email tenga formato válido (algo@algo.algo)
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// ── Página de Registro ────────────────────────────────────────────────────────
export default function SignupPage() {
  // ── Estado del formulario ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");       // campo email
  const [password, setPassword] = useState(""); // campo contraseña
  const [password2, setPassword2] = useState(""); // campo confirmar contraseña

  const [showPw, setShowPw] = useState(false);   // muestra/oculta campo contraseña
  const [showPw2, setShowPw2] = useState(false);  // muestra/oculta campo confirmación

  const [loading, setLoading] = useState(false);     // true mientras se espera respuesta de Supabase
  const [msg, setMsg] = useState("");               // mensaje de éxito o error
  const [isSuccess, setIsSuccess] = useState(false); // true = éxito verde, false = error rojo

  // canSubmit: true solo si todos los campos son válidos y no está cargando
  const canSubmit = useMemo(() => {
    const okEmail = isValidEmail(email);
    const okPw = password.length >= 6;
    const okMatch = password2.length > 0 && password2 === password; // las dos contraseñas deben coincidir
    return okEmail && okPw && okMatch && !loading;
  }, [email, password, password2, loading]);

  // ── Función: crear cuenta ──────────────────────────────────────────────────
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

      // Si Supabase tiene confirmación por email activada, redirige al login después de confirmar
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      // Crea la cuenta en Supabase Auth
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

      // Registro exitoso: pide al usuario que confirme su email antes de entrar
      setMsg(
        "Listo ✅ Revisa tu correo para confirmar la cuenta y luego vuelve a Login."
      );
      setIsSuccess(true);
      setPassword("");  // limpia las contraseñas por seguridad
      setPassword2("");
    } catch (err) {
      setMsg(err?.message ?? "Error desconocido al crear la cuenta.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  // "Touched" = el usuario ya escribió algo en ese campo.
  // Se usa para no mostrar errores de validación antes de que el usuario empiece a escribir.
  const emailTouched = email.length > 0;
  const pwTouched = password.length > 0;
  const pw2Touched = password2.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AuthShell titulo="Crear cuenta">
      <form onSubmit={signUp} style={{ display: "grid", gap: 16 }}>

        <Campo
          etiqueta="Correo electrónico"
          aviso={emailTouched && !isValidEmail(email) ? "Ingrese un email válido." : null}
        >
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
          />
        </Campo>

        <Campo
          etiqueta="Contraseña"
          extra={
            <button type="button" onClick={() => setShowPw((v) => !v)} style={enlaceTenue}>
              {showPw ? "Ocultar" : "Mostrar"}
            </button>
          }
          aviso={pwTouched && password.length < 6 ? "Mínimo 6 caracteres." : null}
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
          extra={
            <button type="button" onClick={() => setShowPw2((v) => !v)} style={enlaceTenue}>
              {showPw2 ? "Ocultar" : "Mostrar"}
            </button>
          }
          aviso={pw2Touched && password2 !== password ? "Las contraseñas no coinciden." : null}
        >
          <Input
            type={showPw2 ? "text" : "password"}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            placeholder="repite tu contraseña"
          />
        </Campo>

        {/* El mismo aviso sirve para el éxito y para el error: cambia el color */}
        {msg ? (
          isSuccess ? <Aviso>{msg}</Aviso> : <ErrorCaja>{msg}</ErrorCaja>
        ) : null}

        <Button type="submit" variant="accion" grande ancho disabled={!canSubmit}>
          {loading ? "Creando…" : "Crear cuenta"}
        </Button>

        <p style={{ margin: 0, fontSize: 13, color: "inherit" }}>
          <span style={enlaceTenue}>¿Ya tienes cuenta? </span>
          <Link href="/login" style={{ ...enlaceTenue, fontWeight: 700 }}>
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
