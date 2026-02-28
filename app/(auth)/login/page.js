"use client";

// useMemo: recalcula canSubmit solo cuando cambian los valores del formulario
// useState: variables reactivas del formulario
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabaseClient";

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
    <main className="min-h-[100svh] bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Encabezado */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Bike Garage
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Inicia sesión para ver tu garage y llevar el control de tus bicicletas.
            </p>
          </div>

          {/* Tarjeta con el formulario */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <form onSubmit={onSubmit} className="grid gap-4">

              {/* Campo email con validación inline */}
              <div className="grid gap-2">
                <label className="text-sm text-zinc-200">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"       // muestra teclado de email en móvil
                  autoComplete="email"    // el navegador puede autocompletar
                  placeholder="tu@email.com"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none ring-0 transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {/* Muestra advertencia si el email tiene formato inválido */}
                {email.length > 0 && !isValidEmail(email) ? (
                  <p className="text-xs text-amber-300">
                    Ingrese un email válido.
                  </p>
                ) : null}
              </div>

              {/* Campo contraseña con toggle mostrar/ocultar */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-200">Password</label>
                  {/* Botón para alternar entre mostrar y ocultar la contraseña */}
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)} // alterna entre true y false
                    className="text-xs text-zinc-300 hover:text-zinc-100"
                  >
                    {showPw ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <input
                  type={showPw ? "text" : "password"} // "text" = visible, "password" = puntos
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm outline-none transition focus:border-zinc-600 focus:bg-zinc-950"
                />
                {/* Avisa si la contraseña tiene menos de 6 caracteres */}
                {password.length > 0 && password.length < 6 ? (
                  <p className="text-xs text-amber-300">
                    Mínimo 6 caracteres.
                  </p>
                ) : null}
              </div>

              {/* Mensaje de error del servidor */}
              {errMsg ? (
                <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm">
                  <span className="font-semibold text-red-200">Error: </span>
                  <span className="text-red-100">{errMsg}</span>
                </div>
              ) : null}

              {/* Botón de envío — deshabilitado si canSubmit es false */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "h-11 rounded-xl px-4 text-sm font-semibold transition",
                  "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                ].join(" ")}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {/* Botón volver a la página de inicio */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-xs text-zinc-300 hover:text-zinc-50"
                >
                  ← Volver
                </button>
              </div>
            </form>
          </div>

          {/* Pie de página con año dinámico */}
          <p className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} Bike Garage
          </p>
        </div>
      </div>
    </main>
  );
}
