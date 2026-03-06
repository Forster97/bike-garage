// lib/createBikeWithTemplate.js
import { supabase } from "./supabaseClient";

/**
 * Crea una bici y, si existe plantilla (brand+model+year), carga componentes.
 * Usa las tablas components + bike_components (many-to-many).
 *
 * Tablas requeridas:
 * - bikes
 * - bike_model_templates  (id, brand, model, year)
 * - component_templates   (template_id, category, name, weight_g, position)
 * - components            (user_id, name, category, weight_g)
 * - bike_components       (bike_id, component_id, user_id)
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

    if (tplParts?.length) {
      // 4a) Insertar componentes de la plantilla como componentes nuevos
      const { data: upserted, error: compErr } = await supabase
        .from("components")
        .insert(
          tplParts.map((p) => ({
            user_id: userId,
            name: p.name,
            category: p.category,
            weight_g: p.weight_g ?? null,
          }))
        )
        .select("id");

      if (compErr) throw compErr;

      // 4b) Insert en bike_components para ligar cada componente a esta bici
      if (upserted?.length) {
        const { error: bcErr } = await supabase.from("bike_components").insert(
          upserted.map((c) => ({
            bike_id: bike.id,
            component_id: c.id,
            user_id: userId,
          }))
        );
        if (bcErr) throw bcErr;
      }
    }
  }

  return bike;
}
