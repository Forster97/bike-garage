"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { ok, message }

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    city: "",
    birth_date: "",
    weight_kg: "",
    preferred_units: "km",
    avatar_url: "",
  });

  // Vista previa local antes de subir
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Notificaciones
  const [types, setTypes] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [savingPref, setSavingPref] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: ud } = await supabase.auth.getUser();
      if (!ud?.user) return router.replace("/login");

      setUserId(ud.user.id);
      setUserEmail(ud.user.email ?? "");

      const [profileRes, typesRes, prefsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", ud.user.id).single(),
        supabase.from("maintenance_types").select("*").order("name"),
        supabase.from("notification_preferences").select("*").eq("user_id", ud.user.id),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setForm({
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          city: p.city ?? "",
          birth_date: p.birth_date ?? "",
          weight_kg: p.weight_kg ?? "",
          preferred_units: p.preferred_units ?? "km",
          avatar_url: p.avatar_url ?? "",
        });
      }

      setTypes(typesRes.data || []);
      const prefsMap = {};
      for (const p of prefsRes.data || []) prefsMap[p.type_id] = p.notify_email;
      setPrefs(prefsMap);

      setLoading(false);
    };
    load();
  }, [router]);

  // ── Subir avatar ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Vista previa inmediata
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error("Avatar upload error:", error);
      setSaveResult({ ok: false, message: "Error al subir la foto. Verifica el bucket 'avatars' en Supabase." });
      setAvatarPreview(null);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Agrega cache-buster para forzar recarga de la imagen
      setForm((f) => ({ ...f, avatar_url: `${data.publicUrl}?t=${Date.now()}` }));
      setAvatarPreview(null);
    }
    setUploadingAvatar(false);
  };

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaveResult(null);

    const payload = {
      id: userId,
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      city: form.city.trim() || null,
      birth_date: form.birth_date || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      preferred_units: form.preferred_units,
      avatar_url: form.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);
    if (error) {
      setSaveResult({ ok: false, message: error.message || "Error al guardar. Intenta de nuevo." });
    } else {
      setSaveResult({ ok: true, message: "Perfil guardado correctamente." });
      setTimeout(() => setSaveResult(null), 3000);
    }
  };

  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const togglePref = async (typeId) => {
    const next = prefs[typeId] === false; // si era false → true, si era true/undefined → false
    setPrefs((p) => ({ ...p, [typeId]: next }));
    setSavingPref(typeId);
    try {
      await supabase.from("notification_preferences").upsert(
        { user_id: userId, type_id: typeId, notify_email: next },
        { onConflict: "user_id,type_id" }
      );
    } finally {
      setSavingPref(null);
    }
  };

  // ── Helpers de display ────────────────────────────────────────────────────
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ") || "Sin nombre";
  const avatarSrc = avatarPreview || form.avatar_url || null;
  const initials = [form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const age = form.birth_date
    ? Math.floor((Date.now() - new Date(form.birth_date)) / (365.25 * 864e5))
    : null;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "grid", gap: 12 }}>
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-[18px]"
          style={{ height: 120, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", borderRadius: 20 }} />
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .profile-avatar-ring:hover { border-color: rgba(99,102,241,0.60) !important; }
        @media (max-width: 600px) {
          .profile-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Hero card ── */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              className="profile-avatar-ring"
              onClick={() => fileRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                border: "2px solid rgba(99,102,241,0.30)",
                overflow: "hidden", cursor: "pointer",
                background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(34,197,94,0.15))",
                display: "grid", placeItems: "center",
                transition: "border-color 0.2s",
                position: "relative",
              }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.70)" }}>{initials}</span>
              )}
              {/* Overlay al hover */}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                display: "grid", placeItems: "center", opacity: 0,
                transition: "opacity 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <span style={{ fontSize: 20 }}>{uploadingAvatar ? "⏳" : "📷"}</span>
              </div>
            </div>

            {/* Botón cámara */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(99,102,241,0.90)",
                border: "2px solid #060910",
                display: "grid", placeItems: "center",
                cursor: "pointer", fontSize: 13,
              }}
              title="Cambiar foto"
            >
              {uploadingAvatar ? "…" : "✏️"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", marginBottom: 4 }}>
              Mi perfil
            </div>
            <div style={{ fontSize: "clamp(18px,5vw,24px)", fontWeight: 900, letterSpacing: -0.5, color: "rgba(255,255,255,0.95)", lineHeight: 1.1 }}>
              {displayName}
            </div>
            <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={S.metaChip}>{userEmail}</span>
              {form.city && <span style={S.metaChip}>📍 {form.city}</span>}
              {age !== null && <span style={S.metaChip}>{age} años</span>}
              {form.weight_kg && <span style={S.metaChip}>⚖️ {form.weight_kg} kg</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <form onSubmit={handleSave}>
        <div style={S.card}>
          <div style={{ marginBottom: 16 }}>
            <div style={S.sectionTitle}>Información personal</div>
          </div>

          <div className="profile-grid">
            <label style={S.fieldWrap}>
              <span style={S.label}>Nombre</span>
              <input
                value={form.first_name}
                onChange={(e) => field("first_name", e.target.value)}
                placeholder="Tu nombre"
                style={S.input}
              />
            </label>

            <label style={S.fieldWrap}>
              <span style={S.label}>Apellido</span>
              <input
                value={form.last_name}
                onChange={(e) => field("last_name", e.target.value)}
                placeholder="Tu apellido"
                style={S.input}
              />
            </label>

            <label style={S.fieldWrap}>
              <span style={S.label}>Ciudad</span>
              <input
                value={form.city}
                onChange={(e) => field("city", e.target.value)}
                placeholder="Santiago, Chile"
                style={S.input}
              />
            </label>

            <label style={S.fieldWrap}>
              <span style={S.label}>Fecha de nacimiento</span>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => field("birth_date", e.target.value)}
                style={{ ...S.input, colorScheme: "dark" }}
              />
            </label>

            <label style={S.fieldWrap}>
              <span style={S.label}>Peso (kg)</span>
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => field("weight_kg", e.target.value)}
                placeholder="70"
                style={S.input}
              />
            </label>

            <label style={S.fieldWrap}>
              <span style={S.label}>Unidades de distancia</span>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                {["km", "mi"].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => field("preferred_units", unit)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      border: form.preferred_units === unit
                        ? "1px solid rgba(99,102,241,0.50)"
                        : "1px solid rgba(255,255,255,0.10)",
                      background: form.preferred_units === unit
                        ? "rgba(99,102,241,0.20)"
                        : "rgba(255,255,255,0.04)",
                      color: form.preferred_units === unit
                        ? "rgba(165,180,252,0.95)"
                        : "rgba(255,255,255,0.50)",
                    }}
                  >
                    {unit === "km" ? "Kilómetros (km)" : "Millas (mi)"}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Correo (solo lectura) */}
          <div style={{ marginTop: 14 }}>
            <label style={S.fieldWrap}>
              <span style={S.label}>Correo electrónico</span>
              <input
                value={userEmail}
                readOnly
                style={{ ...S.input, opacity: 0.5, cursor: "not-allowed" }}
              />
            </label>
            <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              El correo se gestiona desde la configuración de autenticación.
            </div>
          </div>

          {/* Resultado */}
          {saveResult && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 12,
              border: `1px solid ${saveResult.ok ? "rgba(134,239,172,0.25)" : "rgba(239,68,68,0.25)"}`,
              background: saveResult.ok ? "rgba(134,239,172,0.07)" : "rgba(239,68,68,0.07)",
              color: saveResult.ok ? "rgba(134,239,172,0.90)" : "rgba(239,68,68,0.90)",
              fontSize: 13, fontWeight: 600,
            }}>
              {saveResult.ok ? "✓ " : "✕ "}{saveResult.message}
            </div>
          )}

          {/* Botón guardar */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...S.saveBtn,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Notificaciones por email ── */}
      {types.filter((t) => t.default_interval_days).length > 0 && (
        <div style={S.card}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={S.sectionTitle}>Notificaciones por email</div>
              <div style={{ marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.46)", lineHeight: 1.5 }}>
                Activa o desactiva el email automático para cada tipo de mantenimiento
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", flexShrink: 0, transition: "transform 0.2s", display: "inline-block", transform: notifOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </button>

          {notifOpen && <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
            {types.filter((t) => t.default_interval_days).map((type) => {
              const enabled = prefs[type.id] !== false;
              return (
                <div key={type.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: enabled ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.40)" }}>
                      {type.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 1 }}>
                      Cada {type.default_interval_days} días{type.default_interval_km ? ` · ${type.default_interval_km} km` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePref(type.id)}
                    disabled={savingPref === type.id}
                    title={enabled ? "Desactivar" : "Activar"}
                    style={{
                      position: "relative", width: 36, height: 20, borderRadius: 999,
                      border: "none", cursor: savingPref === type.id ? "not-allowed" : "pointer",
                      flexShrink: 0, transition: "background 0.2s",
                      background: enabled ? "rgba(99,102,241,0.85)" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 2, left: 0, width: 16, height: 16, borderRadius: 999,
                      background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                      transition: "transform 0.2s",
                      transform: enabled ? "translateX(18px)" : "translateX(2px)",
                    }} />
                  </button>
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {/* ── Zona peligrosa ── */}
      <div style={{ ...S.card, borderColor: "rgba(239,68,68,0.15)" }}>
        <div style={S.sectionTitle}>Cuenta</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.5 }}>
            Email: <strong style={{ color: "rgba(255,255,255,0.75)" }}>{userEmail}</strong>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            style={{
              padding: "9px 18px", borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.30)",
              background: "rgba(239,68,68,0.08)",
              color: "rgba(239,68,68,0.85)",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const S = {
  card: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.055)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
    padding: 20,
  },
  sectionTitle: { fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.92)" },
  metaChip: {
    fontSize: 11, fontWeight: 600,
    padding: "3px 9px", borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.60)",
    whiteSpace: "nowrap",
  },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 13px",
    fontSize: 14,
    color: "rgba(255,255,255,0.90)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  saveBtn: {
    border: 0,
    fontWeight: 900,
    padding: "12px 24px",
    borderRadius: 12,
    color: "#0b1220",
    background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))",
    boxShadow: "0 10px 28px rgba(0,0,0,0.30)",
    fontSize: 14,
  },
};
