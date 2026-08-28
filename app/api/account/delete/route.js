// POST /api/account/delete — eliminar la propia cuenta.
//
// BG-045. Alguien podía registrarse pero NO PODÍA IRSE: no había botón, ni
// proceso, ni forma de pedirlo. Mientras esto fue el garage de una persona daba
// igual; desde que Bike Garage es un producto abierto (PRD-00, 2026-08-28) es
// una obligación, no una comodidad.
//
// QUÉ SE BORRA
//   Todo lo del usuario, por cascada desde auth.users: bicis, componentes
//   montados, registros de mantención, historial, reglas, perfil, categorías,
//   preferencias y la conexión a Strava. Más el avatar, que vive en Storage y
//   no lo alcanza ninguna cascada.
//
// QUÉ NO SE BORRA, Y POR QUÉ
//   Los modelos que aportó al catálogo. El catálogo es COMPARTIDO: esas
//   entradas ya están montadas en bicis de otra gente. Si se fueran con él,
//   se romperían bicicletas ajenas. Se quedan, pero pierden su firma
//   (`created_by` pasa a NULL, por la llave foránea).
//
// Variables de entorno requeridas:
//   SUPABASE_SERVICE_ROLE_KEY — borrar un usuario solo se puede con esta

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  // 1. Solo el propio usuario puede borrarse. Se exige su token, no un id:
  //    aceptar un id sería dejar que cualquiera borre a cualquiera.
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  try {
    // 2. El avatar. Es lo único que no se va por cascada, porque vive en
    //    Storage y no en una tabla. Se listan sus archivos y se borran.
    const { data: archivos } = await supabaseAdmin.storage.from("avatars").list(user.id);
    if (archivos?.length) {
      await supabaseAdmin.storage
        .from("avatars")
        .remove(archivos.map((a) => `${user.id}/${a.name}`));
    }

    // 3. El usuario. Todo lo suyo se va con él por las cascadas de la base
    //    (ver migrations/2026-08-28_bg045_eliminar_cuenta.sql).
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Error eliminando cuenta:", deleteError);
      return NextResponse.json(
        { error: "No se pudo eliminar la cuenta. Escríbenos y lo hacemos a mano." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando cuenta:", err);
    return NextResponse.json(
      { error: "No se pudo eliminar la cuenta. Escríbenos y lo hacemos a mano." },
      { status: 500 }
    );
  }
}
