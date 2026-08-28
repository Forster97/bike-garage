"use client";

// useMemo: recalcula canSubmit solo cuando cambian los valores del formulario
// useState: variables reactivas del formulario
import { useMemo, useState } from "react";
import TapLink from "../../../components/TapLink";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";
import AuthShell, { Campo, ErrorCaja, enlaceTenue } from "../../../components/AuthShell";
import Input from "../../../components/Input";
import Button from "../../../components/Button";

export const dynamic = "force-dynamic";

// Valida que el email tenga formato válido (algo@algo.algo)
// La expresión regular comprueba la estructura básica: caracteres@caracteres.caracteres
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// ── Página de Login ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");       // valor del campo email
  const [password, setPassword] = useState(""); // valor del campo contraseña

  const [showPw, setShowPw] = useState(false);  // true = muestra contraseña como texto
  const [loading, setLoading] = useState(false); // true mientras espera respuesta de Supabase
  const [errMsg, setErrMsg] = useState("");      // mensaje de error visible al usuario

  // canSubmit: true solo si el email es válido, la contraseña tiene ≥6 caracteres y no está cargando
  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 6 && !loading;
  }, [email, password, loading]);

  // ── Función: enviar el formulario de login ─────────────────────────────────
  async function onSubmit(e) {
    e.preventDefault(); // evita que la página se recargue al enviar el formulario
    setErrMsg("");       // limpia errores previos
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        // Si las variables de entorno no están configuradas, muestra este error
        setErrMsg(
          "Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
        );
        return;
      }

      // Intenta iniciar sesión con email y contraseña en Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrMsg(error.message); // muestra el error de Supabase al usuario
        return;
      }

      const session = data?.session;
      if (!session) {
        // Esto no debería pasar, pero es una validación de seguridad extra
        setErrMsg(
          "Login OK pero no llegó sesión. Revisa la configuración de Auth en Supabase."
        );
        return;
      }

      // Login exitoso → redirige al garage
      router.push("/garage");
      router.refresh(); // fuerza a Next.js a refrescar los datos del servidor
    } catch (err) {
      setErrMsg(err?.message ?? "Error desconocido al iniciar sesión.");
    } finally {
      setLoading(false); // siempre desactiva el loading al terminar, haya error o no
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AuthShell
      titulo="Bienvenido de vuelta"
      bajada="Inicia sesión para ver tu garage y llevar el control de tus bicicletas."
    >
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>

        <Campo
          etiqueta="Correo electrónico"
          aviso={email.length > 0 && !isValidEmail(email) ? "Ingrese un email válido." : null}
        >
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"       // teclado de email en el teléfono
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
          aviso={password.length > 0 && password.length < 6 ? "Mínimo 6 caracteres." : null}
        >
          <Input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Campo>

        <ErrorCaja>{errMsg}</ErrorCaja>

        <Button type="submit" variant="accion" grande ancho disabled={!canSubmit} cargando={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button type="button" onClick={() => router.push("/")} style={enlaceTenue}>
            ← Volver
          </button>
          <TapLink href="/forgot-password" style={enlaceTenue}>
            ¿Olvidaste tu contraseña?
          </TapLink>
        </div>
      </form>
    </AuthShell>
  );
}
