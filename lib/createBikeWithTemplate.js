// lib/createBikeWithTemplate.js
import { supabase } from "./supabaseClient";

/**
 * Crea una bici y, si existe plantilla (brand+model+year), carga componentes en parts.
 *
 * Espera que existan tablas:
 * - bikes
 * - bike_model_templates  (id, brand, model, year)
 * - component_templates   (template_id, category, name, weight_g, position)
 * - parts                 (user_id, bike_id, category, name, weight_g)
 */
export async function createBikeWithTemplate({
  userId,
  name,
  brand,
  model,
  year,
  size,
  notes,
  type,
}) {
  // 1) Crear la bici
  const { data: bike, error: bikeErr } = await supabase
    .from("bikes")
    .insert({
      user_id: userId,
      name: name ?? `${brand} ${model} ${year}`,
      brand,
      model,
      year: Number(year),
      size: size ?? null,
      notes: notes ?? "",
      type: type ?? null,
    })
    .select()
    .single();

  if (bikeErr) throw bikeErr;

  // 2) Buscar plantilla por brand+model+year (case-insensitive)
  const { data: template, error: tplErr } = await supabase
    .from("bike_model_templates")
    .select("id")
    .ilike("brand", brand.trim())
    .ilike("model", model.trim())
    .eq("year", Number(year))
    .maybeSingle();

  if (tplErr) throw tplErr;

  // 3) Si hay plantilla, traer componentes
  if (template?.id) {
    const { data: tplParts, error: partsErr } = await supabase
      .from("component_templates")
      .select("category,name,weight_g,position")
      .eq("template_id", template.id)
      .order("position", { ascending: true });

    if (partsErr) throw partsErr;

    // 4) Insert masivo en parts
    if (tplParts?.length) {
      const payload = tplParts.map((p) => ({
        user_id: userId,
        bike_id: bike.id,
        category: p.category,
        name: p.name,
        weight_g: p.weight_g ?? null,
      }));

      const { error: insErr } = await supabase.from("parts").insert(payload);
      if (insErr) throw insErr;
    }
  }

  return bike;
}