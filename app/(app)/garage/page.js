"use client"; // Le dice a Next.js que este componente se ejecuta en el navegador (no en el servidor)
export const dynamic = "force-dynamic"; // Fuerza que la página siempre se recargue desde el servidor, nunca desde caché

// ── Importaciones ──────────────────────────────────────────────────────────────
// useEffect: ejecuta código cuando el componente carga o cuando algo cambia
// useMemo: memoriza un valor calculado para no recalcularlo en cada render
// useState: crea variables que, al cambiar, actualizan la pantalla automáticamente
import { useEffect, useMemo, useState } from "react";
import ComboBox from "../../../components/ComboBox";

// useRouter: permite navegar entre páginas (ej: redirigir al login)
import { useRouter } from "next/navigation";

// Link: componente para crear enlaces internos sin recargar la página completa
import Link from "next/link";

// supabase: conexión a la base de datos y sistema de autenticación
import { supabase } from "../../../lib/supabaseClient";

// import de insertar componentes:
  import { useRouter } from "next/navigation";
  import { supabase } from "../../../lib/supabaseClient"; // ajusta la ruta
  import { createBikeWithTemplate } from "../../../lib/createBikeWithTemplate"; // ajusta la ruta


// ── Chevron reutilizable ───────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ transition: "transform 0.22s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.40)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Componente principal de la página ─────────────────────────────────────────
export default function GaragePage() {
  const router = useRouter(); // Hook para poder redirigir al usuario a otra página

  // ── Estado (variables reactivas) ──────────────────────────────────────────
  // Cada useState guarda un valor. Cuando ese valor cambia, React redibuja la pantalla.
  const [bikes, setBikes] = useState([]);             // Lista de bicicletas del usuario
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newType, setNewType] = useState("Gravel");

  const BIKE_TYPES = ["Ruta", "Gravel", "XC", "Trail", "Enduro", "Urbana", "E-Bike", "Dh", "Otra"];
  const [loading, setLoading] = useState(true);       // true = está cargando datos, false = ya terminó
  const [adding, setAdding] = useState(false);        // true = se está guardando una bici nueva (evita doble clic)
  const [addOpen, setAddOpen] = useState(false);      // colapsable del formulario "Agregar bicicleta"

  // ── Catálogo de bicicletas (para los desplegables) ────────────────────────
  const [catalogBrands, setCatalogBrands] = useState([]);  // marcas únicas
  const [catalogModels, setCatalogModels] = useState([]);  // modelos filtrados por marca
  const [catalogYears,  setCatalogYears]  = useState([]);  // años filtrados por marca+modelo
  const [catalogSizes,  setCatalogSizes]  = useState([]);  // tallas de bike_sizes

  // ── Efecto: carga marcas y tallas al montar (datos independientes) ──────────
  useEffect(() => {
    const fetchStaticCatalog = async () => {
      const [brandsRes, sizesRes] = await Promise.all([
        supabase.from("bike_catalog").select("brand").order("brand"),
        supabase.from("bike_sizes").select("size").order("size"),
      ]);
      if (brandsRes.data) setCatalogBrands([...new Set(brandsRes.data.map((r) => r.brand))]);
      if (sizesRes.data)  setCatalogSizes(sizesRes.data.map((r) => r.size));
    };
    fetchStaticCatalog();
  }, []);

  // ── Efecto: recarga modelos cada vez que cambia la marca ─────────────────
  // Usa 300 ms de debounce para no disparar una query por cada tecla
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!newBrand.trim()) { setCatalogModels([]); return; }
      const { data } = await supabase
        .from("bike_catalog")
        .select("model")
        .ilike("brand", newBrand.trim())
        .order("model");
      if (data) setCatalogModels([...new Set(data.map((r) => r.model))]);
    }, 300);
    return () => clearTimeout(t);
  }, [newBrand]);

  // ── Efecto: recarga años cada vez que cambia marca o modelo ──────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!newBrand.trim() || !newModel.trim()) { setCatalogYears([]); return; }
      const { data } = await supabase
        .from("bike_catalog")
        .select("year")
        .ilike("brand", newBrand.trim())
        .ilike("model", newModel.trim())
        .order("year", { ascending: false });
      if (data) setCatalogYears([...new Set(data.map((r) => String(r.year)))]);
    }, 300);
    return () => clearTimeout(t);
  }, [newBrand, newModel]);

  // ── Función: cargar bicicletas desde la base de datos ──────────────────────
  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")
      .select("id, user_id, brand, model, type, year, size, notes, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const rows = (data || []).map((b) => ({
      ...b,
      displayName: `${b.brand ?? ""} ${b.model ?? ""}`.trim() || b.name || "Bicicleta",
    }));

    setBikes(rows);
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
    const brand = newBrand.trim();
    const model = newModel.trim();
    const size = newSize.trim();
    const type = (newType || "").trim();
    const yearNum = Number(String(newYear).trim());

    // Validaciones mínimas (evita errores por NOT NULL)
    if (adding) return;
    if (!brand || !model || !size || !type) return;
    if (!Number.isFinite(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear() + 1) return;

    try {
      setAdding(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (userErr || !uid) {
        router.replace("/login");
        return;
      }

    // 1) Asegura que exista en el catálogo (si no existe, lo crea; si existe, no duplica)
    const { error: catErr } = await supabase
      .from("bike_catalog")
      .upsert(
        { brand, model, year: yearNum, type },
        { onConflict: "brand,model,year" }
      );

    if (catErr) throw catErr;

    // 2) Inserta la bici del usuario

      // dentro de tu componente...
      const router = useRouter();

      async function handleCreate(e) {
        e.preventDefault();

        // 1) sacar userId
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) {
          alert("Debes iniciar sesión");
          return;
        }

        try {
          // 2) crear bici + autocargar componentes
          const bike = await createBikeWithTemplate({
            userId,
            name,   // tu state
            brand,  // tu state
            model,  // tu state
            year,   // tu state
            size,   // tu state (si lo tienes)
            notes,  // tu state (si lo tienes)
          });

          // 3) redirigir a la bici
          router.push(`/garage/${bike.id}`);
        } catch (err) {
          console.error(err);
          alert(err?.message ?? "Error creando bicicleta");
        }
      }
      // Limpia el form
      setNewBrand("");
      setNewModel("");
      setNewYear("");
      setNewSize("");
      setNewType("Gravel");

      await refreshBikes(uid);
    } catch (err) {
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
      // Actualiza sugerencias sin recargar la página
      setCatalogBrands((prev) =>
        prev.includes(brand) ? prev : [...prev, brand].sort((a, b) => a.localeCompare(b))
      );
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
        <button
          onClick={() => setAddOpen((o) => !o)}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={s.addCardTitle}>Agregar bicicleta</div>
            <div style={s.addCardSub}>Ej: Diverge Comp / Gambler / Orbea Terra</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={s.newBadge}>+ Nueva</span>
            <Chevron open={addOpen} />
          </div>
        </button>

        {addOpen && (
          <>
            <div style={s.addRow}>
              <ComboBox
                value={newBrand}
                onChange={setNewBrand}
                options={catalogBrands}
                placeholder="Marca (ej: Orbea)"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newModel}
                onChange={setNewModel}
                options={catalogModels}
                placeholder="Modelo (ej: Terra H30)"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newYear}
                onChange={setNewYear}
                options={catalogYears}
                placeholder="Año (ej: 2021)"
                inputMode="numeric"
                style={s.comboWrapper}
              />

              <ComboBox
                value={newSize}
                onChange={setNewSize}
                options={catalogSizes}
                placeholder="Talla (ej: S / 54)"
                style={s.comboWrapper}
              />

              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ ...s.input, cursor: "pointer" }}
              >
                {BIKE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                onClick={addBike}
                disabled={
                  adding ||
                  !newBrand.trim() ||
                  !newModel.trim() ||
                  !String(newYear).trim() ||
                  !newSize.trim() ||
                  !newType.trim()
                }
                style={{
                  ...s.addBtn,
                  opacity:
                    adding ||
                    !newBrand.trim() ||
                    !newModel.trim() ||
                    !String(newYear).trim() ||
                    !newSize.trim() ||
                    !newType.trim()
                      ? 0.45
                      : 1,
                  cursor:
                    adding ||
                    !newBrand.trim() ||
                    !newModel.trim() ||
                    !String(newYear).trim() ||
                    !newSize.trim() ||
                    !newType.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {adding ? "Agregando…" : "Agregar"}
              </button>
            </div>

            {/* Pequeño tip informativo para el usuario */}
            <div style={s.tip}>
              <span style={s.tipDot} />
              Estos 5 datos son obligatorios. Después podrás agregar notas y componentes dentro de cada bici.
            </div>
          </>
        )}
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
            {/* Avatar con la primera letra del displayName (brand + model) */}
            <div style={s.bikeAvatar}>
              {(`${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || "B")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div style={s.bikeInfo}>
              {/* Nombre visible = brand + model */}
              <div style={s.bikeName}>
                {(`${bike.brand ?? ""} ${bike.model ?? ""}`.trim() || bike.name || "Bicicleta")}
              </div>

              <div style={s.bikeMeta}>
                {bike.type ? `${bike.type} · ` : ""}
                Creada{" "}
                {new Date(bike.created_at).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            <div style={s.bikeArrow}>→</div>
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
  // comboWrapper: layout para el contenedor del ComboBox (flex+minWidth van aquí, el estilo visual va dentro del componente)
  comboWrapper: { flex: 1, minWidth: 180 },
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
