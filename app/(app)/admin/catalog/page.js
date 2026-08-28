"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { color, radio } from "../../../../lib/design";

const ADMIN_EMAIL = "bforsterb@gmail.com";

const CATEGORIES = ["cassette", "chain", "rear_derailleur", "crankset", "brake", "rotor"];
const DISCIPLINES = ["mtb", "road"];
const CONFIDENCE = ["verified", "likely"];

const EMPTY = {
  discipline: "mtb",
  category: "cassette",
  brand: "",
  series: "",
  model: "",
  variant: "",
  speeds: "",
  year: "",
  sku: "",
  weight_g: "",
  confidence: "verified",
  source_url: "",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function catLabel(c) {
  return { cassette: "Cassette", chain: "Cadena", rear_derailleur: "Cambio trasero", crankset: "Biela", brake: "Freno", rotor: "Disco" }[c] ?? c;
}

function discChip(d) {
  const colors = { mtb: { bg: color.estado.alDiaTenue, color: color.estado.alDiaTexto, border: color.estado.alDiaBorde }, road: { bg: color.identidad.tenue, color: "#a5b4fc", border: color.identidad.borde } };
  const style = colors[d] ?? { bg: color.superficie.alta, color: color.texto.suave, border: color.borde.normal };
  return (
    <span style={{ ...s.chip, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
      {d?.toUpperCase() ?? "—"}
    </span>
  );
}

function confBadge(c) {
  const ok = c === "verified";
  return (
    <span style={{ ...s.chip, background: ok ? color.estado.alDiaTenue : color.estado.proximoTenue, color: ok ? color.estado.alDiaTexto : color.estado.proximo, border: `1px solid ${ok ? color.estado.alDiaBorde : color.estado.proximoBorde}` }}>
      {ok ? "✓ verified" : "~ likely"}
    </span>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export default function AdminCatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [token, setToken] = useState(null);

  // filtros
  const [filterDisc, setFilterDisc] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  // modal
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', form: {...}, id?: string }
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // borrar
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud?.user || ud.user.email !== ADMIN_EMAIL) {
        router.replace("/garage");
        return;
      }
      const { data: sd } = await supabase.auth.getSession();
      setToken(sd?.session?.access_token ?? null);
      await loadItems();
      setLoading(false);
    };
    init();
  }, [router]);

  async function loadItems() {
    const { data } = await supabase
      .from("component_catalog")
      .select("*")
      .order("discipline")
      .order("category")
      .order("brand")
      .order("model");
    setItems(data ?? []);
  }

  // ── lista filtrada ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      if (filterDisc !== "all" && r.discipline !== filterDisc) return false;
      if (filterCat !== "all" && r.category !== filterCat) return false;
      if (q) {
        const hay = [r.brand, r.series, r.model, r.variant, r.sku].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterDisc, filterCat, search]);

  // ── api helpers ──────────────────────────────────────────────────────────
  function apiHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  function parseForm(form) {
    return {
      discipline: form.discipline || null,
      category: form.category,
      brand: form.brand.trim(),
      series: form.series.trim() || null,
      model: form.model.trim() || null,
      variant: form.variant.trim() || null,
      speeds: form.speeds ? parseInt(form.speeds) : null,
      year: form.year ? parseInt(form.year) : null,
      sku: form.sku.trim() || null,
      weight_g: form.weight_g ? parseInt(form.weight_g) : null,
      confidence: form.confidence || "verified",
      source_url: form.source_url.trim() || null,
    };
  }

  async function handleSave() {
    if (!modal?.form?.brand?.trim()) { setModalError("Brand es obligatorio"); return; }
    setSaving(true);
    setModalError("");
    try {
      const payload = parseForm(modal.form);

      let res;
      if (modal.mode === "create") {
        res = await fetch("/api/admin/catalog", { method: "POST", headers: apiHeaders(), body: JSON.stringify(payload) });
      } else {
        res = await fetch("/api/admin/catalog", { method: "PUT", headers: apiHeaders(), body: JSON.stringify({ id: modal.id, ...payload }) });
      }
      const json = await res.json();
      if (!res.ok) { setModalError(json.error ?? "Error"); return; }

      if (modal.mode === "create") {
        setItems((prev) => [...prev, json.data]);
      } else {
        setItems((prev) => prev.map((r) => (r.id === modal.id ? json.data : r)));
      }

      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/catalog", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ id: deleteId }) });
      if (res.ok) setItems((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() { setModal({ mode: "create", form: { ...EMPTY } }); setModalError(""); }
  function openEdit(row) { setModal({ mode: "edit", id: row.id, form: { discipline: row.discipline ?? "", category: row.category ?? "cassette", brand: row.brand ?? "", series: row.series ?? "", model: row.model ?? "", variant: row.variant ?? "", speeds: row.speeds ?? "", year: row.year ?? "", sku: row.sku ?? "", weight_g: row.weight_g ?? "", confidence: row.confidence ?? "verified", source_url: row.source_url ?? "" } }); setModalError(""); }
  function setField(k, v) { setModal((m) => ({ ...m, form: { ...m.form, [k]: v } })); }

  // ── render ───────────────────────────────────────────────────────────────
  if (loading) return <div style={s.center}>Cargando…</div>;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Catálogo de Componentes</h1>
          <p style={s.sub}>{items.length} componentes · {filtered.length} visibles</p>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ Nuevo</button>
      </div>

      {/* Filtros */}
      <div style={s.filters}>
        <input style={s.searchInput} placeholder="Buscar marca, modelo, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={s.select} value={filterDisc} onChange={(e) => setFilterDisc(e.target.value)}>
          <option value="all">Todas las disciplinas</option>
          {DISCIPLINES.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <select style={s.select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Disc.", "Cat.", "Brand", "Series", "Model / Variant", "Vel.", "Peso (g)", "Conf.", ""].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: color.texto.tenue, padding: 32 }}>Sin resultados</td></tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} style={s.tr}>
                <td style={s.td}>{discChip(row.discipline)}</td>
                <td style={s.td}><span style={s.catText}>{catLabel(row.category)}</span></td>
                <td style={s.td}><span style={s.bold}>{row.brand}</span></td>
                <td style={s.td}><span style={s.muted}>{row.series ?? "—"}</span></td>
                <td style={s.td}>
                  <span style={s.bold}>{row.model ?? "—"}</span>
                  {row.variant && <span style={{ ...s.muted, marginLeft: 6 }}>{row.variant}</span>}
                </td>
                <td style={{ ...s.td, textAlign: "center" }}>{row.speeds ?? "—"}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{row.weight_g ?? "—"}</td>
                <td style={s.td}>{confBadge(row.confidence)}</td>
                <td style={{ ...s.td, textAlign: "right" }}>
                  <div style={s.actions}>
                    <button style={s.editBtn} onClick={() => openEdit(row)}>Editar</button>
                    <button style={s.delBtn} onClick={() => setDeleteId(row.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div style={s.overlay} onClick={() => !saving && setModal(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{modal.mode === "create" ? "Nuevo componente" : "Editar componente"}</h2>

            <div style={s.formGrid}>
              <Field label="Disciplina">
                <select style={s.input} value={modal.form.discipline} onChange={(e) => setField("discipline", e.target.value)}>
                  <option value="">— ninguna —</option>
                  {DISCIPLINES.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                </select>
              </Field>
              <Field label="Categoría *">
                <select style={s.input} value={modal.form.category} onChange={(e) => setField("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </Field>
              <Field label="Brand *">
                <input style={s.input} value={modal.form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="Shimano" />
              </Field>
              <Field label="Series">
                <input style={s.input} value={modal.form.series} onChange={(e) => setField("series", e.target.value)} placeholder="XT" />
              </Field>
              <Field label="Model">
                <input style={s.input} value={modal.form.model} onChange={(e) => setField("model", e.target.value)} placeholder="CS-M8100" />
              </Field>
              <Field label="Variant">
                <input style={s.input} value={modal.form.variant} onChange={(e) => setField("variant", e.target.value)} placeholder="10-51t" />
              </Field>
              <Field label="Velocidades">
                <input style={s.input} type="number" min="1" max="13" value={modal.form.speeds} onChange={(e) => setField("speeds", e.target.value)} placeholder="12" />
              </Field>
              <Field label="Año">
                <input style={s.input} type="number" min="2015" max="2030" value={modal.form.year} onChange={(e) => setField("year", e.target.value)} placeholder="2023" />
              </Field>
              <Field label="SKU">
                <input style={s.input} value={modal.form.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="Y0VS98020" />
              </Field>
              <Field label="Peso (g)">
                <input style={s.input} type="number" min="1" value={modal.form.weight_g} onChange={(e) => setField("weight_g", e.target.value)} placeholder="420" />
              </Field>
              <Field label="Confidence">
                <select style={s.input} value={modal.form.confidence} onChange={(e) => setField("confidence", e.target.value)}>
                  {CONFIDENCE.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Source URL" full>
                <input style={s.input} value={modal.form.source_url} onChange={(e) => setField("source_url", e.target.value)} placeholder="https://…" />
              </Field>
            </div>

            {modalError && <p style={s.err}>{modalError}</p>}

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setModal(null)} disabled={saving}>Cancelar</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : modal.mode === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrar */}
      {deleteId && (
        <div style={s.overlay} onClick={() => !deleting && setDeleteId(null)}>
          <div style={{ ...s.modalBox, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>¿Eliminar componente?</h2>
            <p style={{ color: color.texto.suave, marginBottom: 24, fontSize: 14 }}>
              Esta acción no se puede deshacer. Si hay componentes de usuarios que referencian este catálogo, el FK se pondrá en NULL.
            </p>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setDeleteId(null)} disabled={deleting}>Cancelar</button>
              <button style={{ ...s.saveBtn, background: "#ef4444" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

// ── estilos ──────────────────────────────────────────────────────────────────
const s = {

  page: { display: "flex", flexDirection: "column", gap: 20 },
  center: { display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: color.texto.tenue },

  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
  sub: { fontSize: 13, color: color.texto.tenue, margin: "4px 0 0" },
  addBtn: { flexShrink: 0, background: "#22c55e", color: "#030712", border: "none", borderRadius: radio.sm, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" },

  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 180, background: color.superficie.media, border: `1px solid ${color.borde.normal}`, borderRadius: radio.sm, padding: "8px 12px", color: color.texto.normal, fontSize: 13, outline: "none" },
  select: { background: color.superficie.media, border: `1px solid ${color.borde.normal}`, borderRadius: radio.sm, padding: "8px 12px", color: color.texto.normal, fontSize: 13, cursor: "pointer", outline: "none" },

  tableWrap: { overflowX: "auto", borderRadius: radio.md, border: `1px solid ${color.borde.sutil}`, background: color.superficie.baja },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 780 },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: color.texto.tenue, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${color.borde.sutil}`, whiteSpace: "nowrap" },
  tr: { borderBottom: `1px solid ${color.borde.sutil}` },
  td: { padding: "10px 12px", fontSize: 13, verticalAlign: "middle" },
  bold: { fontWeight: 600, color: color.texto.normal },
  muted: { color: color.texto.tenue, fontSize: 12 },
  catText: { fontSize: 12, color: color.texto.suave },
  chip: { display: "inline-block", padding: "2px 8px", borderRadius: radio.full, fontSize: 11, fontWeight: 600 },
  actions: { display: "flex", gap: 6, justifyContent: "flex-end" },
  editBtn: { background: color.identidad.tenue, border: `1px solid ${color.identidad.borde}`, color: "#a5b4fc", borderRadius: radio.sm, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  delBtn: { background: color.estado.vencidoTenue, border: `1px solid ${color.estado.vencidoBorde}`, color: "#f87171", borderRadius: radio.sm, padding: "5px 9px", fontSize: 12, cursor: "pointer" },

  overlay: { position: "fixed", inset: 0, background: color.velo.fuerte, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 },
  modalBox: { background: "#0d1117", border: `1px solid ${color.borde.normal}`, borderRadius: radio.lg, padding: 28, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 17, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.3px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 11, fontWeight: 600, color: color.texto.tenue, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { background: color.superficie.media, border: `1px solid ${color.borde.normal}`, borderRadius: radio.sm, padding: "8px 11px", color: color.texto.normal, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" },
  err: { color: "#f87171", fontSize: 13, margin: "12px 0 0" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 },
  cancelBtn: { background: color.superficie.alta, border: `1px solid ${color.borde.normal}`, color: color.texto.suave, borderRadius: radio.sm, padding: "9px 18px", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  saveBtn: { background: "#22c55e", color: "#030712", border: "none", borderRadius: radio.sm, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontWeight: 700 },
};
