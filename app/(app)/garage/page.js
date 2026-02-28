"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import AppHeader from "../../../components/AppHeader";
import PageShell from "../../../components/PageShell";

const headerBtnStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 800,
};

export default function GaragePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [newBikeName, setNewBikeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const userLabel = useMemo(() => {
    const email = user?.email || "";
    return email.length > 26 ? `${email.slice(0, 22)}…` : email;
  }, [user]);

  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) { console.error("refreshBikes:", error); alert(error.message); return; }
    setBikes(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) { router.replace("/login"); return; }
        if (cancelled) return;
        setUser(data.user);
        await refreshBikes(data.user.id);
      } catch (err) {
        console.error("Garage load:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const addBike = async () => {
    const name = newBikeName.trim();
    if (!name || adding) return;
    try {
      setAdding(true);
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (userErr || !uid) { router.replace("/login"); return; }
      const { error } = await supabase.from("bikes").insert([{ name, user_id: uid }]);
      if (error) throw error;
      setNewBikeName("");
      await refreshBikes(uid);
    } catch (err) {
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
  };

  const deleteBike = async (bikeId) => {
    if (!confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.")) return;
    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) { alert(error.message); return; }
    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  const header = (
    <AppHeader
      actions={[
        <Link key="cats" href="/settings/categories"
          style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, padding: "10px" }}>
          Categorías
        </Link>,
        user?.email && (
          <div key="chip"
            className="hidden sm:flex items-center gap-2 rounded-full px-3 py-2 text-xs"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.80)" }}
            title={user.email}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: "rgba(34,197,94,0.9)" }} />
            {userLabel}
          </div>
        ),
        <button key="logout" onClick={logout} style={headerBtnStyle}>Salir</button>,
      ].filter(Boolean)}
    />
  );

  return (
    <PageShell header={header}>
      {/* Título */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight" style={{ color: "rgba(255,255,255,0.96)" }}>
            Tu Garage
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
            Crea tus bicicletas, entra a cada una para registrar sus componentes
          </p>
        </div>
        <div className="rounded-2xl border px-4 py-3"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <span className="text-lg font-black" style={{ color: "rgba(255,255,255,0.92)" }}>{bikes.length}</span>
          <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Bicis</span>
        </div>
      </div>

      {/* Agregar bici */}
      <div className="rounded-[18px] border p-4"
        style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", boxShadow: "0 18px 55px rgba(0,0,0,0.22)" }}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>Agregar bicicleta</div>
            <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Ej: Orbea Terra / Diverge / Gambler</div>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-black"
            style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.25)", color: "rgba(255,255,255,0.90)" }}>
            Nuevo
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newBikeName}
            onChange={(e) => setNewBikeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBike()}
            placeholder="Nombre de la bicicleta"
            className="flex-1 min-w-[200px] rounded-[14px] px-3 py-3 text-sm outline-none"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.22)", color: "rgba(255,255,255,0.92)" }}
          />
          <button
            onClick={addBike}
            disabled={!newBikeName.trim() || adding}
            className="rounded-[14px] px-4 py-3 text-sm font-black"
            style={{
              border: 0, color: "#0b1220",
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))",
              boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
              opacity: !newBikeName.trim() || adding ? 0.55 : 1,
              cursor: !newBikeName.trim() || adding ? "not-allowed" : "pointer",
            }}
          >
            {adding ? "Agregando..." : "Agregar"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "rgba(99,102,241,0.75)" }} />
          Tip: después podrás agregar tipo, año, talla y notas dentro de la bici.
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-[18px] border p-4"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}>
              <div className="h-4 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
              <div className="mt-3 h-3 w-1/3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>
          ))}
        </div>
      ) : bikes.length === 0 ? (
        <div className="rounded-[18px] border p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border text-lg"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)" }}>✨</div>
          <div className="font-black" style={{ color: "rgba(255,255,255,0.92)" }}>No tienes bicicletas aún</div>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>Agrega tu primera bici arriba para empezar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bikes.map((bike) => (
            <div key={bike.id} className="overflow-hidden rounded-[22px] border"
              style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>
              <div className="flex items-center justify-between gap-3 p-4">
                <Link href={`/garage/${bike.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  style={{ textDecoration: "none" }}>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-black text-lg"
                    style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.92)" }}>
                    {(bike.name || "B").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black text-xl" style={{ color: "rgba(255,255,255,0.95)" }}>{bike.name}</div>
                    <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                      Creada: {new Date(bike.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
                <button onClick={() => deleteBike(bike.id)}
                  className="grid h-11 w-11 place-items-center rounded-2xl"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.20)", cursor: "pointer" }}
                  title="Eliminar">🗑</button>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
              <Link href={`/garage/${bike.id}`}
                className="block px-4 py-3 text-sm"
                style={{ color: "rgba(255,255,255,0.60)", textDecoration: "none" }}>
                Toca para ver detalles →
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}