"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

function cn(...c) {
  return c.filter(Boolean).join(" ");
}

export default function GaragePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [newBikeName, setNewBikeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const userLabel = useMemo(() => {
    const email = user?.email || "";
    return email.length > 24 ? `${email.slice(0, 20)}…` : email;
  }, [user]);

  const refreshBikes = async (uid) => {
    const { data, error } = await supabase
      .from("bikes")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("refreshBikes error:", error);
      alert(error.message);
      return;
    }

    setBikes(data || []);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!data?.user) {
          router.replace("/login");
          return;
        }

        if (cancelled) return;
        setUser(data.user);

        await refreshBikes(data.user.id);
      } catch (err) {
        console.error("Garage load crash:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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

      if (userErr || !uid) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase.from("bikes").insert([{ name, user_id: uid }]);
      if (error) throw error;

      setNewBikeName("");
      await refreshBikes(uid);
    } catch (err) {
      console.error("addBike error:", err);
      alert(err?.message ?? "Error al agregar la bicicleta.");
    } finally {
      setAdding(false);
    }
  };

  const deleteBike = async (bikeId) => {
    const ok = confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.");
    if (!ok) return;

    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
    if (error) return alert(error.message);

    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  return (
    <main className="min-h-[100svh] bg-zinc-950 text-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50">
              <span className="text-sm">🚴</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Bike Garage</div>
              <div className="text-xs text-zinc-400">Tu inventario y peso por bici</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-2">
              <Link
                href="/garage"
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60 transition"
              >
                Garage
              </Link>
              <Link
                href="/settings/categories"
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60 transition"
              >
                Categorías
              </Link>
            </nav>

            {user?.email ? (
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="max-w-[220px] truncate">{userLabel}</span>
              </div>
            ) : null}

            <button
              onClick={logout}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Page title */}
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tu Garage</h1>
          <p className="text-sm text-zinc-400">
            Crea bicis, agrega componentes y mira el peso total por categoría.
          </p>
        </div>

        {/* Add bike card */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium">Agregar bicicleta</div>
              <div className="text-xs text-zinc-400">
                Ej: Orbea Terra / Stumpjumper EVO / Ruta 54
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-[520px] sm:flex-row">
              <input
                value={newBikeName}
                onChange={(e) => setNewBikeName(e.target.value)}
                placeholder="Nombre de la bicicleta"
                className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addBike();
                }}
              />

              <button
                onClick={addBike}
                disabled={!newBikeName.trim() || adding}
                className={cn(
                  "h-11 rounded-xl px-4 text-sm font-semibold transition",
                  "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {adding ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
                <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : bikes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/30">
              ✨
            </div>
            <div className="text-lg font-semibold">No tienes bicicletas aún</div>
            <p className="mt-2 text-sm text-zinc-400">
              Agrega tu primera bici arriba para empezar a registrar componentes y pesos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bikes.map((bike) => (
              <div
                key={bike.id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-emerald-500/40 hover:bg-zinc-900/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/garage/${bike.id}`}
                      className="block truncate text-lg font-semibold text-zinc-100 group-hover:text-emerald-200 transition"
                    >
                      {bike.name}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-400">
                      Creada:{" "}
                      {bike.created_at ? new Date(bike.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteBike(bike.id)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-50 transition"
                    title="Eliminar bici"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/garage/${bike.id}`}
                    className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition"
                  >
                    Abrir
                  </Link>

                  <Link
                    href={`/garage/${bike.id}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-50 transition"
                    title="Ver detalles"
                  >
                    Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile bottom nav (opcional, simple) */}
        <div className="sm:hidden mt-8 grid grid-cols-2 gap-2">
          <Link
            href="/garage"
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-center text-sm text-zinc-200"
          >
            Garage
          </Link>
          <Link
            href="/settings/categories"
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-center text-sm text-zinc-200"
          >
            Categorías
          </Link>
        </div>
      </div>
    </main>
  );
}