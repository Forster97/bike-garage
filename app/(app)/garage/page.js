"use client"; // Le dice a Next.js que este componente se ejecuta en el navegador (no en el servidor)
export const dynamic = "force-dynamic"; // Fuerza que la página siempre se recargue desde el servidor, nunca desde caché

// ── Importaciones ──────────────────────────────────────────────────────────────
// useEffect: ejecuta código cuando el componente carga o cuando algo cambia
// useMemo: memoriza un valor calculado para no recalcularlo en cada render
// useState: crea variables que, al cambiar, actualizan la pantalla automáticamente
import { useEffect, useMemo, useState } from "react";

// useRouter: permite navegar entre páginas (ej: redirigir al login)
import { useRouter } from "next/navigation";

// Link: componente para crear enlaces internos sin recargar la página completa
import Link from "next/link";

// supabase: conexión a la base de datos y sistema de autenticación
import { supabase } from "../../../lib/supabaseClient";

// ── Componente principal de la página ─────────────────────────────────────────
export default function GaragePage() {
  const router = useRouter(); // Hook para poder redirigir al usuario a otra página

  // ── Estado (variables reactivas) ──────────────────────────────────────────
  // Cada useState guarda un valor. Cuando ese valor cambia, React redibuja la pantalla.
  const [bikes, setBikes] = useState([]);             // Lista de bicicletas del usuario
  const [newBikeName, setNewBikeName] = useState(""); // Texto que escribe el usuario en el input
  const [loading, setLoading] = useState(true);       // true = está cargando datos, false = ya terminó
  const [adding, setAdding] = useState(false);        // true = se está guardando una bici nueva (evita doble clic)

  // ── Función: cargar bicicletas desde la base de datos ──────────────────────
  // Recibe el ID del usuario (uid) y consulta Supabase para traer sus bicis
  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")                              // tabla "bikes" en Supabase
      .select("*")                                // trae todas las columnas
      .eq("user_id", uid)                         // solo las filas donde user_id coincide
      .order("created_at", { ascending: false }); // ordena de más nueva a más antigua

    if (error) { console.error(error); alert(error.message); return; } // si hay error, lo muestra
    setBikes(data || []); // guarda las bicis en el estado (o array vacío si no hay datos)
  };

  // ── Efecto: se ejecuta al cargar la página ────────────────────────────────
  // useEffect con [router] al final significa "ejecutar cuando el componente aparece o cuando router cambia"
  useEffect(() => {
    let cancelled = false; // bandera para evitar actualizar el estado si el componente ya se desmontó

    const load = async () => {
      setLoading(true); // activa el estado de carga (muestra los esqueletos animados)
      try {
        const { data, error } = await supabase.auth.getUser(); // verifica si hay sesión activa
        if (error) throw error; // si hay error de sesión, lo lanza
        if (!data?.user) { router.replace("/login"); return; } // si no hay usuario, redirige al login
        if (cancelled) return; // si el componente se desmontó mientras cargaba, no hace nada
        await refreshBikes(data.user.id); // carga las bicis del usuario autenticado
      } catch (err) {
        console.error(err); // muestra el error en la consola del navegador
      } finally {
        if (!cancelled) setLoading(false); // desactiva el estado de carga al terminar (con o sin error)
      }
    };

    load(); // llama a la función de carga
    return () => { cancelled = true; }; // limpieza: marca como cancelado si el componente se destruye
  }, [router]);

  // ── Función: agregar una nueva bicicleta ──────────────────────────────────
  const addBike = async () => {
    const name = newBikeName.trim(); // elimina espacios al inicio y al final del nombre
    if (!name || adding) return;     // si el campo está vacío o ya se está agregando, no hace nada

    try {
      setAdding(true); // bloquea el botón para evitar envíos duplicados

      // Vuelve a verificar que el usuario sigue autenticado antes de guardar
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (userErr || !uid) { router.replace("/login"); return; } // si perdió la sesión, redirige

      // Inserta una nueva fila en la tabla "bikes" con el nombre y el ID del usuario
      const { error } = await supabase.from("bikes").insert([{ name, user_id: uid }]);
      if (error) throw error;

      setNewBikeName("");       // limpia el input
      await refreshBikes(uid);  // recarga la lista para mostrar la nueva bici
    } catch (err) {
      alert(err?.message ?? "Error al agregar la bicicleta."); // muestra el error al usuario
    } finally {
      setAdding(false); // desbloquea el botón siempre, haya o no error
    }
  };

  // ── Función: eliminar una bicicleta ───────────────────────────────────────
  const deleteBike = async (bikeId) => {
    // Muestra un diálogo de confirmación antes de eliminar
    if (!confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.")) return;

    // Elimina la fila de la tabla "bikes" donde el id coincide
    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) { alert(error.message); return; }

    // Actualiza el estado local quitando la bici eliminada (sin recargar desde la BD)
    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  // ── Render (lo que se muestra en pantalla) ────────────────────────────────
  return (
    <>
      {/* ── Título de la página ── */}
      <div style={s.titleRow}>
        <div>
          <div style={s.titleLabel}>Mi colección</div>
          <h1 style={s.title}>Garage</h1>
        </div>
        {/* Solo muestra el contador cuando ya terminó de cargar */}
        {!loading && (
          <div style={s.countPill}>
            <span style={s.countNum}>{bikes.length}</span>
            {/* Singular "bici" o plural "bicis" según la cantidad */}
            <span style={s.countLabel}>{bikes.length === 1 ? "bici" : "bicis"}</span>
          </div>
        )}
      </div>

      {/* ── Tarjeta para agregar una nueva bicicleta ── */}
      <div style={s.addCard}>
        <div style={s.addCardTop}>
          <div>
            <div style={s.addCardTitle}>Agregar bicicleta</div>
            <div style={s.addCardSub}>Ej: Diverge Comp / Gambler / Orbea Terra</div>
          </div>
          <span style={s.newBadge}>+ Nueva</span>
        </div>

        <div style={s.addRow}>
          {/* Input controlado: su valor viene del estado y se actualiza con onChange */}
          <input
            value={newBikeName}
            onChange={(e) => setNewBikeName(e.target.value)} // actualiza el estado con cada tecla
            onKeyDown={(e) => e.key === "Enter" && addBike()} // permite agregar presionando Enter
            placeholder="Nombre de la bicicleta"
            style={s.input}
          />
          {/* Botón deshabilitado si el input está vacío o si ya se está guardando */}
          <button
            onClick={addBike}
            disabled={!newBikeName.trim() || adding}
            style={{
              ...s.addBtn, // aplica los estilos base del botón
              opacity: !newBikeName.trim() || adding ? 0.45 : 1,               // más transparente si está deshabilitado
              cursor: !newBikeName.trim() || adding ? "not-allowed" : "pointer", // cambia el cursor
            }}
          >
            {adding ? "Agregando…" : "Agregar"} {/* Cambia el texto mientras guarda */}
          </button>
        </div>

        {/* Pequeño tip informativo para el usuario */}
        <div style={s.tip}>
          <span style={s.tipDot} />
          Después podrás agregar tipo, año, talla y notas dentro de cada bici.
        </div>
      </div>

      {/* ── Lista de bicicletas ── */}
      {/* Lógica condicional: muestra un estado diferente según la situación */}
      {loading ? (
        // CASO 1: Cargando → muestra 3 tarjetas "esqueleto" animadas como placeholder
        <div style={s.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={s.skeletonCard}>
              <div style={s.skeletonAvatar} /> {/* círculo gris simulando el avatar */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={s.skeletonLine1} /> {/* línea gris simulando el nombre */}
                <div style={s.skeletonLine2} /> {/* línea más corta simulando la fecha */}
              </div>
            </div>
          ))}
        </div>
      ) : bikes.length === 0 ? (
        // CASO 2: Sin bicis → muestra estado vacío con mensaje
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🚲</div>
          <div style={s.emptyTitle}>Tu garage está vacío</div>
          <p style={s.emptyText}>Agrega tu primera bici arriba para empezar a registrar componentes y pesos.</p>
        </div>
      ) : (
        // CASO 3: Hay bicis → muestra la lista real
        <div style={s.list}>
          {bikes.map((bike) => ( // recorre cada bici y renderiza una tarjeta
            <div key={bike.id} style={s.bikeCard}> {/* key es obligatorio en listas, ayuda a React a identificar cada elemento */}

              {/* Área clickeable que lleva al detalle de la bici */}
              <Link href={`/garage/${bike.id}`} style={s.bikeLink}>
                {/* Avatar con la primera letra del nombre de la bici */}
                <div style={s.bikeAvatar}>
                  {(bike.name || "B").slice(0, 1).toUpperCase()}
                </div>
                <div style={s.bikeInfo}>
                  <div style={s.bikeName}>{bike.name}</div>
                  <div style={s.bikeMeta}>
                    {/* Muestra el tipo si existe, seguido de un punto separador */}
                    {bike.type ? `${bike.type} · ` : ""}
                    {/* Formatea la fecha de creación en español chileno */}
                    Creada {new Date(bike.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={s.bikeArrow}>→</div> {/* flecha indicando que es clickeable */}
              </Link>

              {/* Botón de eliminar, separado del Link para no activar la navegación */}
              <button onClick={() => deleteBike(bike.id)} style={s.deleteBtn} title="Eliminar bicicleta">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
// Objeto con todos los estilos inline de la página.
// Es equivalente a CSS pero escrito como objetos JavaScript.
// Se usan con style={s.nombreDelEstilo} en los elementos de arriba.
const s = {
  // Fila del título: flex para poner el título y el contador en la misma línea
  titleRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  titleLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 },
  title: { margin: 0, fontSize: "clamp(28px, 6vw, 38px)", fontWeight: 900, letterSpacing: "-1px", color: "rgba(255,255,255,0.95)", lineHeight: 1 },
  // Pastilla que muestra la cantidad de bicis
  countPill: { display: "flex", alignItems: "baseline", gap: 5, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" },
  countNum: { fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.5px" },
  countLabel: { fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500 },

  // Tarjeta de agregar bici
  addCard: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", padding: "18px", display: "flex", flexDirection: "column", gap: 14 },
  addCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  addCardTitle: { fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.3px" },
  addCardSub: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.40)" },
  newBadge: { fontSize: 11, fontWeight: 700, color: "rgba(134,239,172,0.9)", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" },
  addRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 180, padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.90)", fontSize: 14, outline: "none" },
  addBtn: { padding: "11px 18px", borderRadius: 11, border: 0, fontWeight: 700, fontSize: 14, color: "#060910", background: "rgba(255,255,255,0.92)", whiteSpace: "nowrap" },
  tip: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.38)" },
  tipDot: { display: "block", width: 5, height: 5, borderRadius: 999, background: "rgba(99,102,241,0.6)", flexShrink: 0 },

  // Lista de bicis
  list: { display: "flex", flexDirection: "column", gap: 8 },

  // Esqueletos de carga (placeholders mientras llegan los datos)
  skeletonCard: { display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 },
  skeletonLine1: { height: 14, width: "55%", borderRadius: 999, background: "rgba(255,255,255,0.07)" },
  skeletonLine2: { height: 11, width: "35%", borderRadius: 999, background: "rgba(255,255,255,0.05)" },

  // Estado vacío (cuando no hay bicis)
  emptyState: { padding: "48px 20px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyIcon: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,0.80)", letterSpacing: "-0.3px" },
  emptyText: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.40)", lineHeight: 1.6, maxWidth: 320 },

  // Tarjetas de cada bici
  bikeCard: { display: "flex", alignItems: "center", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", overflow: "hidden" },
  bikeLink: { display: "flex", alignItems: "center", gap: 14, flex: 1, padding: "14px 16px", textDecoration: "none", minWidth: 0 },
  bikeAvatar: { width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.85)", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.20)", flexShrink: 0 },
  bikeInfo: { flex: 1, minWidth: 0 },
  bikeName: { fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bikeMeta: { marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.40)" },
  bikeArrow: { fontSize: 16, color: "rgba(255,255,255,0.25)", flexShrink: 0 },
  deleteBtn: { padding: "14px 16px", border: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, alignSelf: "stretch", display: "grid", placeItems: "center" },
};
