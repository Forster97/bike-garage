"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PageShell from "../../../components/PageShell";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";

import { supabase } from "../../../lib/supabaseClient";

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
    <PageShell
      title="Tu Garage"
      subtitle="Crea tus bicicletas y entra a cada una para registrar componentes y pesos."
      right={
        <div className="flex items-center gap-2">
          <Link
            href="/settings/categories"
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Categorías
          </Link>

          {user?.email ? (
            <div
              className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 sm:flex"
              title={user?.email}
            >
              <span className="h-2 w-2 rounded-full bg-lime-400" aria-hidden="true" />
              <span className="max-w-[220px] truncate">{userLabel}</span>
            </div>
          ) : null}

          <PrimaryButton variant="ghost" onClick={logout}>
            Salir
          </PrimaryButton>
        </div>
      }
    >
      {/* Resumen simple */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100">{bikes.length}</span> bici(s) en tu garage
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
          Todo ordenado, sin Excel 😉
        </div>
      </div>

      {/* Agregar bicicleta */}
      <Card className="mb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">Agregar bicicleta</div>
            <div className="mt-1 text-xs text-slate-300">
              Ej: Orbea Terra / Diverge / Gambler
            </div>
          </div>

          <div className="rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-200">
            Nuevo
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newBikeName}
            onChange={(e) => setNewBikeName(e.target.value)}
            placeholder="Nombre de la bicicleta"
            className="w-full flex-1 min-w-[220px] rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-lime-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") addBike();
            }}
          />

          <PrimaryButton
            onClick={addBike}
            disabled={!newBikeName.trim() || adding}
            className="min-w-[130px]"
          >
            {adding ? "Agregando..." : "Agregar"}
          </PrimaryButton>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-slate-300">
          <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" />
          <p>
            Tip: después podrás agregar tipo, año, talla y notas dentro de la bici.
          </p>
        </div>
      </Card>

      {/* Contenido */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 w-2/3 rounded-full bg-slate-800" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-800/70" />
              <div className="mt-4 h-10 w-full rounded-xl bg-slate-800/60" />
            </Card>
          ))}
        </div>
      ) : bikes.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-slate-800 bg-slate-900/60 text-lg">
            ✨
          </div>
          <div className="font-semibold text-slate-100">No tienes bicicletas aún</div>
          <div className="mt-2 text-sm text-slate-300">
            Agrega tu primera bici arriba para empezar.
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="text-xs text-slate-300 underline underline-offset-4 hover:text-slate-100"
            >
              Próximamente: mantenimiento + recordatorios
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bikes.map((bike) => (
            <Card key={bike.id} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4">
                <Link href={`/garage/${bike.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-800/60 text-sm font-extrabold text-slate-100">
                    {(bike.name || "B").slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-slate-100">
                      {bike.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      Creada: {new Date(bike.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>

                <PrimaryButton
                  variant="ghost"
                  onClick={() => deleteBike(bike.id)}
                  aria-label="Eliminar bicicleta"
                  title="Eliminar"
                  className="h-10 w-10 p-0"
                >
                  🗑
                </PrimaryButton>
              </div>

              <Link
                href={`/garage/${bike.id}`}
                className="block border-t border-slate-800 px-4 py-3 text-xs text-slate-300 hover:bg-slate-900/60"
              >
                Toca para ver detalles →
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Footer mini */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs text-slate-400">
        <div>Bike Garage • Construido para ciclistas</div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-slate-200">
            Inicio
          </Link>
          <Link href="/settings/categories" className="hover:text-slate-200">
            Categorías
          </Link>
        </div>
      </div>
    </PageShell>
  );
}