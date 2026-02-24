"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

export default function GaragePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [newBikeName, setNewBikeName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return router.replace("/login");

      setUser(data.user);

      const { data: bikesData } = await supabase
        .from("bikes")
        .select("*")
        .order("created_at", { ascending: false });

      setBikes(bikesData || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const refreshBikes = async () => {
    const { data } = await supabase
      .from("bikes")
      .select("*")
      .order("created_at", { ascending: false });
    setBikes(data || []);
  };

  const addBike = async () => {
    const name = newBikeName.trim();
    if (!name) return;

    const { error } = await supabase.from("bikes").insert([
      {
        name,
        user_id: user.id,
      },
    ]);

    if (error) return alert(error.message);

    setNewBikeName("");
    await refreshBikes();
  };

  const deleteBike = async (bikeId) => {
    const ok = confirm("¿Eliminar esta bicicleta? Esto también eliminará sus componentes.");
    if (!ok) return;

    const { error } = await supabase.from("bikes").delete().eq("id", bikeId);

    if (error) return alert(error.message);

    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
  };

  if (loading) return <div className="px-6 py-8 text-muted">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tu Garage</h1>

        <button
          onClick={logout}
          className="rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
        >
          Salir
        </button>
      </div>

      <div className="h-px w-full bg-border/70" />

      {/* Add bike (mobile-first) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={newBikeName}
          onChange={(e) => setNewBikeName(e.target.value)}
          placeholder="Nombre de la bicicleta"
          className="w-full flex-1 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-text placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40"
        />

        <button
          onClick={addBike}
          className="w-full sm:w-auto rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          Agregar
        </button>
      </div>

      {/* Empty state */}
      {bikes.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-card/75 p-6 text-center shadow-soft backdrop-blur-sm">
          <div className="text-lg font-semibold">No tienes bicicletas aún 🚴</div>
          <p className="mt-2 text-sm text-muted">
            Crea tu primera bicicleta para comenzar a gestionar componentes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bikes.map((bike) => (
            <div
              key={bike.id}
              className="rounded-xl2 border border-border bg-card/75 p-4 shadow-soft backdrop-blur-sm hover:border-primary/40 transition flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/garage/${bike.id}`}
                  className="block truncate text-lg font-semibold text-text hover:text-primary transition"
                >
                  {bike.name}
                </Link>

                <p className="mt-1 text-sm text-muted">
                  Creada: {new Date(bike.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => deleteBike(bike.id)}
                className="w-full sm:w-auto rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}