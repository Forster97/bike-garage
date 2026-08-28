import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { esAdmin } from "../../../../lib/esAdmin";

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
  return esAdmin(data?.user) ? data.user : null;
}

export async function POST(request) {
  if (!await verifyAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await adminClient()
    .from("component_catalog")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PUT(request) {
  if (!await verifyAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await request.json();
  const { data, error } = await adminClient()
    .from("component_catalog")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request) {
  if (!await verifyAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const { error } = await adminClient()
    .from("component_catalog")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
