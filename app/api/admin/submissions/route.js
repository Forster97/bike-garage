// API Route: /api/admin/submissions
//
// Revisión de las marcas y modelos que proponen los usuarios al cargar un
// componente que no está en el catálogo maestro.
//
//   GET   → lista las propuestas (por defecto, las pendientes)
//   POST  → aprueba una (la crea en component_catalog) o la rechaza
//
// Solo el admin. La verificación es server-side: no se confía en la pantalla.
// Ver PRD-09-Catalogo-Maestro en la bóveda.

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "bforsterb@gmail.com";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function verifyAdmin(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await adminClient().auth.getUser(token);
  return data?.user?.email === ADMIN_EMAIL ? data.user : null;
}

export async function GET(request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") || "pending";

  const { data, error } = await adminClient()
    .from("component_catalog_submissions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, catalogRow, reason } = await request.json();
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const db = adminClient();

  if (action === "reject") {
    const { error } = await db
      .from("component_catalog_submissions")
      .update({
        status: "rejected",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason || null,
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    // El admin traduce la categoría en español a la técnica del catálogo
    // y completa lo que falte antes de aprobar.
    if (!catalogRow?.category || !catalogRow?.brand) {
      return NextResponse.json(
        { error: "Para aprobar hace falta al menos categoría técnica y marca." },
        { status: 400 }
      );
    }

    // Este es el ÚNICO lugar que inserta al aprobar: así no se duplica la fila.
    const { data: created, error: insErr } = await db
      .from("component_catalog")
      .insert([catalogRow])
      .select()
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    const { error: updErr } = await db
      .from("component_catalog_submissions")
      .update({
        status: "approved",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, data: created });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
