"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabaseClient";
import BackgroundGlow from "../../components/BackgroundGlow";

function NavItem({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-slate-900/70 text-slate-100"
          : "text-slate-300 hover:bg-slate-900/50 hover:text-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppGroupLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) return router.replace("/login");

      const { data } = await supabase.auth.getUser();
      if (!data?.user) return router.replace("/login");
      setEmail(data.user.email ?? "");
    };

    load();
  }, [router]);

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
  };

  const isGarage = pathname?.startsWith("/garage");
  const isCategories = pathname?.startsWith("/settings/categories");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <BackgroundGlow />

      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">Bike Garage</div>

          <div className="hidden items-center gap-2 sm:flex">
            <NavItem href="/garage" label="Garage" active={isGarage} />
            <NavItem
              href="/settings/categories"
              label="Categorías"
              active={isCategories}
            />
            <span className="ml-2 max-w-[220px] truncate text-sm text-slate-300">
              {email}
            </span>
            <button
              onClick={logout}
              className="ml-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/80 hover:text-slate-100 transition"
            >
              Salir
            </button>
          </div>

          <button
            onClick={logout}
            className="sm:hidden rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/80 hover:text-slate-100 transition"
          >
            Salir
          </button>
        </div>

        <div className="sm:hidden">
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <NavItem href="/garage" label="Garage" active={isGarage} />
              <NavItem
                href="/settings/categories"
                label="Categorías"
                active={isCategories}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}