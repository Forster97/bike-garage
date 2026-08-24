// lib/createBikeWithTemplate.js
import { supabase } from "./supabaseClient";

/**
 * Crea una bici y, si existe plantilla (brand+model+year), le monta sus componentes.
 *
 * Desde PRD-12 los componentes NO se copian a una biblioteca privada: cada pieza
 * de la plantilla se busca (o se crea) como MODELO en `component_catalog`, y la
 * bici la monta vía `bike_components`.
 *
 * Tablas:
 * - bikes
 * - bike_model_templates  (id, brand, model, year)
 * - component_templates   (template_id, category, name, weight_g, position, brand, model…)
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
      name: name ?? `${brand} ${model}`,
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
  if (!template?.id) return bike; // sin plantilla, la bici queda vacía

  // 3) Traer las piezas de la plantilla
  const { data: tplParts, error: partsErr } = await supabase
    .from("component_templates")
    .select("category,name,weight_g,position,brand,model,variant,year,sku")
    .eq("template_id", template.id)
    .order("position", { ascending: true });

  if (partsErr) throw partsErr;
  if (!tplParts?.length) return bike;

  // 4) Cada pieza de plantilla se resuelve contra el catálogo de modelos
  const catalogIds = [];
  for (const p of tplParts) {
    const catalogId = await findOrCreateCatalogModel({
      userId,
      category: p.category,
      brand: p.brand,
      // El nombre de la plantilla es la identidad del modelo cuando no hay uno propio
      model: p.model ?? p.name,
      variant: p.variant,
      weight_g: p.weight_g,
      sku: p.sku,
    });
    if (catalogId) catalogIds.push(catalogId);
  }

  // 5) Montar cada modelo en la bici
  if (catalogIds.length) {
    const { error: bcErr } = await supabase.from("bike_components").insert(
      catalogIds.map((catalog_id) => ({
        bike_id: bike.id,
        catalog_id,
        user_id: userId,
      }))
    );
    if (bcErr) throw bcErr;
  }

  return bike;
}

/**
 * Devuelve el id del modelo en el catálogo, creándolo si no existe.
 * Lo que crea queda como 'unverified': salió de una plantilla, nadie lo revisó.
 */
async function findOrCreateCatalogModel({
  userId, category, brand, model, variant, weight_g, sku,
}) {
  const marca = (brand ?? "").trim() || null;
  const modelo = (model ?? "").trim() || null;
  const varianteRaw = (variant ?? "").trim() || null;

  // Buscar primero: la comparación ignora mayúsculas, igual que el índice único
  let q = supabase.from("component_catalog").select("id").eq("category", category).limit(1);
  q = marca ? q.ilike("brand", marca) : q.is("brand", null);
  q = modelo ? q.ilike("model", modelo) : q.is("model", null);
  q = varianteRaw ? q.ilike("variant", varianteRaw) : q.is("variant", null);

  const { data: encontrado } = await q.maybeSingle();
  if (encontrado?.id) return encontrado.id;

  const { data: creado, error } = await supabase
    .from("component_catalog")
    .insert([{
      category,
      brand: marca,
      model: modelo,
      variant: varianteRaw,
      weight_g: weight_g ?? null,
      sku: (sku ?? "").trim() || null,
      confidence: "unverified",
      created_by: userId,
    }])
    .select("id")
    .single();

  // 23505 = otra persona lo creó entremedio. Lo buscamos de nuevo.
  if (error) {
    if (error.code !== "23505") throw error;
    const { data: reintento } = await q.maybeSingle();
    return reintento?.id ?? null;
  }

  return creado.id;
}
