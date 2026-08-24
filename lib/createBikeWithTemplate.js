// lib/createBikeWithTemplate.js
import { supabase } from "./supabaseClient";

/**
 * ⏸️ La auto-carga de componentes desde plantilla está EN PAUSA.
 *
 * Las plantillas guardan los componentes como texto libre: 422 nombres distintos
 * con la marca metida adentro, 121 pares en una sola fila ("… (par)"), 19 grupos
 * completos y 13 genéricos sin identidad ("Handlebar", "Fork (MTB)").
 *
 * Desde PRD-12 un componente es una entrada del catálogo compartido. Cargar las
 * plantillas tal como están hoy metería esas 422 filas sin curar al catálogo que
 * recién limpiamos. Es preferible que una bici nueva quede vacía.
 *
 * Se reactiva poniendo esto en true, una vez que las plantillas apunten al
 * catálogo vía `component_templates.catalog_id` — ver BG-032 en la bóveda.
 */
const AUTOCARGA_DESDE_PLANTILLA = false;

/**
 * Crea una bici y, si la auto-carga está activa y existe plantilla, le monta
 * sus componentes resolviéndolos contra el catálogo de modelos.
 *
 * Tablas:
 * - bikes
 * - bike_model_templates  (id, brand, model, year)
 * - component_templates   (template_id, category, name, weight_g, position…)
 * - component_catalog     (el registro de modelos, compartido)
 * - bike_components       (bike_id, catalog_id, user_id)
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
      // Si viene vacío, el trigger `bikes_sync_name` pone "marca modelo".
      // La regla vive en UN solo lugar — la base — y no duplicada acá. (BG-027)
      name: (name ?? "").trim(),
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

  if (!AUTOCARGA_DESDE_PLANTILLA) return bike;

  // 2) Buscar plantilla por brand+model+year (case-insensitive)
  const { data: template, error: tplErr } = await supabase
    .from("bike_model_templates")
    .select("id")
    .ilike("brand", brand.trim())
    .ilike("model", model.trim())
    .eq("year", Number(year))
    .maybeSingle();

  if (tplErr) throw tplErr;
  if (!template?.id) return bike; // sin plantilla, la bici queda vacía

  // 3) Traer las piezas de la plantilla, ya vinculadas al catálogo
  const { data: tplParts, error: partsErr } = await supabase
    .from("component_templates")
    .select("catalog_id, position")
    .eq("template_id", template.id)
    .not("catalog_id", "is", null)
    .order("position", { ascending: true });

  if (partsErr) throw partsErr;
  if (!tplParts?.length) return bike;

  // 4) Montar cada modelo en la bici
  const { error: bcErr } = await supabase.from("bike_components").insert(
    tplParts.map((p) => ({
      bike_id: bike.id,
      catalog_id: p.catalog_id,
      user_id: userId,
    }))
  );
  if (bcErr) throw bcErr;

  return bike;
}
