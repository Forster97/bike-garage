"use client";

// Página de gestión de categorías de componentes.
// Permite al usuario:
//   - Ver las categorías visibles (aparecen en los selects de componentes)
//   - Ocultar categorías (dejan de aparecer en los selects)
//   - Agregar categorías personalizadas propias
//   - Eliminar categorías personalizadas (las de por defecto no se pueden borrar)
import TapLink from "../../../../components/TapLink";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Card from "../../../../components/Card";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Badge from "../../../../components/Badge";
import { color, radio, espacio, texto } from "../../../../lib/design";
import { DEFAULT_CATEGORIES } from "../../../../lib/constants";

// Limpia espacios al inicio y al final de un nombre de categoría
const normalizeName = (s) => (s ?? "").trim();

export default function CategoriesPage() {
  const router = useRouter();

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");          // email del usuario (para mostrarlo en el header)
  const [custom, setCustom] = useState([]);        // categorías personalizadas del usuario (de la BD)
  const [hidden, setHidden] = useState(() => new Set()); // Set con los nombres de categorías ocultas
  const [newName, setNewName] = useState("");      // valor del input para agregar categoría
  const [saving, setSaving] = useState(false);
  // Qué categoría se está moviendo. Ocultar, mostrar y eliminar hablan con la
  // base y no avisaban nada mientras tanto.
  const [ocupada, setOcupada] = useState(null);     // true mientras se guarda una nueva categoría
  const [errorMsg, setErrorMsg] = useState("");    // mensaje de error visible al usuario

  // ── Listas computadas (se recalculan cuando cambian custom u hidden) ───────

  // visibleList: todas las categorías (default + custom) que NO están ocultas
  const visibleList = useMemo(() => {
    const customNames = custom.map((r) => r.name);
    const merged = [...DEFAULT_CATEGORIES, ...customNames];
    const unique = [];
    const seen = new Set();
    for (const name of merged) {
      if (!name) continue;
      if (seen.has(name)) continue; // evita duplicados
      seen.add(name);
      if (hidden.has(name)) continue; // si está oculta, la saltamos
      unique.push(name);
    }
    return unique;
  }, [custom, hidden]);

  // hiddenList: todas las categorías que están ocultas
  const hiddenList = useMemo(() => {
    const all = [...DEFAULT_CATEGORIES, ...custom.map((r) => r.name)];
    const unique = [];
    const seen = new Set();
    for (const name of all) {
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      if (!hidden.has(name)) continue; // solo incluye las ocultas
      unique.push(name);
    }
    // También agrega cualquier nombre en hidden que no esté en las listas conocidas
    for (const name of hidden) {
      if (seen.has(name)) continue;
      unique.push(name);
    }
    return unique;
  }, [custom, hidden]);

  // ── Carga inicial: verifica sesión y trae datos de la BD ───────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) { router.replace("/login"); return; }
      if (cancelled) return;
      setEmail(data.user.email ?? "");

      // Carga en paralelo las categorías personalizadas y las ocultas
      const [
        { data: customRows, error: customErr },
        { data: hiddenRows, error: hiddenErr },
      ] = await Promise.all([
        supabase.from("categories").select("id,name,created_at").eq("user_id", data.user.id).order("created_at", { ascending: true }),
        supabase.from("category_hidden").select("name").eq("user_id", data.user.id),
      ]);

      if (cancelled) return;

      if (customErr) setErrorMsg(customErr.message);
      if (hiddenErr) setErrorMsg((prev) => prev || hiddenErr.message);

      setCustom(
        (customRows ?? [])
          .map((r) => ({ id: r.id, name: r.name }))
          .filter((r) => normalizeName(r.name).length > 0) // descarta nombres vacíos
      );
      setHidden(new Set((hiddenRows ?? []).map((r) => r.name).filter(Boolean)));
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [router]);

  // ── Función: agregar categoría personalizada ───────────────────────────────
  const addCustom = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const name = normalizeName(newName);
    if (!name) return;
    setSaving(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authErr || !user) { setSaving(false); router.replace("/login"); return; }

    // Si la categoría ya existe (en defaults o en personalizadas), no la agrega
    const exists = DEFAULT_CATEGORIES.includes(name) || custom.some((r) => r.name === name);
    if (exists) { setSaving(false); setNewName(""); return; }

    const { data: row, error } = await supabase
      .from("categories").insert({ user_id: user.id, name }).select("id,name").single();

    if (error) { setErrorMsg(error.message); setSaving(false); return; }

    setCustom((prev) => [...prev, { id: row.id, name: row.name }]); // agrega localmente
    setNewName("");
    setSaving(false);
  };

  // ── Función: ocultar una categoría ────────────────────────────────────────
  // Actualización optimista: cambia el estado primero, y si la BD falla, revierte.
  const hideCategory = async (name) => {
    if (ocupada) return;
    setOcupada(name);
    try {
    setErrorMsg("");
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authErr || !user) return router.replace("/login");

    const n = normalizeName(name);
    if (!n) return;

    setHidden((prev) => new Set([...prev, n])); // la oculta inmediatamente en UI

    const { error } = await supabase.from("category_hidden").insert({ user_id: user.id, name: n });
    if (error) {
      // Si falla en la BD, revierte el cambio en el estado
      setHidden((prev) => { const next = new Set(prev); next.delete(n); return next; });
      setErrorMsg(error.message);
    }
    } finally {
      setOcupada(null);
    }
  };

  // ── Función: mostrar una categoría oculta ─────────────────────────────────
  const unhideCategory = async (name) => {
    if (ocupada) return;
    setOcupada(name);
    try {
    setErrorMsg("");
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authErr || !user) return router.replace("/login");

    const n = normalizeName(name);
    if (!n) return;

    setHidden((prev) => { const next = new Set(prev); next.delete(n); return next; }); // la muestra en UI

    const { error } = await supabase.from("category_hidden").delete().eq("user_id", user.id).eq("name", n);
    if (error) {
      // Si falla en la BD, revierte el cambio
      setHidden((prev) => new Set([...prev, n]));
      setErrorMsg(error.message);
    }
    } finally {
      setOcupada(null);
    }
  };

  // ── Función: eliminar una categoría personalizada ─────────────────────────
  // Solo borra de la tabla "categories", no afecta las categorías por defecto.
  const deleteCustom = async (row) => {
    if (ocupada) return;
    setOcupada(row.name);
    try {
    setErrorMsg("");
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authErr || !user) return router.replace("/login");

    setCustom((prev) => prev.filter((r) => r.id !== row.id)); // la elimina localmente

    const { error } = await supabase.from("categories").delete().eq("id", row.id).eq("user_id", user.id);
    if (error) {
      setCustom((prev) => [...prev, row]); // si falla, la restaura
      setErrorMsg(error.message);
    }
    } finally {
      setOcupada(null);
    }
  };

  // ── Render ───────────────────────────────────────────────
  //
  // Primera pantalla migrada al sistema de diseño. Era la única que usaba los
  // primitivos viejos —escritos en Tailwind, con paleta lima y gris pizarra—,
  // así que se veía distinta a las otras ocho sin que eso fuera una decisión.

  const chip = {
    display: "flex", alignItems: "center", gap: espacio.sm,
    borderRadius: radio.md, border: "1px solid " + color.borde.sutil,
    background: color.superficie.baja, padding: espacio.sm + "px " + espacio.md + "px",
  };
  const titulo = { fontSize: texto.md, fontWeight: texto.peso.fuerte, color: color.texto.fuerte };
  const apoyo = { marginTop: 4, fontSize: texto.sm, color: color.texto.suave };
  const vacio = { fontSize: texto.base, color: color.texto.tenue };
  const caja = {
    borderRadius: radio.md, border: "1px solid " + color.borde.sutil,
    background: color.superficie.baja, padding: espacio.md,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: espacio.md }}>

      {/* Título + volver */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: espacio.md, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: texto.xs, fontWeight: texto.peso.fuerte, letterSpacing: "1px", textTransform: "uppercase", color: color.texto.tenue }}>
            Ajustes
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: texto.peso.maximo, letterSpacing: "-0.5px", color: color.texto.fuerte }}>
            Categorías
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: texto.md, color: color.texto.suave }}>
            Administra qué categorías aparecen en tus componentes.
          </p>
        </div>
        {/* Se vuelve a Perfil, que es desde donde se llega acá (PRD-11.2) */}
        <TapLink href="/settings/profile" style={{ textDecoration: "none" }}>
          <Button>← Perfil</Button>
        </TapLink>
      </div>

      {/* Resumen */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: espacio.md, textAlign: "center" }}>
          {[
            ["Visibles", visibleList.length],
            ["Ocultas", hiddenList.length],
            ["Personalizadas", custom.length],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} style={caja}>
              <div style={{ fontSize: texto.xl, fontWeight: texto.peso.maximo, color: color.texto.fuerte, lineHeight: 1 }}>{valor}</div>
              <div style={{ marginTop: 5, fontSize: texto.sm, color: color.texto.tenue }}>{etiqueta}</div>
            </div>
          ))}
        </div>
      </Card>

      {errorMsg ? (
        <Card tono="peligro">
          <div style={{ fontSize: texto.md, fontWeight: texto.peso.fuerte, color: color.estado.vencido }}>Error</div>
          <div style={{ fontSize: texto.base, color: color.texto.normal }}>{errorMsg}</div>
        </Card>
      ) : null}

      {/* Agregar */}
      <Card>
        <div>
          <div style={titulo}>Agregar categoría</div>
          <div style={apoyo}>No se agregan duplicadas.</div>
        </div>
        <form onSubmit={addCustom} style={{ display: "flex", gap: espacio.sm }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Suspensión"
            style={{ flex: 1, minWidth: 0 }}
          />
          <Button type="submit" variant="accion" disabled={saving || !newName.trim()} cargando={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </Button>
        </form>
      </Card>

      {/* Visibles */}
      <Card>
        <div>
          <div style={titulo}>Visibles</div>
          <div style={apoyo}>Aparecen al agregar un componente.</div>
        </div>
        {loading ? (
          <div style={vacio}>Cargando…</div>
        ) : visibleList.length === 0 ? (
          <div style={vacio}>No tienes categorías visibles.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: espacio.sm }}>
            {visibleList.map((name) => (
              <div key={"vis-" + name} style={chip}>
                <span style={{ fontSize: texto.base, fontWeight: texto.peso.medio, color: color.texto.fuerte }}>{name}</span>
                <Button variant="fantasma" onClick={() => hideCategory(name)} cargando={ocupada === name}>Ocultar</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ocultas */}
      <Card>
        <div>
          <div style={titulo}>Ocultas</div>
          <div style={apoyo}>No aparecen al agregar un componente.</div>
        </div>
        {hiddenList.length === 0 ? (
          <div style={vacio}>No tienes categorías ocultas.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: espacio.sm }}>
            {hiddenList.map((name) => (
              <div key={"hid-" + name} style={chip}>
                <span style={{ fontSize: texto.base, fontWeight: texto.peso.medio, color: color.texto.suave }}>{name}</span>
                <Button variant="fantasma" onClick={() => unhideCategory(name)} cargando={ocupada === name}>Mostrar</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Personalizadas */}
      <Card>
        <div>
          <div style={titulo}>Personalizadas</div>
          <div style={apoyo}>Las que creaste tú. Puedes ocultarlas o eliminarlas.</div>
        </div>
        {custom.length === 0 ? (
          <div style={vacio}>Aún no agregas categorías personalizadas.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: espacio.sm }}>
            {custom.map((row) => {
              const oculta = hidden.has(row.name);
              return (
                <div key={row.id} style={{ ...caja, display: "flex", alignItems: "center", justifyContent: "space-between", gap: espacio.md, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: texto.base, fontWeight: texto.peso.fuerte, color: color.texto.fuerte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.name}
                    </div>
                    <Badge nivel={oculta ? "sinDatos" : "alDia"} style={{ marginTop: 4 }}>
                      {oculta ? "Oculta" : "Visible"}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: espacio.sm }}>
                    <Button variant="fantasma" onClick={() => (oculta ? unhideCategory(row.name) : hideCategory(row.name))} cargando={ocupada === row.name}>
                      {oculta ? "Mostrar" : "Ocultar"}
                    </Button>
                    <Button variant="peligro" onClick={() => deleteCustom(row)} cargando={ocupada === row.name}>Eliminar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
