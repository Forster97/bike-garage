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
          ? "bg-surface/80 text-text"
          : "text-muted hover:bg-surface/70 hover:text-text",
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
    <div className="min-h-screen relative">
      {/* Glow de fondo */}
      <BackgroundGlow />

      {/* Topbar */}
      <div className="sticky top-0 z-20 border-b border-border bg-surface/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">Bike Garage</div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <NavItem href="/garage" label="Garage" active={isGarage} />
            <NavItem
              href="/settings/categories"
              label="Categorías"
              active={isCategories}
            />
            <span className="ml-2 max-w-[220px] truncate text-sm text-muted">
              {email}
            </span>
            <button
              onClick={logout}
              className="ml-2 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
            >
              Salir
            </button>
          </div>

          {/* Mobile logout */}
          <button
            onClick={logout}
            className="sm:hidden rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted hover:bg-surface/80 hover:text-text transition"
          >
            Salir
          </button>
        </div>

        {/* Mobile tabs */}
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

      {/* Content wrapper */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}